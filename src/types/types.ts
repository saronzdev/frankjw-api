export enum ErrorCodes {
  //Auth Errors
  TokenExpired = 1001,
  InvalidCredentials = 1002,
  AccessDenied = 1003,
  UserNotFound = 1004,
  PasswordIncorrect = 1005,
  AuthError = 1004,

  //Validations Errors
  InvalidMail = 2001,
  RequiredFieldMissing = 2002,
  AlreadyExist = 2003,
  InvalidId = 2004,

  //Server Errors
  DatabaseError = 3001,
  UploadFileError = 3002
}

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
