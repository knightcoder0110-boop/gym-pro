import { type Request, type Response, type NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { prisma } from '../lib/prisma.js';
import { AppError, asyncHandler } from '../middlewares/error.middleware.js';
import type { JwtPayload } from '../middlewares/auth.middleware.js';

const generateTokens = (payload: JwtPayload) => {
  const accessToken = jwt.sign(payload, config.jwt.secret as jwt.Secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
  
  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret as jwt.Secret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as jwt.SignOptions);
  
  return { accessToken, refreshToken };
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, organizationId, role } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError('User already exists', 400, 'USER_EXISTS');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      organizationId,
      role: role || 'STAFF',
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      organizationId: true,
    },
  });

  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
  };

  const { accessToken, refreshToken } = generateTokens(payload);

  res.status(201).json({
    success: true,
    data: {
      user,
      accessToken,
      refreshToken,
    },
    message: 'User registered successfully',
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
        },
      },
    },
  });

  if (!user || !user.isActive) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
  };

  const { accessToken, refreshToken } = generateTokens(payload);

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        organization: user.organization,
      },
      accessToken,
      refreshToken,
    },
  });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatar: true,
      role: true,
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
        },
      },
      branch: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  res.json({
    success: true,
    data: user,
  });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw new AppError('Refresh token required', 400, 'TOKEN_REQUIRED');
  }

  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new AppError('User not found', 401, 'UNAUTHORIZED');
    }

    const payload: JwtPayload = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      organizationId: decoded.organizationId,
    };

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(payload);

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch {
    throw new AppError('Invalid refresh token', 401, 'INVALID_TOKEN');
  }
});
