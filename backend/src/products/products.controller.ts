import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: diskStorage({
        destination: './uploads/products',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `product-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          return cb(new Error('Разрешены только изображения!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  create(
    @Body(new ValidationPipe({ whitelist: false, transform: false })) body: any,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    // Валидация обязательных полей
    if (!body.name || !body.category) {
      throw new BadRequestException('Название и категория обязательны для заполнения');
    }

    // Преобразуем данные из FormData в правильные типы
    const createProductDto: CreateProductDto = {
      name: String(body.name).trim(),
      description: body.description ? String(body.description).trim() : undefined,
      price: Number(body.price),
      category: String(body.category).trim(),
      inStock: Number(body.inStock) || 0,
      isActive: body.isActive === 'true' || body.isActive === true || body.isActive === undefined,
      image: undefined,
      images: [],
    };

    // Обработка загруженных файлов
    if (files && files.length > 0) {
      const imagePaths = files.map((file) => `/uploads/products/${file.filename}`);
      createProductDto.image = imagePaths[0]; // Первое изображение - основное
      createProductDto.images = imagePaths; // Все изображения в массив
    } else if (body.image) {
      createProductDto.image = String(body.image).trim();
    }

    return this.productsService.create(createProductDto);
  }

  @Get()
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get('categories')
  getCategories() {
    return this.productsService.getCategories();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: diskStorage({
        destination: './uploads/products',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `product-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          return cb(new Error('Разрешены только изображения!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: false, transform: false })) body: any,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    // Преобразуем данные из FormData в правильные типы
    const updateProductDto: UpdateProductDto = {};

    if (body.name !== undefined) updateProductDto.name = body.name;
    if (body.description !== undefined) updateProductDto.description = body.description;
    if (body.price !== undefined) updateProductDto.price = Number(body.price);
    if (body.category !== undefined) updateProductDto.category = body.category;
    if (body.inStock !== undefined) updateProductDto.inStock = Number(body.inStock);
    if (body.isActive !== undefined) {
      updateProductDto.isActive = body.isActive === 'true' || body.isActive === true;
    }

    // Обработка загруженных файлов
    if (files && files.length > 0) {
      const imagePaths = files.map((file) => `/uploads/products/${file.filename}`);
      updateProductDto.image = imagePaths[0]; // Первое изображение - основное
      updateProductDto.images = imagePaths; // Все изображения в массив
    } else if (body.image !== undefined) {
      updateProductDto.image = body.image;
      // Если переданы images как строка (JSON), парсим их
      if (body.images !== undefined) {
        updateProductDto.images = typeof body.images === 'string' 
          ? JSON.parse(body.images) 
          : body.images;
      }
    }

    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}

