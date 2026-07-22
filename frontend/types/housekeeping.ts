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