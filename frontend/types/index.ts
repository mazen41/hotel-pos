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

// ─── Dashboard Types ──────────────────────────────────────────────────────────

export interface KPI {
  key: string;
  label: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  period: string;
}

export interface ActivityItem {
  id: number;
  type: 'check_in' | 'check_out' | 'reservation';
  guest: string;
  room: string;
  description: string;
  time: string;
}

export interface OccupancyDataPoint {
  date: string;
  rate: number;
}

// ─── Hotel Settings Types ─────────────────────────────────────────────────────

export interface HotelSettings {
  // General
  hotel_name: string;
  legal_business_name: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website_url: string | null;
  // Location
  country: string | null;
  city: string | null;
  address: string | null;
  postal_code: string | null;
  // Operational
  timezone: string;
  currency: string;
  default_language: string;
  check_in_time: string;
  check_out_time: string;
  // Financial
  tax_percentage: number;
  service_charge_percentage: number;
  // Booking
  cancellation_policy: string | null;
  confirmation_policy: string | null;
  // Channel Manager
  channel_property_code: string | null;
  channel_external_property_ref: string | null;
  channel_default_rate_plan_code: string | null;
  channel_default_inventory_code: string | null;
}

export type SettingsTab =
  | 'general'
  | 'location'
  | 'operations'
  | 'financial'
  | 'booking'
  | 'channel';

// ─── Room Types ───────────────────────────────────────────────────────────────

export interface RoomType {
  id: number;
  // Basic Information
  name: string;
  description: string | null;
  // Pricing
  base_price: number;
  formatted_price: string;
  meal_plan: string | null;
  rates: Record<string, number> | null;
  // Occupancy
  max_adults: number;
  max_children: number;
  max_occupancy: number;
  occupancy_description: string;
  // Room Details
  bed_type: string | null;
  amenities: string[];
  images: string[];
  // Status
  is_active: boolean;
  // Channel Manager Integration
  external_mapping_id: string | null;
  channel_manager_code: string | null;
  rate_plan_code: string | null;
  // Timestamps
  created_at: string | null;
  updated_at: string | null;
}

export interface RoomTypeFormData {
  name: string;
  description?: string;
  base_price: number;
  meal_plan?: string;
  rates?: Record<string, number>;
  max_adults: number;
  max_children: number;
  max_occupancy: number;
  bed_type?: string;
  amenities?: string[];
  images?: string[];
  is_active?: boolean;
  external_mapping_id?: string;
  channel_manager_code?: string;
  rate_plan_code?: string;
}

// ─── Rooms ──────────────────────────────────────────────────────────────────

export type RoomStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'out_of_order' | 'out_of_service';

export interface Room {
  id: number;
  // Room Type Relationship
  room_type_id: number;
  room_type?: RoomType;
  // Room Identification
  room_number: string;
  display_name: string;
  floor: string | null;
  // Status
  status: RoomStatus;
  status_label: string;
  status_color: string;
  // Additional Information
  notes: string | null;
  is_active: boolean;
  // Channel Manager & Inventory Synchronization
  external_room_id: string | null;
  inventory_code: string | null;
  sort_order: number;
  // Timestamps
  created_at: string | null;
  updated_at: string | null;
}

export interface RoomFormData {
  room_type_id: number;
  room_number: string;
  floor?: string;
  status: RoomStatus;
  notes?: string;
  is_active?: boolean;
  external_room_id?: string;
  inventory_code?: string;
  sort_order?: number;
}

// ─── Guests ──────────────────────────────────────────────────────────────────

export interface Guest {
  id: number;
  // Profile and contact details
  first_name: string;
  last_name: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  // Identity documents
  passport_number: string | null;
  national_id: string | null;
  date_of_birth: string | null;
  // CRM and analytics
  notes: string | null;
  vip_status: boolean;
  marketing_consent: boolean;
  total_stays: number;
  total_spent: number;
  reservations_count?: number;
  reservations?: GuestReservation[];
  // Timestamps
  created_at: string | null;
  updated_at: string | null;
}

export interface GuestFormData {
  first_name: string;
  last_name: string;
  email?: string;
  phone: string;
  country?: string;
  city?: string;
  address?: string;
  passport_number?: string;
  national_id?: string;
  date_of_birth?: string;
  gender?: string;
  nationality?: string;
  passport_expiry_date?: string;
  notes?: string;
  vip_status?: boolean;
  marketing_consent?: boolean;
}

