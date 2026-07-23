// ─── Auth Types ───────────────────────────────────────────────────────────────

export interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  roles?: Array<{ name: string; permissions?: string[] }>;
  permissions?: string[];
  is_active?: boolean;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

// ─── API Types ────────────────────────────────────────────────────────────────

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// ─── Notifications ───────────────────────────────────────────────────────────────

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  data: any;
  related_type: string | null;
  related_id: number | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Audit Logs ─────────────────────────────────────────────────────────────────

export interface ActivityLog {
  id: number;
  log_name: string | null;
  description: string;
  subject_type: string | null;
  subject_id: number | null;
  causer_type: string | null;
  causer_id: number | null;
  properties: any;
  old_values: any;
  new_values: any;
  event: string | null;
  batch_uuid: string | null;
  created_at: string;
  updated_at: string;
  causer?: {
    id: number;
    name: string;
    email: string;
  };
  subject?: any;
}

// ─── POS Menu Categories ───────────────────────────────────────────────────────────

export interface MenuCategory {
  id: number;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

// ─── POS Menu Items ──────────────────────────────────────────────────────────────

export interface MenuItem {
  id: number;
  menu_category_id: number;
  name: string;
  description: string | null;
  price: number | string;
  cost: number | string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  modifiers: Record<string, unknown>[] | null;
  track_inventory: boolean;
  preparation_time_minutes: number;
  created_at: string;
  updated_at: string;
  category?: MenuCategory;
  inventory?: MenuItemInventory[];
}

export interface MenuItemInventory {
  id: number;
  menu_item_id: number;
  inventory_id: number;
  quantity: number;
  inventory?: Inventory;
}

// ─── POS Tables ─────────────────────────────────────────────────────────────────

export interface Table {
  id: number;
  number: string;
  name: string | null;
  capacity: number;
  status: 'available' | 'occupied' | 'pending_payment' | 'reserved' | 'needs_cleaning' | 'disabled';
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  activeOrder?: Order;
}

// ─── POS Orders ─────────────────────────────────────────────────────────────────

export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  cash_shift_id: number | null;
  shiftId?: number | null;
  shiftName?: string | null;
  shiftTaker?: string | null;
  order_type: 'dine_in' | 'takeaway' | 'room_service';
  table_number: string | null;
  guest_name: string | null;
  guest_room: string | null;
  guest_folio_id: string | null;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded' | 'pending_payment';
  subtotal: number | string;
  tax_amount: number | string;
  service_charge: number | string;
  discount_amount: number | string;
  total: number | string;
  paid_amount: number | string;
  change_amount: number | string;
  notes: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  refunded_at: string | null;
  cancellation_reason: string | null;
  refund_reason: string | null;
  is_split_payment: boolean;
  created_at: string;
  updated_at: string;
  user?: User;
  cashShift?: CashShift;
  // Laravel serializes camelCase relation names as snake_case in JSON responses
  order_items?: OrderItem[];
  orderItems?: OrderItem[];
  payments?: OrderPayment[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  quantity: number;
  unit_price: number | string;
  total_price: number | string;
  selected_modifiers: Record<string, unknown>[] | null;
  notes: string | null;
  discount_amount: number | string;
  created_at: string;
  updated_at: string;
  menuItem?: MenuItem;
}

export interface OrderPayment {
  id: number;
  order_id: number;
  payment_method_id: number;
  amount: number;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  paymentMethod?: PosPaymentMethod;
}

// ─── POS Cash Shifts ─────────────────────────────────────────────────────────────

export interface CashShift {
  id: number;
  user_id: number;
  status: 'open' | 'closed';
  name?: string | null;
  shift_name?: string | null;
  shift_taker?: string | null;
  opening_cash: number | string;
  expected_cash: number | string;
  counted_cash: number | string | null;
  variance: number | string | null;
  opened_at: string;
  closed_at: string | null;
  closing_notes: string | null;
  total_orders: number;
  total_sales: number;
  payment_breakdown: Record<string, number> | null;
  created_at: string;
  updated_at: string;
  user?: User;
  orders?: Order[];
}

// ─── POS Returns ───────────────────────────────────────────────────────────────────

export interface OrderReturn {
  id: number;
  return_number: string;
  order_id: number;
  user_id: number;
  approved_by: number | null;
  status: 'pending' | 'approved' | 'rejected';
  total_amount: number;
  refund_method: 'cash' | 'card' | 'room_charge' | 'original_payment';
  reason: string;
  rejection_reason: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
  order?: Order;
  user?: User;
  approvedBy?: User;
  returnItems?: OrderReturnItem[];
}

export interface OrderReturnItem {
  id: number;
  order_return_id: number;
  order_item_id: number;
  menu_item_id: number;
  quantity: number;
  unit_price: number;
  total_amount: number;
  reason: string | null;
  created_at: string;
  updated_at: string;
  orderItem?: OrderItem;
  menuItem?: MenuItem;
}

// ─── POS Inventory ───────────────────────────────────────────────────────────────

export interface Inventory {
  id: number;
  name: string;
  sku: string | null;
  current_stock: number;
  minimum_stock: number;
  reorder_level: number;
  unit: string;
  unit_cost: number | null;
  is_active: boolean;
  low_stock_alert: boolean;
  created_at: string;
  updated_at: string;
  menuItems?: MenuItem[];
  adjustments?: InventoryAdjustment[];
}

export interface InventoryAdjustment {
  id: number;
  inventory_id: number;
  user_id: number;
  adjustment_type: 'add' | 'remove' | 'sale' | 'return' | 'waste';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string;
  order_id: number | null;
  return_id: number | null;
  created_at: string;
  updated_at: string;
  inventory?: Inventory;
  user?: User;
  order?: Order;
  orderReturn?: OrderReturn;
}

// ─── POS Settings ───────────────────────────────────────────────────────────────

export interface PosSetting {
  id: number;
  require_open_shift_for_cash: boolean;
  auto_print_receipt: boolean;
  default_payment_method: string;
  receipt_footer: string | null;
  tax_percentage: number;
  service_charge_percentage: number;
  currency: string;
  currency_symbol: string;
  auto_approve_return_threshold: number;
  created_at: string;
  updated_at: string;
}

// ─── POS Payment Methods ─────────────────────────────────────────────────────────

export interface PosPaymentMethod {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ─── POS Roles ───────────────────────────────────────────────────────────────

export interface Role {
  id: number;
  name: string;
  max_discount_percent: number;
  max_discount_amount: number;
  permissions: string[];
  created_at?: string;
  updated_at?: string;
}

// ─── POS Reports ───────────────────────────────────────────────────────────────

export interface SalesReport {
  period: string;
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  taxCollected: number;
  serviceChargeCollected: number;
  discountsGiven: number;
  refundsProcessed: number;
  netRevenue: number;
  payment_breakdown: Record<string, number>;
  daily_breakdown: Array<{
    date: string;
    sales: number;
    orders: number;
  }>;
}

export interface RevenueByCategory {
  category: string;
  revenue: number;
  orders: number;
  percentage: number;
}

export interface BestSeller {
  name: string;
  quantity: number;
  revenue: number;
  average_price: number;
}

export interface CashierPerformance {
  cashier: string;
  orders: number;
  revenue: number;
  averageOrderValue: number;
  refunds: number;
  voids: number;
}

export interface RefundReport {
  total_refunds: number;
  total_amount: number;
  refund_by_method: Record<string, number>;
  refund_by_reason: Record<string, number>;
  top_refunded_items: Array<{
    item_name: string;
    refund_count: number;
    refund_amount: number;
  }>;
}

// ─── Hotel Integration ─────────────────────────────────────────────────────────

export interface HotelIntegrationSetting {
  id: number;
  hotel_api_url: string;
  hotel_api_token: string | null;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface HotelGuest {
  id: number;
  name: string;
  room_number: string;
  folio_id: string;
}
