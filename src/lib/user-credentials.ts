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

// Hashes generados con bcrypt (salt rounds: 12)
export const LOCAL_USER_CREDENTIALS: UserCredentials[] = [
  {
    id: '1',
    email: 'paula@equipo.com',
    password_hash: '$2b$12$4gL5GHOlho4KgW8zXtBt9.BAUJfFI3PIfXCF/0XOVrq6/QUNRFrJ.',
    name: 'Paula',
    role: 'admin',
    phone: '+54 9 11 1111-1111'
  },
  {
    id: '2', 
    email: 'gabi@equipo.com',
    password_hash: '$2b$12$OYDIK5s.ZKSn4LinNj1b8.Ng5pW5IUaYF.mkTnktuuLEQfzbjlpFq',
    name: 'Gabi',
    role: 'member',
    phone: '+54 9 11 3333-3333'
  },
  {
    id: '3',
    email: 'caro@equipo.com', 
    password_hash: '$2b$12$b6pfm.vPiHM1d2J7j1jRkOlgR3e8oH4NGNN5PR76uUI5irLy6nFmS',
    name: 'Caro',
    role: 'member',
    phone: '+54 9 11 2222-2222'
  }
]

// Credenciales en texto plano para referencia (NO usar en producción)
// Paula: 1111
// Gabi: 3333  
// Caro: 2222

export function findUserByEmail(email: string): UserCredentials | undefined {
  return LOCAL_USER_CREDENTIALS.find(
    user => user.email.toLowerCase() === email.toLowerCase()
  )
}

export function getUserCredentials(): UserCredentials[] {
  return LOCAL_USER_CREDENTIALS
}