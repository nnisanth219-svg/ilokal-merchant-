import nodemailer from 'nodemailer'
import { env } from '../config/env.js'

export interface SendMailInput {
  to: string
  subject: string
  text: string
  html?: string
}

export function isEmailConfigured(): boolean {
  return Boolean(env.smtpHost && env.smtpFrom)
}

function createTransport() {
  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: env.smtpUser
      ? {
          user: env.smtpUser,
          pass: env.smtpPass,
        }
      : undefined,
  })
}

export async function sendMail(input: SendMailInput): Promise<void> {
  if (!isEmailConfigured()) {
    throw new Error('Email delivery is not configured')
  }

  const transporter = createTransport()
  await transporter.sendMail({
    from: env.smtpFrom,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html ?? input.text.replace(/\n/g, '<br />'),
  })
}
