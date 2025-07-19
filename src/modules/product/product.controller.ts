import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductCreateDto } from './dto/create.dto';

@Controller('product')
export class ProductController {
    constructor(
        private productService: ProductService
    ) { }

    @Get()
    async getAllProducts() {
        return await this.productService.getAllProducts()
    }

    @Post()
    async create(@Body() body: ProductCreateDto) {
        let product = await this.productService.create(body)

        return product
    }

    @Get(":id")
    async getProductById(@Param("id") id: number) {
        return await this.productService.getProductById(id)
    }

    @Delete(":id")
    async deleteProduct(@Param("id") id: number) {
        return await this.productService.deleteProduct(id)
    }

}