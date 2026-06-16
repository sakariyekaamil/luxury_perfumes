import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '@prisma/client';
import { prisma } from '../config/database';
import { config } from '../config';
import { UnauthorizedError, ValidationError, ForbiddenError } from '../utils/errors';
import { AuditService } from './audit.service';
import { isAdminRole } from '../config/roles';

export class AuthService {
  static async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: UserRole;
  }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ValidationError('Email already registered');

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role && isAdminRole(data.role) ? data.role : UserRole.ADMIN,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        createdAt: true,
      },
    });

    return user;
  }

  static async login(email: string, password: string, ipAddress?: string) {
    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!isAdminRole(user.role)) {
      throw new ForbiddenError('Access restricted to admin users only');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedError('Invalid credentials');

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'] }
    );

    const refreshToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await AuditService.log(user.id, 'LOGIN', 'User', user.id, 'User logged in', ipAddress);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
      },
      accessToken,
      refreshToken,
    };
  }

  static async refresh(refreshToken: string) {
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    if (!tokenRecord.user.isActive) {
      throw new UnauthorizedError('User account is inactive');
    }

    if (!isAdminRole(tokenRecord.user.role)) {
      throw new ForbiddenError('Access restricted to admin users only');
    }

    const accessToken = jwt.sign(
      { id: tokenRecord.user.id, email: tokenRecord.user.email, role: tokenRecord.user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'] }
    );

    return { accessToken };
  }

  static async logout(userId: string, refreshToken?: string, ipAddress?: string) {
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    await AuditService.log(userId, 'LOGOUT', 'User', userId, 'User logged out', ipAddress);
  }

  static async getProfile(userId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) throw new UnauthorizedError('User not found');
    return user;
  }
}
