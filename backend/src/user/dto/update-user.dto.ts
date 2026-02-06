import { IsOptional, IsString, IsEmail } from 'class-validator';
import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({ description: '更新时间戳', required: false })
  @IsOptional()
  updatedAt?: Date;
}