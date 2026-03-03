import { getServerSession } from 'next-auth';
import { and, eq } from 'drizzle-orm';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/lib/db';
import { userCompanyAccess } from '@/lib/db/schema';

export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.tenantId) {
    throw new Error('UNAUTHORIZED');
  }
  return session.user;
}

export async function assertCompanyAccess(userId: string, tenantId: string, companyId: string) {
  const access = await db.query.userCompanyAccess.findFirst({
    where: and(
      eq(userCompanyAccess.userId, userId),
      eq(userCompanyAccess.tenantId, tenantId),
      eq(userCompanyAccess.companyId, companyId),
    ),
  });

  if (!access) {
    throw new Error('FORBIDDEN');
  }
}
