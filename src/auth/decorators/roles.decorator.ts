// src/auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => {
    console.log('@RRRRRoles',roles);
    
    return SetMetadata('role', roles)
};