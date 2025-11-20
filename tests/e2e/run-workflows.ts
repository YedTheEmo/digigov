import { ApiClient, idempotencyKey } from './http';

type Clients = {
  admin: ApiClient;
  procurement: ApiClient;
  supply: ApiClient;
  budget: ApiClient;
  accounting: ApiClient;
  cashier: ApiClient;
  bac: ApiClient;
  twg: ApiClient;
  approver: ApiClient;
};

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const PASSWORD = 'Password123!';

function logStep(name: string, ok: boolean, extra?: string) {
  const sym = ok ? '✅' : '❌';
  console.log(`${sym} ${name}${extra ? ` — ${extra}` : ''}`);
}

async function loginAll(): Promise<Clients> {
  const mk = () => new ApiClient(BASE_URL);
  const c: Clients = {
    admin: mk(),
    procurement: mk(),
    supply: mk(),
    budget: mk(),
    accounting: mk(),
    cashier: mk(),
    bac: mk(),
    twg: mk(),
    approver: mk(),
  };
  await Promise.all([
    c.admin.login('admin@local', PASSWORD),
    c.procurement.login('procurement@local', PASSWORD),
    c.supply.login('supply@local', PASSWORD),
    c.budget.login('budget@local', PASSWORD),
    c.accounting.login('accounting@local', PASSWORD),
    c.cashier.login('cashier@local', PASSWORD),
    c.bac.login('bac@local', PASSWORD),
    c.twg.login('twg@local', PASSWORD),
    c.approver.login('approver@local', PASSWORD),
  ]);
  return c;
}

async function waitForServerReady(timeoutMs = 30000) {
  const start = Date.now();
  const client = new ApiClient(BASE_URL);
  while (true) {
    try {
      const res = await client.get('/api/cases?query=_health');
      if (res.status === 200) return;
    } catch {}
    if (Date.now() - start > timeoutMs) throw new Error('Server not ready within timeout');
    await new Promise((r) => setTimeout(r, 1000));
  }
}

async function assertState(client: ApiClient, id: string, expected: string) {
  const c = await client.fetchCaseById(id);
  if (String(c.currentState) !== expected) throw new Error(`State ${c.currentState} !== ${expected}`);
}

