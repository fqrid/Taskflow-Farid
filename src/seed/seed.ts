import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../app.module';
import { RolesService } from '../modules/roles/roles.service';
import { User } from '../modules/users/user.entity';
import { Role } from '../modules/roles/role.entity';

type SeedUser = {
  email: string;
  nombre: string;
  rol: 'ADMIN' | 'GERENTE' | 'DESARROLLADOR';
  password: string;
};

async function main() {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const allowProd = process.env.SEED_ALLOW_PROD === 'true';
  if (nodeEnv === 'production' && !allowProd) {
    throw new Error(
      'Seed bloqueada en producción. Define SEED_ALLOW_PROD=true si realmente quieres ejecutarla.',
    );
  }

  const resetPasswords = process.env.SEED_RESET_PASSWORDS === 'true';

  const seedUsers: SeedUser[] = [
    {
      email: process.env.SEED_ADMIN_EMAIL ?? 'admin@taskflowpro.com',
      nombre: process.env.SEED_ADMIN_NAME ?? 'Admin',
      rol: 'ADMIN',
      password: process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!',
    },
    {
      email: process.env.SEED_GERENTE_EMAIL ?? 'gerente@taskflowpro.com',
      nombre: process.env.SEED_GERENTE_NAME ?? 'Gerente',
      rol: 'GERENTE',
      password: process.env.SEED_GERENTE_PASSWORD ?? 'Gerente123!',
    },
    {
      email: process.env.SEED_DEV_EMAIL ?? 'dev@taskflowpro.com',
      nombre: process.env.SEED_DEV_NAME ?? 'Desarrollador',
      rol: 'DESARROLLADOR',
      password: process.env.SEED_DEV_PASSWORD ?? 'Dev123!',
    },
  ];

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const rolesService = app.get(RolesService);
    await rolesService.inicializarRoles();

    const dataSource = app.get(DataSource);
    const rolesRepo = dataSource.getRepository(Role);
    const usersRepo = dataSource.getRepository(User);

    for (const u of seedUsers) {
      const rolEntity = await rolesRepo.findOne({
        where: { nombre: u.rol, activo: true },
      });
      if (!rolEntity) {
        throw new Error(
          `No se encontró el rol ${u.rol}. Verifica RolesService.inicializarRoles().`,
        );
      }

      const existente = await usersRepo.findOne({ where: { email: u.email } });

      if (!existente) {
        const hashed = await bcrypt.hash(u.password, 10);
        const nuevo = usersRepo.create({
          email: u.email,
          nombre: u.nombre,
          contraseña: hashed,
          rol: rolEntity,
          activo: true,
        });

        await usersRepo.save(nuevo);
        console.log(`Creado usuario: ${u.email} (${u.rol})`);
      } else {
        existente.nombre = u.nombre;
        existente.activo = true;
        existente.rol = rolEntity;

        if (resetPasswords) {
          existente.contraseña = await bcrypt.hash(u.password, 10);
        }

        await usersRepo.save(existente);
        console.log(
          `Actualizado usuario: ${u.email} (${u.rol})${resetPasswords ? ' (password reseteada)' : ''}`,
        );
      }

      if (process.env.SEED_SHOW_PASSWORDS === 'true') {
        console.log(`password: ${u.password}`);
      }
    }

    console.log('\nSeed finalizada.');
    console.log(
      'Notas: para resetear passwords usa SEED_RESET_PASSWORDS=true. Para mostrar passwords usa SEED_SHOW_PASSWORDS=true.',
    );
  } finally {
    await app.close();
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error('❌ Error ejecutando seed:', message);
  process.exitCode = 1;
});
