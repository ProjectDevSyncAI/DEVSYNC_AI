/**
 * Operator Provisioning Script: set-platform-role.ts
 *
 * Controlled server-side procedure to assign platform-level roles (USER, ADMIN)
 * to an existing user. Atomically increments tokenVersion to invalidate
 * all previously issued JWTs immediately upon role transition.
 *
 * Usage:
 *   pnpm exec tsx scripts/set-platform-role.ts <email-or-username> <USER|ADMIN>
 */

import { PrismaClient } from '../apps/api/src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: pnpm exec tsx scripts/set-platform-role.ts <email-or-username> <USER|ADMIN>');
    process.exit(1);
  }

  const [identifier, roleInput] = args;
  const targetRole = roleInput.toUpperCase().trim();

  if (targetRole !== 'USER' && targetRole !== 'ADMIN') {
    console.error(`Error: Invalid platform role "${roleInput}". Allowed values: USER, ADMIN`);
    process.exit(1);
  }

  const cleanIdentifier = identifier.trim().toLowerCase();

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: cleanIdentifier },
        { username: identifier.trim() },
      ],
    },
    select: {
      id: true,
      email: true,
      username: true,
      platformRole: true,
      tokenVersion: true,
      status: true,
    },
  });

  if (!user) {
    console.error(`Error: User not found for identifier "${identifier}"`);
    process.exit(1);
  }

  if (user.status === 'DEACTIVATED' || user.status === 'SUSPENDED') {
    console.error(`Error: Cannot change platform role for inactive user (status: ${user.status})`);
    process.exit(1);
  }

  const previousRole = user.platformRole;
  const previousTokenVersion = user.tokenVersion;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      platformRole: targetRole as any,
      tokenVersion: { increment: 1 },
    },
    select: {
      id: true,
      email: true,
      username: true,
      platformRole: true,
      tokenVersion: true,
    },
  });

  console.log('âœ… Platform role updated successfully:');
  console.log(`   User ID:               ${updated.id}`);
  console.log(`   Username:              ${updated.username}`);
  console.log(`   Email:                 ${updated.email}`);
  console.log(`   Previous Role:         ${previousRole}`);
  console.log(`   New Platform Role:     ${updated.platformRole}`);
  console.log(`   Previous TokenVersion: ${previousTokenVersion}`);
  console.log(`   New TokenVersion:      ${updated.tokenVersion} (All prior JWTs invalidated)`);
}

main()
  .catch((e) => {
    console.error('â Œ Error setting platform role:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
