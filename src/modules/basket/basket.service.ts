import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClsService } from 'nestjs-cls';
import { BasketEntity, BasketItemEntity } from 'src/entities/Basket.entity';
import { ProductEntity } from 'src/entities/Products.entity';
import { Repository } from 'typeorm';
import BasketDto from './dto/add.dto';
import { UserEntity } from 'src/entities/User.entity';

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

    async addBasket({ productId, quantity }: BasketDto) {
        const user = this.cls.get("user");

        const product = await this.productRepo.findOne({ where: { id: productId } });

        if (!product) throw new NotFoundException("Product is not found with given id!")

        let basket = await this.basketRepo.findOne({
            where: { userId: user.id },
            relations: ['items', 'items.product']
        });

        if (!basket) {
            basket = this.basketRepo.create({
                userId: user.id,
                totalItems: 0,
                totalPrice: 0
            });
            basket = await this.basketRepo.save(basket);
        }

        let existingItem = await this.basketItemRepo.findOne({
            where: {
                basketId: basket.id,
                productId
            }
        });

        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;

            if (newQuantity <= 0) {
                await this.basketItemRepo.delete({ id: existingItem.id });
            } else {
                existingItem.quantity = newQuantity;
                await this.basketItemRepo.save(existingItem);
            }
        } else {
            if (quantity > 0) {
                const newItem = this.basketItemRepo.create({
                    basketId: basket.id,
                    productId: productId,
                    quantity: quantity,
                    price: product.price
                });
                await this.basketItemRepo.save(newItem);
            }
        }

        await this.updateBasketTotals(basket.id);

        return await this.basketRepo.findOne({
            where: { id: basket.id },
            relations: ['items', 'items.product']
        });
    }

    async updateItemQuantity(productId: number, quantity: number) {
        const user = this.cls.get("user");

        const basket = await this.basketRepo.findOne({
            where: { userId: user.id }
        });

        if (!basket) throw new NotFoundException("Basket is not found!");

        const existingItem = await this.basketItemRepo.findOne({
            where: {
                basketId: basket.id,
                productId
            }
        });

        if (!existingItem) throw new NotFoundException("Item not found in basket!");

        if (quantity <= 0) {

            await this.basketItemRepo.delete({ id: existingItem.id });

        } else {
            existingItem.quantity = quantity;
            await this.basketItemRepo.save(existingItem);
        }

        await this.updateBasketTotals(basket.id);

        return await this.basketRepo.findOne({
            where: { id: basket.id },
            relations: ['items', 'items.product']
        });
    }

    async removeFromBasket(productId: number) {
        const user = this.cls.get("user");

        const basket = await this.basketRepo.findOne({
            where: { userId: user.id }
        });

        if (!basket) throw new NotFoundException("Basket is not found!");

        const existingItem = await this.basketItemRepo.findOne({
            where: {
                basketId: basket.id,
                productId
            }
        });

        if (!existingItem) throw new NotFoundException("Item not found in basket!");

        await this.basketItemRepo.delete({ id: existingItem.id });
        await this.updateBasketTotals(basket.id);

        let removed = await this.basketRepo.findOne({
            where: { id: basket.id },
            relations: ['items', 'items.product']
        });

        return {
            message: "Item successfully deleted!",
            removed
        }
    }

    private async updateBasketTotals(basketId: number) {
        const items = await this.basketItemRepo.find({
            where: { basketId },
            relations: ['product']
        });

        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        await this.basketRepo.update(basketId, {
            totalItems,
            totalPrice
        });
    }

    async getBasket() {
        const user = this.cls.get<UserEntity>("user");

        const basket = await this.basketRepo.findOne({
            where: { userId: user.id },
            select: {
                id: true,
                totalItems: true,
                totalPrice: true,
                items: {
                    id: true,
                    quantity: true,
                    price: true,
                    product: {
                        id: true,
                        name: true,
                        price: true,
                        slug: true,
                        images: true
                    }
                }
            },
            relations: ['items', 'items.product', 'items.product.images']
        });

        if (!basket) throw new NotFoundException("Basket is not found!")

        return basket
    }
}