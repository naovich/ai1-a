import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './create-user.dto';
import { UpdateUserDto } from './update-user.dto';

@Injectable()
export class UserService {
  private users = [];

  async findAll() {
    return this.users;
  }

  async findOne(id: string) {
    return this.users.find((user) => user.id === id);
  }

  async create(userData: CreateUserDto) {
    const newUser = {
      id: Date.now().toString(),
      ...userData,
    };
    this.users.push(newUser);
    return newUser;
  }

  async update(id: string, userData: UpdateUserDto) {
    const userIndex = this.users.findIndex((user) => user.id === id);
    if (userIndex >= 0) {
      this.users[userIndex] = { ...this.users[userIndex], ...userData };
      return this.users[userIndex];
    }
    return null;
  }

  async delete(id: string) {
    const userIndex = this.users.findIndex((user) => user.id === id);
    if (userIndex >= 0) {
      const user = this.users[userIndex];
      this.users.splice(userIndex, 1);
      return user;
    }
    return null;
  }
}
