import { NextAuthOptions } from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

const credentialsEnabled = (process.env.AUTH_CREDENTIALS_ENABLED ?? 'true') === 'true';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: 'jwt' },
  providers: [
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [GitHub({ clientId: process.env.GITHUB_CLIENT_ID, clientSecret: process.env.GITHUB_CLIENT_SECRET })]
      : []),
    ...(credentialsEnabled
      ? [Credentials({
          name: 'Credentials',
          credentials: {
            email: { label: 'Email', type: 'email' },
            password: { label: 'Password', type: 'password' },
          },
          async authorize(creds) {
            const email = (creds?.email as string | undefined)?.toLowerCase().trim();
            const password = creds?.password as string | undefined;
            if (!email || !password) return null;
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user?.passwordHash) return null;
            const ok = await bcrypt.compare(password, user.passwordHash);
            if (!ok) return null;
            return { id: user.id, email: user.email, name: user.name ?? undefined };
          },
        })]
      : []),
  ],
  pages: { signIn: '/signin' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.uid = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.uid) {
        (session.user as any).id = token.uid;
      }
      return session;
    },
  },
};
