export class AppError extends Error {
  readonly statusCode: number
  readonly expose: boolean

  constructor(statusCode: number, message: string, expose = true) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.expose = expose
  }
}
