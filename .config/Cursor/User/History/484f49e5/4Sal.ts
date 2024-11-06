import { BadRequestException, Controller, Get, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiOperation,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiSecurity,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { Crud, CrudController, CrudRequest, CrudRequestInterceptor, Override, ParsedRequest } from '@nestjsx/crud';
import { Swagger } from '@nestjsx/crud/lib/crud';
import { API_KEY_HEADER } from 'src/common/constants/api';
import { ImportJobInterceptor } from 'src/common/interceptors/import-jobs.interceptor';

import { BULK_ORDER_ALLOWED_MIME_TYPES } from './constants/bulk-order-mime-types';
import { RequestImportJobDto } from './dto/request-import-jobs.dto';
import { GetManyResponseImportJobDto, ResponseImportJobDto } from './dto/response-import-jobs.dto';
import { ImportJob } from './entities/import-job.entity';
import { ImportJobService } from './import-job.service';
import { ApiKeyApiProperty } from 'src/modules/access/api-key/constants/apiKeyApiProperty';

@ApiTags('Import')
@ApiSecurity(API_KEY_HEADER)
@ApiInternalServerErrorResponse({
  description: 'Internal server error occurred while processing the request',
})
@Crud({
  model: {
    type: ImportJob,
  },
  routes: {
    only: ['getManyBase', 'getOneBase'],
  },
  serialize: {
    get: ResponseImportJobDto,
    getMany: GetManyResponseImportJobDto,
  },
  query: {
    join: {
      inputFile: {},
      outputFile: {},
      'inputFile.bucket': {
        alias: 'inputFileBucket',
      },
      'outputFile.bucket': {
        alias: 'outputFileBucket',
      },
    },
  },
})
@Controller('import-jobs')
@UseInterceptors(ImportJobInterceptor)
export class ImportJobController implements CrudController<ImportJob> {
  constructor(public service: ImportJobService) {
    const metadata = Swagger.getParams(this.getManyImportJobsOrder);
    const queryParamsMeta = Swagger.createQueryParamsMeta('getManyBase', {
      model: { type: ImportJob },
      query: {
        softDelete: false,
      },
    });
    Swagger.setParams([...metadata, ...queryParamsMeta], this.getManyImportJobsOrder);
  }

  get base(): CrudController<ImportJob> {
    return this;
  }

  @Post('/orders')
  @ApiOperation({
    summary: 'Create bulk order import job',
    description: `
      Uploads a file containing orders and creates an import job to process them asynchronously.
      The job will:
      1. Validate access permissions
      2. Create orders based on the file content
      3. Generate an output file with processing results
      
      Supported file formats: CSV, XLS, XLSX
      Maximum file size: 5MB
    `,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File containing orders to import. Must be in CSV, XLS, or XLSX format.',
    type: RequestImportJobDto,
  })
  @ApiOkResponse({
    description: 'Import job created successfully',
    type: ResponseImportJobDto,
    schema: {
      properties: {
        jobDetails: { $ref: getSchemaPath(ImportJob) }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Invalid request. Possible reasons: missing file, unsupported file format, file too large, or invalid file content',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5000000,
      },
      fileFilter: (_, file, callback) => {
        if (!BULK_ORDER_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          return callback(new BadRequestException('File extension is not supported'), false);
        }
        callback(null, true);
      },
    }),
  )
  async postImportOrderJob(@UploadedFile() file: Express.Multer.File): Promise<{ jobDetails: ImportJob }> {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    try {
      return await this.service.createImportOrdersJob(file);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @Get('orders')
  @ApiOperation({
    summary: 'Get bulk order import jobs',
    description: `
      Retrieves a paginated list of bulk order import jobs.
      Use query parameter 'join=inputFile&join=inputFile.bucket' to include file URLs in the response.
      Supports filtering, sorting, and pagination through query parameters.
    `
  })
  @UseInterceptors(CrudRequestInterceptor)
  @ApiOkResponse({
    description: 'Successfully retrieved import jobs',
    schema: {
      properties: {
        data: { 
          type: 'array',
          items: { $ref: getSchemaPath(ResponseImportJobDto) }
        },
        count: { 
          type: 'number',
          description: 'Number of items in current page'
        },
        total: { 
          type: 'number',
          description: 'Total number of items'
        },
        page: { 
          type: 'number',
          description: 'Current page number'
        },
        pageCount: { 
          type: 'number',
          description: 'Total number of pages'
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid query parameters'
  })
  public async getManyImportJobsOrder(@ParsedRequest() req: CrudRequest) {
    return this.base.getManyBase(req);
  }

  @Override('getManyBase')
  @ApiOperation({
    summary: 'Deprecated endpoint',
    description: 'This endpoint is deprecated. Please use /import-jobs/orders instead.'
  })
  getMany() {
    return { message: 'Please use /import-jobs/order' };
  }
}
