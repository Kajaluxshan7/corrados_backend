import { IsInt, Min } from 'class-validator';

export class ReorderDto {
  @IsInt()
  @Min(0)
  sortOrder: number;
}
