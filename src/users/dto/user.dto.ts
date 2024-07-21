import { PartialType, OmitType, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { CreateAuthDto } from 'src/auth/dto/auth.dto';

export class UpdateUserDto extends PartialType(
  OmitType(CreateAuthDto, [
    'password',
    'confirm_password',
    'email',
    'username',
    'telephone',
    'referall',
    'role',
  ] as const),
) {}

export class UpdatePasswordDto {
  @ApiProperty({ example: 'qwsa', required: true })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ example: 'John', required: true })
  @IsString()
  @IsNotEmpty()
  newPassword: string;

  @ApiProperty({ example: 'John', required: true })
  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}
