import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

const credentialsEnabled = (process.env.AUTH_CREDENTIALS_ENABLED ?? 'true') === 'true';

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  providers: [
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GitHub({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(credentialsEnabled
      ? [
          Credentials({
            name: 'Credentials',
            credentials: {
              email: { label: 'Email', type: 'email' },
              password: { label: 'Password', type: 'password' },
            },
            async authorize(creds) {
              const email = creds?.email?.toLowerCase().trim();
              const password = creds?.password;
              if (!email || !password) return null;

              const user = await prisma.user.findUnique({ where: { email } });
              if (!user?.passwordHash) return null;

              const ok = await bcrypt.compare(password, user.passwordHash);
              if (!ok) return null;
              return { id: user.id, email: user.email };
            },
          }),
        ]
      : []),
  ],
  pages: {
    signIn: '/signin',
  },
});

export { handler as GET, handler as POST };
