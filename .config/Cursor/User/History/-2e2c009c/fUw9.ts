import { Body, Controller, Param, UseInterceptors } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Crud, CrudController, Override } from '@nestjsx/crud';
import { API_KEY_HEADER } from 'src/common/constants/api';
import { HoldingsInterceptor } from 'src/common/interceptors/holdings.interceptor';

import { CreateHoldingDto } from './dto/request/create-holding.dto';
import { UpdateHoldingDto } from './dto/request/update-holding.dto';
import { ResponseHoldingDto } from './dto/response/response-holding.dto';
import { Holding } from './entities/holding.entity';
import { HoldingsService } from './holdings.service';
import { CustomApiSecurity } from 'src/common/decorators/custom-api-security.decorator';

@ApiTags('Holdings')
@CustomApiSecurity(API_KEY_HEADER)
@Crud({
  model: {
    type: Holding,
  },
  routes: {
    only: ['getManyBase', 'getOneBase', 'createOneBase', 'updateOneBase'],
  },
  serialize: {
    get: ResponseHoldingDto,
    getMany: false,
  },
  validation: { transform: true },
  query: {
    join: {
      investor: { eager: true },
      'investor.repInvestors': { alias: 'repInvestors', eager: true },
      'investor.memberFirm': {},
      asset: {},
    },
  },
})
@Controller('holdings')
@UseInterceptors(HoldingsInterceptor)
export class HoldingsController implements CrudController<Holding> {
  constructor(public service: HoldingsService) {}

  @Override('createOneBase')
  async create(@Body() createHoldingDto: CreateHoldingDto): Promise<ResponseHoldingDto> {
    return this.service.postEndpoint(createHoldingDto);
  }

  @Override('updateOneBase')
  async update(@Param('id') id: string, @Body() updateHoldingDto: UpdateHoldingDto): Promise<ResponseHoldingDto> {
    return this.service.patchEndpoint(id, updateHoldingDto);
  }
}
