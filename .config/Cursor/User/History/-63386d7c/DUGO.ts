import {
  Controller,
  ForbiddenException,
  Get,
  Inject,
  Logger,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags, ApiResponse, ApiBadRequestResponse, ApiForbiddenResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import { Crud, CrudController, CrudRequest, Override, ParsedBody, ParsedRequest } from '@nestjsx/crud';
import { isNil } from 'lodash';
import { ClsService } from 'nestjs-cls';
import { API_KEY_HEADER, PREFIX_MEMBER_FIRM, PREFIX_MEMBER_FIRM_REP } from 'src/common/constants/api';
import { CURRENT_USER } from 'src/common/constants/user';
import { isSuperAdmin } from 'src/common/helpers/is-superadmin';
import { OrdersInterceptor } from 'src/common/interceptors/orders.interceptor';

import { InvestorsService } from '../investors/investors.service';
import { CreateOrderDto } from './dto/request/create-order.dto';
import { ResponseOrderActivitiesDto } from './dto/response/response-order-activities.dto';
import { ResponseOrderBookDto } from './dto/response/response-order-book.dto';
import { ResponseOrderDto } from './dto/response/response-orders.dto';
import { Order } from './entities/order.entity';
import { OrdersService } from './orders.service';
import { UpdateOrderDto } from './dto/request/update-order.dto';

@ApiTags('Orders')
@ApiSecurity(API_KEY_HEADER)
@Crud({
  model: {
    type: Order,
  },
  routes: {
    only: ['createOneBase', 'getManyBase', 'getOneBase', 'updateOneBase'],
  },
  dto: {
    create: CreateOrderDto,
    update: UpdateOrderDto,
  },
  serialize: {
    create: ResponseOrderDto,
    get: ResponseOrderDto,
    update: ResponseOrderDto,
    getMany: false,
  },
  validation: { transform: true },
  query: {
    // Hack patch to avoid error while using limit
    // https://github.com/nestjsx/crud/issues/788
    exclude: ['id'],
    join: {
      investor: { eager: true, exclude: ['id'] },
      'investor.repInvestors': { alias: 'repInvestors', eager: true, exclude: ['id'] },
      tradingPair: { eager: false, exclude: ['id'] },
      'tradingPair.asset': { eager: false, exclude: ['id'] },
      buyTrades: { eager: false, exclude: ['id'] },
      sellTrades: { eager: false, exclude: ['id'] },
    },
    limit: 25,
  },
})
@Controller('orders')
@UseInterceptors(OrdersInterceptor)
export class OrdersController implements CrudController<Order> {
  constructor(
    public service: OrdersService,
    @Inject(ClsService) private cls: ClsService,
    public investorService: InvestorsService,
  ) {}
  get base(): CrudController<CreateOrderDto> {
    return this;
  }

  @Override('createOneBase')
  @ApiOperation({
    summary: 'Create new order',
    description: 'Creates a new order with the following authorization rules:\n\n' +
      '1. Member firms can only create orders for their own investors\n' +
      '2. Representatives can only create orders for investors they manage\n' +
      '3. Super admins can create orders across all member firms\n\n' +
      'Note: For sell orders, the investor must have sufficient holdings.'
  })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully. Returns order details and sends email confirmation.',
    type: ResponseOrderDto
  })
  @ApiBadRequestResponse({
    description: 'Invalid request. Possible reasons:\n' +
      '- Investor not found or inactive\n' +
      '- Asset is delisted\n' +
      '- Trading pair is inactive\n' +
      '- Insufficient holdings for sell orders'
  })
  @ApiForbiddenResponse({
    description: 'Unauthorized to create order for this investor'
  })
  async createOne(@ParsedRequest() req: CrudRequest, @ParsedBody() dto: CreateOrderDto): Promise<ResponseOrderDto> {
    let allowOperation = false;

    // Rule 3
    if (isSuperAdmin(this.cls)) {
      allowOperation = true;
    } else {
      const currentUser: string = this.cls.get(CURRENT_USER);

      const userType = currentUser.split(':')[0];
      const memberFirmIdOrRepId = currentUser.split(':')[1];

      if (userType === PREFIX_MEMBER_FIRM) {
        // Rule 1
        if ((await this.investorService.isMemberFirmAuthorised(dto.investorId, memberFirmIdOrRepId)) === true) {
          allowOperation = true;
        }
      } else if (userType === PREFIX_MEMBER_FIRM_REP) {
        // Rule 2
        if ((await this.investorService.isMemberFirmRepAuthorised(dto.investorId, memberFirmIdOrRepId)) === true) {
          allowOperation = true;
        }
        if (dto.representativeId) {
          if (memberFirmIdOrRepId === dto.representativeId) {
            allowOperation = true;
          } else {
            Logger.warn('Rep is not allowed to create order on behalf of another rep');
            allowOperation = false;
          }
        }
      }
    }

    if (allowOperation === false) {
      throw new ForbiddenException();
    }

    return this.service.createOrder(dto);
  }

  @Patch('/:id/cancel-order')
  @ApiOperation({
    summary: 'Cancel order',
    description: 'Cancels an existing order with the following authorization rules:\n\n' +
      '1. Member firms can only cancel orders for their own investors\n' +
      '2. Representatives can only cancel orders for investors they manage\n' +
      '3. Super admins can cancel any order'
  })
  @ApiResponse({
    status: 200,
    description: 'Order cancelled successfully. Updates order status and sends email notification.',
    type: ResponseOrderDto
  })
  @ApiNotFoundResponse({
    description: 'Order not found'
  })
  @ApiForbiddenResponse({
    description: 'Unauthorized to cancel this order'
  })
  async cancelOrderById(@Param('id', new ParseUUIDPipe()) id: string): Promise<ResponseOrderDto> {
    let allowOperation = false;

    // Rule 3
    if (isSuperAdmin(this.cls)) {
      allowOperation = true;
    } else {
      const currentUser: string = this.cls.get(CURRENT_USER);

      const userType = currentUser.split(':')[0];
      const memberFirmIdOrRepId = currentUser.split(':')[1];

      const order = await this.service.findOne({ where: { id } });

      if (isNil(order)) throw new NotFoundException(`Order not found`);

      if (userType === PREFIX_MEMBER_FIRM) {
        // Rule 1
        if ((await this.investorService.isMemberFirmAuthorised(order.investorId, memberFirmIdOrRepId)) === true) {
          allowOperation = true;
        }
      } else if (userType === PREFIX_MEMBER_FIRM_REP) {
        // Rule 2
        if ((await this.investorService.isMemberFirmRepAuthorised(order.investorId, memberFirmIdOrRepId)) === true) {
          allowOperation = true;
        }
      }
    }

    if (allowOperation === false) {
      throw new ForbiddenException();
    }

    return this.service.cancelOrderById(id);
  }

  @Get('/count')
  @ApiOperation({
    summary: 'Get order count',
    description: 'Retrieves total number of orders accessible to the current user based on their permissions'
  })
  @ApiResponse({
    status: 200,
    description: 'Returns total count of accessible orders',
    schema: {
      properties: {
        count: {
          type: 'number',
          description: 'Total number of orders'
        }
      }
    }
  })
  async getOrderCount(): Promise<{ count: number }> {
    const currentUser: string = this.cls.get(CURRENT_USER);
    const count = await this.service.getOrderCount(currentUser);
    return { count };
  }

  @Get('/book/:tradingPairId')
  @ApiOperation({
    summary: 'Get order book',
    description: 'Retrieves aggregated buy and sell orders for a specific trading pair.\n' +
      'Orders are grouped by price level and include total quantity at each level.'
  })
  @ApiResponse({
    status: 200,
    description: 'Returns order book with buy and sell orders',
    type: ResponseOrderBookDto
  })
  @ApiNotFoundResponse({
    description: 'Trading pair not found'
  })
  async getOrderBook(@Param('tradingPairId', new ParseUUIDPipe()) id: string): Promise<ResponseOrderBookDto> {
    return this.service.getOrderBook(id);
  }

  @Get('/activities/:tradingPairId')
  @ApiOperation({
    summary: 'Get order activities',
    description: 'Retrieves recent order activities (creates, cancellations, expirations, trades) for a trading pair.\n' +
      'Results are ordered by timestamp descending.'
  })
  @ApiResponse({
    status: 200,
    description: 'Returns list of recent order activities',
    type: ResponseOrderActivitiesDto
  })
  @ApiNotFoundResponse({
    description: 'Trading pair not found'
  })
  async getActivities(@Param('tradingPairId', new ParseUUIDPipe()) id: string): Promise<ResponseOrderActivitiesDto> {
    return this.service.getActivities(id);
  }

  @Override('updateOneBase')
  @ApiOperation({
    summary: 'Update reference data order',
    description: 'Updates an order with kind=reference_data. Only price, originalQty and deletedAt can be modified.\n' +
      'Note: This endpoint is only for reference data orders, not active exchange orders.'
  })
  @ApiResponse({
    status: 200,
    description: 'Order updated successfully',
    type: ResponseOrderDto
  })
  @ApiBadRequestResponse({
    description: 'Invalid update request or attempt to update non-reference order'
  })
  @ApiNotFoundResponse({
    description: 'Order not found'
  })
  async updateOne(@Param('id') id: string, @ParsedBody() dto: UpdateOrderDto): Promise<ResponseOrderDto> {
    return this.service.updateOrder(id, dto);
  }
}
