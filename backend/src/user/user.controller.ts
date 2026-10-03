import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, ForbiddenException, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { CreateUserDto } from './create-user.dto';
import { UpdateUserDto } from './update-user.dto';
import { UpdatePasswordDto } from './update-password.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthPayload } from '../auth/interfaces/auth-payload.interface';

const isAdmin = (user: AuthPayload) => user.role === 'admin' || user.role === 'superadmin';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  getAll(@CurrentUser() user: AuthPayload) {
    if (!isAdmin(user)) {
      throw new ForbiddenException('Access denied: Only admin and superadmin can view all users');
    }
    return this.userService.findAll();
  }

  // Account creation by admins (public sign-up goes through /auth/signup)
  @Post()
  createUser(@Body() createUserDto: CreateUserDto, @CurrentUser() user: AuthPayload) {
    if (!isAdmin(user)) {
      throw new ForbiddenException('Access denied: Only admin and superadmin can create users');
    }
    if (createUserDto.role === 'superadmin' && user.role !== 'superadmin') {
      throw new ForbiddenException('Only a superadmin can create superadmin accounts');
    }
    return this.userService.create(createUserDto);
  }

  @Get('test-auth')
  testAuth(@CurrentUser() user: AuthPayload) {
    return { message: 'Authentication successful', user };
  }

  @Get(':id')
  getUser(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthPayload) {
    if (user.id !== id && !isAdmin(user)) {
      throw new ForbiddenException('You can only view your own profile');
    }
    return this.userService.findById(id);
  }

  @Put(':id')
  updateUser(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto, @CurrentUser() user: AuthPayload) {
    // Users can update their own profile; only a superadmin can update others
    if (user.id !== id && user.role !== 'superadmin') {
      throw new ForbiddenException('You can only update your own profile');
    }
    // Changing a role is superadmin-only (resubmitting one's current role is fine)
    if (updateUserDto.role !== undefined && updateUserDto.role !== user.role && user.role !== 'superadmin') {
      throw new ForbiddenException('Only a superadmin can change roles');
    }
    return this.userService.update(id, updateUserDto);
  }

  @Put(':id/password')
  updatePassword(@Param('id', ParseIntPipe) id: number, @Body() updatePasswordDto: UpdatePasswordDto, @CurrentUser() user: AuthPayload) {
    if (user.id !== id) {
      throw new ForbiddenException('You can only update your own password');
    }
    return this.userService.updatePassword(id, updatePasswordDto);
  }

  @Delete(':id')
  deleteUser(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthPayload) {
    if (user.role !== 'superadmin') {
      throw new ForbiddenException('Access denied: Only superadmin can delete users');
    }
    return this.userService.delete(id);
  }
}
