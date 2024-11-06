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
    summary: 'Initiate login process',
    description: 'Step 1 of 2FA: Validates credentials and sends OTP via email. Requires reCAPTCHA in production.'
  })
  @ApiBody({ 
    type: PreLoginDto,
    description: 'Login credentials'
  })
  @ApiBadRequestResponse({
    description: 'Invalid credentials or reCAPTCHA'
  })
  @ApiUnauthorizedResponse({
    description: 'Account locked'
  })
  @OpenApiInterceptedSuccessResponse(ResponsePreLoginDto, 'OTP sent', 200)
  async preLogin(@Body() loginDto: PreLoginDto): Promise<ResponsePreLoginDto> {
    return this.authService.preLogin(loginDto);
  }

  @Post('/refresh-otp')
  @ApiOperation({
    summary: 'Request new OTP',
    description: 'Generates and sends a new OTP when previous one expires'
  })
  @ApiBody({ 
    type: RefreshOtpDto,
    description: 'Email and refresh token'
  })
  @ApiBadRequestResponse({
    description: 'Invalid token or email'
  })
  @ApiUnauthorizedResponse({
    description: 'Expired token'
  })
  @OpenApiInterceptedSuccessResponse(ResponseRefreshOtpDto, 'New OTP sent', 200)
  async refreshOtp(@Body() refreshOtpDto: RefreshOtpDto): Promise<ResponseRefreshOtpDto> {
    return this.authService.refreshOtp(refreshOtpDto);
  }

  @Post('/login')
  @ApiOperation({
    summary: 'Complete login',
    description: 'Step 2 of 2FA: Validates OTP and completes login'
  })
  @ApiBody({ 
    type: LoginDto,
    description: 'OTP verification'
  })
  @ApiBadRequestResponse({
    description: 'Invalid OTP'
  })
  @ApiUnauthorizedResponse({
    description: 'Expired OTP'
  })
  @OpenApiInterceptedSuccessResponse(ResponseLoginDto, 'Login successful', 200)
  async login(@Body() loginDto: LoginDto): Promise<ResponseLoginDto> {
    const output = await this.authService.login(loginDto);
    if (!output) throw new InternalServerErrorException('Unable to login');
    return output;
  }

  @Post('/login/skip-2fa')
  @ApiOperation({
    summary: 'Direct login (2FA disabled)',
    description: 'Login without OTP when EXCHANGE_DISABLE_2FA=true'
  })
  @ApiBody({ 
    type: PreLoginDto,
    description: 'Login credentials'
  })
  @ApiBadRequestResponse({
    description: 'Invalid credentials'
  })
  @ApiNotFoundResponse({
    description: '2FA is enabled'
  })
  @OpenApiInterceptedSuccessResponse(ResponseLoginDto, 'Login successful', 200)
  async loginSkip2fa(@Body() loginDto: PreLoginDto): Promise<ResponseLoginDto> {
    const disable2fa = Boolean(process.env.EXCHANGE_DISABLE_2FA === 'true') || false;
    if (!disable2fa) throw new NotFoundException();
    return this.authService.skip2faLogin(loginDto);
  }

  @Post('/forgot-password')
  @ApiOperation({
    summary: 'Initiate password reset',
    description: 'Step 1 of 3: Sends password reset OTP via email. Requires reCAPTCHA in production.'
  })
  @ApiBody({ 
    type: ForgotPasswordDto,
    description: 'Email and reCAPTCHA'
  })
  @ApiBadRequestResponse({
    description: 'Invalid email or reCAPTCHA'
  })
  @OpenApiInterceptedSuccessResponse(ResponseForgotPasswordDto, 'OTP sent', 200)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<ResponseForgotPasswordDto> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('/validate-otp')
  @ApiOperation({
    summary: 'Validate reset OTP',
    description: 'Step 2 of 3: Validates password reset OTP'
  })
  @ApiBody({ 
    type: ValidateOtpDto,
    description: 'OTP verification'
  })
  @ApiBadRequestResponse({
    description: 'Invalid OTP'
  })
  @ApiUnauthorizedResponse({
    description: 'Expired OTP'
  })
  @OpenApiInterceptedSuccessResponse(ResponseValidateOtp, 'OTP valid', 200)
  async validateOtp(@Body() validateOtpDto: ValidateOtpDto): Promise<ResponseValidateOtp> {
    return this.authService.validateOtp(validateOtpDto);
  }

  @Post('/reset-password')
  @ApiOperation({
    summary: 'Complete password reset',
    description: 'Step 3 of 3: Updates password and returns login token'
  })
  @ApiBody({ 
    type: ResetPasswordDto,
    description: 'New password and reset token'
  })
  @ApiBadRequestResponse({
    description: 'Invalid password format'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid reset token'
  })
  @OpenApiInterceptedSuccessResponse(ResponseResetPasswordDto, 'Password updated', 200)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<ResponseResetPasswordDto> {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Get('/csrf')
  @ApiOperation({
    summary: 'Get CSRF token',
    description: 'Retrieves CSRF token for POST requests'
  })
  @OpenApiInterceptedSuccessResponse(ResponseCsrfDto, 'Token retrieved', 200)
  getCsrf(@Req() request: Request): ResponseCsrfDto {
    const csrfToken = isNil(request.csrfToken) ? '' : request.csrfToken();
    return { csrfToken };
  }
}
