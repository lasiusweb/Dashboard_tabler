import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'

describe('AuthController', () => {
  let controller: AuthController
  let service: {
    signIn: ReturnType<typeof vi.fn>
    signUp: ReturnType<typeof vi.fn>
    signOut: ReturnType<typeof vi.fn>
    getSession: ReturnType<typeof vi.fn>
    sendPasswordResetEmail: ReturnType<typeof vi.fn>
    resetPassword: ReturnType<typeof vi.fn>
    verifyEmail: ReturnType<typeof vi.fn>
    sendPhoneOTP: ReturnType<typeof vi.fn>
    verifyPhoneOTP: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    service = {
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      sendPasswordResetEmail: vi.fn(),
      resetPassword: vi.fn(),
      verifyEmail: vi.fn(),
      sendPhoneOTP: vi.fn(),
      verifyPhoneOTP: vi.fn(),
    }
    controller = new AuthController(service as unknown as AuthService)
  })

  describe('signIn', () => {
    it('delegates email and password to the service', async () => {
      service.signIn.mockResolvedValue({ token: 't' })
      await expect(controller.signIn({ email: 'a@b.com', password: 'secret' })).resolves.toEqual({ token: 't' })
      expect(service.signIn).toHaveBeenCalledWith('a@b.com', 'secret')
    })
  })

  describe('signUp', () => {
    it('delegates email, password and name to the service', async () => {
      service.signUp.mockResolvedValue({ id: 'u-1' })
      await expect(controller.signUp({ email: 'a@b.com', password: 'secret', name: 'A' })).resolves.toEqual({ id: 'u-1' })
      expect(service.signUp).toHaveBeenCalledWith('a@b.com', 'secret', 'A')
    })
  })

  describe('signOut', () => {
    it('delegates the session token to the service', async () => {
      service.signOut.mockResolvedValue({ ok: true })
      await expect(controller.signOut({ sessionToken: 'tok' })).resolves.toEqual({ ok: true })
      expect(service.signOut).toHaveBeenCalledWith('tok')
    })
  })

  describe('getSession', () => {
    it('delegates the token to the service', async () => {
      service.getSession.mockResolvedValue({ user: { id: 'u-1' } })
      await expect(controller.getSession('tok')).resolves.toEqual({ user: { id: 'u-1' } })
      expect(service.getSession).toHaveBeenCalledWith('tok')
    })
  })

  describe('forgetPassword', () => {
    it('delegates the email to the service', async () => {
      service.sendPasswordResetEmail.mockResolvedValue({ ok: true })
      await expect(controller.forgetPassword({ email: 'a@b.com' })).resolves.toEqual({ ok: true })
      expect(service.sendPasswordResetEmail).toHaveBeenCalledWith('a@b.com')
    })
  })

  describe('resetPassword', () => {
    it('delegates password and token to the service', async () => {
      service.resetPassword.mockResolvedValue({ ok: true })
      await expect(controller.resetPassword({ password: 'new', token: 'tok' })).resolves.toEqual({ ok: true })
      expect(service.resetPassword).toHaveBeenCalledWith('new', 'tok')
    })
  })

  describe('verifyEmail', () => {
    it('delegates the token to the service', async () => {
      service.verifyEmail.mockResolvedValue({ ok: true })
      await expect(controller.verifyEmail('tok')).resolves.toEqual({ ok: true })
      expect(service.verifyEmail).toHaveBeenCalledWith('tok')
    })
  })

  describe('sendOTP', () => {
    it('delegates the phone to the service', async () => {
      service.sendPhoneOTP.mockResolvedValue({ ok: true })
      await expect(controller.sendOTP({ phone: '12345' })).resolves.toEqual({ ok: true })
      expect(service.sendPhoneOTP).toHaveBeenCalledWith('12345')
    })
  })

  describe('verifyOTP', () => {
    it('delegates phone and otp to the service', async () => {
      service.verifyPhoneOTP.mockResolvedValue({ ok: true })
      await expect(controller.verifyOTP({ phone: '12345', otp: '1234' })).resolves.toEqual({ ok: true })
      expect(service.verifyPhoneOTP).toHaveBeenCalledWith('12345', '1234')
    })
  })
})
