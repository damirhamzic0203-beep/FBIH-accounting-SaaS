import Link from 'next/link';
import { redirect } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { requireUser } from '@/lib/auth/access';
import { db } from '@/lib/db';
import { companies, userCompanyAccess } from '@/lib/db/schema';

export default async function DashboardPage() {
  try {
    const user = await requireUser();

    const accessibleCompanies = await db
      .select({ id: companies.id, name: companies.name, taxNumber: companies.taxNumber })
      .from(userCompanyAccess)
      .innerJoin(companies, eq(companies.id, userCompanyAccess.companyId))
      .where(and(eq(userCompanyAccess.userId, user.id), eq(userCompanyAccess.tenantId, user.tenantId)));

    return (
      <section>
        <h1 className="mb-4 text-2xl font-semibold">Dashboard</h1>
        <ul className="space-y-2">
          {accessibleCompanies.map((company) => (
            <li key={company.id} className="rounded bg-white p-4 shadow">
              <Link href={`/companies/${company.id}`} className="font-medium text-blue-600">
                {company.name}
              </Link>
              <p className="text-sm text-slate-600">PDV: {company.taxNumber}</p>
            </li>
          ))}
        </ul>
      </section>
    );
  } catch {
    redirect('/sign-in');
  }
}
