import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para que el Panel Next.js pueda hacer peticiones
  app.enableCors();

  // 🚀 EL SECRETO DE LA NUBE: Leer el puerto dinámico de Render
  const port = process.env.PORT || 3000;



  // Validaciones globales estrictas (Protege contra payloads con basura)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina campos no definidos en los DTOs
      forbidNonWhitelisted: true, // Lanza error si envían campos extra
      transform: true, // Transforma los payloads a las clases DTO
    }),
  );

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('API de Asistencia')
    .setDescription('Documentación de los endpoints para la App Móvil y el Panel Admin')
    .setVersion('1.0')
    .addBearerAuth() // Habilita el botón para inyectar el JWT en las pruebas
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Iniciar el servidor en el puerto 3000
  await app.listen(3000, '0.0.0.0');
  //console.log(`🚀 Servidor corriendo en: http://localhost:3000`);
  //console.log(`📄 Swagger documentado en: http://localhost:3000/api`);
  console.log(`🚀 Servidor corriendo en: http://localhost:${port}`);
}
bootstrap();
