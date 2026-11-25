import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Nguyễn Văn A' })
  name: string;

  @ApiProperty({ example: 'a@example.com' })
  email: string;

  @ApiProperty({ example: 'matkhau123' })
  password: string;
}
