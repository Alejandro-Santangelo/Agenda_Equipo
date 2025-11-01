// Utilidades para manejo seguro de contraseñas
import bcrypt from 'bcryptjs'

// Configuración para bcrypt
const SALT_ROUNDS = 12 // Número de rondas para el salt (más alto = más seguro pero más lento)

/**
 * Hashea una contraseña usando bcrypt
 * @param password - Contraseña en texto plano
 * @returns Promise<string> - Hash de la contraseña
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS)
    const hash = await bcrypt.hash(password, salt)
    return hash
  } catch (error) {
    console.error('Error hashing password:', error)
    throw new Error('Error al procesar la contraseña')
  }
}

/**
 * Verifica una contraseña contra un hash
 * @param password - Contraseña en texto plano
 * @param hash - Hash almacenado en la base de datos
 * @returns Promise<boolean> - true si la contraseña es correcta
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash)
  } catch (error) {
    console.error('Error verifying password:', error)
    return false
  }
}

/**
 * Genera hashes para las credenciales por defecto
 * Función auxiliar para migración inicial
 */
export async function generateDefaultCredentialsHashes() {
  const defaultCredentials = [
    { email: 'paula@equipo.com', password: '1111', name: 'Paula', role: 'admin' },
    { email: 'gabi@equipo.com', password: '3333', name: 'Gabi', role: 'member' },
    { email: 'caro@equipo.com', password: '2222', name: 'Caro', role: 'member' }
  ]

  const hashedCredentials = []
  
  for (const cred of defaultCredentials) {
    const hashedPassword = await hashPassword(cred.password)
    hashedCredentials.push({
      ...cred,
      password_hash: hashedPassword
    })
    console.log(`${cred.name} (${cred.email}): ${hashedPassword}`)
  }
  
  return hashedCredentials
}

/**
 * Valida la fortaleza de una contraseña
 * @param password - Contraseña a validar
 * @returns object - Resultado de validación
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean
  errors: string[]
  score: number
} {
  const errors: string[] = []
  let score = 0

  // Validaciones básicas
  if (password.length < 4) {
    errors.push('La contraseña debe tener al menos 4 caracteres')
  } else {
    score += 1
  }

  if (password.length >= 8) {
    score += 1
  }

  if (/[A-Z]/.test(password)) {
    score += 1
  }

  if (/[a-z]/.test(password)) {
    score += 1
  }

  if (/\d/.test(password)) {
    score += 1
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1
  }

  // Validar que no sea muy común
  const commonPasswords = ['1234', '1111', '2222', '3333', 'password', '123456', 'qwerty']
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('La contraseña es muy común, usa una más segura')
    score = Math.max(0, score - 2)
  }

  return {
    isValid: errors.length === 0 && score >= 1,
    errors,
    score: Math.min(5, score) // Máximo 5 puntos
  }
}

/**
 * Genera una contraseña segura aleatoria
 * @param length - Longitud de la contraseña (mínimo 8)
 * @returns string - Contraseña generada
 */
export function generateSecurePassword(length: number = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  
  const allChars = lowercase + uppercase + numbers + symbols
  let password = ''
  
  // Asegurar al menos un carácter de cada tipo
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // Llenar el resto con caracteres aleatorios
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Mezclar los caracteres
  return password.split('').sort(() => 0.5 - Math.random()).join('')
}