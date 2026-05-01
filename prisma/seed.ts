import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateSlug } from '../src/lib/performance';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.DEFAULT_ADMIN_EMAIL;
  const password = process.env.DEFAULT_ADMIN_PASSWORD;
  const name = process.env.DEFAULT_ADMIN_NAME || 'ALTFaze Admin';

  if (!email || !password) {
    throw new Error('DEFAULT_ADMIN_EMAIL and DEFAULT_ADMIN_PASSWORD are required');
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const slug = generateSlug(name);

  await prisma.user.upsert({
    where: { email },
    update: {
      name,
      slug,
      role: 'ADMIN',
      password: hashedPassword,
      image: null,
      bio: 'Default platform administrator',
    },
    create: {
      email,
      name,
      slug,
      role: 'ADMIN',
      password: hashedPassword,
      bio: 'Default platform administrator',
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
