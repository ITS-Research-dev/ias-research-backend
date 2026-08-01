import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  getAll() {
    return this.roleService.findAll();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.roleService.findOne(id);
  }

  @Post()
  createOne(@Body() dto: CreateRoleDto) {
    return this.roleService.create(dto);
  }

  @Put(':id')
  updateOne(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.roleService.update(id, dto);
  }

  @Delete(':id')
  deleteOne(@Param('id') id: string) {
    return this.roleService.remove(id);
  }
}
