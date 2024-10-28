import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { CreateUserDto } from './create-user.dto';
import { UpdateUserDto } from './update-user.dto';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getAllUsers() {
    return this.userService.findAll();
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Post()
  async createUser(@Body() userData: CreateUserDto) {
    return this.userService.create(userData);
  }

  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() userData: UpdateUserDto) {
    return this.userService.update(id, userData);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return this.userService.delete(id);
  }
}
