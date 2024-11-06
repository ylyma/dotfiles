import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiParam, ApiSecurity, ApiTags, ApiResponse, ApiBadRequestResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import { Crud, CrudController, Override } from '@nestjsx/crud';
import { plainToClass } from 'class-transformer';
import { ALLOWED_MIME_TYPES } from 'file-upload';
import { ResponseException } from 'file-upload/dist/components/ResponseException';
import { AdminApiKeyGuard } from 'src/common/guards/admin-apikey.guard';

import { API_KEY_HEADER } from '../../common/constants/api';
import { CreateNoticeRequestDto } from './dto/request/create-notice.dto';
import { CreateNoticeDocumentRequestDto } from './dto/request/create-notice-document.dto';
import { UpdateNoticeRequestDto } from './dto/request/update-notice.dto';
import { UpdateNoticeDocumentRequestDto } from './dto/request/update-notice-document.dto';
import { ResponseNoticeDocumentDto, ResponseNoticeDto, ResponseNoticesDto } from './dto/response/response-notice.dto';
import { NoticeContent, NoticeStatus } from './entities/notice-content.entity';
import { NoticeDocumentsService } from './notice-document.service';
import { NoticesService } from './notices.service';

enum FileValidationErrors {
  UNSUPPORTED_FILE_TYPE = 'UNSUPPORTED_FILE_TYPE',
}

@ApiTags('Notices')
@ApiSecurity(API_KEY_HEADER)
/**
 * Notice management endpoints
 * 
 * Auto-generated endpoints:
 * GET /notices - List notices
 * GET /notices/:id - Get notice by ID
 * POST /notices - Create notice (admin only)
 * PATCH /notices/:id - Update notice (admin only)
 */
@Crud({
  model: {
    type: NoticeContent,
  },
  routes: {
    only: ['createOneBase', 'updateOneBase', 'getManyBase', 'getOneBase'],
  },
  dto: {
    create: CreateNoticeRequestDto,
    update: UpdateNoticeRequestDto,
  },
  serialize: {
    create: ResponseNoticeDto,
    update: ResponseNoticeDto,
    get: ResponseNoticeDto,
    getMany: ResponseNoticesDto,
  },
  query: {
    join: {
      documents: { eager: true },
      'documents.file': { eager: true },
    },
  },
})
@Controller('notices')
export class NoticesController implements CrudController<NoticeContent> {
  constructor(public service: NoticesService, private noticeDocumentsService: NoticeDocumentsService) {}

  @UseGuards(AdminApiKeyGuard)
  @Override('createOneBase')
  @ApiOperation({
    summary: 'Create notice',
    description: 'Create a new notice. Title and slug required for published notices.'
  })
  @ApiResponse({
    status: 201,
    description: 'Notice created',
    type: ResponseNoticeDto
  })
  @ApiBadRequestResponse({
    description: 'Invalid notice data'
  })
  async createNotice(@Body() dto: CreateNoticeRequestDto): Promise<ResponseNoticeDto> {
    return this.service.createNotice(dto);
  }

  @UseGuards(AdminApiKeyGuard)
  @Override('updateOneBase')
  @ApiOperation({
    summary: 'Update notice',
    description: 'Update notice details. Title and slug required for published notices.'
  })
  @ApiResponse({
    status: 200,
    description: 'Notice updated',
    type: ResponseNoticeDto
  })
  @ApiBadRequestResponse({
    description: 'Invalid notice data'
  })
  @ApiNotFoundResponse({
    description: 'Notice not found'
  })
  async updateNotice(@Param('id') id: string, @Body() dto: UpdateNoticeRequestDto): Promise<ResponseNoticeDto> {
    return this.service.updateNotice(id, dto);
  }

  @Get('slug/:slug')
  @ApiOperation({
    summary: 'Get notice by slug',
    description: 'Retrieve published notice by its URL slug'
  })
  @ApiResponse({
    status: 200,
    description: 'Notice found',
    type: ResponseNoticeDto
  })
  @ApiNotFoundResponse({
    description: 'Notice not found'
  })
  async getNoticeBySlug(@Param('slug') slug: string): Promise<ResponseNoticeDto> {
    const notice = await this.service.findOne({
      relations: ['documents', 'documents.file', 'documents.file.bucket'],
      where: { slug, status: NoticeStatus.PUBLISHED },
    });
    return plainToClass(ResponseNoticeDto, notice);
  }

