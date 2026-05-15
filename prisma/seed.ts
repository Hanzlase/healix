import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const systemEmail = 'system@healix.local';
  const systemName = 'Healix System';
  const password = 'healix_system_password'; // Not really used but good to have

  const existing = await prisma.user.findUnique({
    where: { email: systemEmail },
  });

  if (!existing) {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email: systemEmail,
        name: systemName,
        passwordHash,
      },
    });
    console.log('Created system user:', systemEmail);
  } else {
    console.log('System user already exists.');
  }

  // Add a test repository for the system user if needed
  const sysUser = await prisma.user.findUnique({ where: { email: systemEmail } });
  if (sysUser) {
    const repoName = 'healix-demo';
    const existingRepo = await prisma.repository.findUnique({
      where: { userId_repoName: { userId: sysUser.id, repoName } },
    });

    if (!existingRepo) {
      await prisma.repository.create({
        data: {
          userId: sysUser.id,
          repoName,
          repoOwner: 'hanzlase',
          autoPrEnabled: true,
        },
      });
      console.log('Created demo repository:', repoName);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // In Prisma 7, we don't necessarily need to disconnect if the process is ending
    // but it's good practice.
  });
