import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';
import { Auth } from 'src/commons/decorators/auth.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
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
}
