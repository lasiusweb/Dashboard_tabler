import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthService } from './auth.service'
import { PrismaService } from '../../prisma/prisma.service'

describe('AuthService', () => {
  let service: AuthService

  beforeEach(() => {
    service = new AuthService({} as unknown as PrismaService)
  })

  it('delegates sign-in to the Better Auth endpoint', async () => {
    await expect(service.signIn('a@b.com', 'secret')).resolves.toEqual({
      message: 'Use /api/auth/sign-in endpoint',
    })
  })

  it('delegates sign-up to the Better Auth endpoint', async () => {
    await expect(service.signUp('a@b.com', 'secret', 'Alice')).resolves.toEqual({
      message: 'Use /api/auth/sign-up endpoint',
    })
  })

  it('delegates sign-out to the Better Auth endpoint', async () => {
    await expect(service.signOut('token')).resolves.toEqual({
      message: 'Use /api/auth/sign-out endpoint',
    })
  })

  it('delegates session lookup to the Better Auth endpoint', async () => {
    await expect(service.getSession('token')).resolves.toEqual({
      message: 'Use /api/auth/get-session endpoint',
    })
  })

  it('delegates password reset email to the Better Auth endpoint', async () => {
    await expect(service.sendPasswordResetEmail('a@b.com')).resolves.toEqual({
      message: 'Use /api/auth/forget-password endpoint',
    })
  })

  it('delegates password reset to the Better Auth endpoint', async () => {
    await expect(service.resetPassword('newpass', 'token')).resolves.toEqual({
      message: 'Use /api/auth/reset-password endpoint',
    })
  })

  it('delegates email verification to the Better Auth endpoint', async () => {
    await expect(service.verifyEmail('vtoken')).resolves.toEqual({
      message: 'Use /api/auth/verify-email endpoint',
    })
  })

  it('delegates phone OTP sending to the Better Auth endpoint', async () => {
    await expect(service.sendPhoneOTP('+919999999999')).resolves.toEqual({
      message: 'Use /api/auth/send-otp endpoint',
    })
  })

  it('delegates phone OTP verification to the Better Auth endpoint', async () => {
    await expect(service.verifyPhoneOTP('+919999999999', '123456')).resolves.toEqual({
      message: 'Use /api/auth/verify-otp endpoint',
    })
  })
})
