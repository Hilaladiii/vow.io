import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';
import { Auth } from 'src/commons/decorators/auth.decorator';
import { Message } from 'src/commons/decorators/message.decorator';
import { GetCurrentUser } from 'src/commons/decorators/get-current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Message('Successfully sign in to your account')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = await this.authService.login(loginDto);
    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 20 * 60 * 60 * 1000,
    });

    return true;
  }

  @Post('logout')
  @Auth()
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });

    return true;
  }

  @Get('me')
  @Auth()
  async getMe(@GetCurrentUser('sub') userId: string) {
    return await this.authService.getMe(userId);
  }
}
