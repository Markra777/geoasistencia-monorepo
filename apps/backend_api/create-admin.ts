import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando creación de Administrador...');
  
  // 1. Encriptar la contraseña de forma segura
  const hashedPassword = await bcrypt.hash('Admin12345', 10);

  // 2. Inyectar el usuario en PostgreSQL (Neon)
  const admin = await prisma.user.create({
    data: {
      fullName: 'Administrador Supremo', // Cambia el nombre si gustas
      email: 'admin@empresa.com',
      passwordHash: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log(`¡Éxito! Administrador creado: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });