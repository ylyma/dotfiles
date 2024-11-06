import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Post,
  Req,
  HttpCode,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiBody,
  ApiTags,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { isNil } from 'lodash';

import { Public } from '../../common/constants';
import { AuthService } from './auth.service';
import ForgotPasswordDto from './dto/requests/forgot-password.dto';
import LoginDto from './dto/requests/login.dto';
import PreLoginDto from './dto/requests/pre-login.dto';
import RefreshOtpDto from './dto/requests/refresh-otp.dto';
import ResetPasswordDto from './dto/requests/reset-password.dto';
import ValidateOtpDto from './dto/requests/validate-otp';
import { ResponseCsrfDto } from './dto/responses/response-csrf.dto';
import { ResponseForgotPasswordDto } from './dto/responses/response-forgot-password.dto';
import { ResponseLoginDto } from './dto/responses/response-login.dto';
import { ResponsePreLoginDto } from './dto/responses/response-pre-login.dto';
import { ResponseRefreshOtpDto } from './dto/responses/response-refresh-otp.dto';
import { ResponseResetPasswordDto } from './dto/responses/response-reset-password.dto';
import { ResponseValidateOtp } from './dto/responses/response-validate-otp.dto';

@ApiTags('Authentication (Public APIs)')
@Controller('/auth')
@UseInterceptors(ClassSerializerInterceptor)
@Public()
@ApiInternalServerErrorResponse({
  description: 'Internal server error occurred while processing the request',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/pre-login')
  @ApiOperation({
    summary: 'Start authentication flow',
    description:
      'First step of authentication. Validates credentials and initiates 2FA. ' +
      'Requires reCAPTCHA token except in playground/local environments.',
  })
  @HttpCode(200)
  @ApiBody({
    type: PreLoginDto,
    description: 'Email, password, and reCAPTCHA token (required in non-local environments)',
  })
  @ApiOkResponse({ type: ResponsePreLoginDto, description: 'Successful pre-login' })
  @ApiBadRequestResponse({
    description: 'Invalid credentials or reCAPTCHA token',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication failed',
  })
  async preLogin(@Body() loginDto: PreLoginDto): Promise<ResponsePreLoginDto> {
    return this.authService.preLogin(loginDto);
  }

  @Post('/refresh-otp')
  @ApiOperation({
    summary: 'Refresh expired OTP',
    description:
      'Generates and sends new OTP using refresh token. For security, returns success regardless of email existence.',
  })
	@HttpCode(200)
  @ApiBody({
    type: RefreshOtpDto,
    description: 'Email and refresh token from pre-login',
  })
	@ApiOkResponse({
    type: ResponseRefreshOtpDto,
    description: 'Successful refresh OTP (or not - deliberate response for security)',
  })
  @ApiBadRequestResponse({
    description: 'Invalid request format',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid refresh token',
  })
  async refreshOtp(@Body() refreshOtpDto: RefreshOtpDto): Promise<ResponseRefreshOtpDto> {
    return this.authService.refreshOtp(refreshOtpDto);
  }

  @Post('/login')
  @ApiOperation({
    summary: 'Complete login with OTP',
    description: 'Validates OTP and returns JWT access token with user and member firm details',
  })
	@HttpCode(200)
  @ApiBody({
    type: LoginDto,
    description: 'Email and OTP',
  })
	@ApiOkResponse({ type: ResponseLoginDto, description: 'Successful login' })
  @ApiBadRequestResponse({
    description: 'Invalid request format',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid OTP',
  })
  async login(@Body() loginDto: LoginDto): Promise<ResponseLoginDto> {
    const output = await this.authService.login(loginDto);
    if (!output) throw new InternalServerErrorException('Unable to login');
    return output;
  }

  @Post('/login/skip-2fa')
	@HttpCode(200)
  @ApiOperation({
    summary: '[Development] Direct authentication',
    description: 'Bypasses 2FA when EXCHANGE_DISABLE_2FA=true. Only available in development.',
  })
  @ApiBody({
    type: PreLoginDto,
    description: 'Email and password',
  })
	@ApiOkResponse({ type: ResponseLoginDto, description: 'Successful login' })
  @ApiBadRequestResponse({
    description: 'Invalid credentials',
  })
  @ApiNotFoundResponse({
    description: 'Not available (2FA enabled)',
  })
  async loginSkip2fa(@Body() loginDto: PreLoginDto): Promise<ResponseLoginDto> {
    const disable2fa = Boolean(process.env.EXCHANGE_DISABLE_2FA === 'true') || false;
    if (!disable2fa) throw new NotFoundException();
    return this.authService.skip2faLogin(loginDto);
  }

  @Post('/forgot-password')
	@HttpCode(200)
	@ApiOperation({
    summary: 'Initiate password reset',
    description: `
      Initiates the password reset process by sending an OTP to the user's email address.
      Flow:
      1. /auth/forgot-password (current) - Sends OTP
      2. /auth/validate-otp - Validates OTP
      3. /auth/reset-password - Sets new password
    `,
  })
  @ApiBody({
    type: ForgotPasswordDto,
    description: 'Email and reCAPTCHA token (required in non-local environments)',
  })
	@ApiOkResponse({ type: ResponseForgotPasswordDto, description: 'Forgot password' })
  @ApiBadRequestResponse({
    description: 'Invalid reCAPTCHA token or email format',
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<ResponseForgotPasswordDto> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('/validate-otp')
	@HttpCode(200)
  @ApiOperation({
    summary: 'Verify recovery OTP',
    description: 'Validates password reset OTP and provides reset token',
  })
  @ApiBody({
    type: ValidateOtpDto,
    description: 'Email and OTP',
  })
  @ApiBadRequestResponse({
    description: 'Invalid request format',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid OTP',
  })
  async validateOtp(@Body() validateOtpDto: ValidateOtpDto): Promise<ResponseValidateOtp> {
    return this.authService.validateOtp(validateOtpDto);
  }

  @Post('/reset-password')
	@HttpCode(200)
  @ApiOperation({
    summary: 'Complete password recovery',
    description: 'Updates password using reset token and returns new JWT access token',
  })
  @ApiBody({
    type: ResetPasswordDto,
    description: 'New password and reset token from validate-otp',
  })
	@ApiOkResponse({ type: ResponseResetPasswordDto, description: 'Reset password by token' })
  @ApiBadRequestResponse({
    description: 'Invalid password',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid reset token',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<ResponseResetPasswordDto> {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Get('/csrf')
	@HttpCode(200)
  @ApiOperation({
    summary: 'Get CSRF token',
    description: 'Required for all POST requests. Include token in X-CSRF-Token header.',
  })
	@ApiOkResponse({ type: ResponseCsrfDto, description: 'Get CSRF token' })
  getCsrf(@Req() request: Request): ResponseCsrfDto {
    const csrfToken = isNil(request.csrfToken) ? '' : request.csrfToken();
    return { csrfToken };
  }
}
