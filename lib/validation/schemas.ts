import { z } from 'zod';

export const partnerCreateSchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().min(2).max(255),
  type: z.string().min(2).max(100),
});

export const periodCreateSchema = z.object({
  companyId: z.string().uuid(),
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export const periodCloseSchema = z.object({
  companyId: z.string().uuid(),
  periodId: z.string().uuid(),
});
