import { GenderEnum } from "src/shared/enums/gender.enum";
import { RoleEnum } from "src/shared/enums/role.enum";
import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('user')
export class UserEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    firstName: string

    @Column()
    lastName: string

    @Column()
    password: string

    @Column({ default: GenderEnum.MALE })
    gender: GenderEnum

    @Column({ default: RoleEnum.USER })
    role: RoleEnum

    @Column({ unique: true })
    email: string

    @Column()
    dateofbirth: Date

    @CreateDateColumn()
    createAt: Date


}