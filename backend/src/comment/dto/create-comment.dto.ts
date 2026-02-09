import { IsNotEmpty, IsString, IsInt, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ description: '评论内容' })
  @IsString()
  @IsNotEmpty({ message: '评论内容不能为空' })
  content: string;

  @ApiProperty({ description: '所属文章ID' })
  @IsInt()
  @IsNotEmpty()
  blogId: number;

  @ApiProperty({ description: '父评论ID', required: false })
  @IsOptional()
  @IsInt()
  parentId?: number;
}