export interface GuestReservation {
  id: number;
  reservation_number: string;
  check_in_date: string;
  check_out_date: string;
  room_number?: string;
  room_type?: string;
  status: string;
  total_amount: number;
}

// ─── Availability ───────────────────────────────────────────────────────────────

export interface Availability {
  id: number;
  room_id: number;
  room: Room;
  date: string;
  status: 'available' | 'booked' | 'blocked' | 'maintenance' | 'out_of_order' | 'check_out_day' | 'check_in_day';
  reservation_id: number | null;
  reservation: Reservation | null;
  price: number | null;
  stop_sell: boolean;
  min_stay_enforced: boolean;
  min_stay: number;
  max_stay_enforced: boolean;
  max_stay: number | null;
  notes: string | null;
  is_bookable: boolean;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityBlock {
  id: number;
  name: string;
  description: string | null;
  room_id: number | null;
  room: Room | null;
  room_type_id: number | null;
  room_type: RoomType | null;
  start_date: string;
  end_date: string;
  reason: 'maintenance' | 'renovation' | 'group_booking' | 'owner_use' | 'staff_use' | 'other';
  is_active: boolean;
  is_currently_active: boolean;
  created_by: number | null;
  creator: User | null;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityCalendar {
  [date: string]: Availability[];
}

export interface DailyAvailabilitySummary {
  room_type_name: string;
  total_rooms: number;
  available: number;
  booked: number;
  blocked: number;
  maintenance: number;
  cleaning: number;
}

export interface AvailabilitySearchRequest {
  check_in: string;
  check_out: string;
  adults: number;
  children?: number;
  room_type_id?: number;
}

export interface AvailabilitySearchResponse {
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  nights: number;
  available_rooms: Array<{
    room: Room;
    room_type: RoomType;
    availabilities: Availability[];
    total_price: number;
  }>;
}

export interface AvailabilityCalendarRequest {
  start_date: string;
  end_date: string;
  room_type_id?: number;
}

export interface AvailabilityCalendarResponse {
  calendar: AvailabilityCalendar;
  start_date: string;
  end_date: string;
  total_days: number;
}

export interface DailyAvailabilityResponse {
  date: string;
  summary: DailyAvailabilitySummary[];
}

// ─── Reservations ─────────────────────────────────────────────────────────────

export type ReservationStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';

export type ReservationPaymentStatus = 'unpaid' | 'partially_paid' | 'paid' | 'refunded';

export interface Reservation {
  id: number;
  group_id: number | null;
  group?: Reservation;
  group_members?: Reservation[];
  reservation_number: string;
  guest_id: number;
  guest?: {
    id: number;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string | null;
    phone: string | null;
  };
  room_id: number;
  room?: {
    id: number;
    room_number: string;
    floor?: string;
    room_type?: {
      id: number;
      name: string;
    };
  };
  room_type_id: number;
  room_type?: {
    id: number;
    name: string;
    base_price: number;
  };
  source: string;
  check_in_date: string;
  check_out_date: string;
  adults: number;
  children: number;
  nights: number;
  status: ReservationStatus;
  payment_status: ReservationPaymentStatus;
  subtotal: number;
  taxes: number;
  fees: number;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  special_requests: string | null;
  internal_notes: string | null;
  external_reservation_id: string | null;
  channel_manager_reference: string | null;
  synced_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReservationFormData {
  group_id?: number;
  guest_id: number;
  room_id: number;
  room_type_id: number;
  source?: string;
  check_in_date: string;
  check_out_date: string;
  adults?: number;
  children?: number;
  status?: ReservationStatus;
  payment_status?: ReservationPaymentStatus;
  total_amount?: number;
  taxes?: number;
  fees?: number;
  paid_amount?: number;
  special_requests?: string;
  internal_notes?: string;
}

// ─── Rate Plans ──────────────────────────────────────────────────────────────

export type RatePlanType = 'standard' | 'corporate' | 'seasonal' | 'package' | 'promotional';

export type PricingType = 'fixed' | 'percentage' | 'per_person' | 'per_night';

export interface RatePlan {
  id: number;
  name: string;
  description: string | null;
  type: RatePlanType;
  pricing_type: PricingType;
  base_rate: number;
  min_nights: number | null;
  max_nights: number | null;
  occupancy_based_pricing: boolean;
  allow_children: boolean;
  allow_extra_beds: boolean;
  extra_bed_price: number | null;
  meal_plan_included: boolean;
  meal_plan_type: string | null;
  cancellation_policy: string | null;
  payment_policy: string | null;
  active: boolean;
  priority: number;
  available_channels: string[];
  room_types: {
    id: number;
    name: string;
    rate: number;
  }[];
  seasonal_rates: SeasonalRate[];
  dynamic_pricing_rules: DynamicPricingRule[];
  restrictions: RateRestriction[];
  channel_sync_enabled: boolean;
  channel_manager_references: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface RatePlanFormData {
  name: string;
  description?: string;
  type: RatePlanType;
  pricing_type: PricingType;
  base_rate: number;
  min_nights?: number | null;
  max_nights?: number | null;
  occupancy_based_pricing?: boolean;
  allow_children?: boolean;
  allow_extra_beds?: boolean;
  extra_bed_price?: number | null;
  meal_plan_included?: boolean;
  meal_plan_type?: string;
  cancellation_policy?: string;
  payment_policy?: string;
  active?: boolean;
  priority?: number;
  available_channels?: string[];
  room_type_rates?: { room_type_id: number; rate: number }[];
  channel_sync_enabled?: boolean;
}

export interface SeasonalRate {
  id: number;
  rate_plan_id: number;
  name: string;
  start_date: string;
  end_date: string;
  rate: number;
  rate_type: PricingType;
  min_stay: number | null;
  max_stay: number | null;
  applies_to_all_room_types: boolean;
  room_types: number[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SeasonalRateFormData {
  name: string;
  start_date: string;
  end_date: string;
  rate: number;
  rate_type: PricingType;
  min_stay?: number;
  max_stay?: number;
  applies_to_all_room_types: boolean;
  room_types?: number[];
  active?: boolean;
}

export interface DynamicPricingRule {
  id: number;
  rate_plan_id: number;
  name: string;
  rule_type: 'occupancy_based' | 'lead_time_based' | 'day_of_week_based' | 'event_based';
  condition: Record<string, any>;
  action: 'increase' | 'decrease';
  value: number;
  value_type: 'percentage' | 'fixed';
  min_value: number | null;
  max_value: number | null;
  applies_to_all_room_types: boolean;
  room_types: number[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DynamicPricingRuleFormData {
  name: string;
  rule_type: 'occupancy_based' | 'lead_time_based' | 'day_of_week_based' | 'event_based';
  condition: Record<string, any>;
  action: 'increase' | 'decrease';
  value: number;
  value_type: 'percentage' | 'fixed';
  min_value?: number;
  max_value?: number;
  applies_to_all_room_types: boolean;
  room_types?: number[];
  active?: boolean;
}

export interface RateRestriction {
  id: number;
  rate_plan_id: number;
  restriction_type: 'blackout_date' | 'min_stay' | 'max_stay' | 'check_in' | 'check_out';
  start_date: string;
  end_date: string;
  value: number | null;
  description: string | null;
  applies_to_all_room_types: boolean;
  room_types: number[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RateRestrictionFormData {
  restriction_type: 'blackout_date' | 'min_stay' | 'max_stay' | 'check_in' | 'check_out';
  start_date: string;
  end_date: string;
  value?: number;
  description?: string;
  applies_to_all_room_types: boolean;
  room_types?: number[];
  active?: boolean;
}

// ─── Housekeeping ─────────────────────────────────────────────────────────────

export interface HousekeepingTask {
  id: number;
  room: {
    id: number;
    room_number: string;
    display_name: string;
    floor: string;
    status: string;
    room_type: {
      id: number;
      name: string;
    };
  };
  assigned_to: {
    id: number;
    name: string;
    email: string;
  } | null;
  created_by: {
    id: number;
    name: string;
  } | null;
  task_type: 'cleaning' | 'inspection' | 'maintenance' | 'turnover' | 'deep_clean';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  scheduled_at: string;
  started_at: string | null;
  completed_at: string | null;
  duration: number | null;
  is_overdue: boolean;
  notes: string | null;
  checklist: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface HousekeepingBoard {
  date: string;
  board: {
    pending: HousekeepingTask[];
    in_progress: HousekeepingTask[];
    completed: HousekeepingTask[];
    skipped: HousekeepingTask[];
  };
  summary: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    skipped: number;
  };
}

export interface HousekeepingSummary {
  date: string;
  by_room_type: Array<{
    room_type_name: string;
    total_tasks: number;
    pending: number;
    in_progress: number;
    completed: number;
    urgent: number;
  }>;
  overall: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    skipped: number;
    urgent: number;
  };
}

// ─── Billing ─────────────────────────────────────────────────────────────────

export type FolioStatus = 'open' | 'closed' | 'cancelled';

export type ChargeType = 'room' | 'food_beverage' | 'service' | 'amenity' | 'phone' | 'laundry' | 'other';

export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'check' | 'online_payment';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Charge {
  id: number;
  folio_id: number;
  folio?: {
    id: number;
    folio_number: string;
    status: FolioStatus;
  };
  reservation_id: number | null;
  reservation?: {
    id: number;
    reservation_number: string;
  };
  charge_type: ChargeType;
  description: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  charged_at: string | null;
  notes: string | null;
  created_by: number | null;
  created_by_user?: {
    id: number;
    name: string;
  } | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ChargeFormData {
  folio_id: number;
  reservation_id?: number;
  charge_type: ChargeType;
  description: string;
  amount: number;
  tax_amount?: number;
  total_amount?: number;
  charged_at?: string;
  notes?: string;
}

export interface Folio {
  id: number;
  reservation_id: number;
  reservation?: {
    id: number;
    reservation_number: string;
    check_in_date: string | null;
    check_out_date: string | null;
  };
  guest_id: number;
  guest?: {
    id: number;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string | null;
    phone: string | null;
  };
  folio_number: string;
  status: FolioStatus;
  subtotal: number;
  tax_amount: number;
  fee_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  closed_at: string | null;
  notes: string | null;
  created_by: number | null;
  created_by_user?: {
    id: number;
    name: string;
  } | null;
  charges?: Charge[];
  payments?: Payment[];
  created_at: string | null;
  updated_at: string | null;
}

export interface FolioFormData {
  reservation_id: number;
  guest_id: number;
  folio_number?: string;
  status?: FolioStatus;
  subtotal?: number;
  tax_amount?: number;
  fee_amount?: number;
  discount_amount?: number;
  total_amount?: number;
  paid_amount?: number;
  balance_due?: number;
  notes?: string;
}

export interface Payment {
  id: number;
  folio_id: number;
  folio?: {
    id: number;
    folio_number: string;
    status: FolioStatus;
  };
  reservation_id: number | null;
  reservation?: {
    id: number;
    reservation_number: string;
  };
  payment_number: string;
  payment_method: PaymentMethod;
  card_last_four: string | null;
  card_type: string | null;
  transaction_id: string | null;
  amount: number;
  status: PaymentStatus;
  payment_date: string | null;
  notes: string | null;
  received_by: number | null;
  received_by_user?: {
    id: number;
    name: string;
  } | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface PaymentFormData {
  folio_id: number;
  reservation_id?: number;
  payment_number?: string;
  payment_method: PaymentMethod;
  card_last_four?: string;
  card_type?: string;
  transaction_id?: string;
  amount: number;
  status?: PaymentStatus;
  payment_date?: string;
  notes?: string;
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

// ─── Maintenance Requests ───────────────────────────────────────────────────────

export interface MaintenanceRequest {
  id: number;
  room_id: number;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to: number | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  resolved_at: string | null;
  resolution_notes: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  room?: {
    id: number;
    room_number: string;
    room_type?: {
      name: string;
    };
  };
  assignedTo?: {
    id: number;
    name: string;
  };
  createdBy?: {
    id: number;
    name: string;
  };
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
  price: number;
  cost: number | null;
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

// ─── POS Orders ─────────────────────────────────────────────────────────────────

export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  cash_shift_id: number | null;
  order_type: 'dine_in' | 'takeaway' | 'room_service';
  table_number: string | null;
  guest_name: string | null;
  guest_room: string | null;
  guest_folio_id: string | null;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  subtotal: number;
  tax_amount: number;
  service_charge: number;
  discount_amount: number;
  total: number;
  paid_amount: number;
  change_amount: number;
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
  orderItems?: OrderItem[];
  payments?: OrderPayment[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  selected_modifiers: Record<string, unknown>[] | null;
  notes: string | null;
  discount_amount: number;
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
  opening_cash: number;
  expected_cash: number;
  counted_cash: number | null;
  variance: number | null;
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
