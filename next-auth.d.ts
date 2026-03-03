import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string;
      tenantId: string;
      role: 'OWNER' | 'BOOKKEEPER' | 'CLIENT';
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    tenantId?: string;
    role?: 'OWNER' | 'BOOKKEEPER' | 'CLIENT';
  }
}
