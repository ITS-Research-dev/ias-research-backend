#!/usr/bin/env node

/**
 * scripts/make-resource.js
 * -----------------------------------------------------------------------
 * Generate struktur resource NestJS lewat command:
 *
 *   npm run generate -- --name=siswa
 *
 * Menghasilkan:
 *
 *   src/siswa/
 *   ├── dto/
 *   │   ├── create-siswa.dto.ts
 *   │   └── update-siswa.dto.ts
 *   ├── entities/
 *   │   └── siswa.entity.ts
 *   ├── siswa.controller.ts
 *   ├── siswa.module.ts
 *   ├── siswa.repository.ts
 *   └── siswa.service.ts
 *
 * CRUD yang dibuat: getAll (/), getOne (/:id), createOne (/),
 * updateOne (/:id), deleteOne (/:id) — mengikuti pola template project.
 *
 * Tidak butuh dependency tambahan, hanya modul bawaan Node.js.
 * -----------------------------------------------------------------------
 */

const fs = require('fs');
const path = require('path');

// ------------------------------------------------------------------
// 1. Ambil nama resource dari argumen CLI
//    Mendukung dua format:
//      npm run generate -- --name=siswa
//      npm run generate -- siswa
// ------------------------------------------------------------------
function getResourceName() {
  const args = process.argv.slice(2);

  const namedArg = args.find((a) => a.startsWith('--name='));
  if (namedArg) {
    return namedArg.split('=')[1];
  }

  const positional = args.find((a) => !a.startsWith('--'));
  if (positional) {
    return positional;
  }

  return null;
}

// ------------------------------------------------------------------
// 2. Util konversi penamaan
// ------------------------------------------------------------------
function toPascalCase(str) {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toUpperCase());
}

