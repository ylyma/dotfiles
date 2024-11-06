import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { MessagePattern, Payload } from '@nestjs/microservices';
import { MessageOrderConsumerService } from './message-order-consumer.service';
import { PubsubEvent, PubsubSource } from '../../pubsub/pubsub.type';
import { Message } from '@google-cloud/pubsub';
import { API_KEY_HEADER } from '../../../../common/constants/api';
import { CustomApiSecurity } from 'src/common/decorators/custom-api-security.decorator';
import { IdempotencyService } from '../../idempotency/idempotency.service';

@CustomApiSecurity(API_KEY_HEADER)
@ApiTags('pubsub')
@Controller('messages/order')
export class MessageOrderConsumerController {
  constructor(private messageOrder: MessageOrderConsumerService, private idempotencyService: IdempotencyService) {}

  @MessagePattern({ event: PubsubEvent.ORDER_CREATE, source: PubsubSource.BOPS })
  async bopsCreateOrder(@Payload() data: Message): Promise<void> {
    await this.idempotencyService.checkOrSave(data);
    await this.messageOrder.bopsOrderCreate(data);
  }

  @MessagePattern({ event: PubsubEvent.ORDER_UPDATE, source: PubsubSource.BOPS })
  async bopsUpdateStatus(@Payload() data: Message): Promise<void> {
    await this.idempotencyService.checkOrSave(data);
    await this.messageOrder.bopsOrderUpdate(data);
  }

  @MessagePattern({ event: PubsubEvent.ORDER_UPDATE_DL, source: PubsubSource.EXCHANGE })
  async handleOrderUpdateDeadLetter(@Payload() data: Message): Promise<void> {
    await this.messageOrder.handleOrderUpdateDeadLetter(data);
  }

  @MessagePattern({ event: PubsubEvent.ORDER_SYNC_DL, source: PubsubSource.EXCHANGE })
  async handleOrderSyncDeadLetter(@Payload() data: Message): Promise<void> {
    await this.messageOrder.handleOrderSyncDeadLetter(data);
  }

  @MessagePattern({ event: PubsubEvent.ORDER_MATCH_DL, source: PubsubSource.EXCHANGE })
  async handleOrderMatchDeadLetter(@Payload() data: Message): Promise<void> {
    await this.messageOrder.handleOrderMatchDeadLetter(data);
  }
}
