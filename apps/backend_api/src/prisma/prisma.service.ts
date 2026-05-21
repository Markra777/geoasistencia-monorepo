import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv'; // 1. Importamos dotenv

// 2. Forzamos la lectura del archivo .env al cargar este módulo
dotenv.config();

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // 3. Obtenemos la URL de forma segura
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('⚠️ DATABASE_URL no está definida en el entorno.');
    }

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}