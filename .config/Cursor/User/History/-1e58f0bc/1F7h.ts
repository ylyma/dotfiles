import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiSecurity, ApiTags, ApiBadRequestResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import { Crud, CrudController } from '@nestjsx/crud';
import { API_KEY_HEADER } from 'src/common/constants/api';
import { CreateManualTradeDto } from './dto/request/create-manual-trade.dto';
import { GetPriceChangePathDto } from './dto/request/get-price-change.dto';
import { ResponsePriceChangeDto } from './dto/response/response-price-change.dto';
import { ResponseTradeDto } from './dto/response/response-trades.dto';
import { Trade } from './entities/trade.entity';
import { TradesService } from './trades.service';

@ApiTags('Trade')
@ApiSecurity(API_KEY_HEADER)
/**
 * Trade API endpoints for managing and querying trades
 * 
 * Auto-generated endpoints:
 * - GET /trades - List trades with pagination and filtering
 * - GET /trades/:id - Get single trade by ID
 * 
 * Response schema for trade objects:
 * - buyOrderId: UUID of the buy order
 * - sellOrderId: UUID of the sell order
 * - tradingPairId: UUID of the trading pair
 * - tradedQty: Quantity that was traded (string, up to 8 decimal places)
 * - tradedPrice: Price at which the trade occurred (string, up to 8 decimal places)
 */
@Crud({
  model: {
    type: Trade,
  },
  routes: {
    only: ['getManyBase', 'getOneBase'],
  },
  serialize: {
    get: ResponseTradeDto,
    getMany: false,
  },
  validation: { transform: true },
})
@Controller('trades')
export class TradesController implements CrudController<Trade> {
  constructor(public service: TradesService) {}

  @Post('/manual-trades')
  @ApiOperation({
    summary: 'Create manual trade',
    description: 'Creates a matching trade between specified buy and sell orders.\n\n' +
      'Requirements:\n' +
      '- Both buy and sell orders must exist and be valid\n' +
      '- Orders must be for the same trading pair\n' +
      '- Traded quantity must not exceed remaining unfulfilled quantity of either order\n' +
      '- Traded price must be within acceptable range of order prices\n\n' +
      'Note: This endpoint is typically used for administrative purposes or to handle special trading scenarios.'
  })
  @ApiResponse({
    status: 201,
    description: 'Trade successfully created',
    type: ResponseTradeDto
  })
  @ApiBadRequestResponse({
    description: 'Invalid request - orders not found, incompatible orders, or invalid trade parameters'
  })
  async createManualTrade(@Body() dto: CreateManualTradeDto): Promise<ResponseTradeDto> {
    return this.service.createManualTrade(dto);
  }

  @Get('/:tradingPairId/price-change')
  @ApiOperation({
    summary: 'Get price change metrics',
    description: 'Retrieves price change metrics between the two most recent trades for a trading pair.\n\n' +
      'Returns:\n' +
      '- Absolute change: Price difference between latest trades (positive for increase, negative for decrease)\n' +
      '- Percentage change: Price difference as a percentage (always positive)\n\n' +
      'Note: Returns 0.00 for both metrics if less than 2 trades exist'
  })
  @ApiResponse({
    status: 200,
    description: 'Price change metrics retrieved successfully',
    type: ResponsePriceChangeDto
  })
  @ApiNotFoundResponse({
    description: 'Trading pair not found'
  })
  async getPriceChange(@Param() params: GetPriceChangePathDto): Promise<ResponsePriceChangeDto> {
    return this.service.getPriceChange(params.tradingPairId);
  }
}
