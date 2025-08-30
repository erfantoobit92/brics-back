// src/auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => {
    return SetMetadata('role', roles)
};