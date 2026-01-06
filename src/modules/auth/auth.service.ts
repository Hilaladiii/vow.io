import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as argon from 'argon2';
import { JwtService } from '@nestjs/jwt';
@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login({ email, password }: LoginDto) {
    const user = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) throw new BadRequestException('User not registered yet!');

    const isPasswordValid = await argon.verify(user.password, password);

    if (!isPasswordValid)
      throw new BadRequestException('Email or Password is incorrect');

    const token = this.jwtService.sign({
      sub: user.id,
      username: user.username,
    });

    return token;
  }

  async getMe(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        username: true,
      },
    });

    if (!user) throw new NotFoundException('User not found!');

    return user;
  }
}
