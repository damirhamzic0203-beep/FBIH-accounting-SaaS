import { NextResponse } from 'next/server';
import { assertCompanyAccess, requireUser } from '@/lib/auth/access';
import { db } from '@/lib/db';
import { partners } from '@/lib/db/schema';
import { partnerCreateSchema } from '@/lib/validation/schemas';

export async function POST(request: Request) {
  const user = await requireUser();
  const form = await request.formData();

  const parsed = partnerCreateSchema.safeParse({
    companyId: form.get('companyId'),
    name: form.get('name'),
    type: form.get('type'),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { companyId, name, type } = parsed.data;
  await assertCompanyAccess(user.id, user.tenantId, companyId);

  await db.insert(partners).values({
    companyId,
    tenantId: user.tenantId,
    name,
    type,
  });

  return NextResponse.redirect(new URL(`/companies/${companyId}`, request.url), { status: 303 });
}
