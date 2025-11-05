import { createClient } from '@supabase/supabase-js'

// Configuración segura que funciona tanto con credenciales reales como en modo offline
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rvgrrbquevzfuyhekbfr.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Z3JyYnF1ZXZ6ZnV5aGVrYmZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwODk5MDAsImV4cCI6MjA3NzY2NTkwMH0.GIjnZZ7xkZyyn3Nml5EiFp2m8XxIMdPOfi1uJDdn1nY'

// Solo crear cliente real si tenemos credenciales válidas
export const supabase = (supabaseUrl.includes('supabase.co') && supabaseAnonKey !== 'offline-mode-key') 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Helper para verificar si Supabase está configurado
export const isSupabaseConfigured = () => {
  return supabase !== null && 
         supabaseUrl.includes('supabase.co') && 
         supabaseAnonKey !== 'offline-mode-key'
}

// Tipos para la base de datos
export interface TeamMember {
  id: string
  name: string
  email: string
  phone?: string
  role: 'admin' | 'member'
  avatar_url?: string
  created_at: string
  // Soportar ambos campos para retrocompatibilidad
  last_seen?: string // Campo en Supabase
  last_active?: string // Campo legacy en código local
  is_active?: boolean
  password_hash?: string
  phone_verified?: boolean
  permissions?: string[]
}

export interface SharedFile {
  id: string
  name: string
  type: 'upload' | 'link'
  file_type: string
  url?: string
  size_bytes?: number
  shared_by: string
  created_at: string
  description?: string
  tags?: string[]
  download_count?: number
  
  // Campos legacy para compatibilidad
  file_url?: string
  drive_url?: string
  size?: number
  uploaded_by?: string
  shared_with?: string[]
  comments?: FileComment[]
}

export interface FileComment {
  id: string
  file_id: string
  user_id: string
  comment: string
  created_at: string
}

export interface ChatMessage {
  id: string
  message: string
  user_id: string
  user_name: string
  created_at: string
  edited_at?: string
  file_attachments?: string[]
}

// Database types
export interface Database {
  public: {
    Tables: {
      team_members: {
        Row: TeamMember
        Insert: Omit<TeamMember, 'id' | 'created_at'>
        Update: Partial<Omit<TeamMember, 'id'>>
      }
      shared_files: {
        Row: SharedFile
        Insert: Omit<SharedFile, 'id' | 'created_at' | 'comments'>
        Update: Partial<Omit<SharedFile, 'id' | 'created_at'>>
      }
      file_comments: {
        Row: FileComment
        Insert: Omit<FileComment, 'id' | 'created_at'>
        Update: Partial<Omit<FileComment, 'id' | 'created_at'>>
      }
      chat_messages: {
        Row: ChatMessage
        Insert: Omit<ChatMessage, 'id' | 'created_at'>
        Update: Partial<Omit<ChatMessage, 'id' | 'created_at'>>
      }
    }
  }
}