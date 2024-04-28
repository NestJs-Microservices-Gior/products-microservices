/* eslint-disable prettier/prettier */
import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from '@prisma/client';
import { PaginationDto } from 'src/common';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {
  //
  private readonly logger = new Logger('ProductsService');

  onModuleInit() {
    this.$connect();
    //console.log('Database connected');
    this.logger.log('Database connected');
  }
  create(createProductDto: CreateProductDto) {
    return this.product.create({
      data: createProductDto,
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;
    const totalPages = await this.product.count({ where: { available: true } });
    const lastPage = Math.ceil(totalPages / limit);

    return {
      data: await this.product.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: { available: true },
      }),
      meta: {
        total: totalPages,
        page,
        lastPage,
      },
    };
  }

  async findOne(id: number) {
    const product = await this.product.findFirst({
      where: { id, available: true },
    });
    if (!product)
      throw new NotFoundException(`Product with id ${id} not found`);
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    try {
      const { id: __, ...data } = updateProductDto;
      return await this.product.update({
        where: { id },
        //data: updateProductDto,
        data: data,
      });
    } catch (error) {
      throw new NotFoundException(
        `Error in ${error.meta.modelName} code:${error.code} descripcion:${error.meta.cause}`,
      );
    }
  }

  async remove(id: number) {
    try {
      // return await this.product.delete({
      //   where: { id },
      // });
      return await this.product.update({
        where: { id },
        data: {
          available: false,
        },
      });
    } catch (error) {
      this.logger.log(
        `Error in ${error.meta.modelName} code:${error.code} descripcion:${error.meta.cause}`,
      );
      if (error.code === 'P2025')
        throw new NotFoundException(
          `Error in ${error.meta.modelName} code:${error.code} descripcion:${error.meta.cause}`,
        );
    }
  }
}
