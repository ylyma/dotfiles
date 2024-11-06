import { ApiSecurity, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileController as _FileController } from 'file-upload';

import { API_KEY_HEADER } from '../../../common/constants/api';

@ApiSecurity(API_KEY_HEADER)
@ApiConsumes('multipart/form-data')
@ApiBody({ 
  schema: {
    type: 'object',
    properties: {
      file: {
        type: 'string',
        format: 'binary'
      }
    }
  }
})
export class FileController extends _FileController {}
