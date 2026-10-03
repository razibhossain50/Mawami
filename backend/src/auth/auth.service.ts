import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../user/user.entity';
import { LoginDto } from './dto/login.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { CreateUserDto } from '../user/create-user.dto';
import type { AuthPayload } from './interfaces/auth-payload.interface';

interface GoogleUser {
  googleId: string;
  email: string;
  fullName: string;
  profilePicture?: string;
  accessToken: string;
  refreshToken?: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private config: ConfigService
  ) { }

  async signup(createUserDto: CreateUserDto) {
    const { fullName, email, password, confirmPassword } = createUserDto;

    if (password !== confirmPassword) {
      throw new BadRequestException('Password and confirm password do not match');
    }

    // Normalize email to lowercase for consistency
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const userExists = await this.usersRepository.findOne({ where: { email: normalizedEmail } });
    if (userExists) {
      throw new BadRequestException('An account with this email already exists. Please use a different email or try logging in.');
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = this.usersRepository.create({
        fullName: fullName?.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: 'user'
      });

      const savedUser = await this.usersRepository.save(user);

      // Generate JWT token for immediate login after signup
      const payload = { id: savedUser.id, email: savedUser.email, role: savedUser.role };

      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: savedUser.id,
          fullName: savedUser.fullName,
          email: savedUser.email,
          role: savedUser.role
        }
      };
    } catch (error) {
      // Handle database-level unique constraint violations
      if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
        throw new BadRequestException('An account with this email already exists. Please use a different email or try logging in.');
      }
      
      // Re-throw other errors
      throw error;
    }
  }

  private findByEmailWithPassword(email: string) {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async validateUser(loginDto: LoginDto): Promise<AuthPayload> {
    const normalizedEmail = loginDto.email.toLowerCase().trim();
    const user = await this.findByEmailWithPassword(normalizedEmail);

    if (!user) {
      throw new UnauthorizedException('No account found with this email. Please sign up first.');
    }

    if (!user.password) {
      throw new UnauthorizedException('This account was created with Google. Please use Google Sign-In.');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password. Please check your password and try again.');
    }

    return {
      id: user.id,
      email: user.email || '',
      role: user.role
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto);
    const payload = { id: user.id, email: user.email, role: user.role };

    const fullUser = await this.usersRepository.findOne({ where: { id: user.id } });

    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        fullName: fullUser?.fullName || null,
        email: user.email,
        role: user.role
      }
    };
  }

  // Admin authentication methods (email-based)
  async validateAdminUser(adminLoginDto: AdminLoginDto): Promise<AuthPayload> {
    const normalizedEmail = adminLoginDto.email.toLowerCase().trim();
    const user = await this.findByEmailWithPassword(normalizedEmail);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user has admin or superadmin role
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      throw new UnauthorizedException('Access denied. Admin privileges required.');
    }

    if (!user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(adminLoginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      id: user.id,
      email: user.email || '',
      role: user.role
    };
  }

  async adminLogin(adminLoginDto: AdminLoginDto) {
    const user = await this.validateAdminUser(adminLoginDto);
    const payload = { id: user.id, email: user.email, role: user.role };

    const fullUser = await this.usersRepository.findOne({ where: { id: user.id } });

    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        fullName: fullUser?.fullName || null,
        email: fullUser?.email || null,
        role: user.role
      }
    };
  }

  async validateGoogleUser(googleUser: GoogleUser): Promise<AuthPayload> {
    const normalizedEmail = googleUser.email.toLowerCase().trim();
    
    let user = await this.usersRepository.findOne({ 
      where: [
        { email: normalizedEmail },
        { googleId: googleUser.googleId }
      ]
    });

    if (user) {
      // Update existing user with Google ID if not present
      if (!user.googleId) {
        user.googleId = googleUser.googleId;
        await this.usersRepository.save(user);
      }
    } else {
      try {
        // Create new user from Google profile
        user = this.usersRepository.create({
          email: normalizedEmail,
          fullName: googleUser.fullName?.trim(),
          googleId: googleUser.googleId,
          role: 'user',
          // No password needed for Google users
          password: undefined,
          profilePicture: googleUser.profilePicture
        });

        user = await this.usersRepository.save(user);
      } catch (error) {
        // Handle case where email might already exist (race condition)
        if (error.code === '23505' || error.message?.includes('duplicate key')) {
          // Try to find the existing user and link Google ID
          const existingUser = await this.usersRepository.findOne({ where: { email: normalizedEmail } });
          if (existingUser) {
            existingUser.googleId = googleUser.googleId;
            if (!existingUser.profilePicture && googleUser.profilePicture) {
              existingUser.profilePicture = googleUser.profilePicture;
            }
            user = await this.usersRepository.save(existingUser);
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }
    }

    return {
      id: user.id,
      email: user.email || '',
      role: user.role
    };
  }

  async googleLogin(user: AuthPayload) {
    const payload = { id: user.id, email: user.email, role: user.role };
    const fullUser = await this.usersRepository.findOne({ where: { id: user.id } });

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        fullName: fullUser?.fullName || null,
        email: user.email,
        role: user.role
      }
    };
  }

  async createSuperAdmin() {
    const email = this.config.get<string>('SUPERADMIN_EMAIL')?.toLowerCase().trim();
    const password = this.config.get<string>('SUPERADMIN_PASSWORD');
    if (!email || !password) {
      console.log('SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD not set; skipping superadmin bootstrap');
      return;
    }

    try {
      // Only bootstrap a missing account; never overwrite an existing password
      const existing = await this.usersRepository.findOne({ where: { email } });
      if (existing) {
        return;
      }

      const admin = this.usersRepository.create({
        email,
        password: await bcrypt.hash(password, 10),
        role: 'superadmin',
        fullName: this.config.get<string>('SUPERADMIN_NAME') || 'Super Admin',
      });
      await this.usersRepository.save(admin);
      console.log(`Superadmin created: ${email}`);
    } catch (error) {
      console.error('Error in createSuperAdmin:', error.message);
    }
  }

}
