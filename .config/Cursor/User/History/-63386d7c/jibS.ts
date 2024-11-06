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
import {
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
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
import { CustomApiSecurity } from 'src/common/decorators/custom-api-security.decorator';

@ApiTags('Orders')
@CustomApiSecurity(API_KEY_HEADER)
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
    description:
      'Creates order with authorization based on user type (member firm/representative/admin). Requires sufficient holdings for sell orders.',
  })
  @ApiCreatedResponse({
    description: 'Order created successfully',
    type: ResponseOrderDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid request - investor inactive, asset delisted, trading pair inactive, insufficient holdings, or duplicate order',
  })
  @ApiForbiddenResponse({
    description: 'Unauthorized access - user lacks permission for the investor',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to create order due to server error',
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
    description: 'Cancels order based on user authorization level',
  })
  @ApiOkResponse({
    description: 'Order cancelled successfully',
    type: ResponseOrderDto,
    schema: {
      properties: {
        id: { type: 'string', format: 'uuid' },
        status: { type: 'string', enum: ['CANCELLED'] },
        fulfillmentStatus: { type: 'string', enum: ['NONE', 'PARTIAL', 'COMPLETE'] },
        tradingPairId: { type: 'string', format: 'uuid' },
        price: { type: 'string' },
        originalQty: { type: 'string' },
        fulfilledQty: { type: 'string' },
        // Other order properties included
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Order not found',
  })
  @ApiForbiddenResponse({
    description: 'Unauthorized access - user lacks permission for this order',
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
    description: 'Returns total number of accessible orders based on user authorization level',
  })
  @ApiOkResponse({
    description: 'Total order count retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        count: {
          type: 'number',
          description: 'Total orders',
          example: 42
        },
      },
    },
  })
  async getOrderCount(): Promise<{ count: number }> {
    const currentUser: string = this.cls.get(CURRENT_USER);
    const count = await this.service.getOrderCount(currentUser);
    return { count };
  }

  @Get('/book/:tradingPairId')
  @ApiOperation({
    summary: 'Get order book',
    description: 'Returns aggregated buy/sell orders for trading pair',
  })
  @ApiOkResponse({
    description: 'Order book data retrieved successfully',
    type: ResponseOrderBookDto,
    schema: {
      type: 'object',
      properties: {
        tradingPairId: { type: 'string', format: 'uuid' },
        buy: { 
          type: 'array', 
          items: { 
            type: 'object',
            properties: {
              price: { type: 'string' },
              qty: { type: 'string' }
            }
          } 
        },
        sell: { 
          type: 'array', 
          items: { 
            type: 'object',
            properties: {
              price: { type: 'string' },
              qty: { type: 'string' }
            }
          } 
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Trading pair not found',
  })
  async getOrderBook(@Param('tradingPairId', new ParseUUIDPipe()) id: string): Promise<ResponseOrderBookDto> {
    return this.service.getOrderBook(id);
  }

  @Get('/activities/:tradingPairId')
  @ApiOperation({
    summary: 'Get order activities',
    description: 'Returns recent order activities for trading pair',
  })
  @ApiOkResponse({
    description: 'Order activities retrieved successfully',
    type: ResponseOrderActivitiesDto,
    schema: {
      type: 'object',
      properties: {
        tradingPairId: { type: 'string', format: 'uuid' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              price: { type: 'string' },
              originalQty: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              status: { type: 'string' },
              kind: { type: 'string' }
            }
          }
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Trading pair not found',
  })
  async getActivities(@Param('tradingPairId', new ParseUUIDPipe()) id: string): Promise<ResponseOrderActivitiesDto> {
    return this.service.getActivities(id);
  }

  @Override('updateOneBase')
  @ApiOperation({
    summary: 'Update order',
    description: 'Updates an existing order with new information',
  })
  @ApiOkResponse({
    description: 'Order updated successfully',
    type: ResponseOrderDto
  })
  @ApiNotFoundResponse({
    description: 'Order not found'
  })
  @ApiBadRequestResponse({
    description: 'Invalid update data or operation not allowed for order type/status'
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to update order due to server error'
  })
  async updateOne(@Param('id') id: string, @ParsedBody() dto: UpdateOrderDto): Promise<ResponseOrderDto> {
    return this.service.updateOrder(id, dto);
  }
}
