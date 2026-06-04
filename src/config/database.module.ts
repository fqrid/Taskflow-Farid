import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbPort = Number(configService.get<string>('DB_PORT') ?? 3306);
        const dbUsername =
          configService.get<string>('DB_USERNAME') ??
          configService.getOrThrow<string>('DB_USER');
        const dbDatabase =
          configService.get<string>('DB_DATABASE') ??
          configService.getOrThrow<string>('DB_NAME');
        const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';

        return {
          type: 'mysql',
          host: configService.get<string>('DB_HOST') ?? 'localhost',
          port: Number.isNaN(dbPort) ? 3306 : dbPort,
          username: dbUsername,
          password: configService.getOrThrow<string>('DB_PASSWORD'),
          database: dbDatabase,
          autoLoadEntities: true,
          // En desarrollo, sincronizar automáticamente. En producción, usar migraciones
          synchronize: nodeEnv === 'development',
          logging: nodeEnv === 'development',
        };
      },
    }),
  ],
})
export class DatabaseModule {}
