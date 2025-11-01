import { SharedFile, ChatMessage, TeamMember } from './supabase'

// Tipos para elementos de sincronización
interface SyncQueueItem {
  id?: number
  type: string
  data: Record<string, unknown>
  timestamp: number
}

// IndexedDB para almacenamiento offline
class OfflineDB {
  private db: IDBDatabase | null = null
  private dbName = 'agenda-equipo-offline'
  private version = 1

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // Store para archivos
        if (!db.objectStoreNames.contains('files')) {
          const filesStore = db.createObjectStore('files', { keyPath: 'id' })
          filesStore.createIndex('uploadedBy', 'uploaded_by', { unique: false })
          filesStore.createIndex('createdAt', 'created_at', { unique: false })
        }
        
        // Store para mensajes de chat
        if (!db.objectStoreNames.contains('messages')) {
          const messagesStore = db.createObjectStore('messages', { keyPath: 'id' })
          messagesStore.createIndex('userId', 'user_id', { unique: false })
          messagesStore.createIndex('createdAt', 'created_at', { unique: false })
        }
        
        // Store para miembros del equipo
        if (!db.objectStoreNames.contains('members')) {
          const membersStore = db.createObjectStore('members', { keyPath: 'id' })
          membersStore.createIndex('email', 'email', { unique: true })
          membersStore.createIndex('role', 'role', { unique: false })
        }
        
        // Store para cola de sincronización
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true })
          syncStore.createIndex('timestamp', 'timestamp', { unique: false })
          syncStore.createIndex('type', 'type', { unique: false })
        }
      }
    })
  }

  async saveFile(file: SharedFile): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readwrite')
      const store = transaction.objectStore('files')
      
      const request = store.put({
        ...file,
        cached_at: new Date().toISOString()
      })
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getFiles(): Promise<SharedFile[]> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readonly')
      const store = transaction.objectStore('files')
      const request = store.getAll()
      
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async saveMessage(message: ChatMessage): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['messages'], 'readwrite')
      const store = transaction.objectStore('messages')
      
      const request = store.put({
        ...message,
        cached_at: new Date().toISOString()
      })
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getMessages(): Promise<ChatMessage[]> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['messages'], 'readonly')
      const store = transaction.objectStore('messages')
      const index = store.index('createdAt')
      const request = index.getAll()
      
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async saveMembers(members: TeamMember[]): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['members'], 'readwrite')
      const store = transaction.objectStore('members')
      
      // Limpiar y guardar todos los miembros
      store.clear()
      
      let pending = members.length
      if (pending === 0) {
        resolve()
        return
      }
      
      members.forEach(member => {
        const request = store.put({
          ...member,
          cached_at: new Date().toISOString()
        })
        
        request.onsuccess = () => {
          pending--
          if (pending === 0) resolve()
        }
        request.onerror = () => reject(request.error)
      })
    })
  }

  async getMembers(): Promise<TeamMember[]> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['members'], 'readonly')
      const store = transaction.objectStore('members')
      const request = store.getAll()
      
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async updateMember(memberId: string, updates: Partial<TeamMember>): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['members'], 'readwrite')
      const store = transaction.objectStore('members')
      
      const getRequest = store.get(memberId)
      
      getRequest.onsuccess = () => {
        const member = getRequest.result
        if (member) {
          const updatedMember = {
            ...member,
            ...updates,
            updated_at: new Date().toISOString()
          }
          
          const putRequest = store.put(updatedMember)
          putRequest.onsuccess = () => resolve()
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          reject(new Error('Member not found'))
        }
      }
      
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  async addToSyncQueue(item: SyncQueueItem): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite')
      const store = transaction.objectStore('syncQueue')
      
      const request = store.add(item)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readonly')
      const store = transaction.objectStore('syncQueue')
      const request = store.getAll()
      
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async clearSyncQueue(): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite')
      const store = transaction.objectStore('syncQueue')
      
      const request = store.clear()
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

export const offlineDB = new OfflineDB()