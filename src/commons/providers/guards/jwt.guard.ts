import { ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  constructor(private jwtService: JwtService) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      const token = request.cookies?.token;

      if (!token) return false;

      const isTokenValid = this.jwtService.verify(token);

      if (!isTokenValid) return false;

      request.user = token;

      return true;
    } catch (error) {
      return false;
    }
  }
}
