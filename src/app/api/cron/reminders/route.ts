import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/notifications/resend';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const secret = process.env.VERCEL_CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const due = await prisma.reminder.findMany({ where: { sentAt: null, dueAt: { lte: now } } });
  for (const r of due) {
    // Send email (dev no-op if RESEND_API_KEY missing)
    const to = r.type === 'PRE_BID_CONF' || r.type === 'BID_OPENING' ? 'bac@local'
      : r.type === 'DELIVERY_DUE' ? 'supply@local'
      : 'procurement@local';
    await sendEmail({ to, subject: `Reminder: ${r.type} due`, html: `<p>Case ${r.caseId} has a due reminder: <b>${r.type}</b>.</p>` });
    await prisma.reminder.update({ where: { id: r.id }, data: { sentAt: new Date() } });
    await prisma.activityLog.create({ data: { caseId: r.caseId, action: 'reminder_sent', payload: { reminderId: r.id, type: r.type } } });
  }
  return NextResponse.json({ processed: due.length });
}