  @Get('banner')
  @ApiOperation({
    summary: 'Get banner notice',
    description: 'Get currently active banner notice'
  })
  @ApiResponse({
    status: 200,
    description: 'Banner notice found',
    type: ResponseNoticeDto
  })
  async getBannerNotices(): Promise<ResponseNoticeDto> {
    const notice = await this.service.findOne({ where: { banner: true, status: NoticeStatus.PUBLISHED } });
    return plainToClass(ResponseNoticeDto, notice);
  }

  @Post(':id/docs')
  @UseGuards(AdminApiKeyGuard)
  @ApiOperation({
    summary: 'Add documents',
    description: 'Upload documents to a notice. Max 50 files.'
  })
  @ApiParam({ name: 'id', description: 'Notice ID' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Documents added',
    type: [ResponseNoticeDocumentDto]
  })
  @ApiBadRequestResponse({
    description: 'Invalid files or document data'
  })
  @ApiNotFoundResponse({
    description: 'Notice not found'
  })
  @UseInterceptors(
    FilesInterceptor('files', 50, {
      fileFilter: (req: Request & { fileValidationError?: FileValidationErrors }, file, callback) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype?.toLowerCase())) {
          console.error(`NoticesController [addDocumentsToNotice]: File mimetype ${file.mimetype} is not supported`);

          req.fileValidationError = FileValidationErrors.UNSUPPORTED_FILE_TYPE;
          callback(null, false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  async addDocumentsToNotice(
    @Param('id') noticeId: string,
    @Body() createNoticeDocDto: CreateNoticeDocumentRequestDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Req() req: Request & { fileValidationError?: FileValidationErrors },
  ): Promise<ResponseNoticeDocumentDto[]> {
    if (req.fileValidationError && req.fileValidationError === FileValidationErrors.UNSUPPORTED_FILE_TYPE) {
      throw new BadRequestException('File extension is not supported.');
    }

    if (!files || files.length !== createNoticeDocDto.docs.length) {
      throw new BadRequestException(
        `Number of files (${files?.length || 0}) does not match number of document entries (${
          createNoticeDocDto.docs.length
        })`,
      );
    }

    const docs = createNoticeDocDto.docs.map((item, index) => ({
      ...item,
      file: files[index],
    }));

    const documents = await this.noticeDocumentsService.addDocumentsToNotice(noticeId, { docs, files });
    return plainToClass(ResponseNoticeDocumentDto, documents);
  }

  @UseGuards(AdminApiKeyGuard)
  @Put(':id/docs/:docId')
  @ApiOperation({
    summary: 'Update document label',
    description: 'Update document label for a notice'
  })
  @ApiParam({ name: 'id', description: 'Notice ID' })
  @ApiParam({ name: 'docId', description: 'Document ID' })
  @ApiResponse({
    status: 200,
    description: 'Document label updated',
    type: ResponseNoticeDocumentDto
  })
  @ApiNotFoundResponse({
    description: 'Notice or document not found'
  })
  async updateDocumentLabel(
    @Param('id') noticeId: string,
    @Param('docId') docId: string,
    @Body() updateNoticeDocDto: UpdateNoticeDocumentRequestDto,
  ): Promise<ResponseNoticeDocumentDto> {
    const document = await this.noticeDocumentsService.updateDocumentLabel(noticeId, docId, updateNoticeDocDto.label);
    return plainToClass(ResponseNoticeDocumentDto, document);
  }

  @UseGuards(AdminApiKeyGuard)
  @Delete(':id/docs/:docId')
  @ApiOperation({
    summary: 'Delete document',
    description: 'Remove document from notice'
  })
  @ApiParam({ name: 'id', description: 'Notice ID' })
  @ApiParam({ name: 'docId', description: 'Document ID' })
  @ApiResponse({
    status: 200,
    description: 'Document deleted'
  })
  @ApiNotFoundResponse({
    description: 'Notice or document not found'
  })
  async deleteDocument(@Param('id') noticeId: string, @Param('docId') docId: string) {
    return this.noticeDocumentsService.deleteDocument(noticeId, docId);
  }
}
