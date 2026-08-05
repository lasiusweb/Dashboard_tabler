import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async signIn(email: string, password: string) {
    // Better Auth handles this via the auth endpoint
    // This service is for any additional auth logic
    return { message: 'Use /api/auth/sign-in endpoint' };
  }

  async signUp(email: string, password: string, name: string) {
    // Better Auth handles this via the auth endpoint
    return { message: 'Use /api/auth/sign-up endpoint' };
  }

  async signOut(sessionToken: string) {
    // Better Auth handles this via the auth endpoint
    return { message: 'Use /api/auth/sign-out endpoint' };
  }

  async getSession(sessionToken: string) {
    // Better Auth handles this via the auth endpoint
    return { message: 'Use /api/auth/get-session endpoint' };
  }

  async sendPasswordResetEmail(email: string) {
    // Better Auth handles this via the auth endpoint
    return { message: 'Use /api/auth/forget-password endpoint' };
  }

  async resetPassword(password: string, token: string) {
    // Better Auth handles this via the auth endpoint
    return { message: 'Use /api/auth/reset-password endpoint' };
  }

  async verifyEmail(verificationToken: string) {
    // Better Auth handles this via the auth endpoint
    return { message: 'Use /api/auth/verify-email endpoint' };
  }

  async sendPhoneOTP(phone: string) {
    // Better Auth handles this via the auth endpoint
    return { message: 'Use /api/auth/send-otp endpoint' };
  }

  async verifyPhoneOTP(phone: string, otp: string) {
    // Better Auth handles this via the auth endpoint
    return { message: 'Use /api/auth/verify-otp endpoint' };
  }
}
