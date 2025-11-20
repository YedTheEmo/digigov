type HeadersInit = Record<string, string>;

class SimpleCookieJar {
  private jar = new Map<string, string>();

  setFromSetCookie(setCookieValues: string[] | null) {
    if (!setCookieValues) return;
    for (const raw of setCookieValues) {
      const first = raw.split(';')[0]?.trim();
      if (!first) continue;
      const eq = first.indexOf('=');
      if (eq <= 0) continue;
      const name = first.slice(0, eq);
      const value = first.slice(eq + 1);
      if (!name) continue;
      this.jar.set(name, value);
    }
  }

  header(): string | undefined {
    if (this.jar.size === 0) return undefined;
    return Array.from(this.jar.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
  }
}

export class ApiClient {
  private baseUrl: string;
  private jar = new SimpleCookieJar();

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private async request(method: string, path: string, opts?: {
    json?: any;
    form?: URLSearchParams;
    headers?: HeadersInit;
  }) {
    const url = `${this.baseUrl}${path}`;
    const headers: HeadersInit = { 'Accept': 'application/json', ...(opts?.headers || {}) };
    let body: any = undefined;
    if (opts?.json !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(opts.json);
    }
    if (opts?.form) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      body = opts.form.toString();
    }
    const cookieHeader = this.jar.header();
    if (cookieHeader) headers['Cookie'] = cookieHeader;
    const res = await fetch(url, { method, headers, body, redirect: 'manual' as any });
    const setCookie = res.headers.getSetCookie?.() ?? res.headers.get('set-cookie')?.split(/,(?=[^ ;]+?=)/g) ?? null;
    this.jar.setFromSetCookie(Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : null);
    let data: any = null;
    const text = await res.text().catch(() => '');
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    return { status: res.status, ok: res.ok, headers: res.headers, data, text };
  }

  get(path: string, headers?: HeadersInit) {
    return this.request('GET', path, { headers });
  }
  post(path: string, json?: any, headers?: HeadersInit) {
    return this.request('POST', path, { json, headers });
  }
  postForm(path: string, form: URLSearchParams, headers?: HeadersInit) {
    return this.request('POST', path, { form, headers });
  }

  async login(email: string, password: string) {
    // Fetch CSRF token
    const csrf = await this.get('/api/auth/csrf');
    if (!csrf.ok || !csrf.data?.csrfToken) throw new Error(`CSRF failed (${csrf.status})`);
    const form = new URLSearchParams();
    form.set('csrfToken', String(csrf.data.csrfToken));
    form.set('email', email);
    form.set('password', password);
    form.set('callbackUrl', `${this.baseUrl}/`);
    form.set('json', 'true');
    const res = await this.postForm('/api/auth/callback/credentials', form);
    if (!(res.status === 200 || res.status === 302)) {
      throw new Error(`Login failed for ${email} (${res.status}): ${typeof res.data === 'string' ? res.data : JSON.stringify(res.data)}`);
    }
  }

  async createCase(title: string, method: 'PUBLIC_BIDDING' | 'SMALL_VALUE_RFQ' | 'INFRASTRUCTURE') {
    const res = await this.post('/api/cases', { title, method, regime: 'RA9184' });
    if (!res.ok) throw new Error(`Create case failed (${res.status})`);
    return res.data;
  }

  async fetchCaseById(id: string) {
    const res = await this.get(`/api/cases?query=${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error(`Fetch case failed (${res.status})`);
    const arr = Array.isArray(res.data) ? res.data : [];
    const found = arr.find((c: any) => c.id === id) || arr[0];
    if (!found) throw new Error('Case not found in response');
    return found;
  }
}

export function expectStatus(actual: number, expected: number, context: string) {
  if (actual !== expected) throw new Error(`${context}: expected ${expected}, got ${actual}`);
}

export function idempotencyKey(suffix?: string) {
  const base = (globalThis as any).crypto?.randomUUID ? (globalThis as any).crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  return suffix ? `${base}-${suffix}` : base;
}




