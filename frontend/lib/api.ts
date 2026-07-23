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
    if (params?.category_id) queryString.append('menu_category_id', String(params.category_id));
    if (params?.active !== undefined) queryString.append('active_only', String(params.active));
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
    order_type?: 'dine_in' | 'takeaway' | 'room_service';
    status?: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded' | 'pending_payment';
    table_number?: string;
    guest_name?: string;
    guest_room?: string;
    guest_folio_id?: string;
    notes?: string;
    discount_amount?: number;
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
    request<{ message: string; data: import('@/types').Order }>(
      `/orders/${orderId}/items`,
      { method: 'POST', body: JSON.stringify(data) }
    ),

  updateItem: (orderId: number, itemId: number, data: {
    quantity?: number;
    notes?: string;
  }) =>
    request<{ message: string; data: import('@/types').Order }>(
      `/orders/${orderId}/items/${itemId}`,
      { method: 'PUT', body: JSON.stringify(data) }
    ),

  deleteItem: (orderId: number, itemId: number) =>
    request<{ message: string; data: import('@/types').Order }>(
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
      { method: 'POST', body: JSON.stringify({ reason }) }
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
    request<{ data: import('@/types').PosPaymentMethod[] }>('/payment-methods'),

  get: (id: number) =>
    request<{ data: import('@/types').PosPaymentMethod }>(`/payment-methods/${id}`),

  create: (data: {
    name: string;
    code: string;
    is_active?: boolean;
    sort_order?: number;
  }) =>
    request<{ message: string; data: import('@/types').PosPaymentMethod }>(
      '/payment-methods',
      { method: 'POST', body: JSON.stringify(data) }
    ),

  update: (id: number, data: {
    name?: string;
    code?: string;
    is_active?: boolean;
    sort_order?: number;
  }) =>
    request<{ message: string; data: import('@/types').PosPaymentMethod }>(
      `/payment-methods/${id}`,
      { method: 'PUT', body: JSON.stringify(data) }
    ),

  delete: (id: number) =>
    request<{ message: string }>(`/payment-methods/${id}`, { method: 'DELETE' }),
};

// ─── POS Tables API ─────────────────────────────────────────────────────────────────

export const tablesApi = {
  list: (params?: { status?: string }) => {
    const queryString = new URLSearchParams();
    if (params?.status) queryString.append('status', params.status);
    const query = queryString.toString();
    return request<{ data: import('@/types').Table[] }>(
      `/tables${query ? `?${query}` : ''}`
    );
  },

  get: (id: number) =>
    request<{ data: import('@/types').Table }>(`/tables/${id}`),

  create: (data: {
    number: string;
    name?: string;
    capacity?: number;
    location?: string;
    notes?: string;
  }) =>
    request<{ message: string; data: import('@/types').Table }>(
      '/tables',
      { method: 'POST', body: JSON.stringify(data) }
    ),

  update: (id: number, data: {
    number?: string;
    name?: string;
    capacity?: number;
    status?: string;
    location?: string;
    notes?: string;
  }) =>
    request<{ message: string; data: import('@/types').Table }>(
      `/tables/${id}`,
      { method: 'PUT', body: JSON.stringify(data) }
    ),

  delete: (id: number) =>
    request<{ message: string }>(`/tables/${id}`, { method: 'DELETE' }),

  updateStatus: (id: number, status: string) =>
    request<{ message: string; data: import('@/types').Table }>(
      `/tables/${id}/status`,
      { method: 'PUT', body: JSON.stringify({ status }) }
    ),

  getOrCreateOrder: (id: number) =>
    request<{ data: import('@/types').Order }>(
      `/tables/${id}/order`,
      { method: 'POST', body: JSON.stringify({}) }
    ),

  completeOrder: (id: number) =>
    request<{ message: string; data: import('@/types').Order }>(
      `/tables/${id}/complete`,
      { method: 'POST', body: JSON.stringify({}) }
    ),
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
