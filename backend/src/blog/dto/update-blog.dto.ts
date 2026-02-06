import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateBlogDto } from './create-blog.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateBlogDto extends PartialType(CreateBlogDto) {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}