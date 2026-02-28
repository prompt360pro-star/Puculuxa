import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  Min,
} from 'class-validator';

export class CreateQuotationDto {
  @IsString()
  @IsNotEmpty()
  eventType!: string;

  @IsInt()
  @Min(1)
  guestCount!: number;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsArray()
  complements?: string[];

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsString()
  referenceImage?: string;
}
