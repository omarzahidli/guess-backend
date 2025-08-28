import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClsService } from 'nestjs-cls';
import { BasketEntity, BasketItemEntity } from 'src/entities/Basket.entity';
import { ProductEntity } from 'src/entities/Products.entity';
import { Repository } from 'typeorm';
import BasketDto from './dto/add.dto';
import { ColorEnum, SizeEnum } from 'src/shared/enums/products.enum';

@Injectable()
export class BasketService {
    constructor(
        @InjectRepository(BasketEntity)
        private basketRepo: Repository<BasketEntity>,
        @InjectRepository(BasketItemEntity)
        private basketItemRepo: Repository<BasketItemEntity>,
        @InjectRepository(ProductEntity)
        private productRepo: Repository<ProductEntity>,
        private cls: ClsService
    ) { }

    async getBasket() {
        const user = this.cls.get("user");

        let basket = await this.basketRepo.findOne({
            where: { userId: user.id },
            select: {
                id: true,
                totalItems: true,
                totalPrice: true,
                items: {
                    id: true,
                    size: true,
                    color: true,
                    quantity: true,
                    price: true,
                    product: true
                }
            },
            relations: ['items', 'items.product', 'items.product.images']
        });
        
        if (!basket) {
            // create empty basket
            basket = this.basketRepo.create({
                userId: user.id,
                totalItems: 0,
                totalPrice: 0,
                items: []
            });
            await basket.save();
        }

        if (!basket) throw new NotFoundException("Basket is empty or not found!");

        basket.items.forEach(item => {
            const { color, size, product } = item;
            product.colors = product.colors.filter(c => c === color);
            product.sizes = product.sizes.filter(s => s === size);
        });

        return basket;
    }

    async addBasket(id: number, params: BasketDto) {
        const user = this.cls.get("user");
        const product = await this.productRepo.findOne({ where: { id } });

        if (!product) throw new NotFoundException('Product not found with given id!');

        let basket = await this.basketRepo.findOne({ where: { userId: user.id } });
        if (!basket) {
            basket = this.basketRepo.create({ userId: user.id, totalItems: 0, totalPrice: 0 });
            await basket.save();
        }

        // Check if same product with same size & color already exists
        let existingItem = await this.basketItemRepo.findOne({
            where: {
                productId: id,
                basketId: basket.id,
                color: params.color,
                size: params.size
            }
        });

        if (existingItem) {
            // Update quantity if same product/size/color
            const newQuantity = existingItem.quantity + params.quantity;

            if (newQuantity <= 0) {
                basket.totalPrice -= existingItem.price;
                basket.totalItems -= existingItem.quantity;

                await Promise.all([
                    this.removeFromBasket(existingItem.id),
                    basket.save()
                ]);
            } else {
                basket.totalItems += params.quantity;
                basket.totalPrice += +product.price * params.quantity;

                existingItem.quantity = newQuantity;
                existingItem.price = +product.price * newQuantity;

                await Promise.all([basket.save(), existingItem.save()]);
            }

            return existingItem;
        } 
        else {
            // Validate color and size
            if (!product.colors.includes(params.color as ColorEnum)) {
                throw new NotFoundException("Color is not available for this product!");
            }
            if (!product.sizes.includes(params.size as SizeEnum)) {
                throw new NotFoundException("Size is not available for this product!");
            }
            // Create new basket item
            const basketItem = this.basketItemRepo.create({
                basketId: basket.id,
                size: params.size,
                color: params.color,
                quantity: params.quantity,
                price: +product.price * params.quantity,
                productId: id
            });
            basket.totalItems += params.quantity;
            basket.totalPrice += +product.price * params.quantity;

            await Promise.all([basket.save(), basketItem.save()]);

            return basketItem;
        }
    }

    async removeFromBasket(id: number) {
        const user = this.cls.get("user");

        const basket = await this.basketRepo.findOne({ where: { userId: user.id } });
        if (!basket) throw new NotFoundException("User has not yet basket!");

        const basketItem = await this.basketItemRepo.findOne({
            where: { basketId: basket.id, id }
        });
        if (!basketItem) throw new NotFoundException("Basket item is not found!");

        basket.totalItems -= basketItem.quantity;
        basket.totalPrice -= +basketItem.price;

        await this.basketItemRepo.delete({ id });
        await basket.save();

        return { message: "Product successfully deleted from basket!" };
    }

    async getBasketByUser(userId: number) {
        const basket = await this.basketRepo.find({
            where: { userId },
            relations: ['items', 'items.product', 'items.product.images']
        });

        if (!basket?.length) {
            throw new NotFoundException("Basket not found for this user!");
        }

        // Filter product colors/sizes based on basket items
        basket[0].items.forEach(item => {
            const { color, size, product } = item;
            product.colors = product.colors.filter(c => c === color);
            product.sizes = product.sizes.filter(s => s === size);
        });

        return basket;
    }
}
