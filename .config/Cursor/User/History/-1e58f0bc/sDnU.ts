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
 * Trade API endpoints
 * GET /trades - List trades
 * GET /trades/:id - Get trade by ID
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
    description: 'Match buy and sell orders. Requires valid orders with sufficient quantities and compatible prices.'
  })
  @ApiResponse({
    status: 201,
    description: 'Trade created',
    type: ResponseTradeDto
  })
  @ApiBadRequestResponse({
    description: 'Invalid orders or trade parameters'
  })
  async createManualTrade(@Body() dto: CreateManualTradeDto): Promise<ResponseTradeDto> {
    return this.service.createManualTrade(dto);
  }

  @Get('/:tradingPairId/price-change')
  @ApiOperation({
    summary: 'Get price change metrics',
    description: 'Get price difference between last two trades. Returns 0.00 if insufficient data.'
  })
  @ApiResponse({
    status: 200,
    description: 'Price metrics retrieved',
    type: ResponsePriceChangeDto
  })
  @ApiNotFoundResponse({
    description: 'Trading pair not found'
  })
  async getPriceChange(@Param() params: GetPriceChangePathDto): Promise<ResponsePriceChangeDto> {
    return this.service.getPriceChange(params.tradingPairId);
  }
}
