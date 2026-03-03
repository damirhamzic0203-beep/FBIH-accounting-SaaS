import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { assertCompanyAccess, requireUser } from '@/lib/auth/access';
import { db } from '@/lib/db';
import { periods } from '@/lib/db/schema';
import { periodCloseSchema } from '@/lib/validation/schemas';

export async function POST(request: Request) {
  const user = await requireUser();
  const form = await request.formData();

  const parsed = periodCloseSchema.safeParse({
    companyId: form.get('companyId'),
    periodId: form.get('periodId'),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { companyId, periodId } = parsed.data;
  await assertCompanyAccess(user.id, user.tenantId, companyId);

  await db
    .update(periods)
    .set({ status: 'CLOSED', updatedAt: new Date() })
    .where(and(eq(periods.id, periodId), eq(periods.companyId, companyId), eq(periods.tenantId, user.tenantId)));

  return NextResponse.redirect(new URL(`/companies/${companyId}`, request.url), { status: 303 });
}
