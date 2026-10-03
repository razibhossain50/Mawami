import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';
import { CreateUserDto } from './create-user.dto';
import { UpdateUserDto } from './update-user.dto';
import { UpdatePasswordDto } from './update-password.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  // password is select: false on the entity, so it is never part of these results
  findAll() {
    return this.userRepository.find();
  }

  async create(createUserDto: CreateUserDto) {
    const { fullName, email, password, confirmPassword, role } = createUserDto;

    if (password !== confirmPassword) {
      throw new BadRequestException('Password and confirm password do not match');
    }

    // Normalize email to lowercase for consistency
    const normalizedEmail = email.toLowerCase().trim();

    const userExists = await this.userRepository.findOne({ where: { email: normalizedEmail } });
    if (userExists) {
      throw new BadRequestException('An account with this email already exists. Please use a different email or try logging in.');
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = this.userRepository.create({
        fullName: fullName?.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: (role as 'user' | 'admin' | 'superadmin') || 'user' // Use provided role or default to 'user'
      });

      const savedUser = await this.userRepository.save(user);

      // The saved entity still holds the hash we just set; strip it from the response
      const { password: _password, ...userWithoutPassword } = savedUser;
      return userWithoutPassword;
    } catch (error) {
      // Handle database-level unique constraint violations
      if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
        throw new BadRequestException('An account with this email already exists. Please use a different email or try logging in.');
      }
      
      // Re-throw other errors
      throw error;
    }
  }

  async findById(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if email is being updated and if it's already in use by another user
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const normalizedEmail = updateUserDto.email.toLowerCase().trim();
      const existingUser = await this.userRepository.findOne({
        where: { email: normalizedEmail }
      });
      if (existingUser && existingUser.id !== id) {
        throw new BadRequestException('An account with this email already exists. Please use a different email.');
      }
      // Update the DTO with normalized email
      updateUserDto.email = normalizedEmail;
    }

    // Normalize fullName if provided
    if (updateUserDto.fullName) {
      updateUserDto.fullName = updateUserDto.fullName.trim();
    }

    // Update user fields
    Object.assign(user, updateUserDto);
    
    try {
      return await this.userRepository.save(user);
    } catch (error) {
      // Handle database-level unique constraint violations
      if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
        throw new BadRequestException('An account with this email already exists. Please use a different email.');
      }
      
      // Re-throw other errors
      throw error;
    }
  }

  async updatePassword(id: number, updatePasswordDto: UpdatePasswordDto) {
    const { currentPassword, newPassword, confirmPassword } = updatePasswordDto;

    // Check if new password and confirm password match
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('New password and confirm password do not match');
    }

    // Find the user with password (excluded from default selects)
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id })
      .getOne();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.password) {
      throw new BadRequestException('This account uses Google Sign-In and has no password to change');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the password
    user.password = hashedNewPassword;
    await this.userRepository.save(user);

    return { message: 'Password updated successfully' };
  }

  async delete(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent deletion of superadmin accounts (optional safety check)
    if (user.role === 'superadmin') {
      throw new BadRequestException('Cannot delete superadmin accounts');
    }

    // Check if user has biodata and handle it
    const biodataRepository = this.userRepository.manager.getRepository('Biodata');
    const userBiodata = await biodataRepository.find({ where: { userId: id } });
    
    if (userBiodata.length > 0) {
      console.log(`User ${id} has ${userBiodata.length} biodata record(s). Deleting biodata first...`);
      // Delete all biodata records for this user first
      await biodataRepository.delete({ userId: id });
    }

    await this.userRepository.remove(user);
    return { 
      message: 'User deleted successfully', 
      deletedUser: { id: user.id, email: user.email, fullName: user.fullName },
      deletedBiodataCount: userBiodata.length
    };
  }
}