async function publicBiddingFlow(clients: Clients) {
  const { procurement, bac, twg, approver, supply, budget, accounting, cashier } = clients;
  const created = await procurement.createCase(`E2E Public Bidding ${Date.now()}`, 'PUBLIC_BIDDING');
  const id = created.id as string;

  // Posting (Procurement)
  {
    const res = await procurement.post(`/api/cases/${id}/posting`, { postingStartAt: new Date().toISOString() }, { 'Idempotency-Key': idempotencyKey('posting') });
    if (!res.ok) throw new Error(`Posting failed: ${res.status} ${JSON.stringify(res.data)}`);
    await assertState(procurement, id, 'POSTING');
    logStep('PB: Posting', true);
  }

  // BAC: Bid Bulletin, Pre-Bid, Bid
  {
    const bb = await bac.post(`/api/cases/${id}/bid-bulletins`, { number: 1, publishedAt: new Date().toISOString() }, { 'Idempotency-Key': idempotencyKey('bb') });
    if (!bb.ok) throw new Error(`Bid Bulletin failed: ${bb.status} ${JSON.stringify(bb.data)}`);
    await assertState(bac, id, 'BID_BULLETIN');
    logStep('PB: Bid Bulletin', true);

    const pb = await bac.post(`/api/cases/${id}/pre-bid`, { scheduledAt: new Date().toISOString() }, { 'Idempotency-Key': idempotencyKey('prebid') });
    if (!pb.ok) throw new Error(`Pre-Bid failed: ${pb.status} ${JSON.stringify(pb.data)}`);
    await assertState(bac, id, 'PRE_BID_CONF');
    logStep('PB: Pre-Bid Conf', true);

    const bid = await bac.post(`/api/cases/${id}/bids`, { bidderName: 'Acme Corp', amount: 1000000.0, openedAt: new Date().toISOString() }, { 'Idempotency-Key': idempotencyKey('bid') });
    if (!bid.ok) throw new Error(`Record Bid failed: ${bid.status} ${JSON.stringify(bid.data)}`);
    await assertState(bac, id, 'BID_SUBMISSION_OPENING');
    logStep('PB: Record Bid', true);
  }

  // TWG Evaluation
  {
    const tw = await twg.post(`/api/cases/${id}/twg`, { result: 'Responsive', notes: 'OK' }, { 'Idempotency-Key': idempotencyKey('twg') });
    if (!tw.ok) throw new Error(`TWG failed: ${tw.status} ${JSON.stringify(tw.data)}`);
    await assertState(twg, id, 'TWG_EVALUATION');
    logStep('PB: TWG Evaluation', true);
  }

  // Post-Qualification and BAC Resolution (BAC)
  {
    const pq = await bac.post(`/api/cases/${id}/post-qualification`, { lowestResponsiveBidder: 'Acme Corp', passed: true, completedAt: new Date().toISOString() }, { 'Idempotency-Key': idempotencyKey('pq') });
    if (!pq.ok) throw new Error(`Post-Qualification failed: ${pq.status} ${JSON.stringify(pq.data)}`);
    await assertState(bac, id, 'POST_QUALIFICATION');
    logStep('PB: Post-Qualification', true);

    const bacr = await bac.post(`/api/cases/${id}/bac-resolution`, { notes: 'Recommend award' }, { 'Idempotency-Key': idempotencyKey('bacr') });
    if (!bacr.ok) throw new Error(`BAC Resolution failed: ${bacr.status} ${JSON.stringify(bacr.data)}`);
    await assertState(bac, id, 'BAC_RESOLUTION');
    logStep('PB: BAC Resolution', true);
  }

  // Award (Approver)
  {
    const aw = await approver.post(`/api/cases/${id}/award`, { awardedTo: 'Acme Corp', noticeDate: new Date().toISOString() }, { 'Idempotency-Key': idempotencyKey('award') });
    if (!aw.ok) throw new Error(`Award failed: ${aw.status} ${JSON.stringify(aw.data)}`);
    await assertState(approver, id, 'AWARDED');
    logStep('PB: Award', true);
  }

  // PO Approval (Approver)
  {
    const po = await approver.post(`/api/cases/${id}/po`, { poNo: `PO-${Date.now()}` }, { 'Idempotency-Key': idempotencyKey('po') });
    if (!po.ok) throw new Error(`PO approval failed: ${po.status} ${JSON.stringify(po.data)}`);
    await assertState(approver, id, 'PO_APPROVED');
    logStep('PB: PO Approved', true);
  }

  // Contract & NTP (Procurement)
  {
    const ct = await procurement.post(`/api/cases/${id}/contract`, { contractNo: `CT-${Date.now()}`, signedAt: new Date().toISOString() }, { 'Idempotency-Key': idempotencyKey('contract') });
    if (!ct.ok) throw new Error(`Contract failed: ${ct.status} ${JSON.stringify(ct.data)}`);
    await assertState(procurement, id, 'CONTRACT_SIGNED');
    logStep('PB: Contract Signed', true);

    const ntp = await procurement.post(`/api/cases/${id}/ntp`, { issuedAt: new Date().toISOString(), daysToComply: 30 }, { 'Idempotency-Key': idempotencyKey('ntp') });
    if (!ntp.ok) throw new Error(`NTP failed: ${ntp.status} ${JSON.stringify(ntp.data)}`);
    await assertState(procurement, id, 'NTP_ISSUED');
    logStep('PB: NTP Issued', true);
  }

  // Delivery/Inspection/Acceptance (Supply)
  {
    const del = await supply.post(`/api/cases/${id}/deliveries`, { deliveredAt: new Date().toISOString(), notes: 'Delivered' }, { 'Idempotency-Key': idempotencyKey('delivery') });
    if (!del.ok) throw new Error(`Delivery failed: ${del.status} ${JSON.stringify(del.data)}`);
    await assertState(supply, id, 'DELIVERY');
    logStep('PB: Delivery', true);

    const ins = await supply.post(`/api/cases/${id}/inspection`, { status: 'PASSED', inspector: 'COA/End-User' }, { 'Idempotency-Key': idempotencyKey('inspection') });
    if (!ins.ok) throw new Error(`Inspection failed: ${ins.status} ${JSON.stringify(ins.data)}`);
    await assertState(supply, id, 'INSPECTION');
    logStep('PB: Inspection', true);

    const acc = await supply.post(`/api/cases/${id}/acceptance`, { acceptedAt: new Date().toISOString(), officer: 'Supply Officer' }, { 'Idempotency-Key': idempotencyKey('acceptance') });
    if (!acc.ok) throw new Error(`Acceptance failed: ${acc.status} ${JSON.stringify(acc.data)}`);
    await assertState(supply, id, 'ACCEPTANCE');
    logStep('PB: Acceptance', true);
  }

  // ORS / DV / Check
  {
    const ors = await budget.post(`/api/cases/${id}/ors`, { orsNumber: `ORS-${Date.now()}`, preparedAt: new Date().toISOString() }, { 'Idempotency-Key': idempotencyKey('ors') });
    if (!ors.ok) throw new Error(`ORS failed: ${ors.status} ${JSON.stringify(ors.data)}`);
    await assertState(budget, id, 'ORS');
    logStep('PB: ORS', true);

    const dv = await accounting.post(`/api/cases/${id}/dv`, { dvNumber: `DV-${Date.now()}`, preparedAt: new Date().toISOString() }, { 'Idempotency-Key': idempotencyKey('dv') });
    if (!dv.ok) throw new Error(`DV failed: ${dv.status} ${JSON.stringify(dv.data)}`);
    await assertState(accounting, id, 'DV');
    logStep('PB: DV', true);

    const chk = await cashier.post(`/api/cases/${id}/check`, { checkNumber: `CHK-${Date.now()}`, preparedAt: new Date().toISOString() }, { 'Idempotency-Key': idempotencyKey('check') });
    if (!chk.ok) throw new Error(`Check failed: ${chk.status} ${JSON.stringify(chk.data)}`);
    await assertState(cashier, id, 'CHECK');
    logStep('PB: Check', true);
  }
}

