import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { API_KEY_HEADER } from 'src/common/constants/api';
import { CustomApiSecurity } from 'src/common/decorators/custom-api-security.decorator';
import { timezoneConsciousDayjs } from 'src/common/helpers/dayjs';
import { PricingHistoryService } from 'src/modules/pricing-history/pricing-history.service';

@ApiTags('Jobs')
@CustomApiSecurity(API_KEY_HEADER)
@Controller('jobs')
export class CalculatePricingGraphJobController {
  constructor(private readonly pricingHistoryService: PricingHistoryService) {}

  @Get('calculate-pricing-graph')
  @ApiOperation({
    summary: "Calculate pricing history for trading pairs",
    description: "Processes and updates cached pricing graph data for all trading pairs. By default, calculates only yesterday's data, but can process all historical data when needed."
  })
  @ApiQuery({
    name: 'all',
    required: false,
    type: Boolean,
    description: 'When set to true, calculates pricing history for all dates instead of just yesterday'
  })
  @ApiOkResponse({
    description: 'Job successfully triggered, pricing data has been processed',
    schema: {
      type: 'object',
      example: {}
    }
  })
  async calculatePricingGraph(@Query('all') all?: boolean) {
    return await this.pricingHistoryService.calculateAllPricingHistory(
      all ? undefined : timezoneConsciousDayjs().startOf('day').subtract(1, 'day').toDate(),
    );
  }
}
