import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

// 1. Cargar las variables de entorno del archivo .env
dotenv.config();

// 2. Configurar el adaptador nativo de PostgreSQL (igual que en NestJS)
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// 3. Inicializar Prisma con el adaptador
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando el seeding de la base de datos...');

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Admin12345*', salt);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@attendance.com' },
    update: {},
    create: {
      email: 'admin@attendance.com',
      passwordHash: passwordHash,
      fullName: 'Administrador General',
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Usuario Administrador creado exitosamente:');
  console.log(`✉️  Email: ${adminUser.email}`);
  console.log(`🔑 Rol: ${adminUser.role}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    // Es buena práctica cerrar el pool al terminar un script aislado
    await pool.end(); 
  });