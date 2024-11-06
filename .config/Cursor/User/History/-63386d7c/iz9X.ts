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

  /**
   * Authorisation rules:
   * Rule 1: Member firm can only create order for investor from the same member firm
   * Rule 2: Member firm rep can only create order for investor managed by themselves
   * Rule 3: Superadmin member firm / member firm rep can create orders across member firm
   */
  @Override('createOneBase')
  @ApiOperation({
    summary: 'Create new order',
    description: 'Creates order with authorization based on user type (member firm/representative/admin). Requires sufficient holdings for sell orders.'
  })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
    type: ResponseOrderDto
  })
  @ApiBadRequestResponse({
    description: 'Invalid request - investor inactive, asset delisted, trading pair inactive, or insufficient holdings'
  })
  @ApiForbiddenResponse({
    description: 'Unauthorized access'
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

  /**
   * Authorisation rules:
   * Rule 1: Member firm can only cancel orders for investor from the same member firm
   * Rule 2: Member firm rep can only cancel orders for investor managed by themselves
   * Rule 3: Superadmin member firm / member firm rep can cancel all orders
   */
  @Patch('/:id/cancel-order')
  @ApiOperation({
    summary: 'Cancel order',
    description: 'Cancels order based on user authorization level'
  })
  @ApiResponse({
    status: 200,
    description: 'Order cancelled successfully',
    type: ResponseOrderDto
  })
  @ApiNotFoundResponse({
    description: 'Order not found'
  })
  @ApiForbiddenResponse({
    description: 'Unauthorized access'
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
    description: 'Returns total number of accessible orders'
  })
  @ApiResponse({
    status: 200,
    description: 'Total order count',
    schema: {
      properties: {
        count: {
          type: 'number',
          description: 'Total orders'
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
    description: 'Returns aggregated buy/sell orders for trading pair'
  })
  @ApiResponse({
    status: 200,
    description: 'Order book data',
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
    description: 'Returns recent order activities for trading pair'
  })
  @ApiResponse({
    status: 200,
    description: 'Recent activities',
    type: ResponseOrderActivitiesDto
  })
  @ApiNotFoundResponse({
    description: 'Trading pair not found'
  })
  async getActivities(@Param('tradingPairId', new ParseUUIDPipe()) id: string): Promise<ResponseOrderActivitiesDto> {
    return this.service.getActivities(id);
  }

  /**
   * Updates an order with kind = 'reference_data'
   * Only price, originalQty and deletedAt can be updated
   */
  @Override('updateOneBase')
  @ApiOperation({
    summary: 'Update reference data order',
    description: 'Updates price, quantity or deletion status for reference data orders only'
  })
  @ApiResponse({
    status: 200,
    description: 'Order updated',
    type: ResponseOrderDto
  })
  @ApiBadRequestResponse({
    description: 'Invalid update or non-reference order'
  })
  @ApiNotFoundResponse({
    description: 'Order not found'
  })
  async updateOne(@Param('id') id: string, @ParsedBody() dto: UpdateOrderDto): Promise<ResponseOrderDto> {
    return this.service.updateOrder(id, dto);
  }
}
