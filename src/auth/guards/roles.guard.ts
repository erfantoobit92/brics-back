// src/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('role', context.getHandler());
    console.log('!!!!!ROLED',requiredRoles);
    
    if (!requiredRoles) {
      return true; // If no roles are required, allow access
    }

        const request = context.switchToHttp().getRequest();
    const user = request.user; 

       // --- DEBUGGING LOGS ---
    console.log('--- RolesGuard Debug ---');
    console.log('Required Roles:', requiredRoles);
    console.log('User object from JWT:', user);
    console.log('User role:', user?.role);

    // user object comes from the decoded JWT
    return requiredRoles.some((role) => user.role?.includes(role));
  }
}