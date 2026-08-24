export interface StandupTask {
  id: string;
  title: string;
  status: string;
  completedYesterday: boolean;
  plannedToday: boolean;
  blocked: boolean;
  blockerReason?: string;
}

export interface StandupRequest {
  userName: string;
  date: string;
  tasks: StandupTask[];
  additionalNotes?: string;
}

export interface StandupResult {
  userName: string;
  date: string;
  yesterday: string[];
  today: string[];
  blockers: string[];
  summary: string;
  generatedAt: string;
}