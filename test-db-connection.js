// ✅ Скрипт для проверки подключения к базе данных Supabase
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function testConnection() {
  console.log('🔍 Начинаем проверку подключения к Supabase...');
  console.log('📌 Строка подключения:', process.env.DATABASE_URL?.substring(0, 60) + '...');

  try {
    await prisma.$connect();
    console.log('✅ УСПЕХ! Подключение к базе данных работает');

    const result = await prisma.$queryRaw`SELECT NOW() as current_time;`;
    console.log('🕐 Текущее время на сервере базы данных:', result[0].current_time);

    const tables = await prisma.$queryRaw`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    `;

    console.log('\n📋 Созданные таблицы в базе данных:');
    tables.forEach(table => {
      console.log('✅', table.table_name);
    });

    console.log('\n🎉 ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ! База данных работает корректно');

  } catch (error) {
    console.log('\n❌ ОШИБКА ПОДКЛЮЧЕНИЯ:');
    console.log('Код ошибки:', error.code);
    console.log('Сообщение:', error.message);
    
    if (error.code === 'P1001') {
      console.log('\n💡 Решение:');
      console.log('1. Открой панель Supabase в браузере');
      console.log('2. Подожди 30 секунд пока база проснется');
      console.log('3. Запусти скрипт еще раз');
    }

  } finally {
    await prisma.$disconnect();
  }
}

testConnection();