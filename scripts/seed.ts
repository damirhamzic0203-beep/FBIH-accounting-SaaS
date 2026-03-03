import { hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { cliDb, cliPool } from '@/lib/db/cli';
import { companies, tenants, userCompanyAccess, users } from '@/lib/db/schema';

async function main() {
  const existingUsers = await cliDb.query.users.findMany({
    where: eq(users.email, 'owner@demo.ba'),
  });

  if (existingUsers.length > 0) {
    console.log('Seed already applied.');
    return;
  }

  const [tenant] = await cliDb
    .insert(tenants)
    .values({ name: 'Demo tenant' })
    .returning({ id: tenants.id });

  const createdCompanies = await cliDb
    .insert(companies)
    .values([
      { tenantId: tenant.id, name: 'Alfa d.o.o.', taxNumber: '4200000010001' },
      { tenantId: tenant.id, name: 'Beta d.o.o.', taxNumber: '4200000010002' },
    ])
    .returning({ id: companies.id, name: companies.name });

  const passwordHash = await hash('Password123!', 10);

  const createdUsers = await cliDb
    .insert(users)
    .values([
      {
        tenantId: tenant.id,
        email: 'owner@demo.ba',
        name: 'Owner User',
        passwordHash,
        role: 'OWNER',
      },
      {
        tenantId: tenant.id,
        email: 'bookkeeper@demo.ba',
        name: 'Bookkeeper User',
        passwordHash,
        role: 'BOOKKEEPER',
      },
      {
        tenantId: tenant.id,
        email: 'client@demo.ba',
        name: 'Client User',
        passwordHash,
        role: 'CLIENT',
      },
    ])
    .returning({ id: users.id, email: users.email });

  const owner = createdUsers.find((user) => user.email === 'owner@demo.ba')!;
  const bookkeeper = createdUsers.find((user) => user.email === 'bookkeeper@demo.ba')!;
  const client = createdUsers.find((user) => user.email === 'client@demo.ba')!;

  const alfa = createdCompanies.find((company) => company.name === 'Alfa d.o.o.')!;
  const beta = createdCompanies.find((company) => company.name === 'Beta d.o.o.')!;

  await cliDb.insert(userCompanyAccess).values([
    { userId: owner.id, companyId: alfa.id, tenantId: tenant.id },
    { userId: owner.id, companyId: beta.id, tenantId: tenant.id },
    { userId: bookkeeper.id, companyId: alfa.id, tenantId: tenant.id },
    { userId: client.id, companyId: beta.id, tenantId: tenant.id },
  ]);

  console.log('Seed completed.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await cliPool.end();
  });
