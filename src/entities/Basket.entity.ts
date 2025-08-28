import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { UserEntity } from "./User.entity";
import { ProductEntity } from "./Products.entity";

@Entity("basket")
export class BasketEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ default: 0 })
    totalItems: number;

    @Column({ default: 0 })
    totalPrice: number;

    @Column({ unique: true }) // ✅ ensure one basket per user
    userId: number;

    @OneToOne(() => UserEntity, (user) => user.basket, { onDelete: "CASCADE" })
    @JoinColumn({ name: 'userId' })
    user: UserEntity;

    @OneToMany(() => BasketItemEntity, (item) => item.basket, { cascade: true })
    items: BasketItemEntity[];
}

@Entity("basket_item")
export class BasketItemEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    basketId: number;

    @Column()
    productId: number;

    @Column({ default: 1 })
    quantity: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: number;

    @Column({ nullable: true })
    color: string;

    @Column({ nullable: true })
    size: string;

    @ManyToOne(() => BasketEntity, (basket) => basket.items, { onDelete: "CASCADE" })
    @JoinColumn({ name: 'basketId' })
    basket: BasketEntity;

    @ManyToOne(() => ProductEntity, (product) => product.basketItems, { onDelete: "CASCADE" })
    @JoinColumn({ name: 'productId' })
    product: ProductEntity;
}
