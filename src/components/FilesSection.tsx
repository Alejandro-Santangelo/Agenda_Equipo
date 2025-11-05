'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { useAppStore } from '@/lib/store'
import { useFiles } from '@/hooks/useFiles'
import { useActivityLog } from '@/hooks/useActivityLog'
import { offlineDB } from '@/lib/offline'
import { 
  Upload, 
  Link2, 
  FileText, 
  FileSpreadsheet, 
  File as FileIcon, 
  Download,
  Eye,
  Trash2,
  ExternalLink,
  History
} from 'lucide-react'
import ActivityHistoryModal from './ActivityHistoryModal'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function FilesSection() {
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkDescription, setLinkDescription] = useState('')
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  
  const { files, fetchFiles, addFile, deleteFile } = useFiles()
  
  const { 
    currentUser,
    teamMembers 
  } = useAppStore()
  
  const { logActivity } = useActivityLog()

  // Cargar archivos al montar el componente
  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!currentUser) return

    for (const file of acceptedFiles) {
      const fileId = `file-${Date.now()}-${Math.random()}`
      
      // Simular progreso de upload
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }))
      
      const newFile = {
        id: fileId,
        name: file.name,
        type: 'upload' as const,
        file_type: file.type || 'application/octet-stream',
        size: file.size,
        uploaded_by: currentUser.id,
        shared_with: teamMembers.map(m => m.id),
        created_at: new Date().toISOString(),
        comments: []
      }

      // Simular progreso
      let progress = 0
      const progressInterval = setInterval(() => {
        progress += Math.random() * 30
        if (progress >= 100) {
          progress = 100
          clearInterval(progressInterval)
          setUploadProgress(prev => {
            const updated = { ...prev }
            delete updated[fileId]
            return updated
          })
        }
        setUploadProgress(prev => ({ ...prev, [fileId]: Math.min(progress, 100) }))
      }, 200)

      // Guardar archivo usando el hook
      await addFile(newFile)
      await offlineDB.saveFile(newFile)
      
      // 📝 Registrar actividad de subida
      await logActivity({
        user_id: currentUser.id,
        user_name: currentUser.name,
        action_type: 'upload',
        entity_type: 'file',
        entity_id: fileId,
        entity_name: file.name,
        description: `${currentUser.name} subió el archivo "${file.name}"`,
        metadata: {
          file_type: file.type,
          size: file.size
        }
      })

      toast.success(`${file.name} subido correctamente`)
    }
    
    setShowUploadModal(false)
  }, [currentUser, teamMembers, addFile, logActivity])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
    }
  })

  const handleAddLink = async () => {
    if (!linkUrl || !currentUser) return

    const linkFile = {
      id: `link-${Date.now()}`,
      name: linkDescription || linkUrl,
      type: 'link' as const,
      drive_url: linkUrl,
      file_type: 'link',
      uploaded_by: currentUser.id,
      shared_with: teamMembers.map(m => m.id),
      created_at: new Date().toISOString(),
      comments: []
    }

    await addFile(linkFile)
    await offlineDB.saveFile(linkFile)
    toast.success('Link compartido correctamente')

    setLinkUrl('')
    setLinkDescription('')
    setShowLinkModal(false)
  }

  const getFileIcon = (fileType: string) => {
    if (fileType === 'link') return Link2
    if (fileType.includes('word')) return FileText
    if (fileType.includes('excel') || fileType.includes('sheet')) return FileSpreadsheet
    return FileIcon
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getUserName = (userId: string) => {
    return teamMembers.find(m => m.id === userId)?.name || 'Usuario'
  }

  const [typeFilter, setTypeFilter] = useState<'all' | 'upload' | 'link'>('all')

  const getFileStats = () => {
    const uploads = files.filter(f => f.type === 'upload')
    const links = files.filter(f => f.type === 'link')
    const totalSize = uploads.reduce((acc, file) => acc + (file.size || 0), 0)
    
    return {
      total: files.length,
      uploads: uploads.length,
      links: links.length,
      totalSize
    }
  }

  const stats = getFileStats()

  const filteredFiles = files.filter(file => {
    if (typeFilter === 'all') return true
    return file.type === typeFilter
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Archivos Compartidos</h2>
          <p className="text-gray-600">Comparte documentos y links con el equipo</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowHistoryModal(true)}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
          >
            <History className="w-4 h-4 mr-2" />
            Historial
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all"
          >
            <Upload size={16} />
            Subir Archivo
          </button>
          <button
            onClick={() => setShowLinkModal(true)}
            className="flex items-center gap-2 bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Link2 size={16} />
            Compartir Link
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          onClick={() => setTypeFilter('all')}
          className={`bg-gray-50 rounded-lg p-3 text-left transition-all ${
            typeFilter === 'all' ? 'ring-2 ring-gray-400 shadow-md' : 'hover:shadow-md hover:bg-gray-100'
          } ${stats.total === 0 ? 'opacity-50 cursor-default' : 'cursor-pointer'}`}
          disabled={stats.total === 0}
        >
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </button>
        
        <button
          onClick={() => setTypeFilter('upload')}
          className={`bg-blue-50 rounded-lg p-3 text-left transition-all ${
            typeFilter === 'upload' ? 'ring-2 ring-blue-400 shadow-md' : 'hover:shadow-md hover:bg-blue-100'
          } ${stats.uploads === 0 ? 'opacity-50 cursor-default' : 'cursor-pointer'}`}
          disabled={stats.uploads === 0}
        >
          <div className="text-2xl font-bold text-blue-600">{stats.uploads}</div>
          <div className="text-sm text-gray-600">Archivos</div>
        </button>
        
        <button
          onClick={() => setTypeFilter('link')}
          className={`bg-purple-50 rounded-lg p-3 text-left transition-all ${
            typeFilter === 'link' ? 'ring-2 ring-purple-400 shadow-md' : 'hover:shadow-md hover:bg-purple-100'
          } ${stats.links === 0 ? 'opacity-50 cursor-default' : 'cursor-pointer'}`}
          disabled={stats.links === 0}
        >
          <div className="text-2xl font-bold text-purple-600">{stats.links}</div>
          <div className="text-sm text-gray-600">Links</div>
        </button>
        
        <div className="bg-green-50 rounded-lg p-3 text-left">
          <div className="text-2xl font-bold text-green-600">{formatFileSize(stats.totalSize)}</div>
          <div className="text-sm text-gray-600">Tamaño Total</div>
        </div>
      </div>

      {/* Files List */}
      <div className="grid gap-4">
        {filteredFiles.length === 0 ? (
          <div className="text-center py-12 bg-white/50 backdrop-blur-sm rounded-xl border border-pink-200/50">
            <FileIcon size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {files.length === 0 
                ? 'No hay archivos compartidos' 
                : `No hay ${typeFilter === 'upload' ? 'archivos subidos' : 'links compartidos'}`
              }
            </h3>
            <p className="text-gray-600 mb-4">
              {files.length === 0 
                ? 'Sube tu primer archivo o comparte un link para comenzar'
                : 'Prueba con otro filtro'
              }
            </p>
          </div>
        ) : (
          filteredFiles.map((file) => {
            const Icon = getFileIcon(file.file_type)
            const progress = uploadProgress[file.id]
            
            return (
              <div key={file.id} className="bg-white/80 backdrop-blur-sm rounded-xl border border-pink-200/50 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                      <Icon size={20} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{file.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>Por {getUserName(file.uploaded_by)}</span>
                        <span>•</span>
                        {file.created_at && (() => {
                          const createdDate = new Date(file.created_at);
                          return createdDate.toString() !== 'Invalid Date' 
                            ? <span>{format(createdDate, 'dd MMM yyyy', { locale: es })}</span>
                            : null;
                        })()}
                        {file.size && (
                          <>
                            <span>•</span>
                            <span>{formatFileSize(file.size)}</span>
                          </>
                        )}
                      </div>
                      
                      {progress !== undefined && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-blue-600">Subiendo...</span>
                            <span className="text-blue-600">{Math.round(progress)}%</span>
                          </div>
                          <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-4">
                    {file.type === 'link' ? (
                      <button
                        onClick={() => window.open(file.drive_url, '_blank')}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Abrir link"
                      >
                        <ExternalLink size={16} />
                      </button>
                    ) : (
                      <>
                        <button
                          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Vista previa"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Descargar"
                        >
                          <Download size={16} />
                        </button>
                      </>
                    )}
                    
                    {currentUser?.role === 'admin' && (
                      <button
                        onClick={async () => {
                          await deleteFile(file.id)
                          toast.success('Archivo eliminado')
                          
                          // 📝 Registrar actividad de eliminación
                          await logActivity({
                            user_id: currentUser.id,
                            user_name: currentUser.name,
                            action_type: 'delete',
                            entity_type: 'file',
                            entity_id: file.id,
                            entity_name: file.name,
                            description: `${currentUser.name} eliminó el archivo "${file.name}"`,
                            metadata: {
                              file_type: file.file_type,
                              size: file.size
                            }
                          })
                        }}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">Subir Archivo</h3>
            
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                isDragActive 
                  ? 'border-purple-500 bg-purple-50' 
                  : 'border-gray-300 hover:border-purple-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload size={48} className="mx-auto text-gray-400 mb-4" />
              
              {isDragActive ? (
                <p className="text-purple-600 font-medium">Suelta los archivos aquí</p>
              ) : (
                <div>
                  <p className="text-gray-600 mb-2">
                    Arrastra archivos aquí o <span className="text-purple-600 font-medium">busca en tu equipo</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Soporta: .doc, .docx, .xls, .xlsx, .pdf, imágenes
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">Compartir Link</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL del enlace *
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://drive.google.com/... o https://onedrive.live.com/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción (opcional)
                </label>
                <input
                  type="text"
                  value={linkDescription}
                  onChange={(e) => setLinkDescription(e.target.value)}
                  placeholder="Nombre descriptivo del archivo o link"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowLinkModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddLink}
                disabled={!linkUrl}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Compartir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de historial de actividades */}
      <ActivityHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        entityType="file"
        entityName="Archivos"
      />
    </div>
  )
}