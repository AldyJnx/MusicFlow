import "./instrument";
import { NestFactory } from "@nestjs/core";
import { Logger, ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import { AppModule } from "./app.module";

// BigInt is not JSON-serializable by default — Track.fileSizeBytes returns one
// and crashes the whole response handler. Patch the prototype with a toJSON
// that emits the value as a string (preserves precision past Number.MAX_SAFE_INTEGER).
// Frontend treats it as a string and converts when needed.
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const verboseBootstrapLogs =
    process.env.NEST_BOOTSTRAP_LOGS === "true" ||
    process.env.npm_lifecycle_event === "start:dev" ||
    process.env.npm_lifecycle_event === "start:debug";

  const app = await NestFactory.create(AppModule, {
    logger: verboseBootstrapLogs ? undefined : ["error", "warn"],
  });
  validateProductionConfiguration();
  app.enableShutdownHooks();

  const docsEnabled =
    process.env.ENABLE_SWAGGER === "true" ||
    (process.env.NODE_ENV !== "production" &&
      process.env.ENABLE_SWAGGER !== "false");
  app.use(
    helmet({
      // Swagger UI renders inline assets. The remaining Helmet protections
      // stay enabled when docs are available.
      contentSecurityPolicy: docsEnabled ? false : undefined,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  // Global prefix
  app.setGlobalPrefix("api");

  // CORS
  const configuredOrigins = process.env.CORS_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (process.env.NODE_ENV === "production" && !configuredOrigins?.length) {
    throw new Error("CORS_ORIGINS is required in production");
  }
  app.enableCors({
    origin: configuredOrigins?.length
      ? configuredOrigins
      : ["http://localhost:3000", "http://localhost:5173"],
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

  if (docsEnabled) {
    // Swagger document generation walks the metadata graph. It remains enabled
    // by default for local API discovery and can be disabled in production.
    const { DocumentBuilder, SwaggerModule } = await import("@nestjs/swagger");
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
  }

  const port = process.env.PORT || 8000;
  await app.listen(port);

  const logger = new Logger("Bootstrap");
  const readyMessage = `MusicFlow API running on: http://localhost:${port}`;
  if (verboseBootstrapLogs) {
    logger.log(readyMessage);
  } else {
    console.log(`[Bootstrap] ${readyMessage}`);
  }
  if (docsEnabled) {
    const docsMessage = `Swagger docs: http://localhost:${port}/api/docs`;
    if (verboseBootstrapLogs) {
      logger.log(docsMessage);
    } else {
      console.log(`[Bootstrap] ${docsMessage}`);
    }
  }
}

function validateProductionConfiguration(): void {
  if (process.env.NODE_ENV !== "production") return;
  const accessSecret = process.env.JWT_SECRET ?? "";
  const refreshSecret = process.env.JWT_REFRESH_SECRET ?? "";
  if (accessSecret.length < 32 || refreshSecret.length < 32) {
    throw new Error(
      "Production JWT secrets must contain at least 32 characters",
    );
  }
  if (accessSecret === refreshSecret) {
    throw new Error("JWT_SECRET and JWT_REFRESH_SECRET must be independent");
  }
}

bootstrap();
