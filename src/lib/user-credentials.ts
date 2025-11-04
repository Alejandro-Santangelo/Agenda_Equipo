// Credenciales locales con contraseñas hasheadas para modo offline
// Estas contraseñas coinciden con las de la base de datos

export interface UserCredentials {
  id: string
  email: string
  password_hash: string
  name: string
  role: 'admin' | 'member'
  phone?: string
}

// Array vacío - los usuarios se cargan desde Supabase
export const LOCAL_USER_CREDENTIALS: UserCredentials[] = []

export function findUserByEmail(email: string): UserCredentials | undefined {
  return LOCAL_USER_CREDENTIALS.find(
    user => user.email.toLowerCase() === email.toLowerCase()
  )
}

export function getUserCredentials(): UserCredentials[] {
  return LOCAL_USER_CREDENTIALS
}