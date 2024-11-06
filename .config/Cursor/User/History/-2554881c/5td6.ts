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
import {ApiOperation, ApiOkResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiBody, ApiTags } from '@nestjs/swagger';
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

@ApiTags('Authentication (Public APIs)')
@Controller('/auth')
@UseInterceptors(ClassSerializerInterceptor)
@Public()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/pre-login')
  @ApiBody({ type: PreLoginDto })
  @ApiOperation({
    summary: 'Initiate login process',
    description: "Initiates by sending an OTP to the user's email address.",
  })
  @ApiOkResponse({ type: ResponsePreLoginDto, description: 'Successful pre-login' })
  @ApiBadRequestResponse({ description: 'Invalid recaptcha token or locked account' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials or deactivated' })
  async preLogin(@Body() loginDto: PreLoginDto): Promise<ResponsePreLoginDto> {
    return this.authService.preLogin(loginDto);
  }

  @Post('/refresh-otp')
  @ApiBody({ type: RefreshOtpDto })
  @OpenApiInterceptedSuccessResponse(ResponseRefreshOtpDto, 'Successful refresh otp', 200)
  async refreshOtp(@Body() refreshOtpDto: RefreshOtpDto): Promise<ResponseRefreshOtpDto> {
    return this.authService.refreshOtp(refreshOtpDto);
  }

  @Post('/login')
  @ApiBody({ type: LoginDto })
  @OpenApiInterceptedSuccessResponse(ResponseLoginDto, 'Successful login', 200)
  async login(@Body() loginDto: LoginDto): Promise<ResponseLoginDto> {
    const output = await this.authService.login(loginDto);
    if (!output) throw new InternalServerErrorException('Unable to login');

    return output;
  }

  @Post('/login/skip-2fa')
  @ApiBody({ type: PreLoginDto })
  @OpenApiInterceptedSuccessResponse(ResponseLoginDto, 'Successful login', 200)
  async loginSkip2fa(@Body() loginDto: PreLoginDto): Promise<ResponseLoginDto> {
    const disable2fa = Boolean(process.env.EXCHANGE_DISABLE_2FA === 'true') || false;
    if (!disable2fa) throw new NotFoundException();
    return this.authService.skip2faLogin(loginDto);
  }

  @Post('/forgot-password')
  @OpenApiInterceptedSuccessResponse(ResponseForgotPasswordDto, 'Forgot password', 200)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<ResponseForgotPasswordDto> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('/validate-otp')
  @OpenApiInterceptedSuccessResponse(ResponseValidateOtp, 'Validate OTP', 200)
  async validateOtp(@Body() validateOtpDto: ValidateOtpDto): Promise<ResponseValidateOtp> {
    return this.authService.validateOtp(validateOtpDto);
  }

  @Post('/reset-password')
  @OpenApiInterceptedSuccessResponse(ResponseResetPasswordDto, 'Reset password by token', 200)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<ResponseResetPasswordDto> {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Get('/csrf')
  @OpenApiInterceptedSuccessResponse(ResponseCsrfDto, 'Get CSRF token', 200)
  getCsrf(@Req() request: Request): ResponseCsrfDto {
    const csrfToken = isNil(request.csrfToken) ? '' : request.csrfToken();
    return { csrfToken };
  }
}
