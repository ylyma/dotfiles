import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { API_KEY_HEADER } from 'src/common/constants/api';

import { OrderMatchJobResponseDto } from '../dto/order-match-job-response.dto';
import { OrderMatchJobService } from './order-match-job.service';
import { CustomApiSecurity } from 'src/common/decorators/custom-api-security.decorator';

@ApiTags('Jobs')
@CustomApiSecurity(API_KEY_HEADER)
@Controller('jobs')
export class OrderMatchJobController {
  constructor(private readonly orderJobMatchService: OrderMatchJobService) {}

  @Get('match-order')
  @ApiOperation({ 
    summary: 'Trigger automatic order matching process',
    description: 'Initiates the process of matching buy and sell orders based on price and availability. Orders are processed sequentially, with each order being matched against possible counterparties.'
  })
  @ApiOkResponse({
    description: 'Job triggered successfully with results of matching process',
    type: OrderMatchJobResponseDto,
  })
  async matchOrder(): Promise<{ ordersToProcess: number; proccessedOrderCount: number }> {
    return this.orderJobMatchService.matchOrder();
  }
}
