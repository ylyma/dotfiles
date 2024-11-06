import { ApiSecurity, ApiResponse } from '@nestjs/swagger';
import { FileController as _FileController } from 'file-upload';

import { API_KEY_HEADER } from '../../../common/constants/api';

@ApiSecurity(API_KEY_HEADER)
export class FileController extends _FileController {
  @ApiResponse({ 
    status: 200,
    type: YourResponseDto 
  })
}
