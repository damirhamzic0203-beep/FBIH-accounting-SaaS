import { sql } from 'drizzle-orm';
import { cliDb, cliPool } from '@/lib/db/cli';

async function main() {
  await cliDb.execute(sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

  await cliDb.execute(sql`
    DO $$ BEGIN
      CREATE TYPE user_role AS ENUM ('OWNER', 'BOOKKEEPER', 'CLIENT');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await cliDb.execute(sql`
    DO $$ BEGIN
      CREATE TYPE period_status AS ENUM ('OPEN', 'CLOSED');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await cliDb.execute(sql`
    CREATE TABLE IF NOT EXISTS tenants (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name varchar(255) NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS companies (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      name varchar(255) NOT NULL,
      tax_number varchar(50) NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS companies_tenant_id_idx ON companies(tenant_id);

    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      email varchar(255) NOT NULL UNIQUE,
      name varchar(255) NOT NULL,
      password_hash varchar(255) NOT NULL,
      role user_role NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS users_tenant_id_idx ON users(tenant_id);

    CREATE TABLE IF NOT EXISTS user_company_access (
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY(user_id, company_id)
    );

    CREATE INDEX IF NOT EXISTS uca_tenant_id_idx ON user_company_access(tenant_id);
    CREATE INDEX IF NOT EXISTS uca_company_id_idx ON user_company_access(company_id);

    CREATE TABLE IF NOT EXISTS partners (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      name varchar(255) NOT NULL,
      type varchar(100) NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS partners_company_id_idx ON partners(company_id);
    CREATE INDEX IF NOT EXISTS partners_tenant_id_idx ON partners(tenant_id);

    CREATE TABLE IF NOT EXISTS periods (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      year int NOT NULL,
      month int NOT NULL,
      status period_status NOT NULL DEFAULT 'OPEN',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS periods_company_id_idx ON periods(company_id);
    CREATE INDEX IF NOT EXISTS periods_tenant_id_idx ON periods(tenant_id);
    CREATE UNIQUE INDEX IF NOT EXISTS periods_company_year_month_uniq ON periods(company_id, year, month);
  `);

  console.log('Migration completed.');
}

main()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await cliPool.end();
  });
