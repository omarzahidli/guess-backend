import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from 'src/entities/Products.entity';
import CategoryEntity from 'src/entities/Category.entity';
import UploadEntity from 'src/entities/Upload.entity';

@Module({
    imports: [TypeOrmModule.forFeature([ProductEntity, CategoryEntity, UploadEntity])],
    controllers: [ProductController],
    providers: [ProductService],
})
export class ProductModule { };