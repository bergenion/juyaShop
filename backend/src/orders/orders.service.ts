import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrderDto) {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: true,
      },
    });

    if (cartItems.length === 0) {
      throw new BadRequestException('Корзина пуста');
    }

    let total = 0;
    const orderItems = [];

    for (const item of cartItems) {
      if (item.product.inStock < item.quantity) {
        throw new BadRequestException(
          `Недостаточно товара "${item.product.name}" на складе`,
        );
      }

      const itemTotal = item.product.price * item.quantity;
      total += itemTotal;

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: item.product.price,
      });
    }

    const order = await this.prisma.order.create({
      data: {
        userId,
        total,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        comment: dto.comment,
        orderItems: {
          create: orderItems,
        },
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    for (const item of cartItems) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: {
          inStock: {
            decrement: item.quantity,
          },
        },
      });
    }

    await this.prisma.cartItem.deleteMany({
      where: { userId },
    });

    return order;
  }

  async findAll(userId: string, isAdmin: boolean = false) {
    const where = isAdmin ? {} : { userId };
    
    return this.prisma.order.findMany({
      where,
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string, isAdmin: boolean = false) {
    const where: any = { id };
    if (!isAdmin) {
      where.userId = userId;
    }

    const order = await this.prisma.order.findFirst({
      where,
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Заказ не найден');
    }

    return order;
  }

  async updateStatus(id: string, status: string) {
    await this.findOne(id, '', true);
    return this.prisma.order.update({
      where: { id },
      data: { status: status as any },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id, '', true);
    return this.prisma.order.delete({
      where: { id },
    });
  }
}

