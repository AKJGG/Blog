import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateCommentDto } from './create-comment.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCommentDto extends PartialType(CreateCommentDto) {
  // 通常评论只允许修改 content 字段
  @ApiProperty({ description: '修改后的评论内容', required: false })
  @IsString()
  @IsOptional()
  content?: string;
}
