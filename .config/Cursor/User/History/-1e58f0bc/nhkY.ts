import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Crud, CrudController } from '@nestjsx/crud';
import { API_KEY_HEADER } from 'src/common/constants/api';

import { CreateManualTradeDto } from './dto/request/create-manual-trade.dto';
import { GetPriceChangePathDto } from './dto/request/get-price-change.dto';
import { ResponsePriceChangeDto } from './dto/response/response-price-change.dto';
import { ResponseTradeDto } from './dto/response/response-trades.dto';
import { Trade } from './entities/trade.entity';
import { TradesService } from './trades.service';
import { CustomApiSecurity } from 'src/common/decorators/custom-api-security.decorator';

@ApiTags('Trade')
@CustomApiSecurity(API_KEY_HEADER)
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
  @ApiResponse({ type: ResponseTradeDto })
  async createManualTrade(@Body() dto: CreateManualTradeDto): Promise<ResponseTradeDto> {
    return this.service.createManualTrade(dto);
  }

  @Get('/:tradingPairId/price-change')
  @ApiResponse({ description: 'Get price change for a trading pair', status: 200, type: ResponsePriceChangeDto })
  async getPriceChange(@Param() params: GetPriceChangePathDto): Promise<ResponsePriceChangeDto> {
    return this.service.getPriceChange(params.tradingPairId);
  }
}
