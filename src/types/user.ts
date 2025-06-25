export interface UserIn {
  name: string
  email: string
  password: string
}

export const validateUser = (data: any): data is UserIn => {
  return typeof data.name === 'string' && typeof data.email === 'string' && typeof data.password === 'string'
}
