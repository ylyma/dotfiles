import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { API_KEY_HEADER } from 'src/common/constants/api';

import { OrderExpiryJobResponseDto } from '../dto/order-expiry-job-response.dto';
import { OrderExpiryJobService } from './order-expiry-job.service';
import { CustomApiSecurity } from 'src/common/decorators/custom-api-security.decorator';

@ApiTags('Jobs')
@CustomApiSecurity(API_KEY_HEADER)
@Controller('jobs')
export class ExpiryOrderJobController {
  constructor(private readonly orderExpiryJobService: OrderExpiryJobService) {}

  @Get('update-expired-order-status')
  @ApiOperation({ 
    summary: 'Update order status to "expired"',
    description: 'Processes all orders that have reached their expiration date (expires_at) and updates their status to "expired". This endpoint is typically used for system maintenance and cleanup.'
  })
  @ApiOkResponse({
    description: 'Job has been successfully triggered with processing results',
    type: OrderExpiryJobResponseDto,
  })
  async updateExpiredOrderStatus() {
    return this.orderExpiryJobService.updateExpiredOrderStatus();
  }
}
