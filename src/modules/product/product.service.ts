import { ConflictException, Injectable, NotFoundException, ParseEnumPipe } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductEntity } from 'src/entities/Products.entity';
import { In, Repository } from 'typeorm';
import { ProductCreateDto } from './dto/create.dto';
import CategoryEntity from 'src/entities/Category.entity';
import UploadEntity from 'src/entities/Upload.entity';

@Injectable()
export class ProductService {
    constructor(
        @InjectRepository(ProductEntity)
        private productRepo: Repository<ProductEntity>,
        @InjectRepository(CategoryEntity)
        private categoryRepo: Repository<CategoryEntity>,
        @InjectRepository(UploadEntity)
        private uploadRepo: Repository<UploadEntity>,
    ) { }


    async getAllProducts() {
        let products = await this.productRepo.find({
            select: {
                name: true,
                description: true,
                price: true,
                stock: true,
                category: {
                    name: true,
                    id: true,
                    slug: true
                },
                images: true,
                id: true,
                colors: true,
                sizes: true,
                slug: true,
                createdAt: true,
                updatedAt: true
            },
            relations: ['category', 'images']
        })
        return products
    }

    async getProductById(id: number) {
        let product = await this.productRepo.findOne({
            where: { id },
            select: {
                name: true,
                description: true,
                price: true,
                stock: true,
                category: {
                    name: true,
                    id: true,
                    slug: true
                },
                images: true,
                id: true,
                colors: true,
                sizes: true,
                slug: true,
                createdAt: true,
                updatedAt: true
            }
            , relations: ['category', 'images']
        })
        if (!product) throw new NotFoundException("Product is not found with given id!")
        return product
    }

    async create(params: ProductCreateDto) {

        let category = await this.categoryRepo.findOne({ where: { id: params.categoryId }, select: { id: true } })

        if (!category) throw new NotFoundException("Category is not found with given id!")

        const uploads = await this.uploadRepo.find({
            where: { id: In(params.images) }
        })

        if (!uploads.length) throw new NotFoundException("Image is not found with given id!")

        if (params.slug) {
            let checkedProduct = await this.productRepo.findOne({ where: { slug: params.slug }, select: { id: true } })
            if (checkedProduct) throw new ConflictException("Product has already exsist woth given slug")
        } else {
            let editedSlug = this.slugify(params.name)

            let checkedProduct = await this.productRepo.findOne({ where: { slug: editedSlug }, select: { id: true } })

            if (checkedProduct) throw new ConflictException("Product has already exsist with given slug")
        }


        let product = this.productRepo.create({
            name: params.name,
            description: params.description,
            categoryId: params.categoryId,
            price: params.price,
            sizes: params.sizes,
            colors: params.colors,
            images: uploads,
            slug: params.slug ? params.slug : this.slugify(params.name)
        });

        await this.productRepo.save(product);
        return product

    }

    slugify(text: string) {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
    }


    async deleteProduct(id: number) {

        let product = await this.productRepo.findOne({ where: { id } })

        if (!product) throw new NotFoundException("Product is not found with given id!")

        await this.productRepo.delete(id)

        return {
            message: "Product deleted seccessfully!"
        }
    }




}


