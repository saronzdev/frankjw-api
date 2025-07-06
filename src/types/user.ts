export type UserIn = {
  name: string
  password: string
  email: string
}

export type UserOut = {
  id: number
  role: 'admin' | 'client'
  createdAt: Date
}

export type User = UserIn & UserOut

export const validateUser = (data: any): data is UserIn => {
  return typeof data.name === 'string' && typeof data.email === 'string' && typeof data.password === 'string'
}
export const validateUserLogin = (data: any): data is Omit<UserIn, 'name'> => {
  return typeof data.email === 'string' && typeof data.password === 'string'
}
