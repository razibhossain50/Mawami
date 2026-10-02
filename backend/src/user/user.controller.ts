import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { CreateUserDto } from './create-user.dto';
import { UpdateUserDto } from './update-user.dto';
import { UpdatePasswordDto } from './update-password.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Add logging for all requests to this controller
  private logRequest(req: any, endpoint: string) {
    console.log(`\n=== ${endpoint} ===`);
    console.log('Method:', req.method);
    console.log('URL:', req.url);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  getAll(@CurrentUser() user: any) {
    // Allow both admin and superadmin to view all users
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      throw new UnauthorizedException('Access denied: Only admin and superadmin can view all users');
    }
    return this.userService.findAll();
  }

  @Post()
  createUser(@Body() createUserDto: CreateUserDto) {
    console.log('=== POST /api/users ===');
    console.log('Role being set:', createUserDto.role || 'user (default)');
    return this.userService.create(createUserDto);
  }

  @Get('test-auth')
  @UseGuards(AuthGuard('jwt'))
  testAuth(@Req() req: any) {
    console.log('=== Test Auth Endpoint ===');
    console.log('User from JWT:', req.user);
    return { message: 'Authentication successful', user: req.user };
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  getUser(@Param('id') id: string) {
    return this.userService.findById(+id);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Req() req: any) {
    this.logRequest(req, 'PUT /api/users/:id');
    console.log('User from JWT:', req.user);
    console.log('Updating user ID:', id);
    console.log('Update data:', updateUserDto);

    // Ensure user can only update their own profile (unless they're superadmin)
    if (req.user.id !== +id && req.user.role !== 'superadmin') {
      throw new UnauthorizedException('You can only update your own profile');
    }
    return this.userService.update(+id, updateUserDto);
  }

  @Put(':id/password')
  @UseGuards(AuthGuard('jwt'))
  updatePassword(@Param('id') id: string, @Body() updatePasswordDto: UpdatePasswordDto, @Req() req: any) {
    this.logRequest(req, 'PUT /api/users/:id/password');
    console.log('User from JWT:', req.user);
    console.log('Updating password for user ID:', id);

    // Ensure user can only update their own password
    if (req.user.id !== +id) {
      throw new UnauthorizedException('You can only update your own password');
    }

    return this.userService.updatePassword(+id, updatePasswordDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  deleteUser(@Param('id') id: string, @CurrentUser() user: any) {
    console.log('=== DELETE /api/users/:id ===');
    console.log('User from JWT:', user);
    console.log('Deleting user ID:', id);

    // Only superadmin can delete users
    if (user.role !== 'superadmin') {
      throw new UnauthorizedException('Access denied: Only superadmin can delete users');
    }

    return this.userService.delete(+id);
  }
}
