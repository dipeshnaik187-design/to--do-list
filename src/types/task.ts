export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskCategory = 'Personal' | 'Study' | 'Work' | 'Other';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string; // YYYY-MM-DD
  priority: TaskPriority;
  category: TaskCategory;
  status: TaskStatus;
  previousStatus?: 'Pending' | 'In Progress';
  createdAt: string; // ISO timestamp
  completedAt?: string;
}

export type NavSection =
  | 'dashboard'
  | 'all'
  | 'today'
  | 'upcoming'
  | 'completed'
  | 'settings';

export type TaskOrganizationTab =
  | 'all'
  | 'pending'
  | 'in_progress'
  | 'overdue'
  | 'completed';

export type SortOption =
  | 'dueDateAsc'
  | 'dueDateDesc'
  | 'createdDesc'
  | 'createdAsc';

export type ThemeMode = 'light' | 'dark';

export interface AppSettings {
  theme: ThemeMode;
  dailyRemindersEnabled: boolean;
  reminderTime: string; // HH:MM
  browserNotificationsEnabled: boolean;
  defaultSort: SortOption;
  dismissedReminderDate: string | null; // YYYY-MM-DD
}

export interface TaskFormValues {
  title: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
  category: TaskCategory;
  status: TaskStatus;
}

export interface ToastItem {
  id: string;
  message: string;
  variant: 'success' | 'info' | 'warning';
  undoTaskId?: string;
  undoLabel?: string;
}
