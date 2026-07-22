/**
 * Café/Kitchen POS System — API Client
 *
 * Centralized HTTP client for all backend communication.
 * Automatically attaches Sanctum bearer tokens from localStorage.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://hotel-sys.loop-pr.com/api';

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  // Check localStorage first, then cookie
  const token = localStorage.getItem('auth_token');
  if (token) return token;
  
  // Try to get from cookie
  const match = document.cookie.match(new RegExp('(^| )auth_token=([^;]+)'));
  return match ? match[2] : null;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> ?? {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      data.message ?? 'An unexpected error occurred.',
      response.status,
      data.errors
    );
  }

  return data as T;
}

/**
 * Multipart request — for file uploads (logo, favicon).
 * Does NOT set Content-Type so the browser sets it with the boundary.
 */
async function multipartRequest<T>(
  endpoint: string,
  formData: FormData
): Promise<T> {
  const token = getToken();

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      data.message ?? 'An unexpected error occurred.',
      response.status,
      data.errors
    );
  }

  return data as T;
}

/**
 * Generic axios-style client.
 * Provides `.get/.post/.put/.patch/.delete` returning `{ data }` so that
 * callers can read `response.data`, mirroring the axios interface.
 */
function buildQuery(params?: Record<string, unknown>): string {
  if (!params) return '';
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      search.append(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

interface RequestConfig {
  params?: Record<string, unknown>;
}

export const api = {
  get: async <T = any>(endpoint: string, config?: RequestConfig) => {
    const data = await request<T>(`${endpoint}${buildQuery(config?.params)}`);
    return { data };
  },
  post: async <T = any>(endpoint: string, body?: unknown, config?: RequestConfig) => {
    const data = await request<T>(`${endpoint}${buildQuery(config?.params)}`, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { data };
  },
  put: async <T = any>(endpoint: string, body?: unknown, config?: RequestConfig) => {
    const data = await request<T>(`${endpoint}${buildQuery(config?.params)}`, {
      method: 'PUT',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { data };
  },
  patch: async <T = any>(endpoint: string, body?: unknown, config?: RequestConfig) => {
    const data = await request<T>(`${endpoint}${buildQuery(config?.params)}`, {
      method: 'PATCH',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { data };
  },
  delete: async <T = any>(endpoint: string, config?: RequestConfig) => {
    const data = await request<T>(`${endpoint}${buildQuery(config?.params)}`, {
      method: 'DELETE',
    });
    return { data };
  },
};

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const authApi = {
  register: (body: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) =>
    request<{ message: string; user: import('@/types').User; token: string }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify(body) }
    ),

  login: (body: { email: string; password: string }) =>
    request<{ message: string; user: import('@/types').User; token: string }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify(body) }
    ),

  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),

  me: () => request<{ user: import('@/types').User }>('/auth/me'),
};

// ─── Dashboard API ────────────────────────────────────────────────────────────

export const dashboardApi = {
  kpis: () =>
    request<{ data: import('@/types').KPI[] }>('/dashboard/kpis'),

  recentActivity: () =>
    request<{ data: import('@/types').ActivityItem[] }>('/dashboard/recent-activity'),

  occupancyTrend: () =>
    request<{ data: import('@/types').OccupancyDataPoint[] }>('/dashboard/occupancy-trend'),
};

// ─── Hotel Settings API ───────────────────────────────────────────────────────

export const settingsApi = {
  /**
   * Fetch current hotel settings.
   */
  getHotel: () =>
    request<{ data: import('@/types').HotelSettings }>('/settings/hotel'),

  /**
   * Update hotel settings. Accepts FormData so files can be included.
   */
  updateHotel: (formData: FormData) =>
    multipartRequest<{ message: string; data: import('@/types').HotelSettings }>(
      '/settings/hotel',
      formData
    ),
};

// ─── Room Types API ───────────────────────────────────────────────────────────

export const roomTypesApi = {
  /**
   * Fetch all room types.
   */
  list: (params?: { active?: boolean; search?: string; sort?: string; direction?: string }) => {
    const queryString = new URLSearchParams();
    if (params?.active !== undefined) queryString.append('active', String(params.active));
    if (params?.search) queryString.append('search', params.search);
    if (params?.sort) queryString.append('sort', params.sort);
    if (params?.direction) queryString.append('direction', params.direction);
    const query = queryString.toString();
    return request<{ data: import('@/types').RoomType[] }>(
      `/room-types${query ? `?${query}` : ''}`
    );
  },

  /**
   * Fetch a single room type.
   */
  get: (id: number) =>
    request<{ data: import('@/types').RoomType }>(`/room-types/${id}`),

  /**
   * Create a new room type.
   */
  create: (data: import('@/types').RoomTypeFormData) =>
    request<{ message: string; data: import('@/types').RoomType }>(
      '/room-types',
      { method: 'POST', body: JSON.stringify(data) }
    ),

  /**
   * Update a room type.
   */
  update: (id: number, data: Partial<import('@/types').RoomTypeFormData>) =>
    request<{ message: string; data: import('@/types').RoomType }>(
      `/room-types/${id}`,
      { method: 'PUT', body: JSON.stringify(data) }
    ),

  /**
   * Delete a room type.
   */
  delete: (id: number) =>
    request<{ message: string }>(`/room-types/${id}`, { method: 'DELETE' }),
};

// ─── Rooms API ───────────────────────────────────────────────────────────────

export const roomsApi = {
  /**
   * Fetch all rooms with optional filtering.
   */
  list: (params?: { room_type_id?: number; status?: string; active?: boolean; search?: string; sort?: string; direction?: string }) => {
    const queryString = new URLSearchParams();
    if (params?.room_type_id !== undefined) queryString.append('room_type_id', String(params.room_type_id));
    if (params?.status) queryString.append('status', params.status);
    if (params?.active !== undefined) queryString.append('active', String(params.active));
    if (params?.search) queryString.append('search', params.search);
    if (params?.sort) queryString.append('sort', params.sort);
    if (params?.direction) queryString.append('direction', params.direction);
    const query = queryString.toString();
    return request<{ data: import('@/types').Room[] }>(
      `/rooms${query ? `?${query}` : ''}`
    );
  },

  /**
   * Fetch a single room.
   */
  get: (id: number) =>
    request<{ data: import('@/types').Room }>(`/rooms/${id}`),

  /**
   * Create a new room.
   */
  create: (data: import('@/types').RoomFormData) =>
    request<{ message: string; data: import('@/types').Room }>(
      '/rooms',
      { method: 'POST', body: JSON.stringify(data) }
    ),

  /**
   * Update a room.
   */
  update: (id: number, data: Partial<import('@/types').RoomFormData>) =>
    request<{ message: string; data: import('@/types').Room }>(
      `/rooms/${id}`,
      { method: 'PUT', body: JSON.stringify(data) }
    ),

  /**
   * Delete a room.
   */
  delete: (id: number) =>
    request<{ message: string }>(`/rooms/${id}`, { method: 'DELETE' }),

  /**
   * Bulk update room statuses.
   */
  bulkStatusUpdate: (data: { room_ids: number[]; status: string }) =>
    request<{ message: string; updated_count: number }>(
      '/rooms/bulk-status',
      { method: 'POST', body: JSON.stringify(data) }
    ),
};

// ─── Guests API ───────────────────────────────────────────────────────────────

export const guestsApi = {
  /**
   * Fetch all guests with optional filtering, sorting, and pagination.
   */
  list: (params?: {
    search?: string;
    country?: string;
    city?: string;
    vip_status?: boolean;
    marketing_consent?: boolean;
    date_from?: string;
    date_to?: string;
    sort?: string;
    direction?: string;
    per_page?: number;
    page?: number;
  }) => {
    const queryString = new URLSearchParams();
    if (params?.search) queryString.append('search', params.search);
    if (params?.country) queryString.append('country', params.country);
    if (params?.city) queryString.append('city', params.city);
    if (params?.vip_status !== undefined) queryString.append('vip_status', String(params.vip_status));
    if (params?.marketing_consent !== undefined) queryString.append('marketing_consent', String(params.marketing_consent));
    if (params?.date_from) queryString.append('date_from', params.date_from);
    if (params?.date_to) queryString.append('date_to', params.date_to);
    if (params?.sort) queryString.append('sort', params.sort);
    if (params?.direction) queryString.append('direction', params.direction);
    if (params?.per_page) queryString.append('per_page', String(params.per_page));
    if (params?.page) queryString.append('page', String(params.page));
    const query = queryString.toString();
    return request<{
      data: import('@/types').Guest[];
      meta: {
        current_page: number;
        from: number;
        last_page: number;
        per_page: number;
        to: number;
        total: number;
      };
      links: {
        first: string | null;
        last: string | null;
        prev: string | null;
        next: string | null;
      };
    }>(`/guests${query ? `?${query}` : ''}`);
  },

  /**
   * Quick search for guests (faster, limited results).
   */
  search: (query: string, perPage?: number) => {
    const queryString = new URLSearchParams();
    queryString.append('q', query);
    if (perPage) queryString.append('per_page', String(perPage));
    return request<{ data: import('@/types').Guest[] }>(
      `/guests/search?${queryString.toString()}`
    );
  },

  /**
   * Fetch a single guest by ID.
   */
  get: (id: number) =>
    request<{ data: import('@/types').Guest }>(`/guests/${id}`),

  /**
   * Create a new guest.
   */
  create: (data: import('@/types').GuestFormData) =>
    request<{ message: string; data: import('@/types').Guest; duplicate?: import('@/types').Guest }>(
      '/guests',
      { method: 'POST', body: JSON.stringify(data) }
    ),

  /**
   * Update an existing guest.
   */
  update: (id: number, data: Partial<import('@/types').GuestFormData>) =>
    request<{ message: string; data: import('@/types').Guest; duplicate?: import('@/types').Guest }>(
      `/guests/${id}`,
      { method: 'PUT', body: JSON.stringify(data) }
    ),

  /**
   * Delete a guest.
   */
  delete: (id: number) =>
    request<{ message: string; guest_id: number }>(`/guests/${id}`, { method: 'DELETE' }),
};

// ─── Reservations API ─────────────────────────────────────────────────────────────

export const reservationsApi = {
  /**
   * Fetch all reservations with optional filtering, sorting, and pagination.
   */
  list: (params?: {
    search?: string;
    status?: string;
    payment_status?: string;
    guest_id?: number;
    room_id?: number;
    room_type_id?: number;
    source?: string;
    group_id?: number;
    date_from?: string;
    date_to?: string;
    sort?: string;
    direction?: string;
    per_page?: number;
    page?: number;
  }) => {
    const queryString = new URLSearchParams();
    if (params?.search) queryString.append('search', params.search);
    if (params?.status) queryString.append('status', params.status);
    if (params?.payment_status) queryString.append('payment_status', params.payment_status);
    if (params?.guest_id) queryString.append('guest_id', String(params.guest_id));
    if (params?.room_id) queryString.append('room_id', String(params.room_id));
    if (params?.room_type_id) queryString.append('room_type_id', String(params.room_type_id));
    if (params?.source) queryString.append('source', params.source);
    if (params?.group_id) queryString.append('group_id', String(params.group_id));
    if (params?.date_from) queryString.append('date_from', params.date_from);
    if (params?.date_to) queryString.append('date_to', params.date_to);
    if (params?.sort) queryString.append('sort', params.sort);
    if (params?.direction) queryString.append('direction', params.direction);
    if (params?.per_page) queryString.append('per_page', String(params.per_page));
    if (params?.page) queryString.append('page', String(params.page));
    const query = queryString.toString();
    return request<{
      data: import('@/types').Reservation[];
      meta: {
        current_page: number;
        from: number;
        last_page: number;
        per_page: number;
        to: number;
        total: number;
      };
      links: {
        first: string | null;
        last: string | null;
        prev: string | null;
        next: string | null;
      };
    }>(`/reservations${query ? `?${query}` : ''}`);
  },

  /**
   * Quick search for reservations (faster, limited results).
   */
  search: (query: string, perPage?: number) => {
    const queryString = new URLSearchParams();
    queryString.append('q', query);
    if (perPage) queryString.append('per_page', String(perPage));
    return request<{ data: import('@/types').Reservation[] }>(
      `/reservations/search?${queryString.toString()}`
    );
  },

  /**
   * Fetch a single reservation by ID.
   */
  get: (id: number) =>
    request<{ data: import('@/types').Reservation }>(`/reservations/${id}`),

  /**
   * Create a new reservation.
   */
  create: (data: import('@/types').ReservationFormData) =>
    request<{ message: string; data: import('@/types').Reservation }>(
      '/reservations',
      { method: 'POST', body: JSON.stringify(data) }
    ),

  /**
   * Update an existing reservation.
   */
  update: (id: number, data: Partial<import('@/types').ReservationFormData>) =>
    request<{ message: string; data: import('@/types').Reservation }>(
      `/reservations/${id}`,
      { method: 'PUT', body: JSON.stringify(data) }
    ),

  /**
   * Delete a reservation.
   */
  delete: (id: number) =>
    request<{ message: string; guest_id: number }>(`/reservations/${id}`, { method: 'DELETE' }),

  /**
   * Check-in guest for reservation.
   */
  checkIn: (id: number) =>
    request<{ message: string; data: import('@/types').Reservation }>(
      `/reservations/${id}/check-in`,
      { method: 'POST', body: JSON.stringify({}) }
    ),

  /**
   * Check-out guest from reservation.
   */
  checkOut: (id: number) =>
    request<{ message: string; data: import('@/types').Reservation }>(
      `/reservations/${id}/check-out`,
      { method: 'POST', body: JSON.stringify({}) }
    ),

  /**
   * Cancel reservation.
   */
  cancel: (id: number, reason: string) =>
    request<{ message: string; data: import('@/types').Reservation }>(
      `/reservations/${id}/cancel`,
      { method: 'POST', body: JSON.stringify({ cancellation_reason: reason }) }
    ),

  /**
   * Mark reservation as no-show.
   */
  markNoShow: (id: number) =>
    request<{ message: string; data: import('@/types').Reservation }>(
      `/reservations/${id}/no-show`,
      { method: 'POST', body: JSON.stringify({}) }
    ),

  /**
   * Express check-in (auto-assign room, skip modal).
   */
  expressCheckIn: (id: number) =>
    request<{ message: string; data: import('@/types').Reservation }>(
      `/reservations/${id}/express-check-in`,
      { method: 'POST', body: JSON.stringify({}) }
    ),

  /**
   * Express check-out (skip modal, update room status).
   */
  expressCheckOut: (id: number) =>
    request<{ message: string; data: import('@/types').Reservation }>(
      `/reservations/${id}/express-check-out`,
      { method: 'POST', body: JSON.stringify({}) }
    ),

  /**
   * Split reservation into two with different rooms.
   */
  split: (id: number, data: { room_id: number; adults?: number; children?: number }) =>
    request<{ message: string; data: import('@/types').Reservation }>(
      `/reservations/${id}/split`,
      { method: 'POST', body: JSON.stringify(data) }
    ),

  /**
   * Add reservation to a group.
   */
  addToGroup: (id: number, data: { group_id?: number }) =>
    request<{ message: string; data: import('@/types').Reservation }>(
      `/reservations/${id}/add-to-group`,
      { method: 'POST', body: JSON.stringify(data) }
    ),
};

// ─── Rate Plans API ───────────────────────────────────────────────────────────

export const ratePlansApi = {
  /**
   * Fetch all rate plans with optional filtering, sorting, and pagination.
   */
  list: (params?: {
    search?: string;
    active?: boolean;
    channel_id?: number;
    room_type_id?: number;
    sort?: string;
    direction?: string;
    per_page?: number;
    page?: number;
  }) => {
    const queryString = new URLSearchParams();
    if (params?.search) queryString.append('search', params.search);
    if (params?.active !== undefined) queryString.append('active', String(params.active));
    if (params?.channel_id) queryString.append('channel_id', String(params.channel_id));
    if (params?.room_type_id) queryString.append('room_type_id', String(params.room_type_id));
    if (params?.sort) queryString.append('sort', params.sort);
    if (params?.direction) queryString.append('direction', params.direction);
    if (params?.per_page) queryString.append('per_page', String(params.per_page));
    if (params?.page) queryString.append('page', String(params.page));
    const query = queryString.toString();
    return request<{
      data: import('@/types').RatePlan[];
      meta: {
        current_page: number;
        from: number;
        last_page: number;
        per_page: number;
        to: number;
        total: number;
      };
      links: {
        first: string | null;
        last: string | null;
        prev: string | null;
        next: string | null;
      };
    }>(`/rate-plans${query ? `?${query}` : ''}`);
  },

  /**
   * Quick search for rate plans (faster, limited results).
   */
  search: (query: string, perPage?: number) => {
    const queryString = new URLSearchParams();
    queryString.append('q', query);
    if (perPage) queryString.append('per_page', String(perPage));
    return request<{ data: import('@/types').RatePlan[] }>(
      `/rate-plans/search?${queryString.toString()}`
    );
  },

  /**
   * Fetch a single rate plan by ID.
   */
  get: (id: number) =>
    request<{ data: import('@/types').RatePlan }>(`/rate-plans/${id}`),

  /**
   * Create a new rate plan.
   */
  create: (data: import('@/types').RatePlanFormData) =>
    request<{ message: string; data: import('@/types').RatePlan }>(
      '/rate-plans',
      { method: 'POST', body: JSON.stringify(data) }
    ),

  /**
   * Update an existing rate plan.
   */
  update: (id: number, data: Partial<import('@/types').RatePlanFormData>) =>
    request<{ message: string; data: import('@/types').RatePlan }>(
      `/rate-plans/${id}`,
      { method: 'PUT', body: JSON.stringify(data) }
    ),

  /**
   * Delete a rate plan.
   */
  delete: (id: number) =>
    request<{ message: string }>(`/rate-plans/${id}`, { method: 'DELETE' }),

  /**
   * Activate a rate plan.
   */
  activate: (id: number) =>
    request<{ message: string; data: import('@/types').RatePlan }>(
      `/rate-plans/${id}/activate`,
      { method: 'POST', body: JSON.stringify({}) }
    ),

  /**
   * Deactivate a rate plan.
   */
  deactivate: (id: number) =>
    request<{ message: string; data: import('@/types').RatePlan }>(
      `/rate-plans/${id}/deactivate`,
      { method: 'POST', body: JSON.stringify({}) }
    ),

  /**
   * Duplicate a rate plan.
   */
  duplicate: (id: number, data: { name: string }) =>
    request<{ message: string; data: import('@/types').RatePlan }>(
      `/rate-plans/${id}/duplicate`,
      { method: 'POST', body: JSON.stringify(data) }
    ),
};

// ─── Housekeeping API ─────────────────────────────────────────────────────────

export const housekeepingApi = {
  /**
   * Fetch housekeeping board view (kanban-style).
   */
  board: (date?: string) => {
    const queryString = date ? `?date=${date}` : '';
    return request<import('@/types').HousekeepingBoard>(
      `/housekeeping/board${queryString}`
    );
  },

  /**
   * Fetch housekeeping summary statistics.
   */
  summary: (date?: string) => {
    const queryString = date ? `?date=${date}` : '';
    return request<import('@/types').HousekeepingSummary>(
      `/housekeeping/summary${queryString}`
    );
  },

  /**
   * Fetch all housekeeping tasks with optional filtering.
   */
  list: (params?: {
    status?: string;
    priority?: string;
    date?: string;
    room_id?: number;
    assigned_to?: number;
    per_page?: number;
  }) => {
    const queryString = new URLSearchParams();
    if (params?.status) queryString.append('status', params.status);
    if (params?.priority) queryString.append('priority', params.priority);
    if (params?.date) queryString.append('date', params.date);
    if (params?.room_id) queryString.append('room_id', String(params.room_id));
    if (params?.assigned_to) queryString.append('assigned_to', String(params.assigned_to));
    if (params?.per_page) queryString.append('per_page', String(params.per_page));
    const query = queryString.toString();
    return request<{ data: import('@/types').HousekeepingTask[] }>(
      `/housekeeping${query ? `?${query}` : ''}`
    );
  },

  /**
   * Fetch a single housekeeping task.
   */
  get: (id: number) =>
    request<{ data: import('@/types').HousekeepingTask }>(`/housekeeping/${id}`),

  /**
   * Create a new housekeeping task.
   */
  create: (data: {
    room_id: number;
    assigned_to?: number;
    task_type: 'cleaning' | 'inspection' | 'maintenance' | 'turnover' | 'deep_clean';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    scheduled_at: string;
    notes?: string;
    checklist?: string[];
  }) =>
    request<{ message: string; task: import('@/types').HousekeepingTask }>(
      '/housekeeping',
      { method: 'POST', body: JSON.stringify(data) }
    ),

  /**
   * Bulk create housekeeping tasks for multiple rooms.
   */
  bulkCreate: (data: {
    room_ids: number[];
    task_type: 'cleaning' | 'inspection' | 'maintenance' | 'turnover' | 'deep_clean';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    scheduled_at: string;
    assigned_to?: number;
    notes?: string;
  }) =>
    request<{ message: string; tasks: import('@/types').HousekeepingTask[] }>(
      '/housekeeping/bulk',
      { method: 'POST', body: JSON.stringify(data) }
    ),

  /**
   * Update a housekeeping task.
   */
  update: (id: number, data: Partial<{
    assigned_to?: number;
    task_type?: 'cleaning' | 'inspection' | 'maintenance' | 'turnover' | 'deep_clean';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    status?: 'pending' | 'in_progress' | 'completed' | 'skipped';
    scheduled_at?: string;
    notes?: string;
    checklist?: string[];
  }>) =>
    request<{ message: string; task: import('@/types').HousekeepingTask }>(
      `/housekeeping/${id}`,
      { method: 'PUT', body: JSON.stringify(data) }
    ),

  /**
   * Delete a housekeeping task.
   */
  delete: (id: number) =>
    request<{ message: string }>(`/housekeeping/${id}`, { method: 'DELETE' }),

  /**
   * Assign a task to a staff member.
   */
  assign: (id: number, data: { assigned_to: number }) =>
    request<{ message: string; task: import('@/types').HousekeepingTask }>(
      `/housekeeping/${id}/assign`,
      { method: 'POST', body: JSON.stringify(data) }
    ),
};

// ─── Billing API ─────────────────────────────────────────────────────────────

export const billingApi = {
  // Folios
  folios: {
    list: (params?: {
      reservation_id?: number;
      guest_id?: number;
      status?: string;
      folio_number?: string;
      with_balance?: boolean;
      sort?: string;
      direction?: string;
      per_page?: number;
    }) => {
      const queryString = new URLSearchParams();
      if (params?.reservation_id) queryString.append('reservation_id', String(params.reservation_id));
      if (params?.guest_id) queryString.append('guest_id', String(params.guest_id));
      if (params?.status) queryString.append('status', params.status);
      if (params?.folio_number) queryString.append('folio_number', params.folio_number);
      if (params?.with_balance) queryString.append('with_balance', 'true');
      if (params?.sort) queryString.append('sort', params.sort);
      if (params?.direction) queryString.append('direction', params.direction);
      if (params?.per_page) queryString.append('per_page', String(params.per_page));
      const query = queryString.toString();
      return request<{
        data: import('@/types').Folio[];
        meta: {
          current_page: number;
          from: number;
          last_page: number;
          per_page: number;
          to: number;
          total: number;
        };
        links: {
          first: string;
          last: string;
          prev: string | null;
          next: string | null;
        };
      }>(`/billing/folios${query ? `?${query}` : ''}`);
    },

    get: (id: number) =>
      request<{ data: import('@/types').Folio }>(`/billing/folios/${id}`),

    create: (data: import('@/types').FolioFormData) =>
      request<{ message: string; data: import('@/types').Folio }>(
        '/billing/folios',
        { method: 'POST', body: JSON.stringify(data) }
      ),

    update: (id: number, data: Partial<import('@/types').FolioFormData>) =>
      request<{ message: string; data: import('@/types').Folio }>(
        `/billing/folios/${id}`,
        { method: 'PUT', body: JSON.stringify(data) }
      ),

    delete: (id: number) =>
      request<{ message: string }>(`/billing/folios/${id}`, { method: 'DELETE' }),

    close: (id: number) =>
      request<{ message: string; data: import('@/types').Folio }>(
        `/billing/folios/${id}/close`,
        { method: 'POST', body: JSON.stringify({}) }
      ),

    reopen: (id: number) =>
      request<{ message: string; data: import('@/types').Folio }>(
        `/billing/folios/${id}/reopen`,
        { method: 'POST', body: JSON.stringify({}) }
      ),
  },

  // Charges
  charges: {
    list: (params?: {
      folio_id?: number;
      reservation_id?: number;
      charge_type?: string;
      date_from?: string;
      date_to?: string;
      sort?: string;
      direction?: string;
      per_page?: number;
    }) => {
      const queryString = new URLSearchParams();
      if (params?.folio_id) queryString.append('folio_id', String(params.folio_id));
      if (params?.reservation_id) queryString.append('reservation_id', String(params.reservation_id));
      if (params?.charge_type) queryString.append('charge_type', params.charge_type);
      if (params?.date_from) queryString.append('date_from', params.date_from);
      if (params?.date_to) queryString.append('date_to', params.date_to);
      if (params?.sort) queryString.append('sort', params.sort);
      if (params?.direction) queryString.append('direction', params.direction);
      if (params?.per_page) queryString.append('per_page', String(params.per_page));
      const query = queryString.toString();
      return request<{
        data: import('@/types').Charge[];
        meta: {
          current_page: number;
          from: number;
          last_page: number;
          per_page: number;
          to: number;
          total: number;
        };
        links: {
          first: string;
          last: string;
          prev: string | null;
          next: string | null;
        };
      }>(`/billing/charges${query ? `?${query}` : ''}`);
    },

    get: (id: number) =>
      request<{ data: import('@/types').Charge }>(`/billing/charges/${id}`),

    create: (data: import('@/types').ChargeFormData) =>
      request<{ message: string; data: import('@/types').Charge }>(
        '/billing/charges',
        { method: 'POST', body: JSON.stringify(data) }
      ),

    update: (id: number, data: Partial<import('@/types').ChargeFormData>) =>
      request<{ message: string; data: import('@/types').Charge }>(
        `/billing/charges/${id}`,
        { method: 'PUT', body: JSON.stringify(data) }
      ),

    delete: (id: number) =>
      request<{ message: string }>(`/billing/charges/${id}`, { method: 'DELETE' }),
  },

  // Payments
  payments: {
    list: (params?: {
      folio_id?: number;
      reservation_id?: number;
      payment_method?: string;
      status?: string;
      date_from?: string;
      date_to?: string;
      sort?: string;
      direction?: string;
      per_page?: number;
    }) => {
      const queryString = new URLSearchParams();
      if (params?.folio_id) queryString.append('folio_id', String(params.folio_id));
      if (params?.reservation_id) queryString.append('reservation_id', String(params.reservation_id));
      if (params?.payment_method) queryString.append('payment_method', params.payment_method);
      if (params?.status) queryString.append('status', params.status);
      if (params?.date_from) queryString.append('date_from', params.date_from);
      if (params?.date_to) queryString.append('date_to', params.date_to);
      if (params?.sort) queryString.append('sort', params.sort);
      if (params?.direction) queryString.append('direction', params.direction);
      if (params?.per_page) queryString.append('per_page', String(params.per_page));
      const query = queryString.toString();
      return request<{
        data: import('@/types').Payment[];
        meta: {
          current_page: number;
          from: number;
          last_page: number;
          per_page: number;
          to: number;
          total: number;
        };
        links: {
          first: string;
          last: string;
          prev: string | null;
          next: string | null;
        };
      }>(`/billing/payments${query ? `?${query}` : ''}`);
    },

    get: (id: number) =>
      request<{ data: import('@/types').Payment }>(`/billing/payments/${id}`),

    create: (data: import('@/types').PaymentFormData) =>
      request<{ message: string; data: import('@/types').Payment }>(
        '/billing/payments',
        { method: 'POST', body: JSON.stringify(data) }
      ),

    update: (id: number, data: Partial<import('@/types').PaymentFormData>) =>
      request<{ message: string; data: import('@/types').Payment }>(
        `/billing/payments/${id}`,
        { method: 'PUT', body: JSON.stringify(data) }
      ),

    delete: (id: number) =>
      request<{ message: string }>(`/billing/payments/${id}`, { method: 'DELETE' }),

    refund: (id: number) =>
      request<{ message: string; data: import('@/types').Payment }>(
        `/billing/payments/${id}/refund`,
        { method: 'POST', body: JSON.stringify({}) }
      ),
  },
};

// ─── Notifications API ───────────────────────────────────────────────────────────

export const notificationsApi = {
  /**
   * Fetch all notifications for the authenticated user.
   */
  list: (params?: { is_read?: boolean; type?: string; per_page?: number }) => {
    const queryString = new URLSearchParams();
    if (params?.is_read !== undefined) queryString.append('is_read', String(params.is_read));
    if (params?.type) queryString.append('type', params.type);
    if (params?.per_page) queryString.append('per_page', String(params.per_page));
    const query = queryString.toString();
    return request<{
      data: import('@/types').Notification[];
      meta: {
        current_page: number;
        from: number;
        last_page: number;
        per_page: number;
        to: number;
        total: number;
      };
      unread_count: number;
    }>(`/notifications${query ? `?${query}` : ''}`);
  },

  /**
   * Get unread count for the authenticated user.
   */
  unreadCount: () =>
    request<{ unread_count: number }>('/notifications/unread-count'),

  /**
   * Mark a specific notification as read.
   */
  markAsRead: (id: number) =>
    request<{ message: string; data: import('@/types').Notification }>(
      `/notifications/${id}/mark-read`,
      { method: 'POST', body: JSON.stringify({}) }
    ),

  /**
   * Mark all notifications as read for the authenticated user.
   */
  markAllAsRead: () =>
    request<{ message: string }>(
      '/notifications/mark-all-read',
      { method: 'POST', body: JSON.stringify({}) }
    ),

  /**
   * Delete a specific notification.
   */
  delete: (id: number) =>
    request<{ message: string }>(`/notifications/${id}`, { method: 'DELETE' }),
};

// ─── Maintenance API ─────────────────────────────────────────────────────────────

export const maintenanceApi = {
  /**
   * Get board view data (grouped by status).
   */
  board: (params?: { room_id?: number; priority?: string }) => {
    const queryString = new URLSearchParams();
    if (params?.room_id) queryString.append('room_id', String(params.room_id));
    if (params?.priority) queryString.append('priority', params.priority);
    const query = queryString.toString();
    return request<{
      board: {
        pending: import('@/types').MaintenanceRequest[];
        in_progress: import('@/types').MaintenanceRequest[];
        completed: import('@/types').MaintenanceRequest[];
        cancelled: import('@/types').MaintenanceRequest[];
      };
      summary: {
        total: number;
        pending: number;
        in_progress: number;
        completed: number;
        urgent: number;
      };
    }>(`/maintenance/board${query ? `?${query}` : ''}`);
  },

  /**
   * Get all maintenance requests.
   */
  list: (params?: {
    status?: string;
    priority?: string;
    room_id?: number;
    assigned_to?: number;
    per_page?: number;
  }) => {
    const queryString = new URLSearchParams();
    if (params?.status) queryString.append('status', params.status);
    if (params?.priority) queryString.append('priority', params.priority);
    if (params?.room_id) queryString.append('room_id', String(params.room_id));
    if (params?.assigned_to) queryString.append('assigned_to', String(params.assigned_to));
    if (params?.per_page) queryString.append('per_page', String(params.per_page));
    const query = queryString.toString();
    return request<{
      data: import('@/types').MaintenanceRequest[];
      meta: {
        current_page: number;
        from: number;
        last_page: number;
        per_page: number;
        to: number;
        total: number;
      };
    }>(`/maintenance${query ? `?${query}` : ''}`);
  },

  /**
   * Get a specific maintenance request.
   */
  get: (id: number) =>
    request<{ data: import('@/types').MaintenanceRequest }>(`/maintenance/${id}`),

  /**
   * Create a new maintenance request.
   */
  create: (data: {
    room_id: number;
    title: string;
    description: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    assigned_to?: number;
  }) =>
    request<{ message: string; data: import('@/types').MaintenanceRequest }>(
      '/maintenance',
      { method: 'POST', body: JSON.stringify(data) }
    ),

  /**
   * Update a maintenance request.
   */
  update: (id: number, data: {
    title?: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    assigned_to?: number;
    status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    resolution_notes?: string;
  }) =>
    request<{ message: string; data: import('@/types').MaintenanceRequest }>(
      `/maintenance/${id}`,
      { method: 'PUT', body: JSON.stringify(data) }
    ),

  /**
   * Delete a maintenance request.
   */
  delete: (id: number) =>
    request<{ message: string }>(`/maintenance/${id}`, { method: 'DELETE' }),

  /**
   * Assign a maintenance request to a user.
   */
  assign: (id: number, assigned_to: number) =>
    request<{ message: string; data: import('@/types').MaintenanceRequest }>(
      `/maintenance/${id}/assign`,
      { method: 'POST', body: JSON.stringify({ assigned_to }) }
    ),

  /**
   * Mark maintenance request as in progress.
   */
  markAsInProgress: (id: number) =>
    request<{ message: string; data: import('@/types').MaintenanceRequest }>(
      `/maintenance/${id}/mark-in-progress`,
      { method: 'POST', body: JSON.stringify({}) }
    ),

  /**
   * Mark maintenance request as completed.
   */
  markAsCompleted: (id: number, resolution_notes?: string) =>
    request<{ message: string; data: import('@/types').MaintenanceRequest }>(
      `/maintenance/${id}/mark-completed`,
      { method: 'POST', body: JSON.stringify({ resolution_notes }) }
    ),

  /**
   * Cancel a maintenance request.
   */
  cancel: (id: number) =>
    request<{ message: string; data: import('@/types').MaintenanceRequest }>(
      `/maintenance/${id}/cancel`,
      { method: 'POST', body: JSON.stringify({}) }
    ),
};

// ─── Audit Logs API ───────────────────────────────────────────────────────────────

export const auditLogsApi = {
  /**
   * Get all activity logs (Admin only).
   */
  list: (params?: {
    causer_id?: number;
    subject_type?: string;
    date_from?: string;
    date_to?: string;
    per_page?: number;
  }) => {
    const queryString = new URLSearchParams();
    if (params?.causer_id) queryString.append('causer_id', String(params.causer_id));
    if (params?.subject_type) queryString.append('subject_type', params.subject_type);
    if (params?.date_from) queryString.append('date_from', params.date_from);
    if (params?.date_to) queryString.append('date_to', params.date_to);
    if (params?.per_page) queryString.append('per_page', String(params.per_page));
    const query = queryString.toString();
    return request<{
      data: import('@/types').ActivityLog[];
      meta: {
        current_page: number;
        from: number;
        last_page: number;
        per_page: number;
        to: number;
        total: number;
      };
    }>(`/audit-logs${query ? `?${query}` : ''}`);
  },

  /**
   * Get a specific activity log entry (Admin only).
   */
  get: (id: number) =>
    request<{ data: import('@/types').ActivityLog }>(`/audit-logs/${id}`),
};

// ─── POS Menu Categories API ───────────────────────────────────────────────────────

export const menuCategoriesApi = {
  list: () =>
    request<{ data: import('@/types').MenuCategory[] }>('/menu-categories'),

  get: (id: number) =>
    request<{ data: import('@/types').MenuCategory }>(`/menu-categories/${id}`),

  create: (data: {
    name: string;
    description?: string;
    sort_order?: number;
    is_active?: boolean;
    image_url?: string;
  }) =>
    request<{ message: string; data: import('@/types').MenuCategory }>(
      '/menu-categories',
      { method: 'POST', body: JSON.stringify(data) }
    ),

  update: (id: number, data: {
    name?: string;
    description?: string;
    sort_order?: number;
    is_active?: boolean;
    image_url?: string;
  }) =>
    request<{ message: string; data: import('@/types').MenuCategory }>(
      `/menu-categories/${id}`,
      { method: 'PUT', body: JSON.stringify(data) }
    ),

  delete: (id: number) =>
    request<{ message: string }>(`/menu-categories/${id}`, { method: 'DELETE' }),
};

// ─── POS Menu Items API ───────────────────────────────────────────────────────────

export const menuItemsApi = {
  list: (params?: { category_id?: number; active?: boolean; search?: string }) => {
    const queryString = new URLSearchParams();
    if (params?.category_id) queryString.append('category_id', String(params.category_id));
    if (params?.active !== undefined) queryString.append('active', String(params.active));
    if (params?.search) queryString.append('search', params.search);
    const query = queryString.toString();
    return request<{ data: import('@/types').MenuItem[] }>(
      `/menu-items${query ? `?${query}` : ''}`
    );
  },

  get: (id: number) =>
    request<{ data: import('@/types').MenuItem }>(`/menu-items/${id}`),

  create: (data: {
    menu_category_id: number;
    name: string;
    description?: string;
    price: number;
    cost?: number;
    image_url?: string;
    is_active?: boolean;
    sort_order?: number;
    modifiers?: Record<string, unknown>[];
    track_inventory?: boolean;
    preparation_time_minutes?: number;
  }) =>
    request<{ message: string; data: import('@/types').MenuItem }>(
      '/menu-items',
      { method: 'POST', body: JSON.stringify(data) }
    ),

  update: (id: number, data: {
    menu_category_id?: number;
    name?: string;
    description?: string;
    price?: number;
    cost?: number;
    image_url?: string;
    is_active?: boolean;
    sort_order?: number;
    modifiers?: Record<string, unknown>[];
    track_inventory?: boolean;
    preparation_time_minutes?: number;
  }) =>
    request<{ message: string; data: import('@/types').MenuItem }>(
      `/menu-items/${id}`,
      { method: 'PUT', body: JSON.stringify(data) }
    ),

  delete: (id: number) =>
    request<{ message: string }>(`/menu-items/${id}`, { method: 'DELETE' }),
};

// ─── POS Orders API ───────────────────────────────────────────────────────────────

export const ordersApi = {
  list: (params?: {
    status?: string;
    order_type?: string;
    date_from?: string;
    date_to?: string;
    user_id?: number;
    per_page?: number;
  }) => {
    const queryString = new URLSearchParams();
    if (params?.status) queryString.append('status', params.status);
    if (params?.order_type) queryString.append('order_type', params.order_type);
    if (params?.date_from) queryString.append('date_from', params.date_from);
    if (params?.date_to) queryString.append('date_to', params.date_to);
    if (params?.user_id) queryString.append('user_id', String(params.user_id));
    if (params?.per_page) queryString.append('per_page', String(params.per_page));
    const query = queryString.toString();
    return request<{
      data: import('@/types').Order[];
      meta: {
        current_page: number;
        from: number;
        last_page: number;
        per_page: number;
        to: number;
        total: number;
      };
    }>(`/orders${query ? `?${query}` : ''}`);
  },

  get: (id: number) =>
    request<{ data: import('@/types').Order }>(`/orders/${id}`),

  create: (data: {
    order_type: 'dine_in' | 'takeaway' | 'room_service';
    table_number?: string;
    guest_name?: string;
    guest_room?: string;
    guest_folio_id?: string;
    notes?: string;
  }) =>
    request<{ message: string; data: import('@/types').Order }>(
      '/orders',
      { method: 'POST', body: JSON.stringify(data) }
    ),

  update: (id: number, data: {
    status?: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
    table_number?: string;
    notes?: string;
    cancellation_reason?: string;
    refund_reason?: string;
  }) =>
    request<{ message: string; data: import('@/types').Order }>(
      `/orders/${id}`,
      { method: 'PUT', body: JSON.stringify(data) }
    ),

  delete: (id: number) =>
    request<{ message: string }>(`/orders/${id}`, { method: 'DELETE' }),

  addItem: (orderId: number, data: {
    menu_item_id: number;
    quantity: number;
    selected_modifiers?: Record<string, unknown>[];
    notes?: string;
  }) =>
    request<{ message: string; data: import('@/types').OrderItem }>(
      `/orders/${orderId}/items`,
      { method: 'POST', body: JSON.stringify(data) }
    ),

  updateItem: (orderId: number, itemId: number, data: {
    quantity?: number;
    notes?: string;
  }) =>
    request<{ message: string; data: import('@/types').OrderItem }>(
      `/orders/${orderId}/items/${itemId}`,
      { method: 'PUT', body: JSON.stringify(data) }
    ),

  deleteItem: (orderId: number, itemId: number) =>
    request<{ message: string }>(
      `/orders/${orderId}/items/${itemId}`,
      { method: 'DELETE' }
    ),

  addPayment: (orderId: number, data: {
    payment_method_id: number;
    amount: number;
    reference_number?: string;
    notes?: string;
  }) =>
    request<{ message: string; data: import('@/types').OrderPayment }>(
      `/orders/${orderId}/payments`,
      { method: 'POST', body: JSON.stringify(data) }
    ),

  complete: (id: number) =>
    request<{ message: string; data: import('@/types').Order }>(
      `/orders/${id}/complete`,
      { method: 'POST', body: JSON.stringify({}) }
    ),

  cancel: (id: number, reason: string) =>
    request<{ message: string; data: import('@/types').Order }>(
      `/orders/${id}/cancel`,
      { method: 'POST', body: JSON.stringify({ cancellation_reason: reason }) }
    ),
};

// ─── POS Cash Shifts API ───────────────────────────────────────────────────────────

export const cashShiftsApi = {
  list: (params?: { user_id?: number; status?: string; per_page?: number }) => {
    const queryString = new URLSearchParams();
    if (params?.user_id) queryString.append('user_id', String(params.user_id));
    if (params?.status) queryString.append('status', params.status);
    if (params?.per_page) queryString.append('per_page', String(params.per_page));
    const query = queryString.toString();
    return request<{ data: import('@/types').CashShift[] }>(
      `/cash-shifts${query ? `?${query}` : ''}`
    );
  },

  get: (id: number) =>
    request<{ data: import('@/types').CashShift }>(`/cash-shifts/${id}`),

  getCurrent: () =>
    request<{ data: import('@/types').CashShift | null }>('/cash-shifts/current'),

  open: (data: { opening_cash: number }) =>
    request<{ message: string; data: import('@/types').CashShift }>(
      '/cash-shifts/open',
      { method: 'POST', body: JSON.stringify(data) }
    ),

  close: (id: number, data: { counted_cash: number; closing_notes?: string }) =>
    request<{ message: string; data: import('@/types').CashShift }>(
      `/cash-shifts/${id}/close`,
      { method: 'POST', body: JSON.stringify(data) }
    ),
};

// ─── POS Returns API ───────────────────────────────────────────────────────────────

export const returnsApi = {
  list: (params?: { status?: string; order_id?: number; per_page?: number }) => {
    const queryString = new URLSearchParams();
    if (params?.status) queryString.append('status', params.status);
    if (params?.order_id) queryString.append('order_id', String(params.order_id));
    if (params?.per_page) queryString.append('per_page', String(params.per_page));
    const query = queryString.toString();
    return request<{
      data: import('@/types').OrderReturn[];
      meta: {
        current_page: number;
        from: number;
        last_page: number;
        per_page: number;
        to: number;
        total: number;
      };
    }>(`/returns${query ? `?${query}` : ''}`);
  },

  get: (id: number) =>
    request<{ data: import('@/types').OrderReturn }>(`/returns/${id}`),

  create: (data: {
    order_id: number;
    reason: string;
    total_amount?: number;
    refund_amount?: number;
    refund_method?: 'cash' | 'card' | 'room_charge' | 'original_payment';
    items?: Array<{
      order_item_id: number;
      menu_item_id: number;
      quantity: number;
      unit_price: number;
      total_amount: number;
      reason?: string;
    }>;
  }) => {
    const payload = {
      order_id: data.order_id,
      reason: data.reason,
      total_amount: data.total_amount !== undefined ? data.total_amount : (data.refund_amount || 0),
      refund_method: data.refund_method || 'original_payment',
      items: data.items || [],
    };
    return request<{ message: string; data: import('@/types').OrderReturn }>(
      '/returns',
      { method: 'POST', body: JSON.stringify(payload) }
    );
  },

  approve: (id: number) =>
    request<{ message: string; data: import('@/types').OrderReturn }>(
      `/returns/${id}/approve`,
      { method: 'POST', body: JSON.stringify({}) }
    ),

  reject: (id: number, reason?: string) =>
    request<{ message: string; data: import('@/types').OrderReturn }>(
      `/returns/${id}/reject`,
      { method: 'POST', body: JSON.stringify({ rejection_reason: reason || 'Rejected' }) }
    ),
};

// ─── POS Inventory API ─────────────────────────────────────────────────────────────

export const inventoryApi = {
  list: (params?: { active?: boolean; low_stock?: boolean; per_page?: number }) => {
    const queryString = new URLSearchParams();
    if (params?.active !== undefined) queryString.append('active', String(params.active));
    if (params?.low_stock !== undefined) queryString.append('low_stock', String(params.low_stock));
    if (params?.per_page) queryString.append('per_page', String(params.per_page));
    const query = queryString.toString();
    return request<{ data: import('@/types').Inventory[] }>(
      `/inventory${query ? `?${query}` : ''}`
    );
  },

  get: (id: number) =>
    request<{ data: import('@/types').Inventory }>(`/inventory/${id}`),

  create: (data: {
    name: string;
    sku?: string;
    current_stock?: number;
    minimum_stock?: number;
    reorder_level?: number;
    unit?: string;
    unit_cost?: number;
    is_active?: boolean;
  }) =>
    request<{ message: string; data: import('@/types').Inventory }>(
      '/inventory',
      { method: 'POST', body: JSON.stringify(data) }
    ),

  update: (id: number, data: {
    name?: string;
    sku?: string;
    current_stock?: number;
    minimum_stock?: number;
    reorder_level?: number;
    unit?: string;
    unit_cost?: number;
    is_active?: boolean;
  }) =>
    request<{ message: string; data: import('@/types').Inventory }>(
      `/inventory/${id}`,
      { method: 'PUT', body: JSON.stringify(data) }
    ),

  delete: (id: number) =>
    request<{ message: string }>(`/inventory/${id}`, { method: 'DELETE' }),

  adjust: (id: number, data: {
    adjustment_type: 'add' | 'remove' | 'waste';
    quantity: number;
    reason: string;
  }) =>
    request<{ message: string; data: import('@/types').InventoryAdjustment }>(
      `/inventory/${id}/adjust`,
      { method: 'POST', body: JSON.stringify(data) }
    ),

  adjustments: (id: number) =>
    request<{ data: import('@/types').InventoryAdjustment[] }>(`/inventory/${id}/adjustments`),
};

// ─── POS Settings API ───────────────────────────────────────────────────────────────

export const posSettingsApi = {
  get: () =>
    request<{ data: import('@/types').PosSetting }>('/pos-settings'),

  update: (data: {
    require_open_shift_for_cash?: boolean;
    auto_print_receipt?: boolean;
    default_payment_method?: string;
    receipt_footer?: string;
    tax_percentage?: number;
    service_charge_percentage?: number;
    currency?: string;
    currency_symbol?: string;
    auto_approve_return_threshold?: number;
  }) =>
    request<{ message: string; data: import('@/types').PosSetting }>(
      '/pos-settings',
      { method: 'PUT', body: JSON.stringify(data) }
    ),
};

// ─── POS Payment Methods API ───────────────────────────────────────────────────────

export const paymentMethodsApi = {
  list: () =>
    request<{ data: import('@/types').PaymentMethod[] }>('/payment-methods'),

  get: (id: number) =>
    request<{ data: import('@/types').PaymentMethod }>(`/payment-methods/${id}`),

  create: (data: {
    name: string;
    code: string;
    is_active?: boolean;
    sort_order?: number;
  }) =>
    request<{ message: string; data: import('@/types').PaymentMethod }>(
      '/payment-methods',
      { method: 'POST', body: JSON.stringify(data) }
    ),

  update: (id: number, data: {
    name?: string;
    code?: string;
    is_active?: boolean;
    sort_order?: number;
  }) =>
    request<{ message: string; data: import('@/types').PaymentMethod }>(
      `/payment-methods/${id}`,
      { method: 'PUT', body: JSON.stringify(data) }
    ),

  delete: (id: number) =>
    request<{ message: string }>(`/payment-methods/${id}`, { method: 'DELETE' }),
};

// ─── POS Reports API ───────────────────────────────────────────────────────────────

export const posReportsApi = {
  sales: (params?: {
    date_from?: string;
    date_to?: string;
    period?: 'daily' | 'weekly' | 'monthly';
    dateRange?: 'daily' | 'weekly' | 'monthly';
  }) => {
    const queryString = new URLSearchParams();
    if (params?.date_from) queryString.append('date_from', params.date_from);
    if (params?.date_to) queryString.append('date_to', params.date_to);
    if (params?.period) queryString.append('period', params.period);
    if (params?.dateRange) queryString.append('period', params.dateRange);
    const query = queryString.toString();
    return request<{ data: import('@/types').SalesReport }>(
      `/reports/sales${query ? `?${query}` : ''}`
    );
  },

  revenueByCategory: (params?: {
    date_from?: string;
    date_to?: string;
    dateRange?: 'daily' | 'weekly' | 'monthly';
  }) => {
    const queryString = new URLSearchParams();
    if (params?.date_from) queryString.append('date_from', params.date_from);
    if (params?.date_to) queryString.append('date_to', params.date_to);
    if (params?.dateRange) queryString.append('period', params.dateRange);
    const query = queryString.toString();
    return request<{ data: import('@/types').RevenueByCategory[] }>(
      `/reports/revenue-by-category${query ? `?${query}` : ''}`
    );
  },

  bestSellers: (params?: {
    date_from?: string;
    date_to?: string;
    limit?: number;
    dateRange?: 'daily' | 'weekly' | 'monthly';
  }) => {
    const queryString = new URLSearchParams();
    if (params?.date_from) queryString.append('date_from', params.date_from);
    if (params?.date_to) queryString.append('date_to', params.date_to);
    if (params?.limit) queryString.append('limit', String(params.limit));
    if (params?.dateRange) queryString.append('period', params.dateRange);
    const query = queryString.toString();
    return request<{ data: import('@/types').BestSeller[] }>(
      `/reports/best-sellers${query ? `?${query}` : ''}`
    );
  },

  cashierPerformance: (params?: {
    date_from?: string;
    date_to?: string;
    dateRange?: 'daily' | 'weekly' | 'monthly';
  }) => {
    const queryString = new URLSearchParams();
    if (params?.date_from) queryString.append('date_from', params.date_from);
    if (params?.date_to) queryString.append('date_to', params.date_to);
    if (params?.dateRange) queryString.append('period', params.dateRange);
    const query = queryString.toString();
    return request<{ data: import('@/types').CashierPerformance[] }>(
      `/reports/cashier-performance${query ? `?${query}` : ''}`
    );
  },

  refunds: (params?: {
    date_from?: string;
    date_to?: string;
    dateRange?: 'daily' | 'weekly' | 'monthly';
  }) => {
    const queryString = new URLSearchParams();
    if (params?.date_from) queryString.append('date_from', params.date_from);
    if (params?.date_to) queryString.append('date_to', params.date_to);
    if (params?.dateRange) queryString.append('period', params.dateRange);
    const query = queryString.toString();
    return request<{ data: import('@/types').RefundReport }>(
      `/reports/refunds${query ? `?${query}` : ''}`
    );
  },

  export: (params?: {
    date_from?: string;
    date_to?: string;
    dateRange?: 'daily' | 'weekly' | 'monthly';
  }) => {
    const queryString = new URLSearchParams();
    if (params?.date_from) queryString.append('date_from', params.date_from);
    if (params?.date_to) queryString.append('date_to', params.date_to);
    if (params?.dateRange) queryString.append('date_range', params.dateRange);
    const query = queryString.toString();
    return request<{ message: string; download_url: string }>(
      `/reports/export${query ? `?${query}` : ''}`
    );
  },
};

// ─── Hotel Integration API ─────────────────────────────────────────────────────────

export const hotelIntegrationApi = {
  searchGuest: (query: string) =>
    request<{ data: Array<{ id: number; name: string; room_number: string; folio_id: string }> }>(
      `/hotel-integration/guests/search?q=${encodeURIComponent(query)}`
    ),

  chargeToFolio: (data: {
    guest_id: number;
    folio_id: string;
    amount: number;
    description: string;
  }) =>
    request<{ message: string }>(
      '/hotel-integration/charge-to-folio',
      { method: 'POST', body: JSON.stringify(data) }
    ),

  getSettings: () =>
    request<{ data: import('@/types').HotelIntegrationSetting }>('/hotel-integration/settings'),

  updateSettings: (data: {
    hotel_api_url?: string;
    hotel_api_token?: string;
    is_enabled?: boolean;
  }) =>
    request<{ message: string; data: import('@/types').HotelIntegrationSetting }>(
      '/hotel-integration/settings',
      { method: 'PUT', body: JSON.stringify(data) }
    ),
};

// ─── Roles API ────────────────────────────────────────────────────────────────
export const rolesApi = {
  list: () =>
    request<{ data: import('@/types').Role[] }>('/roles'),

  create: (data: {
    name: string;
    max_discount_percent?: number;
    max_discount_amount?: number;
    permissions?: string[];
  }) =>
    request<{ message: string; data: import('@/types').Role }>(
      '/roles',
      { method: 'POST', body: JSON.stringify(data) }
    ),

  update: (id: number, data: {
    name?: string;
    max_discount_percent?: number;
    max_discount_amount?: number;
    permissions?: string[];
  }) =>
    request<{ message: string; data: import('@/types').Role }>(
      `/roles/${id}`,
      { method: 'PUT', body: JSON.stringify(data) }
    ),

  delete: (id: number) =>
    request<{ message: string }>(`/roles/${id}`, { method: 'DELETE' }),
};