async function rfqFlow(clients: Clients) {
  const { procurement, bac, approver, supply, budget, accounting, cashier } = clients;
  const created = await procurement.createCase(`E2E RFQ ${Date.now()}`, 'SMALL_VALUE_RFQ');
  const id = created.id as string;

  // Issue RFQ (can be from DRAFT)
  {
    const rfq = await procurement.post(`/api/cases/${id}/rfq`, { issuedAt: new Date().toISOString() }, { 'Idempotency-Key': idempotencyKey('rfq') });
    if (!rfq.ok) throw new Error(`RFQ failed: ${rfq.status} ${JSON.stringify(rfq.data)}`);
    await assertState(procurement, id, 'RFQ_ISSUED');
    logStep('RFQ: Issue RFQ', true);
  }

  // Add three quotations
  for (let i = 1; i <= 3; i++) {
    const q = await procurement.post(`/api/cases/${id}/quotations`, { supplierName: `Supplier ${i}`, amount: 10000 * i }, { 'Idempotency-Key': idempotencyKey(`q${i}`) });
    if (!q.ok) throw new Error(`Quotation ${i} failed: ${q.status} ${JSON.stringify(q.data)}`);
  }
  logStep('RFQ: Add 3 quotations', true);

  // Generate Abstract (Procurement)
  {
    const ab = await procurement.post(`/api/cases/${id}/abstract`, { notes: 'Generated' }, { 'Idempotency-Key': idempotencyKey('abstract') });
    if (!ab.ok) throw new Error(`Abstract failed: ${ab.status} ${JSON.stringify(ab.data)}`);
    await assertState(procurement, id, 'ABSTRACT_OF_QUOTATIONS');
    logStep('RFQ: Abstract of Quotations', true);
  }

  // BAC Resolution (BAC)
  {
    const bacr = await bac.post(`/api/cases/${id}/bac-resolution`, { notes: 'Recommend award' }, { 'Idempotency-Key': idempotencyKey('bacr') });
    if (!bacr.ok) throw new Error(`BAC Resolution failed: ${bacr.status} ${JSON.stringify(bacr.data)}`);
    await assertState(bac, id, 'BAC_RESOLUTION');
    logStep('RFQ: BAC Resolution', true);
  }

  // Award (Approver)
  {
    const aw = await approver.post(`/api/cases/${id}/award`, { awardedTo: 'Supplier 1', noticeDate: new Date().toISOString() }, { 'Idempotency-Key': idempotencyKey('award') });
    if (!aw.ok) throw new Error(`Award failed: ${aw.status} ${JSON.stringify(aw.data)}`);
    await assertState(approver, id, 'AWARDED');
    logStep('RFQ: Award', true);
  }

  // PO Approval (Approver)
  {
    const po = await approver.post(`/api/cases/${id}/po`, { poNo: `PO-${Date.now()}` }, { 'Idempotency-Key': idempotencyKey('po') });
    if (!po.ok) throw new Error(`PO approval failed: ${po.status} ${JSON.stringify(po.data)}`);
    await assertState(approver, id, 'PO_APPROVED');
    logStep('RFQ: PO Approved', true);
  }

  // Contract & NTP (Procurement)
  {
    const ct = await procurement.post(`/api/cases/${id}/contract`, { contractNo: `CT-${Date.now()}`, signedAt: new Date().toISOString() }, { 'Idempotency-Key': idempotencyKey('contract') });
    if (!ct.ok) throw new Error(`Contract failed: ${ct.status} ${JSON.stringify(ct.data)}`);
    await assertState(procurement, id, 'CONTRACT_SIGNED');
    logStep('RFQ: Contract Signed', true);

    const ntp = await procurement.post(`/api/cases/${id}/ntp`, { issuedAt: new Date().toISOString(), daysToComply: 30 }, { 'Idempotency-Key': idempotencyKey('ntp') });
    if (!ntp.ok) throw new Error(`NTP failed: ${ntp.status} ${JSON.stringify(ntp.data)}`);
    await assertState(procurement, id, 'NTP_ISSUED');
    logStep('RFQ: NTP Issued', true);
  }

  // Delivery/Inspection/Acceptance; ORS/DV/Check
  {
    const del = await supply.post(`/api/cases/${id}/deliveries`, { deliveredAt: new Date().toISOString(), notes: 'Delivered' }, { 'Idempotency-Key': idempotencyKey('delivery') });
    if (!del.ok) throw new Error(`Delivery failed: ${del.status} ${JSON.stringify(del.data)}`);
    await assertState(supply, id, 'DELIVERY');
    logStep('RFQ: Delivery', true);

    const ins = await supply.post(`/api/cases/${id}/inspection`, { status: 'PASSED', inspector: 'COA/End-User' }, { 'Idempotency-Key': idempotencyKey('inspection') });
    if (!ins.ok) throw new Error(`Inspection failed: ${ins.status} ${JSON.stringify(ins.data)}`);
    await assertState(supply, id, 'INSPECTION');
    logStep('RFQ: Inspection', true);

    const acc = await supply.post(`/api/cases/${id}/acceptance`, { acceptedAt: new Date().toISOString(), officer: 'Supply Officer' }, { 'Idempotency-Key': idempotencyKey('acceptance') });
    if (!acc.ok) throw new Error(`Acceptance failed: ${acc.status} ${JSON.stringify(acc.data)}`);
    await assertState(supply, id, 'ACCEPTANCE');
    logStep('RFQ: Acceptance', true);

    const ors = await budget.post(`/api/cases/${id}/ors`, { orsNumber: `ORS-${Date.now()}`, preparedAt: new Date().toISOString() }, { 'Idempotency-Key': idempotencyKey('ors') });
    if (!ors.ok) throw new Error(`ORS failed: ${ors.status} ${JSON.stringify(ors.data)}`);
    await assertState(budget, id, 'ORS');
    logStep('RFQ: ORS', true);

    const dv = await accounting.post(`/api/cases/${id}/dv`, { dvNumber: `DV-${Date.now()}`, preparedAt: new Date().toISOString() }, { 'Idempotency-Key': idempotencyKey('dv') });
    if (!dv.ok) throw new Error(`DV failed: ${dv.status} ${JSON.stringify(dv.data)}`);
    await assertState(accounting, id, 'DV');
    logStep('RFQ: DV', true);

    const chk = await cashier.post(`/api/cases/${id}/check`, { checkNumber: `CHK-${Date.now()}`, preparedAt: new Date().toISOString() }, { 'Idempotency-Key': idempotencyKey('check') });
    if (!chk.ok) throw new Error(`Check failed: ${chk.status} ${JSON.stringify(chk.data)}`);
    await assertState(cashier, id, 'CHECK');
    logStep('RFQ: Check', true);
  }
}

