import { notFound, redirect } from 'next/navigation';
import { and, asc, eq } from 'drizzle-orm';
import { assertCompanyAccess, requireUser } from '@/lib/auth/access';
import { db } from '@/lib/db';
import { companies, partners, periods } from '@/lib/db/schema';

type Props = {
  params: { id: string };
};

export default async function CompanyPage({ params }: Props) {
  const companyId = params.id;

  try {
    const user = await requireUser();
    await assertCompanyAccess(user.id, user.tenantId, companyId);

    const company = await db.query.companies.findFirst({
      where: and(eq(companies.id, companyId), eq(companies.tenantId, user.tenantId)),
    });

    if (!company) notFound();

    const companyPartners = await db.query.partners.findMany({
      where: and(eq(partners.companyId, companyId), eq(partners.tenantId, user.tenantId)),
      orderBy: [asc(partners.name)],
    });

    const companyPeriods = await db.query.periods.findMany({
      where: and(eq(periods.companyId, companyId), eq(periods.tenantId, user.tenantId)),
      orderBy: [asc(periods.year), asc(periods.month)],
    });

    return (
      <section className="space-y-8">
        <header>
          <h1 className="text-2xl font-semibold">{company.name}</h1>
          <p className="text-sm text-slate-600">PDV: {company.taxNumber}</p>
        </header>

        <section className="rounded bg-white p-4 shadow">
          <h2 className="mb-3 text-lg font-semibold">Partneri</h2>
          <ul className="mb-4 list-disc pl-5">
            {companyPartners.map((partner) => (
              <li key={partner.id}>
                {partner.name} ({partner.type})
              </li>
            ))}
          </ul>
          <form method="POST" action="/api/partners" className="grid gap-2 md:grid-cols-4">
            <input type="hidden" name="companyId" value={companyId} />
            <input name="name" placeholder="Naziv partnera" required className="md:col-span-2" />
            <input name="type" placeholder="Tip (kupac/dobavljač)" required />
            <button type="submit">Dodaj partnera</button>
          </form>
        </section>

        <section className="rounded bg-white p-4 shadow">
          <h2 className="mb-3 text-lg font-semibold">Obračunski periodi</h2>
          <ul className="mb-4 space-y-2">
            {companyPeriods.map((period) => (
              <li key={period.id} className="flex items-center justify-between rounded border p-2">
                <span>
                  {period.month}/{period.year} - {period.status}
                </span>
                {period.status === 'OPEN' ? (
                  <form method="POST" action="/api/periods/close">
                    <input type="hidden" name="companyId" value={companyId} />
                    <input type="hidden" name="periodId" value={period.id} />
                    <button type="submit">Close</button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
          <form method="POST" action="/api/periods" className="grid gap-2 md:grid-cols-4">
            <input type="hidden" name="companyId" value={companyId} />
            <input name="year" type="number" min={2000} max={2100} required placeholder="Godina" />
            <input name="month" type="number" min={1} max={12} required placeholder="Mjesec" />
            <button type="submit">Kreiraj period</button>
          </form>
        </section>
      </section>
    );
  } catch {
    redirect('/sign-in');
  }
}
