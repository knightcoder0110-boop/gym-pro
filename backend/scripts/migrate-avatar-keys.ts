/**
 * Migration Script: Extract S3 keys from legacy presigned URLs
 * 
 * This script migrates existing avatar/logo URLs to S3 keys for
 * credential-independent storage.
 * 
 * Run: npx tsx scripts/migrate-avatar-keys.ts
 */

import { prisma } from '../src/lib/prisma.js';
import { extractS3Key } from '../src/lib/file-url.resolver.js';

async function migrateMembers() {
  console.log('🔄 Migrating member avatars...');
  
  const members = await prisma.member.findMany({
    where: {
      avatar: { not: null },
      avatarKey: null,
    },
    select: { id: true, avatar: true },
  });
  
  console.log(`Found ${members.length} members to migrate`);
  
  let migrated = 0;
  for (const member of members) {
    const key = extractS3Key(member.avatar);
    if (key) {
      await prisma.member.update({
        where: { id: member.id },
        data: { avatarKey: key },
      });
      migrated++;
      console.log(`  ✓ Migrated member ${member.id}: ${key}`);
    } else {
      console.log(`  ⚠ Could not extract key for member ${member.id}: ${member.avatar}`);
    }
  }
  
  console.log(`✅ Migrated ${migrated}/${members.length} member avatars\n`);
}

async function migrateUsers() {
  console.log('🔄 Migrating user avatars...');
  
  const users = await prisma.user.findMany({
    where: {
      avatar: { not: null },
      avatarKey: null,
    },
    select: { id: true, avatar: true },
  });
  
  console.log(`Found ${users.length} users to migrate`);
  
  let migrated = 0;
  for (const user of users) {
    const key = extractS3Key(user.avatar);
    if (key) {
      await prisma.user.update({
        where: { id: user.id },
        data: { avatarKey: key },
      });
      migrated++;
      console.log(`  ✓ Migrated user ${user.id}: ${key}`);
    } else {
      console.log(`  ⚠ Could not extract key for user ${user.id}: ${user.avatar}`);
    }
  }
  
  console.log(`✅ Migrated ${migrated}/${users.length} user avatars\n`);
}

async function migrateOrganizations() {
  console.log('🔄 Migrating organization logos...');
  
  const orgs = await prisma.organization.findMany({
    where: {
      logo: { not: null },
      logoKey: null,
    },
    select: { id: true, logo: true },
  });
  
  console.log(`Found ${orgs.length} organizations to migrate`);
  
  let migrated = 0;
  for (const org of orgs) {
    const key = extractS3Key(org.logo);
    if (key) {
      await prisma.organization.update({
        where: { id: org.id },
        data: { logoKey: key },
      });
      migrated++;
      console.log(`  ✓ Migrated org ${org.id}: ${key}`);
    } else {
      console.log(`  ⚠ Could not extract key for org ${org.id}: ${org.logo}`);
    }
  }
  
  console.log(`✅ Migrated ${migrated}/${orgs.length} organization logos\n`);
}

async function main() {
  console.log('🚀 Starting avatar/logo key migration...\n');
  
  try {
    await migrateMembers();
    await migrateUsers();
    await migrateOrganizations();
    
    console.log('🎉 Migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
