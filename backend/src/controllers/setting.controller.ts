import { type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { AppError, asyncHandler } from '../middlewares/error.middleware.js';
import { extractS3Key, getPresignedFileUrl } from '../lib/file-url.resolver.js';
import { uploadService } from '../services/upload.service.js';

// Update User Profile
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { organizationId } = req.user!;
  const { firstName, lastName, phone, avatar } = req.body;

  // Get current user to check for existing avatar
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarKey: true, avatar: true },
  });

  // Prepare update data
  const updateData: any = {
    firstName,
    lastName,
    phone,
    avatar,
  };

  // Extract S3 key from avatar URL for credential-independent storage
  if (avatar) {
    const newAvatarKey = extractS3Key(avatar);
    if (newAvatarKey) {
      updateData.avatarKey = newAvatarKey;

      // Delete old avatar if it's different from the new one
      const oldAvatarKey = currentUser?.avatarKey || extractS3Key(currentUser?.avatar || '');
      if (oldAvatarKey && oldAvatarKey !== newAvatarKey) {
        // Delete asynchronously - don't block the update
        uploadService.deleteFileByKey(oldAvatarKey, organizationId).catch((err) => {
          console.error('[Settings] Failed to delete old avatar:', err);
        });
      }
    }
  } else if (avatar === null || avatar === '') {
    // User is removing their avatar
    updateData.avatarKey = null;
    const oldAvatarKey = currentUser?.avatarKey || extractS3Key(currentUser?.avatar || '');
    if (oldAvatarKey) {
      uploadService.deleteFileByKey(oldAvatarKey, organizationId).catch((err) => {
        console.error('[Settings] Failed to delete old avatar:', err);
      });
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatar: true,
      avatarKey: true,
      role: true,
    },
  });

  // Resolve avatar URL using presigned URL (bucket doesn't allow public access)
  const avatarUrl = await getPresignedFileUrl(updatedUser.avatarKey) || await getPresignedFileUrl(updatedUser.avatar);
  const resolvedUser = {
    ...updatedUser,
    avatar: avatarUrl,
    avatarKey: undefined, // Don't expose internal key
  };

  res.json({
    success: true,
    data: resolvedUser,
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

  // Get current organization to check for existing logo
  const currentOrg = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { logoKey: true, logo: true },
  });

  // Prepare update data
  const updateData: any = {
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
  };

  // Extract S3 key from logo URL for credential-independent storage
  if (logo) {
    const newLogoKey = extractS3Key(logo);
    if (newLogoKey) {
      updateData.logoKey = newLogoKey;

      // Delete old logo if it's different from the new one
      const oldLogoKey = currentOrg?.logoKey || extractS3Key(currentOrg?.logo || '');
      if (oldLogoKey && oldLogoKey !== newLogoKey) {
        // Delete asynchronously - don't block the update
        uploadService.deleteFileByKey(oldLogoKey, organizationId).catch((err) => {
          console.error('[Settings] Failed to delete old logo:', err);
        });
      }
    }
  } else if (logo === null || logo === '') {
    // Organization is removing their logo
    updateData.logoKey = null;
    const oldLogoKey = currentOrg?.logoKey || extractS3Key(currentOrg?.logo || '');
    if (oldLogoKey) {
      uploadService.deleteFileByKey(oldLogoKey, organizationId).catch((err) => {
        console.error('[Settings] Failed to delete old logo:', err);
      });
    }
  }

  const updatedOrg = await prisma.organization.update({
    where: { id: organizationId },
    data: updateData,
  });

  // Resolve logo URL using presigned URL (bucket doesn't allow public access)
  const logoUrl = await getPresignedFileUrl(updatedOrg.logoKey) || await getPresignedFileUrl(updatedOrg.logo);
  const resolvedOrg = {
    ...updatedOrg,
    logo: logoUrl,
    logoKey: undefined, // Don't expose internal key
  };

  res.json({
    success: true,
    data: resolvedOrg,
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
