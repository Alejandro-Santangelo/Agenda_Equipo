'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export interface Task {
  id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  due_date?: string
  assigned_to: string
  created_by: string
  created_at: string
  updated_at: string
  project_id?: string
}

export interface Project {
  id: string
  name: string
  description?: string
  color: string
  created_by: string
  created_at: string
  updated_at: string
}

interface TaskStore {
  tasks: Task[]
  projects: Project[]
  loading: boolean
  error: string | null
  
  // Acciones de tareas
  fetchTasks: () => Promise<void>
  addTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  
  // Acciones de proyectos
  fetchProjects: () => Promise<void>
  addProject: (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  
  // Utilidades
  clearError: () => void
  getTasksByStatus: (status: Task['status']) => Task[]
  getTasksByProject: (projectId: string) => Task[]
}

export const useTasks = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      projects: [],
      loading: false,
      error: null,

      fetchTasks: async () => {
        try {
          set({ loading: true, error: null })
          
          // Si hay Supabase configurado, intentar sincronizar
          if (supabase && isSupabaseConfigured()) {
            try {
              const { data: serverTasks, error } = await supabase
                .from('tasks')
                .select('*')
                .is('archived_at', null)  // Solo tareas no archivadas
                .order('created_at', { ascending: false })

              if (!error && serverTasks) {
                set({ tasks: serverTasks })
                console.log('✅ Tasks sincronizadas desde servidor')
              }
            } catch {
              console.log('📱 Tasks: usando datos locales')
            }
          }
          
          set({ loading: false })
        } catch (error) {
          console.error('Error fetching tasks:', error)
          set({ 
            error: 'Error al cargar tareas',
            loading: false 
          })
        }
      },

      addTask: async (taskData) => {
        try {
          const newTask: Task = {
            ...taskData,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          // Agregar localmente primero (inmediato)
          const { tasks } = get()
          const updatedTasks = [...tasks, newTask]
          set({ tasks: updatedTasks })

          // Sincronizar con servidor si está disponible
          if (supabase && isSupabaseConfigured()) {
            try {
              await supabase.from('tasks').insert([newTask])
              console.log('✅ Task sincronizada con servidor')
            } catch {
              console.log('📱 Task guardada localmente')
            }
          }

        } catch (error) {
          console.error('Error adding task:', error)
          set({ error: 'Error al agregar tarea' })
        }
      },

      updateTask: async (id, updates) => {
        try {
          const { tasks } = get()
          const updatedTasks = tasks.map(task => 
            task.id === id 
              ? { ...task, ...updates, updated_at: new Date().toISOString() }
              : task
          )
          
          set({ tasks: updatedTasks })

          // Sincronizar con servidor si está disponible
          if (supabase && isSupabaseConfigured()) {
            try {
              await supabase
                .from('tasks')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id)
              console.log('✅ Task actualizada en servidor')
            } catch {
              console.log('📱 Task actualizada localmente')
            }
          }

        } catch (error) {
          console.error('Error updating task:', error)
          set({ error: 'Error al actualizar tarea' })
        }
      },

      deleteTask: async (id) => {
        try {
          const { tasks } = get()
          const updatedTasks = tasks.filter(task => task.id !== id)
          set({ tasks: updatedTasks })

          // Sincronizar con servidor si está disponible
          if (supabase && isSupabaseConfigured()) {
            try {
              await supabase.from('tasks').delete().eq('id', id)
              console.log('✅ Task eliminada del servidor')
            } catch {
              console.log('📱 Task eliminada localmente')
            }
          }

        } catch (error) {
          console.error('Error deleting task:', error)
          set({ error: 'Error al eliminar tarea' })
        }
      },

      fetchProjects: async () => {
        try {
          set({ loading: true, error: null })
          
          // Si hay Supabase configurado, intentar sincronizar
          if (supabase && isSupabaseConfigured()) {
            try {
              const { data: serverProjects, error } = await supabase
                .from('projects')
                .select('*')
                .order('name', { ascending: true })

              if (!error && serverProjects) {
                set({ projects: serverProjects })
                console.log('✅ Projects sincronizados desde servidor')
              }
            } catch {
              console.log('📱 Projects: usando datos locales')
            }
          }
          
          set({ loading: false })
        } catch (error) {
          console.error('Error fetching projects:', error)
          set({ 
            error: 'Error al cargar proyectos',
            loading: false 
          })
        }
      },

