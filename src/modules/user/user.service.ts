import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as argon from 'argon2';

@Injectable()
export class UserService {
  constructor(private prismaService: PrismaService) {}

  async register({ email, username, password }: RegisterDto) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { email },
      });

      if (user) throw new BadRequestException('User already exists!');

      const hashedPassword = await argon.hash(password);

      await this.prismaService.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
        },
      });
    } catch (error) {
      throw error;
    }
  }
}
