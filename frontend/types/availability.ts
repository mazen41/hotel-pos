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

// Import related types (these should already exist in your project)
interface Room {
  id: number;
  room_number: string;
  display_name: string;
  floor: string | null;
  status: string;
  is_active: boolean;
  room_type_id: number;
}

interface RoomType {
  id: number;
  name: string;
  description: string;
  base_price: number;
  meal_plan: string;
  rates: Record<string, number>;
  max_occupancy: number;
}

interface Reservation {
  id: number;
  guest_id: number;
  room_id: number;
  check_in_date: string;
  check_out_date: string;
  status: string;
}

interface User {
  id: number;
  name: string;
  email: string;
}