      addProject: async (projectData) => {
        try {
          const newProject: Project = {
            ...projectData,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          // Agregar localmente primero (inmediato)
          const { projects } = get()
          const updatedProjects = [...projects, newProject]
          set({ projects: updatedProjects })

          // Sincronizar con servidor si está disponible
          if (supabase && isSupabaseConfigured()) {
            try {
              await supabase.from('projects').insert([newProject])
              console.log('✅ Project sincronizado con servidor')
            } catch {
              console.log('📱 Project guardado localmente')
            }
          }

        } catch (error) {
          console.error('Error adding project:', error)
          set({ error: 'Error al agregar proyecto' })
        }
      },

      updateProject: async (id, updates) => {
        try {
          const { projects } = get()
          const updatedProjects = projects.map(project => 
            project.id === id 
              ? { ...project, ...updates, updated_at: new Date().toISOString() }
              : project
          )
          
          set({ projects: updatedProjects })

          // Sincronizar con servidor si está disponible
          if (supabase && isSupabaseConfigured()) {
            try {
              await supabase
                .from('projects')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id)
              console.log('✅ Project actualizado en servidor')
            } catch {
              console.log('📱 Project actualizado localmente')
            }
          }

        } catch (error) {
          console.error('Error updating project:', error)
          set({ error: 'Error al actualizar proyecto' })
        }
      },

      deleteProject: async (id) => {
        try {
          const { projects } = get()
          const updatedProjects = projects.filter(project => project.id !== id)
          set({ projects: updatedProjects })

          // Sincronizar con servidor si está disponible
          if (supabase && isSupabaseConfigured()) {
            try {
              await supabase.from('projects').delete().eq('id', id)
              console.log('✅ Project eliminado del servidor')
            } catch {
              console.log('📱 Project eliminado localmente')
            }
          }

        } catch (error) {
          console.error('Error deleting project:', error)
          set({ error: 'Error al eliminar proyecto' })
        }
      },

      clearError: () => set({ error: null }),
      
      getTasksByStatus: (status: Task['status']) => {
        const { tasks } = get()
        return tasks.filter(task => task.status === status)
      },

      getTasksByProject: (projectId: string) => {
        const { tasks } = get()
        return tasks.filter(task => task.project_id === projectId)
      }
    }),
    {
      name: 'tasks-storage',
      partialize: (state) => ({ 
        tasks: state.tasks,
        projects: state.projects
      })
    }
  )
)

// 🔄 Configurar Realtime para sincronización automática
if (typeof window !== 'undefined' && supabase && isSupabaseConfigured()) {
  // Subscripción a cambios en tasks
  supabase
    .channel('tasks-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tasks' },
      (payload) => {
        const store = useTasks.getState()
        
        if (payload.eventType === 'INSERT') {
          const newTask = payload.new as Task
          const exists = store.tasks.find(t => t.id === newTask.id)
          if (!exists) {
            // Crear nuevo array inmutable para forzar re-render
            const updatedTasks = [...store.tasks, newTask]
            useTasks.setState({ tasks: updatedTasks })
            console.log('🔄 Nueva tarea recibida en tiempo real:', newTask.title)
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedTask = payload.new as Task
          // Crear nuevo array inmutable para forzar re-render
          const updatedTasks = store.tasks.map(t => 
            t.id === updatedTask.id ? updatedTask : t
          )
          useTasks.setState({ tasks: updatedTasks })
          console.log('🔄 Tarea actualizada en tiempo real:', updatedTask.title)
        } else if (payload.eventType === 'DELETE') {
          const deletedId = (payload.old as Task).id
          // Crear nuevo array inmutable para forzar re-render
          const updatedTasks = store.tasks.filter(t => t.id !== deletedId)
          useTasks.setState({ tasks: updatedTasks })
          console.log('🔄 Tarea eliminada en tiempo real')
        }
      }
    )
    .subscribe()

  // Subscripción a cambios en projects
  supabase
    .channel('projects-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'projects' },
      (payload) => {
        const store = useTasks.getState()
        
        if (payload.eventType === 'INSERT') {
          const newProject = payload.new as Project
          const exists = store.projects.find(p => p.id === newProject.id)
          if (!exists) {
            // Crear nuevo array inmutable para forzar re-render
            const updatedProjects = [...store.projects, newProject]
            useTasks.setState({ projects: updatedProjects })
            console.log('🔄 Nuevo proyecto recibido en tiempo real:', newProject.name)
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedProject = payload.new as Project
          // Crear nuevo array inmutable para forzar re-render
          const updatedProjects = store.projects.map(p => 
            p.id === updatedProject.id ? updatedProject : p
          )
          useTasks.setState({ projects: updatedProjects })
          console.log('🔄 Proyecto actualizado en tiempo real:', updatedProject.name)
        } else if (payload.eventType === 'DELETE') {
          const deletedId = (payload.old as Project).id
          // Crear nuevo array inmutable para forzar re-render
          const updatedProjects = store.projects.filter(p => p.id !== deletedId)
          useTasks.setState({ projects: updatedProjects })
          console.log('🔄 Proyecto eliminado en tiempo real')
        }
      }
    )
    .subscribe()

  console.log('✅ Supabase Realtime activado para tasks y projects')
}