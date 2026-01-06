import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начало заполнения базы данных...');

  // Создание администратора
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
    },
  });
  console.log('✅ Администратор создан:', admin.email);

  // Создание тестового пользователя
  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: userPassword,
      firstName: 'Test',
      lastName: 'User',
      role: 'USER',
    },
  });
  console.log('✅ Тестовый пользователь создан:', user.email);

  // Создание категорий и товаров
  const categories = [
    'Браслеты',
    'Подвески и Чокеры',
    'Кристаллы',
    'Кольца',
    'Картины-Талисманы',
    'Масляные Эко духи',
    'Свечи',
    'Соли для Ванн',
    'Благовония',
    'Руны',
  ];

  const products = [
    {
      name: 'Браслет из аметиста',
      description: 'Красивый браслет из натурального аметиста. Помогает успокоить ум и улучшить сон.',
      price: 1500,
      category: 'Браслеты',
      inStock: 10,
      image: 'https://via.placeholder.com/400',
    },
    {
      name: 'Кристалл кварца',
      description: 'Натуральный кристалл кварца для очищения энергии и защиты.',
      price: 800,
      category: 'Кристаллы',
      inStock: 15,
      image: 'https://via.placeholder.com/400',
    },
    {
      name: 'Ритуальная свеча',
      description: 'Свеча из натурального воска для ритуалов и медитаций.',
      price: 500,
      category: 'Свечи',
      inStock: 20,
      image: 'https://via.placeholder.com/400',
    },
    {
      name: 'Подвеска с рунами',
      description: 'Серебряная подвеска с древними рунами для защиты и силы.',
      price: 2000,
      category: 'Подвески и Чокеры',
      inStock: 8,
      image: 'https://via.placeholder.com/400',
    },
    {
      name: 'Кольцо с тигровым глазом',
      description: 'Кольцо с натуральным камнем тигровый глаз для защиты и уверенности.',
      price: 1200,
      category: 'Кольца',
      inStock: 12,
      image: 'https://via.placeholder.com/400',
    },
    {
      name: 'Картина-талисман "Защита"',
      description: 'Картина с магическими символами для защиты дома и семьи.',
      price: 3500,
      category: 'Картины-Талисманы',
      inStock: 5,
      image: 'https://via.placeholder.com/400',
    },
    {
      name: 'Эко духи "Афродита"',
      description: 'Масляные эко духи с ароматом розы и жасмина. Афродизиак.',
      price: 1800,
      category: 'Масляные Эко духи',
      inStock: 10,
      image: 'https://via.placeholder.com/400',
    },
    {
      name: 'Соль для ванн с лавандой',
      description: 'Морская соль с травами лаванды для расслабления и восстановления.',
      price: 600,
      category: 'Соли для Ванн',
      inStock: 25,
      image: 'https://via.placeholder.com/400',
    },
    {
      name: 'Благовония "Сандал"',
      description: 'Натуральные благовония из сандалового дерева для очищения пространства.',
      price: 400,
      category: 'Благовония',
      inStock: 30,
      image: 'https://via.placeholder.com/400',
    },
    {
      name: 'Набор рун',
      description: 'Полный набор рун из натурального камня с инструкцией по использованию.',
      price: 2500,
      category: 'Руны',
      inStock: 7,
      image: 'https://via.placeholder.com/400',
    },
  ];

  for (const product of products) {
    const existing = await prisma.product.findFirst({
      where: { name: product.name },
    });
    if (!existing) {
      await prisma.product.create({
        data: product,
      });
    }
  }
  console.log(`✅ Создано ${products.length} товаров`);

  console.log('🎉 База данных успешно заполнена!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

