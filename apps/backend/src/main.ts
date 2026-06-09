import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

// BigInt is not JSON-serializable by default — Track.fileSizeBytes returns one
// and crashes the whole response handler. Patch the prototype with a toJSON
// that emits the value as a string (preserves precision past Number.MAX_SAFE_INTEGER).
// Frontend treats it as a string and converts when needed.
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix("api");

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(",") || [
      "http://localhost:3000",
      "http://localhost:5173",
    ],
    credentials: true,
  });

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle("MusicFlow API")
    .setDescription(
      "API para MusicFlow - Reproductor musical con EQ asistido por IA",
    )
    .setVersion("1.0")
    .addBearerAuth()
    .addTag("auth", "Autenticacion y gestion de usuarios")
    .addTag("library", "Biblioteca musical - tracks y playlists")
    .addTag("equalizer", "Sistema de ecualizacion multi-nivel")
    .addTag("ai-agent", "Agente IA para sugerencias de EQ")
    .addTag("analytics", "Estadisticas y historial de escucha")
    .addTag("sync", "Sincronizacion hibrida")
    .addTag("preferences", "Preferencias de usuario")
    .addTag("admin", "Panel de administracion")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = process.env.PORT || 8000;
  await app.listen(port);

  console.log(`MusicFlow API running on: http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
