/**
 * Authenticated HTTP client for the CodeGuard control plane.
 *
 * Every request carries the session token and every failure surfaces as an
 * ApiError. This deliberately has no fallback data: the previous client caught
 * each error and returned fixtures, so the dashboard rendered a fully populated
 * UI with the entire backend down and nobody could tell.
 */

const API_BASE = '/api/v1';
const TOKEN_STORAGE_KEY = 'codeguard.session.token';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly url: string
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** True when the session is missing, expired, or lacks the required role. */
  get isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }
}

class ApiClient {
  private token = '';

  constructor() {
    // Restore the session on first load in the browser.
    if (typeof window !== 'undefined') {
      this.token = window.localStorage.getItem(TOKEN_STORAGE_KEY) ?? '';
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
      } else {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    }
  }

  getToken(): string {
    return this.token;
  }

  clearToken() {
    this.setToken('');
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${path}`;

    const headers = new Headers(init.headers);
    headers.set('Content-Type', 'application/json');
    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    let res: Response;
    try {
      res = await fetch(url, { ...init, headers });
    } catch (cause) {
      // Network-level failure: the API is unreachable, not merely unhappy.
      throw new ApiError('Cannot reach the CodeGuard API.', 0, url);
    }

    if (!res.ok) {
      let message = `Request failed with status ${res.status}`;
      try {
        const body = await res.json();
        if (body?.message || body?.error) message = body.message ?? body.error;
      } catch {
        // Non-JSON error body; keep the status-based message.
      }
      throw new ApiError(message, res.status, url);
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  private get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  private post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  }

  private patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PATCH',
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  }

  private delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }

  // --- Authentication -------------------------------------------------------

  async login(email: string, password: string) {
    const data = await this.post<{ token: string; user: unknown; customer: unknown; isPlatformAdmin: boolean }>(
      '/auth/login',
      { email, password }
    );
    if (data.token) this.setToken(data.token);
    return data;
  }

  async register(payload: { email: string; password: string; name: string; customerType?: string; planSlug?: string }) {
    const data = await this.post<{ token: string; user: unknown; customer: unknown }>('/auth/register', payload);
    if (data.token) this.setToken(data.token);
    return data;
  }

  async me() {
    return this.get<{ user: unknown; customer: unknown; entitlements: unknown; isPlatformAdmin: boolean }>('/auth/me');
  }

  /** Demo persona switcher. The API refuses this route in production. */
  async demoLogin(role: 'student' | 'pro' | 'org' | 'admin') {
    const data = await this.post<{ token: string; user: unknown; customer: unknown; isPlatformAdmin: boolean }>(
      '/auth/demo-login',
      { role }
    );
    if (data.token) this.setToken(data.token);
    return data;
  }

  // --- Customer portal ------------------------------------------------------

  customerOverview() {
    return this.get<Record<string, any>>('/customer/overview');
  }

  customerSubscription() {
    return this.get<{ currentSubscription: any; availablePlans: any[] }>('/customer/subscription');
  }

  changeSubscription(planId: string, billingInterval: 'MONTHLY' | 'YEARLY' = 'MONTHLY') {
    return this.post<Record<string, any>>('/customer/subscription/change', { planId, billingInterval });
  }

  customerUsage() {
    return this.get<Record<string, any>>('/customer/usage');
  }

  customerBilling() {
    return this.get<{ invoices: any[]; payments: any[] }>('/customer/billing');
  }

  customerDocuments() {
    return this.get<{ documents: any[] }>('/customer/documents');
  }

  supportTickets() {
    return this.get<{ tickets: any[] }>('/customer/support');
  }

  createSupportTicket(payload: { subject: string; description: string; category?: string; priority?: string }) {
    return this.post<Record<string, any>>('/customer/support', payload);
  }

  notifications() {
    return this.get<Record<string, any>>('/customer/notifications');
  }

  markAllNotificationsRead() {
    return this.post<Record<string, any>>('/customer/notifications/read-all');
  }

  // --- Organization portal --------------------------------------------------

  orgOverview() {
    return this.get<Record<string, any>>('/org/overview');
  }

  orgMembers() {
    return this.get<{ members: any[]; seatLimit?: number }>('/org/members');
  }

  inviteMember(email: string, role: string) {
    return this.post<Record<string, any>>('/org/members/invite', { email, role });
  }

  removeMember(id: string) {
    return this.delete<Record<string, any>>(`/org/members/${id}`);
  }

  // --- Review engine --------------------------------------------------------

  dashboardStats() {
    return this.get<Record<string, any>>('/dashboard/stats');
  }

  reviews(params: { repositoryId?: string; pullRequestId?: string } = {}) {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return this.get<{ data: any[] }>(`/reviews${qs ? `?${qs}` : ''}`);
  }

  review(id: string) {
    return this.get<{ data: any }>(`/reviews/${id}`);
  }

  findings(params: { repositoryId?: string; pullRequestId?: string } = {}) {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return this.get<{ data: any[] }>(`/findings${qs ? `?${qs}` : ''}`);
  }

  repositories() {
    return this.get<{ data: any[] }>('/repositories');
  }

  policies() {
    return this.get<{ data: any[] }>('/policies');
  }

  auditLogs() {
    return this.get<{ data: any[] }>('/audit-logs');
  }

  requestBreakGlass(payload: {
    repositoryId: string;
    branch: string;
    requesterEmail: string;
    reason: string;
    durationMinutes?: number;
  }) {
    return this.post<Record<string, any>>('/emergency/break-glass', payload);
  }

  // --- Platform admin -------------------------------------------------------

  adminDashboard() {
    return this.get<Record<string, any>>('/admin/dashboard');
  }

  adminCustomers(search?: string) {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.get<{ customers: any[] }>(`/admin/customers${qs}`);
  }

  suspendCustomer(id: string, reason: string) {
    return this.post<Record<string, any>>(`/admin/customers/${id}/suspend`, { reason });
  }

  reactivateCustomer(id: string) {
    return this.post<Record<string, any>>(`/admin/customers/${id}/reactivate`);
  }

  adminPlans() {
    return this.get<{ plans: any[] }>('/admin/plans');
  }

  adminAuditLogs() {
    return this.get<{ auditLogs: any[] }>('/admin/audit-logs');
  }

  adminSupportTickets() {
    return this.get<{ tickets: any[] }>('/admin/support/tickets');
  }

  broadcast(payload: { title: string; message: string; audience?: unknown }) {
    return this.post<Record<string, any>>('/admin/notifications/broadcast', payload);
  }
}

export const apiClient = new ApiClient();
