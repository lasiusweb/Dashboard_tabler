import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('sign-in')
  @ApiOperation({ summary: 'Sign in with email and password' })
  @ApiResponse({ status: 200, description: 'Successfully signed in' })
  async signIn(@Body() body: { email: string; password: string }) {
    return this.authService.signIn(body.email, body.password);
  }

  @Public()
  @Post('sign-up')
  @ApiOperation({ summary: 'Sign up with email and password' })
  @ApiResponse({ status: 201, description: 'Successfully signed up' })
  async signUp(
    @Body() body: { email: string; password: string; name: string },
  ) {
    return this.authService.signUp(body.email, body.password, body.name);
  }

  @Public()
  @Post('sign-out')
  @ApiOperation({ summary: 'Sign out' })
  @ApiResponse({ status: 200, description: 'Successfully signed out' })
  async signOut(@Body() body: { sessionToken: string }) {
    return this.authService.signOut(body.sessionToken);
  }

  @Public()
  @Get('session')
  @ApiOperation({ summary: 'Get current session' })
  @ApiResponse({ status: 200, description: 'Session retrieved' })
  async getSession(@Query('token') token: string) {
    return this.authService.getSession(token);
  }

  @Public()
  @Post('forget-password')
  @ApiOperation({ summary: 'Send password reset email' })
  @ApiResponse({ status: 200, description: 'Reset email sent' })
  async forgetPassword(@Body() body: { email: string }) {
    return this.authService.sendPasswordResetEmail(body.email);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset' })
  async resetPassword(@Body() body: { password: string; token: string }) {
    return this.authService.resetPassword(body.password, body.token);
  }

  @Public()
  @Get('verify-email')
  @ApiOperation({ summary: 'Verify email with token' })
  @ApiResponse({ status: 200, description: 'Email verified' })
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Public()
  @Post('send-otp')
  @ApiOperation({ summary: 'Send OTP to phone' })
  @ApiResponse({ status: 200, description: 'OTP sent' })
  async sendOTP(@Body() body: { phone: string }) {
    return this.authService.sendPhoneOTP(body.phone);
  }

  @Public()
  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify phone OTP' })
  @ApiResponse({ status: 200, description: 'Phone verified' })
  async verifyOTP(@Body() body: { phone: string; otp: string }) {
    return this.authService.verifyPhoneOTP(body.phone, body.otp);
  }
}
