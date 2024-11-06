import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Post,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { 
  ApiOperation, 
  ApiBody, 
  ApiTags, 
  ApiBadRequestResponse, 
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { Request } from 'express';
import { isNil } from 'lodash';

import { Public } from '../../common/constants';
import { OpenApiInterceptedSuccessResponse } from '../../common/decorators/openapi-intercepted-response.decorator';
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

@ApiTags('Authentication')
@Controller('/auth')
@UseInterceptors(ClassSerializerInterceptor)
@Public()
@ApiInternalServerErrorResponse({
  description: 'Internal server error occurred while processing the request'
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/pre-login')
  @ApiOperation({
    summary: 'Initiate login process with email and password',
    description: 'Authenticates user credentials, generates OTP, sends it via email, and returns a refresh token for OTP expiry. ' +
      'This is the first step in the two-factor authentication process.\n\n' +
      'Note: Requires valid reCAPTCHA token in non-local environments.'
  })
  @ApiBody({ 
    type: PreLoginDto,
    description: 'User credentials and reCAPTCHA token required for pre-login'
  })
  @ApiBadRequestResponse({
    description: 'Invalid credentials, email format, or reCAPTCHA token'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or account locked'
  })
  @OpenApiInterceptedSuccessResponse(ResponsePreLoginDto, 'OTP sent successfully', 200)
  async preLogin(@Body() loginDto: PreLoginDto): Promise<ResponsePreLoginDto> {
    return this.authService.preLogin(loginDto);
  }

  @Post('/refresh-otp')
  @ApiOperation({
    summary: 'Request a new OTP',
    description: 'Authenticates user email and OTP refresh token, generates new OTP, and sends it via email. ' +
      'Use this when the original OTP has expired.\n\n' +
      'Note: For security reasons, this endpoint returns a success message regardless of whether the email exists.'
  })
  @ApiBody({ 
    type: RefreshOtpDto,
    description: 'Email and refresh token from pre-login'
  })
  @ApiBadRequestResponse({
    description: 'Invalid refresh token or email format'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired refresh token'
  })
  @OpenApiInterceptedSuccessResponse(ResponseRefreshOtpDto, 'New OTP sent successfully', 200)
  async refreshOtp(@Body() refreshOtpDto: RefreshOtpDto): Promise<ResponseRefreshOtpDto> {
    return this.authService.refreshOtp(refreshOtpDto);
  }

  @Post('/login')
  @ApiOperation({
    summary: 'Complete login with OTP verification',
    description: 'Validates the provided OTP and completes the login process by returning a JWT token. ' +
      'This is the second step in the two-factor authentication process.'
  })
  @ApiBody({ 
    type: LoginDto,
    description: 'OTP and email required for login completion'
  })
  @ApiBadRequestResponse({
    description: 'Invalid OTP format or email'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired OTP'
  })
  @OpenApiInterceptedSuccessResponse(ResponseLoginDto, 'Login successful', 200)
  async login(@Body() loginDto: LoginDto): Promise<ResponseLoginDto> {
    const output = await this.authService.login(loginDto);
    if (!output) throw new InternalServerErrorException('Unable to login');
    return output;
  }

  @Post('/login/skip-2fa')
  @ApiOperation({
    summary: 'Login without 2FA (if enabled)',
    description: 'Allows direct login without OTP verification when 2FA is disabled in the environment. ' +
      'This endpoint is only available when EXCHANGE_DISABLE_2FA=true.'
  })
  @ApiBody({ 
    type: PreLoginDto,
    description: 'User credentials for direct login'
  })
  @ApiBadRequestResponse({
    description: 'Invalid credentials format'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials'
  })
  @ApiNotFoundResponse({
    description: '2FA is enabled - endpoint not available'
  })
  @OpenApiInterceptedSuccessResponse(ResponseLoginDto, 'Direct login successful', 200)
  async loginSkip2fa(@Body() loginDto: PreLoginDto): Promise<ResponseLoginDto> {
    const disable2fa = Boolean(process.env.EXCHANGE_DISABLE_2FA === 'true') || false;
    if (!disable2fa) throw new NotFoundException();
    return this.authService.skip2faLogin(loginDto);
  }

  @Post('/forgot-password')
  @ApiOperation({
    summary: 'Initiate password reset process',
    description: 'Validates user email, generates OTP for password reset, sends OTP through email, ' +
      'and returns a token to refresh OTP if it expires. This is the first step in password reset.\n\n' +
      'Note: Requires valid reCAPTCHA token in non-local environments. ' +
      'For security reasons, this endpoint returns a success message regardless of whether the email exists.'
  })
  @ApiBody({ 
    type: ForgotPasswordDto,
    description: 'Email and reCAPTCHA token for password reset'
  })
  @ApiBadRequestResponse({
    description: 'Invalid email format or reCAPTCHA token'
  })
  @ApiNotFoundResponse({
    description: 'Email not found'
  })
  @OpenApiInterceptedSuccessResponse(ResponseForgotPasswordDto, 'Password reset OTP sent', 200)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<ResponseForgotPasswordDto> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('/validate-otp')
  @ApiOperation({
    summary: 'Validate password reset OTP',
    description: 'Validates the OTP sent for password reset and returns a token to complete the password reset. ' +
      'This is the second step in password reset.'
  })
  @ApiBody({ 
    type: ValidateOtpDto,
    description: 'OTP and email for validation'
  })
  @ApiBadRequestResponse({
    description: 'Invalid OTP format or email'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired OTP'
  })
  @OpenApiInterceptedSuccessResponse(ResponseValidateOtp, 'OTP validated successfully', 200)
  async validateOtp(@Body() validateOtpDto: ValidateOtpDto): Promise<ResponseValidateOtp> {
    return this.authService.validateOtp(validateOtpDto);
  }

  @Post('/reset-password')
  @ApiOperation({
    summary: 'Complete password reset',
    description: 'Validates the password reset token and password strength, updates the password, ' +
      'and returns a JWT token for immediate login. This is the final step in password reset.'
  })
  @ApiBody({ 
    type: ResetPasswordDto,
    description: 'New password and reset token'
  })
  @ApiBadRequestResponse({
    description: 'Invalid password format or weak password'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired reset token'
  })
  @OpenApiInterceptedSuccessResponse(ResponseResetPasswordDto, 'Password reset successful', 200)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<ResponseResetPasswordDto> {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Get('/csrf')
  @ApiOperation({
    summary: 'Get CSRF token',
    description: 'Retrieves a CSRF token required for making POST requests to protected endpoints'
  })
  @OpenApiInterceptedSuccessResponse(ResponseCsrfDto, 'CSRF token retrieved', 200)
  getCsrf(@Req() request: Request): ResponseCsrfDto {
    const csrfToken = isNil(request.csrfToken) ? '' : request.csrfToken();
    return { csrfToken };
  }
}
