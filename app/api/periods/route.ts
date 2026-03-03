import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { assertCompanyAccess, requireUser } from '@/lib/auth/access';
import { db } from '@/lib/db';
import { periods } from '@/lib/db/schema';
import { periodCreateSchema } from '@/lib/validation/schemas';

export async function POST(request: Request) {
  const user = await requireUser();
  const form = await request.formData();

  const parsed = periodCreateSchema.safeParse({
    companyId: form.get('companyId'),
    year: form.get('year'),
    month: form.get('month'),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { companyId, year, month } = parsed.data;
  await assertCompanyAccess(user.id, user.tenantId, companyId);

  const existing = await db.query.periods.findFirst({
    where: and(eq(periods.companyId, companyId), eq(periods.year, year), eq(periods.month, month)),
  });

  if (!existing) {
    await db.insert(periods).values({
      companyId,
      tenantId: user.tenantId,
      year,
      month,
      status: 'OPEN',
    });
  }

  return NextResponse.redirect(new URL(`/companies/${companyId}`, request.url), { status: 303 });
}
