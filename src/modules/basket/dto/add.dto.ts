import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber } from "class-validator";

export default class BasketDto {
    @Type()
    @IsNumber()
    @ApiProperty({ default: 1 })
    productId: number

    @Type()
    @IsNumber()
    @ApiProperty({ default: 1 })
    quantity: number
}