import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Crud, CrudController } from '@nestjsx/crud';
import { API_KEY_HEADER } from 'src/common/constants/api';

import { CreatePricingHistoryDto } from './dto/request/create-pricing-history.dto';
import { RecalculatePricingHistoryDto } from './dto/request/recalculate-pricing-history.dto';
import { RecalculatePricingHistoryAllDto } from './dto/request/recalculate-pricing-history-all.dto';
import { UpdatePricingHistoryDto } from './dto/request/update-pricing-history.dto';
import { ResponseAskGraphDto } from './dto/response/response-daily-ask-graph.dto';
import { ResponsePricingHistoriesDto, ResponsePricingHistoryDto } from './dto/response/response-pricing-history.dto';
import { PricingHistory } from './entities/pricing-history.entity';
import { PricingHistoryService } from './pricing-history.service';
import { CustomApiSecurity } from 'src/common/decorators/custom-api-security.decorator';

@ApiTags('Pricing History')
@CustomApiSecurity(API_KEY_HEADER)
@Crud({
  model: {
    type: PricingHistory,
  },
  routes: {
    only: ['getManyBase', 'getOneBase', 'createOneBase', 'updateOneBase'],
  },
  dto: {
    create: CreatePricingHistoryDto,
    update: UpdatePricingHistoryDto,
  },
  serialize: {
    get: ResponsePricingHistoryDto,
    create: ResponsePricingHistoryDto,
    update: ResponsePricingHistoryDto,
    getMany: ResponsePricingHistoriesDto,
  },
  validation: { transform: true },
})
@Controller('pricing-history')
export class PricingHistoryController implements CrudController<PricingHistory> {
  constructor(public service: PricingHistoryService) {}

  @Post('recalculate-all')
  @ApiOperation({ summary: 'Recalculate all pricing history by started date' })
  async recalculateAll(@Body() recalculate: RecalculatePricingHistoryAllDto) {
    return await this.service.calculateAllPricingHistory(recalculate.startDate);
  }

  @Post('recalculate')
  @ApiOperation({ summary: 'Recalculate specific pricing history by trading and starter date ' })
  async recalculate(@Body() recalculate: RecalculatePricingHistoryDto) {
    return {
      daily: await this.service.calculatePricingHistory(recalculate.tradingPairId, recalculate.startDate),
      weekly: await this.service.calculatePricingHistoryWeek(recalculate.tradingPairId, recalculate.startDate),
      monthly: await this.service.calculatePricingHistoryMonth(recalculate.tradingPairId, recalculate.startDate),
    };
  }

  @Get('/graph/:id')
  @ApiOperation({ summary: 'get graph data by trading pair id' })
  async getGraphByTradingPair(@Param('id', new ParseUUIDPipe()) id: string): Promise<ResponseAskGraphDto> {
    return await this.service.getGraphByTradingPair(id);
  }
}
