import { BadRequestException, Injectable } from '@nestjs/common';
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

    const isPasswordValid = argon.verify(user.password, password);

    if (!isPasswordValid)
      throw new BadRequestException('Email or Password is incorrect');

    const token = this.jwtService.sign({
      sub: user.id,
    });

    return token;
  }
}
