import { ApiClient } from './http';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const PASSWORD = 'Password123!';

async function main() {
  const client = new ApiClient(BASE_URL);
  await client.login('admin@local', PASSWORD);

  // Create a case
  const created = await client.createCase(`Contract Test ${Date.now()}`, 'SMALL_VALUE_RFQ');
  const id = created.id as string;

  // Check read endpoints
  const list = await client.get('/api/cases?limit=1');
  if (!list.ok) throw new Error(`GET /api/cases failed: ${list.status}`);
  const timeline = await client.get(`/api/cases/${id}/timeline`);
  if (!timeline.ok) throw new Error(`GET timeline failed: ${timeline.status}`);

  // Role gate: DV requires Accounting
  const dvAsAdmin = await client.post(`/api/cases/${id}/dv`, { dvNumber: 'X' });
  if (dvAsAdmin.status !== 403) throw new Error(`Expected 403 for DV as admin, got ${dvAsAdmin.status}`);

  // Login as accounting and do minimal DV (should 400 before ORS due to workflow)
  const accounting = new ApiClient(BASE_URL);
  await accounting.login('accounting@local', PASSWORD);
  const dvAsAcct = await accounting.post(`/api/cases/${id}/dv`, { dvNumber: `DV-${Date.now()}` });
  if (dvAsAcct.status !== 400) throw new Error(`Expected 400 for DV before ORS, got ${dvAsAcct.status}`);

  console.log('Contract tests passed');
}

main().catch((e) => { console.error(e); process.exit(1); });


