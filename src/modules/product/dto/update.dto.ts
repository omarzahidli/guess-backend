import { PartialType } from '@nestjs/mapped-types';
import { ProductCreateDto } from './create.dto';

export class ProductUpdateDto extends PartialType(ProductCreateDto) { }
