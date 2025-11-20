import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AttachmentSchema } from '@/lib/validators/upload';
import { ensureRole } from '@/lib/authz';
import { rateLimit, clientIpKey } from '@/lib/rate-limit';
import { logActivity } from '@/lib/activity';

export async function POST(req: NextRequest) {
  const authz = await ensureRole(['ADMIN', 'PROCUREMENT_MANAGER', 'SUPPLY_MANAGER', 'BUDGET_MANAGER', 'ACCOUNTING_MANAGER', 'CASHIER_MANAGER', 'BAC_SECRETARIAT', 'TWG_MEMBER'] as any);
  if (!authz.ok) return NextResponse.json({ error: 'Forbidden' }, { status: authz.status });
  const rl = await rateLimit(req, clientIpKey(req, 'attachments_create'));
  if (!rl.ok) return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
  const json = await req.json();
  const parsed = AttachmentSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const created = await prisma.attachment.create({ data: parsed.data });
  try {
    await logActivity({ caseId: created.caseId, action: 'attachment_uploaded', payload: { id: created.id, type: created.type, url: created.url } });
  } catch {}
  return NextResponse.json(created, { status: 201 });
}




