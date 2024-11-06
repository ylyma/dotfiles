import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AppService } from './app.service';
import { API_KEY_HEADER } from './common/constants/api';

@ApiTags('System')
@CustomApiSecurity(API_KEY_HEADER)
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Health check endpoint',
    description: 'Returns the health status of the service. Used to verify the API is operational.'
  })
  @ApiResponse({
    status: 200,
    description: 'Service is operational',
    schema: {
      type: 'string',
      example: 'Service is healthy!'
    }
  })
  healthCheck(): string {
    return this.appService.healthCheck();
  }
}
