import { ApiProperty } from '@nestjs/swagger';

export class RefreshDto {
  @ApiProperty({ description: 'Refresh token nhận được khi đăng nhập' })
  refreshToken: string;
}
