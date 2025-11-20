import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';
import { ensureRole } from '@/lib/authz';
import { BidSchema } from '@/lib/validators/bid';
import { rateLimit, clientIpKey } from '@/lib/rate-limit';
import { useIdempotencyKey } from '@/lib/idempotency';
import { assertCanTransition } from '@/lib/workflows/procurement';
import type { CaseState, UserRole } from '@/generated/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bids = await prisma.bid.findMany({ where: { caseId: id }, orderBy: { submittedAt: 'asc' } });
  return NextResponse.json(bids);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: caseId } = await params;
  console.log('=== BID API CALLED ===', { caseId, timestamp: new Date().toISOString() });
  
  const authz = await ensureRole(['BAC_SECRETARIAT', 'ADMIN'] as UserRole[]);
  if (!authz.ok) {
    console.error('[BID API] Auth failed:', authz.status);
    return NextResponse.json({ error: 'Forbidden' }, { status: authz.status });
  }
  console.log('[BID API] === REQUEST RECEIVED ===', { caseId, timestamp: new Date().toISOString() });
  
  const json = await req.json();
  console.log('[BID API] Request body:', json);
  
  const parsed = BidSchema.safeParse(json);
  if (!parsed.success) {
    console.error('[BID API] Validation failed:', parsed.error.flatten());
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  
  const rl = await rateLimit(req, clientIpKey(req, 'bid'));
  if (!rl.ok) {
    console.error('[BID API] Rate limited');
    return NextResponse.json({ error: 'Rate limited' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } });
  }
  
  const idemKey = req.headers.get('Idempotency-Key');
  if (idemKey) {
    const idem = await useIdempotencyKey(`bid:${caseId}:${idemKey}`);
    if (!idem.ok) {
      console.error('[BID API] Duplicate request');
      return NextResponse.json({ error: 'Duplicate request' }, { status: 409 });
    }
  }
  
  // Use a transaction to ensure atomicity and prevent race conditions in parallel test execution
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create the bid
      console.log('[BID API] Creating bid...');
      const created = await tx.bid.create({ 
        data: { 
          caseId, 
          bidderName: parsed.data.bidderName, 
          amount: parsed.data.amount, 
          isResponsive: parsed.data.isResponsive ?? true, 
          openedAt: parsed.data.openedAt ? new Date(parsed.data.openedAt) : null 
        } 
      });
      console.log('[BID API] Bid created:', created.id);
      
      // Fetch case within transaction to ensure consistent state
      const existing = await tx.procurementCase.findUnique({ where: { id: caseId } });
      if (!existing) {
        throw new Error('Case not found');
      }
      
      // Check transition (this reads from DB but doesn't modify, so safe in transaction)
      console.log(`[BID API] Checking transition for case ${caseId}, method: ${existing.method}, current state: ${existing.currentState} → BID_SUBMISSION_OPENING`);
      await assertCanTransition(existing, 'BID_SUBMISSION_OPENING' as CaseState);
      
      // Update state within transaction
      console.log(`[BID API] Transition validation passed, updating state...`);
      await tx.procurementCase.update({ 
        where: { id: caseId }, 
        data: { currentState: 'BID_SUBMISSION_OPENING' } 
      });
      
      return created;
    }, {
      timeout: 10000, // 10 second timeout for transaction
    });
    
    // Log activity outside transaction to avoid long-running operations in transaction
    await logActivity({ caseId, action: 'bid_submission_opening', toState: 'BID_SUBMISSION_OPENING' });
    console.log(`[BID API] State updated successfully to BID_SUBMISSION_OPENING`);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error(`[BID API] Failed to create bid or transition state:`, error);
    console.error(`[BID API] Error details:`, {
      message: (error as Error).message,
      stack: (error as Error).stack,
      name: (error as Error).name,
    });
    
    // Transaction will automatically rollback, so bid won't exist if transaction failed
    // But check if case exists to provide better error message
    if ((error as Error).message === 'Case not found') {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to create bid or transition case state' },
      { status: 400 }
    );
  }
}


