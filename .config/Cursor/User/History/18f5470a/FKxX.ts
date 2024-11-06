import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiSecurity, ApiUnauthorizedResponse } from '@nestjs/swagger';

/**
 * Custom API security decorator that adds authentication and authorization responses to the API.
 * @param securityName - The name of the security scheme to use.
 * @returns A NestJS decorator that applies the API security and response decorators.
 */
export function CustomApiSecurity(securityName: string) {
  return applyDecorators(
    ApiSecurity(securityName),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 401 },
          message: {
            type: 'string',
            example: 'Unauthorized',
          },
        },
      },
    }),
    ApiForbiddenResponse({
      description: 'Forbidden',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 403 },
          message: { type: 'string', example: 'Forbidden' },
        },
      },
    }),
  );
}