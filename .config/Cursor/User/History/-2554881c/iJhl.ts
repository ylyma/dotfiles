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
    summary: 'Start authentication flow',
    description: 'First step of authentication. Requires reCAPTCHA token in all non-local environments. Returns a refresh token for OTP management.'
  })
  @ApiBody({ 
    type: PreLoginDto,
    description: 'Email, password, and reCAPTCHA token'
  })
  @ApiBadRequestResponse({
    description: 'Missing or invalid reCAPTCHA token, malformed email'
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication failed'
  })
  @OpenApiInterceptedSuccessResponse(ResponsePreLoginDto, 'Authentication initiated', 200)
  async preLogin(@Body() loginDto: PreLoginDto): Promise<ResponsePreLoginDto> {
    return this.authService.preLogin(loginDto);
  }

  @Post('/refresh-otp')
  @ApiOperation({
    summary: 'Refresh expired OTP',
    description: 'Use refresh token from pre-login to request a new OTP. Always returns success for security.'
  })
  @ApiBody({ 
    type: RefreshOtpDto,
    description: 'Email and refresh token from pre-login response'
  })
  @ApiBadRequestResponse({
    description: 'Malformed request'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired refresh token'
  })
  @OpenApiInterceptedSuccessResponse(ResponseRefreshOtpDto, 'Request processed', 200)
  async refreshOtp(@Body() refreshOtpDto: RefreshOtpDto): Promise<ResponseRefreshOtpDto> {
    return this.authService.refreshOtp(refreshOtpDto);
  }

  @Post('/login')
  @ApiOperation({
    summary: 'Complete authentication',
    description: 'Final authentication step. Provide OTP received via email. Returns JWT access token on success.'
  })
  @ApiBody({ 
    type: LoginDto,
    description: 'Email and OTP from email'
  })
  @ApiBadRequestResponse({
    description: 'Malformed request'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired OTP'
  })
  @OpenApiInterceptedSuccessResponse(ResponseLoginDto, 'Authentication successful', 200)
  async login(@Body() loginDto: LoginDto): Promise<ResponseLoginDto> {
    const output = await this.authService.login(loginDto);
    if (!output) throw new InternalServerErrorException('Unable to login');
    return output;
  }

  @Post('/login/skip-2fa')
  @ApiOperation({
    summary: '[Development] Direct authentication',
    description: 'Development-only endpoint. Bypasses 2FA when EXCHANGE_DISABLE_2FA=true. Not available in production.'
  })
  @ApiBody({ 
    type: PreLoginDto,
    description: 'Email and password only'
  })
  @ApiBadRequestResponse({
    description: 'Malformed request'
  })
  @ApiNotFoundResponse({
    description: 'Endpoint disabled in production'
  })
  @OpenApiInterceptedSuccessResponse(ResponseLoginDto, 'Authentication successful', 200)
  async loginSkip2fa(@Body() loginDto: PreLoginDto): Promise<ResponseLoginDto> {
    const disable2fa = Boolean(process.env.EXCHANGE_DISABLE_2FA === 'true') || false;
    if (!disable2fa) throw new NotFoundException();
    return this.authService.skip2faLogin(loginDto);
  }

  @Post('/forgot-password')
  @ApiOperation({
    summary: 'Initiate password recovery',
    description: 'Starts password recovery flow. Requires reCAPTCHA token in all non-local environments. Always returns success for security.'
  })
  @ApiBody({ 
    type: ForgotPasswordDto,
    description: 'Email and reCAPTCHA token'
  })
  @ApiBadRequestResponse({
    description: 'Missing or invalid reCAPTCHA token, malformed email'
  })
  @OpenApiInterceptedSuccessResponse(ResponseForgotPasswordDto, 'Recovery initiated', 200)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<ResponseForgotPasswordDto> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('/validate-otp')
  @ApiOperation({
    summary: 'Verify recovery OTP',
    description: 'Second step of password recovery. Validates OTP and provides reset token for password update.'
  })
  @ApiBody({ 
    type: ValidateOtpDto,
    description: 'Email and OTP received via email'
  })
  @ApiBadRequestResponse({
    description: 'Malformed request'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired OTP'
  })
  @OpenApiInterceptedSuccessResponse(ResponseValidateOtp, 'OTP accepted', 200)
  async validateOtp(@Body() validateOtpDto: ValidateOtpDto): Promise<ResponseValidateOtp> {
    return this.authService.validateOtp(validateOtpDto);
  }

  @Post('/reset-password')
  @ApiOperation({
    summary: 'Complete password recovery',
    description: 'Final step of password recovery. Updates password and provides new JWT access token.'
  })
  @ApiBody({ 
    type: ResetPasswordDto,
    description: 'New password and reset token from OTP validation'
  })
  @ApiBadRequestResponse({
    description: 'Password does not meet security requirements'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired reset token'
  })
  @OpenApiInterceptedSuccessResponse(ResponseResetPasswordDto, 'Password updated', 200)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<ResponseResetPasswordDto> {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Get('/csrf')
  @ApiOperation({
    summary: 'Get CSRF token',
    description: 'Required for all POST requests. Include returned token in X-CSRF-Token header.'
  })
  @OpenApiInterceptedSuccessResponse(ResponseCsrfDto, 'Token provided', 200)
  getCsrf(@Req() request: Request): ResponseCsrfDto {
    const csrfToken = isNil(request.csrfToken) ? '' : request.csrfToken();
    return { csrfToken };
  }
}