function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function toKebabCase(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

// ------------------------------------------------------------------
// 3. Template tiap file
// ------------------------------------------------------------------
function tplEntity(namePascal, tableKebab) {
  return `import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('${tableKebab}')
export class ${namePascal} {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // TODO: tambahkan field sesuai kebutuhan, contoh:
  // @Column()
  // nama: string;
}
`;
}

function tplCreateDto(namePascal) {
  return `// TODO: tambahkan field DTO sesuai entity, contoh:
// import { IsString } from 'class-validator';
//
// export class Create${namePascal}Dto {
//   @IsString()
//   nama!: string; // "!" supaya tidak error "has no initializer" (strict mode)
// }

export class Create${namePascal}Dto {}
`;
}

function tplUpdateDto(namePascal, nameKebab) {
  return `import { PartialType } from '@nestjs/mapped-types';
import { Create${namePascal}Dto } from './create-${nameKebab}.dto';

// PartialType membuat semua field jadi opsional,
// jadi tidak perlu tulis ulang validasi untuk update.
export class Update${namePascal}Dto extends PartialType(Create${namePascal}Dto) {}
`;
}

function tplRepository(namePascal, nameCamel, nameKebab) {
  return `import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ${namePascal} } from './entities/${nameKebab}.entity';

@Injectable()
export class ${namePascal}Repository {
  constructor(
    @InjectRepository(${namePascal})
    private readonly repo: Repository<${namePascal}>,
  ) {}

  findAll(): Promise<${namePascal}[]> {
    return this.repo.find();
  }

  findById(id: string): Promise<${namePascal} | null> {
    return this.repo.findOneBy({ id });
  }

  create(data: Partial<${namePascal}>): Promise<${namePascal}> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<${namePascal}>): Promise<${namePascal} | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
`;
}

function tplService(namePascal, nameCamel, nameKebab) {
  return `import { Injectable, NotFoundException } from '@nestjs/common';
import { ${namePascal}Repository } from './${nameKebab}.repository';
import { Create${namePascal}Dto } from './dto/create-${nameKebab}.dto';
import { Update${namePascal}Dto } from './dto/update-${nameKebab}.dto';

@Injectable()
export class ${namePascal}Service {
  constructor(private readonly ${nameCamel}Repository: ${namePascal}Repository) {}

  findAll() {
    return this.${nameCamel}Repository.findAll();
  }

  async findOne(id: string) {
    const ${nameCamel} = await this.${nameCamel}Repository.findById(id);
    if (!${nameCamel}) {
      throw new NotFoundException(\`${namePascal} dengan id \${id} tidak ditemukan\`);
    }
    return ${nameCamel};
  }

  create(dto: Create${namePascal}Dto) {
    return this.${nameCamel}Repository.create(dto);
  }

  async update(id: string, dto: Update${namePascal}Dto) {
    await this.findOne(id); // pastikan data ada dulu sebelum update
    return this.${nameCamel}Repository.update(id, dto);
  }

  async remove(id: string) {
    await this.findOne(id); // pastikan data ada dulu sebelum hapus
    return this.${nameCamel}Repository.delete(id);
  }
}
`;
}

function tplController(namePascal, nameCamel, nameKebab, routePath) {
  return `import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ${namePascal}Service } from './${nameKebab}.service';
import { Create${namePascal}Dto } from './dto/create-${nameKebab}.dto';
import { Update${namePascal}Dto } from './dto/update-${nameKebab}.dto';

@Controller('${routePath}')
export class ${namePascal}Controller {
  constructor(private readonly ${nameCamel}Service: ${namePascal}Service) {}

  @Get()
  getAll() {
    return this.${nameCamel}Service.findAll();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.${nameCamel}Service.findOne(id);
  }

  @Post()
  createOne(@Body() dto: Create${namePascal}Dto) {
    return this.${nameCamel}Service.create(dto);
  }

  @Put(':id')
  updateOne(@Param('id') id: string, @Body() dto: Update${namePascal}Dto) {
    return this.${nameCamel}Service.update(id, dto);
  }

  @Delete(':id')
  deleteOne(@Param('id') id: string) {
    return this.${nameCamel}Service.remove(id);
  }
}
`;
}

function tplModule(namePascal, nameKebab) {
  return `import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ${namePascal} } from './entities/${nameKebab}.entity';
import { ${namePascal}Controller } from './${nameKebab}.controller';
import { ${namePascal}Service } from './${nameKebab}.service';
import { ${namePascal}Repository } from './${nameKebab}.repository';

@Module({
  imports: [TypeOrmModule.forFeature([${namePascal}])],
  controllers: [${namePascal}Controller],
  providers: [${namePascal}Service, ${namePascal}Repository],
  exports: [${namePascal}Service],
})
export class ${namePascal}Module {}
`;
}

// ------------------------------------------------------------------
// 4. Main
// ------------------------------------------------------------------
function main() {
  const rawName = getResourceName();

  if (!rawName) {
    console.error('❌ Nama resource wajib diisi.');
    console.error('   Contoh: npm run generate -- --name=siswa');
    process.exit(1);
  }

  const namePascal = toPascalCase(rawName);
  const nameCamel = toCamelCase(rawName);
  const nameKebab = toKebabCase(rawName);
  const routePath = nameKebab;

  const baseDir = path.join('src', nameKebab);
  const dtoDir = path.join(baseDir, 'dto');
  const entitiesDir = path.join(baseDir, 'entities');

  if (fs.existsSync(baseDir)) {
    console.error(`❌ Folder "${baseDir}" sudah ada. Hapus dulu atau pakai nama lain.`);
    process.exit(1);
  }

  fs.mkdirSync(dtoDir, { recursive: true });
  fs.mkdirSync(entitiesDir, { recursive: true });

  const files = [
    [path.join(entitiesDir, `${nameKebab}.entity.ts`), tplEntity(namePascal, nameKebab)],
    [path.join(dtoDir, `create-${nameKebab}.dto.ts`), tplCreateDto(namePascal)],
    [path.join(dtoDir, `update-${nameKebab}.dto.ts`), tplUpdateDto(namePascal, nameKebab)],
    [path.join(baseDir, `${nameKebab}.repository.ts`), tplRepository(namePascal, nameCamel, nameKebab)],
    [path.join(baseDir, `${nameKebab}.service.ts`), tplService(namePascal, nameCamel, nameKebab)],
    [path.join(baseDir, `${nameKebab}.controller.ts`), tplController(namePascal, nameCamel, nameKebab, routePath)],
    [path.join(baseDir, `${nameKebab}.module.ts`), tplModule(namePascal, nameKebab)],
  ];

  console.log(`\n🚀 Membuat resource "${namePascal}" di ${baseDir}\n`);
  for (const [filePath, content] of files) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✓ ${filePath}`);
  }

  console.log(`\n✅ Selesai! Jangan lupa:`);
  console.log(`   1. Isi field di entity & DTO sesuai kebutuhan.`);
  console.log(`   2. Daftarkan "${namePascal}Module" ke imports di app.module.ts (atau barrel file modules/index.ts).\n`);
}

main();