async function attachmentsTest(clients: Clients) {
  const { procurement } = clients;
  const created = await procurement.createCase(`E2E Attach ${Date.now()}`, 'SMALL_VALUE_RFQ');
  const id = created.id as string;
  const key = `${id}/${Date.now()}_test.txt`;
  // sign
  const sign = await procurement.post('/api/uploads/sign', { key, contentType: 'text/plain' });
  if (!sign.ok || !sign.data?.uploadUrl) throw new Error(`Sign failed: ${sign.status} ${JSON.stringify(sign.data)}`);
  const uploadUrl = String(sign.data.uploadUrl);
  // put
  const putRes = await fetch(`${BASE_URL}${uploadUrl}`, { method: 'PUT', body: Buffer.from('hello'), headers: { 'Content-Type': 'text/plain' } });
  if (!(putRes.status === 204 || putRes.status === 200)) throw new Error(`Upload failed: ${putRes.status}`);
  // attach
  const fileUrl = `/uploads/${key}`;
  const attach = await procurement.post('/api/attachments', { caseId: id, type: 'GENERIC', url: fileUrl });
  if (!attach.ok || attach.status !== 201) throw new Error(`Attachment create failed: ${attach.status} ${JSON.stringify(attach.data)}`);
  logStep('Attachments: sign/put/record', true);
}

