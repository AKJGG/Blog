import { IsEnum, IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateActionDto {
  @ApiProperty({ enum: ['like', 'favorite'], description: '类型' })
  @IsEnum(['like', 'favorite'], { message: '类型必须是 like 或 favorite' })
  @IsNotEmpty()
  type: 'like' | 'favorite';

  @ApiProperty({ description: '文章ID' })
  @IsInt()
  @IsNotEmpty()
  blogId: number;
}
