import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  Min,
  MaxLength,
  IsIn,
} from 'class-validator';

const VALID_EVENT_TYPES = [
  'casamento', 'aniversario', 'corporativo', 'baptizado',
  'bodas', 'baby_shower', 'graduacao', 'outro',
];

const VALID_SOURCES = ['APP', 'WHATSAPP_IMPORT', 'ADMIN_CREATED', 'INSTAGRAM'];

export class CreateQuotationDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(VALID_EVENT_TYPES, { message: 'Tipo de evento inválido.' })
  eventType!: string;

  @IsInt()
  @Min(1, { message: 'Número de convidados deve ser pelo menos 1.' })
  guestCount!: number;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Descrição máx. 500 caracteres.' })
  description?: string;

  @IsOptional()
  @IsString()
  referenceImage?: string;

  @IsOptional()
  @IsString()
  @IsIn(VALID_SOURCES)
  source?: string;

  @IsOptional()
  @IsArray()
  complements?: { name: string; type: string; unitPrice: number; quantity: number }[];

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;
}

export class UpdateQuotationStatusDto {
  @IsString()
  @IsNotEmpty()
  status!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class CreateQuotationVersionDto {
  @IsNotEmpty()
  price!: number;

  @IsOptional()
  @IsString()
  response?: string;

  @IsOptional()
  @IsString()
  changes?: string;
}
