import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'Ótima ideia! Vamos implementar assim.' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