async function negativeTests(clients: Clients) {
  const { procurement, bac } = clients;
  const created = await procurement.createCase(`E2E Negative ${Date.now()}`, 'PUBLIC_BIDDING');
  const id = created.id as string;

  // Attempt BAC Resolution before Post-Qualification → 400
  {
    const res = await bac.post(`/api/cases/${id}/bac-resolution`, { notes: 'Early' }, { 'Idempotency-Key': idempotencyKey('neg-bacr-early') });
    if (res.status !== 400) throw new Error(`Expected 400 on early BAC Resolution, got ${res.status}`);
    logStep('NEG: BAC Resolution before PQ → 400', true);
  }
}

async function infraFlow(clients: Clients) {
  const { procurement, bac, twg, approver, supply, budget, accounting, cashier } = clients;
  const created = await procurement.createCase(`E2E Infra ${Date.now()}`, 'INFRASTRUCTURE');
  const id = created.id as string;

  // Posting
  {
    const res = await procurement.post(
      `/api/cases/${id}/posting`,
      { postingStartAt: new Date().toISOString() },
      { 'Idempotency-Key': idempotencyKey('posting-infra') },
    );
    if (!res.ok) throw new Error(`Infra Posting failed: ${res.status} ${JSON.stringify(res.data)}`);
    await assertState(procurement, id, 'POSTING');
    logStep('INFRA: Posting', true);
  }

  // Pre-bid / bidding steps (same as Public Bidding)
  {
    const bb = await bac.post(
      `/api/cases/${id}/bid-bulletins`,
      { number: 1, publishedAt: new Date().toISOString() },
      { 'Idempotency-Key': idempotencyKey('bb-infra') },
    );
    if (!bb.ok) throw new Error(`INFRA Bid Bulletin failed: ${bb.status} ${JSON.stringify(bb.data)}`);
    await assertState(bac, id, 'BID_BULLETIN');
    logStep('INFRA: Bid Bulletin', true);

    const pb = await bac.post(
      `/api/cases/${id}/pre-bid`,
      { scheduledAt: new Date().toISOString() },
      { 'Idempotency-Key': idempotencyKey('prebid-infra') },
    );
    if (!pb.ok) throw new Error(`INFRA Pre-Bid failed: ${pb.status} ${JSON.stringify(pb.data)}`);
    await assertState(bac, id, 'PRE_BID_CONF');
    logStep('INFRA: Pre-Bid Conf', true);

    const bid = await bac.post(
      `/api/cases/${id}/bids`,
      { bidderName: 'Infra Corp', amount: 2000000.0, openedAt: new Date().toISOString() },
      { 'Idempotency-Key': idempotencyKey('bid-infra') },
    );
    if (!bid.ok) throw new Error(`INFRA Record Bid failed: ${bid.status} ${JSON.stringify(bid.data)}`);
    await assertState(bac, id, 'BID_SUBMISSION_OPENING');
    logStep('INFRA: Record Bid', true);
  }

  // TWG Evaluation
  {
    const tw = await twg.post(
      `/api/cases/${id}/twg`,
      { result: 'Responsive', notes: 'OK' },
      { 'Idempotency-Key': idempotencyKey('twg-infra') },
    );
    if (!tw.ok) throw new Error(`INFRA TWG failed: ${tw.status} ${JSON.stringify(tw.data)}`);
    await assertState(twg, id, 'TWG_EVALUATION');
    logStep('INFRA: TWG Evaluation', true);
  }

  // Post-Qualification and BAC Resolution (BAC)
  {
    const pq = await bac.post(
      `/api/cases/${id}/post-qualification`,
      { lowestResponsiveBidder: 'Infra Corp', passed: true, completedAt: new Date().toISOString() },
      { 'Idempotency-Key': idempotencyKey('pq-infra') },
    );
    if (!pq.ok) throw new Error(`INFRA Post-Qualification failed: ${pq.status} ${JSON.stringify(pq.data)}`);
    await assertState(bac, id, 'POST_QUALIFICATION');
    logStep('INFRA: Post-Qualification', true);

    const bacr = await bac.post(
      `/api/cases/${id}/bac-resolution`,
      { notes: 'Recommend award' },
      { 'Idempotency-Key': idempotencyKey('bacr-infra') },
    );
    if (!bacr.ok) throw new Error(`INFRA BAC Resolution failed: ${bacr.status} ${JSON.stringify(bacr.data)}`);
    await assertState(bac, id, 'BAC_RESOLUTION');
    logStep('INFRA: BAC Resolution', true);
  }

  // Award, PO, contract, NTP
  {
    const aw = await approver.post(
      `/api/cases/${id}/award`,
      { awardedTo: 'Infra Supplier', noticeDate: new Date().toISOString() },
      { 'Idempotency-Key': idempotencyKey('award-infra') },
    );
    if (!aw.ok) throw new Error(`Infra Award failed: ${aw.status} ${JSON.stringify(aw.data)}`);
    await assertState(approver, id, 'AWARDED');
    logStep('INFRA: Award', true);

    const po = await approver.post(
      `/api/cases/${id}/po`,
      { poNo: `PO-INFRA-${Date.now()}` },
      { 'Idempotency-Key': idempotencyKey('po-infra') },
    );
    if (!po.ok) throw new Error(`Infra PO failed: ${po.status} ${JSON.stringify(po.data)}`);
    await assertState(approver, id, 'PO_APPROVED');
    logStep('INFRA: PO Approved', true);

    const ct = await procurement.post(
      `/api/cases/${id}/contract`,
      { contractNo: `CT-INFRA-${Date.now()}`, signedAt: new Date().toISOString() },
      { 'Idempotency-Key': idempotencyKey('contract-infra') },
    );
    if (!ct.ok) throw new Error(`Infra Contract failed: ${ct.status} ${JSON.stringify(ct.data)}`);
    await assertState(procurement, id, 'CONTRACT_SIGNED');
    logStep('INFRA: Contract Signed', true);

    const ntp = await procurement.post(
      `/api/cases/${id}/ntp`,
      { issuedAt: new Date().toISOString(), daysToComply: 30 },
      { 'Idempotency-Key': idempotencyKey('ntp-infra') },
    );
    if (!ntp.ok) throw new Error(`Infra NTP failed: ${ntp.status} ${JSON.stringify(ntp.data)}`);
    await assertState(procurement, id, 'NTP_ISSUED');
    logStep('INFRA: NTP Issued', true);
  }

  // Progress Billing and PMT Inspection
  {
    const pb = await procurement.post(
      `/api/cases/${id}/progress-billing`,
      { billingNo: `PB-${Date.now()}`, amount: 500000.0 },
      { 'Idempotency-Key': idempotencyKey('pb-infra') },
    );
    if (!pb.ok) throw new Error(`Infra Progress Billing failed: ${pb.status} ${JSON.stringify(pb.data)}`);
    await assertState(procurement, id, 'PROGRESS_BILLING');
    logStep('INFRA: Progress Billing', true);

    const pmt = await procurement.post(
      `/api/cases/${id}/pmt-inspection`,
      { status: 'PASSED', inspector: 'PMT' },
      { 'Idempotency-Key': idempotencyKey('pmt-infra') },
    );
    if (!pmt.ok) throw new Error(`Infra PMT Inspection failed: ${pmt.status} ${JSON.stringify(pmt.data)}`);
    await assertState(procurement, id, 'PMT_INSPECTION');
    logStep('INFRA: PMT Inspection', true);
  }

  // Accept, ORS, DV, Check
  {
    const acc = await supply.post(
      `/api/cases/${id}/acceptance`,
      { acceptedAt: new Date().toISOString(), officer: 'Infra Officer' },
      { 'Idempotency-Key': idempotencyKey('acc-infra') },
    );
    if (!acc.ok) throw new Error(`Infra Acceptance failed: ${acc.status} ${JSON.stringify(acc.data)}`);
    await assertState(procurement, id, 'ACCEPTANCE');
    logStep('INFRA: Acceptance', true);

    const ors = await budget.post(
      `/api/cases/${id}/ors`,
      { orsNumber: `ORS-INFRA-${Date.now()}`, preparedAt: new Date().toISOString() },
      { 'Idempotency-Key': idempotencyKey('ors-infra') },
    );
    if (!ors.ok) throw new Error(`Infra ORS failed: ${ors.status} ${JSON.stringify(ors.data)}`);
    await assertState(budget, id, 'ORS');
    logStep('INFRA: ORS', true);

    const dv = await accounting.post(
      `/api/cases/${id}/dv`,
      { dvNumber: `DV-INFRA-${Date.now()}`, preparedAt: new Date().toISOString() },
      { 'Idempotency-Key': idempotencyKey('dv-infra') },
    );
    if (!dv.ok) throw new Error(`Infra DV failed: ${dv.status} ${JSON.stringify(dv.data)}`);
    await assertState(accounting, id, 'DV');
    logStep('INFRA: DV', true);

    const chk = await cashier.post(
      `/api/cases/${id}/check`,
      { checkNumber: `CHK-INFRA-${Date.now()}`, preparedAt: new Date().toISOString() },
      { 'Idempotency-Key': idempotencyKey('check-infra') },
    );
    if (!chk.ok) throw new Error(`Infra Check failed: ${chk.status} ${JSON.stringify(chk.data)}`);
    await assertState(cashier, id, 'CHECK');
    logStep('INFRA: Check', true);
  }
}

async function main() {
  await waitForServerReady();
  const clients = await loginAll();
  let failed = 0;
  try { await publicBiddingFlow(clients); } catch (e: unknown) { failed++; logStep('Public Bidding Flow', false, e instanceof Error ? e.message : String(e)); }
  try { await rfqFlow(clients); } catch (e: unknown) { failed++; logStep('RFQ Flow', false, e instanceof Error ? e.message : String(e)); }
  try { await attachmentsTest(clients); } catch (e: unknown) { failed++; logStep('Attachments', false, e instanceof Error ? e.message : String(e)); }
  try { await negativeTests(clients); } catch (e: unknown) { failed++; logStep('Negative Tests', false, e instanceof Error ? e.message : String(e)); }
  try { await infraFlow(clients); } catch (e: unknown) { failed++; logStep('Infrastructure Flow', false, e instanceof Error ? e.message : String(e)); }
  if (failed > 0) {
    console.error(`\n${failed} scenario(s) failed`);
    process.exit(1);
  } else {
    console.log('\nAll scenarios passed');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });


