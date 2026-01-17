import { type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { AppError, asyncHandler } from '../middlewares/error.middleware.js';

// Update User Profile
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { firstName, lastName, phone, avatar } = req.body;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName,
      lastName,
      phone,
      avatar,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatar: true,
      role: true,
    },
  });

  res.json({
    success: true,
    data: updatedUser,
    message: 'Profile updated successfully',
  });
});

// Update Organization Settings (Admin only)
export const updateOrganization = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = req.user!;
  const {
    name,
    email,
    phone,
    website,
    address,
    city,
    state,
    country,
    timezone,
    currency,
    logo,
  } = req.body;

  // Check if user has permission (Admin or Super Admin)
  // This could also be a middleware, but simple check here works
  if (req.user!.role !== 'ADMIN' && req.user!.role !== 'SUPER_ADMIN') {
    throw new AppError('Not authorized to update organization settings', 403, 'FORBIDDEN');
  }

  const updatedOrg = await prisma.organization.update({
    where: { id: organizationId },
    data: {
      name,
      email,
      phone,
      website,
      address,
      city,
      state,
      country,
      timezone,
      currency,
      logo,
    },
  });

  res.json({
    success: true,
    data: updatedOrg,
    message: 'Organization settings updated successfully',
  });
});

// Change Password
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { currentPassword, newPassword } = req.body;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('Invalid current password', 400, 'INVALID_PASSWORD');
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
    },
  });

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
});
