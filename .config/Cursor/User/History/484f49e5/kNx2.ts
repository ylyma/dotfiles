import { BadRequestException, Controller, Get, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOkResponse, ApiSecurity, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { Crud, CrudController, CrudRequest, CrudRequestInterceptor, Override, ParsedRequest } from '@nestjsx/crud';
import { Swagger } from '@nestjsx/crud/lib/crud';
import { API_KEY_HEADER } from 'src/common/constants/api';
import { ImportJobInterceptor } from 'src/common/interceptors/import-jobs.interceptor';

import { BULK_ORDER_ALLOWED_MIME_TYPES } from './constants/bulk-order-mime-types';
import { RequestImportJobDto } from './dto/request-import-jobs.dto';
import { GetManyResponseImportJobDto, ResponseImportJobDto } from './dto/response-import-jobs.dto';
import { ImportJob } from './entities/import-job.entity';
import { ImportJobService } from './import-job.service';
import { CustomApiSecurity } from 'src/common/decorators/custom-api-security.decorator';

@ApiTags('Import')
@CustomApiSecurity(API_KEY_HEADER)
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
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File to upload',
    type: RequestImportJobDto,
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
  @UseInterceptors(CrudRequestInterceptor)
  @ApiOkResponse({
    description: 'Get paginated bulk order import jobs, do `join=inputFile&join=inputFile.bucket` to get file url',
    status: 200,
    schema: {
      properties: {
        data: { $ref: getSchemaPath(ResponseImportJobDto), type: 'array' },
        count: { type: 'number' },
        total: { type: 'number' },
        page: { type: 'number' },
        pageCount: { type: 'number' },
      },
    },
  })
  public async getManyImportJobsOrder(@ParsedRequest() req: CrudRequest) {
    return this.base.getManyBase(req);
  }

  @Override('getManyBase')
  getMany() {
    return { message: 'Please use /import-jobs/order' };
  }
}
