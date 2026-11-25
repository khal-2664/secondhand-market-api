import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'a@example.com' })
  email: string;

  @ApiProperty({ example: 'matkhau123' })
  password: string;
}
