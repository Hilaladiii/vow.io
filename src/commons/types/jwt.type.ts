import { Role } from './role.type';

export type JwtClaims = {
  sub: string;
  username: string;
  roles: Role[];
};
