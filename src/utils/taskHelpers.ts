import {
  AppSettings,
  SortOption,
  Task,
  TaskCategory,
  TaskOrganizationTab,
  TaskPriority,
  TaskStatus,
} from '../types/task';

const TASKS_STORAGE_KEY = 'clearday_tasks_v1';
const INITIALIZED_STORAGE_KEY = 'clearday_initialized_v1';
const SETTINGS_STORAGE_KEY = 'clearday_settings_v1';

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDaysDateString(baseDateStr: string, offsetDays: number): string {
  const [y, m, d] = baseDateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDueDate(dateStr: string): string {
  if (!dateStr) return 'No date';
  const today = getTodayDateString();
  const tomorrow = addDaysDateString(today, 1);
  const yesterday = addDaysDateString(today, -1);

  if (dateStr === today) return 'Today';
  if (dateStr === tomorrow) return 'Tomorrow';
  if (dateStr === yesterday) return 'Yesterday';

  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

export function formatCreatedDate(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function isTaskOverdue(task: Task): boolean {
  if (task.status === 'Completed') return false;
  return task.dueDate < getTodayDateString();
}

export function isTaskToday(task: Task): boolean {
  return task.dueDate === getTodayDateString();
}

export function isTaskUpcoming(task: Task): boolean {
  if (task.status === 'Completed') return false;
  return task.dueDate > getTodayDateString();
}

export function isTaskPendingGroup(task: Task): boolean {
  return task.status === 'Pending' || task.status === 'In Progress';
}

export function createSeedTasks(): Task[] {
  const today = getTodayDateString();
  const now = Date.now();

  return [
    {
      id: 'seed-task-1',
      title: 'Finalize quarterly roadmap slides',
      description: 'Review Q4 product milestones with engineering leads and attach updated timeline metrics.',
      dueDate: today,
      priority: 'High',
      category: 'Work',
      status: 'In Progress',
      createdAt: new Date(now - 1000 * 60 * 60 * 48).toISOString(),
    },
    {
      id: 'seed-task-2',
      title: 'Submit tax reimbursement receipts',
      description: 'Upload travel and software expense PDFs to the finance portal before accounting cutoff.',
      dueDate: addDaysDateString(today, -2),
      priority: 'High',
      category: 'Work',
      status: 'Pending',
      createdAt: new Date(now - 1000 * 60 * 60 * 96).toISOString(),
    },
    {
      id: 'seed-task-3',
      title: 'Complete distributed systems reading notes',
      description: 'Summarize chapters 4 and 5 on Raft consensus and replication logs.',
      dueDate: today,
      priority: 'Medium',
      category: 'Study',
      status: 'Pending',
      createdAt: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
    },
    {
      id: 'seed-task-4',
      title: 'Schedule annual dental checkup',
      description: 'Call clinic morning desk to confirm Friday afternoon appointment slot.',
      dueDate: addDaysDateString(today, 2),
      priority: 'Low',
      category: 'Personal',
      status: 'Pending',
      createdAt: new Date(now - 1000 * 60 * 60 * 18).toISOString(),
    },
    {
      id: 'seed-task-5',
      title: 'Prepare sprint retrospective talking points',
      description: 'Collect team feedback on release cycle velocity and deployment checklist.',
      dueDate: addDaysDateString(today, 4),
      priority: 'Medium',
      category: 'Work',
      status: 'Pending',
      createdAt: new Date(now - 1000 * 60 * 60 * 12).toISOString(),
    },
    {
      id: 'seed-task-6',
      title: 'Renew cloud storage subscription',
      description: 'Verify billing card details and archive inactive backup buckets.',
      dueDate: addDaysDateString(today, -1),
      priority: 'Low',
      category: 'Other',
      status: 'Completed',
      previousStatus: 'Pending',
      createdAt: new Date(now - 1000 * 60 * 60 * 72).toISOString(),
      completedAt: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
    },
    {
      id: 'seed-task-7',
      title: 'Morning 5km run and hydration log',
      description: 'Keep pace steady around 5:30/km and stretch calves afterward.',
      dueDate: today,
      priority: 'Medium',
      category: 'Personal',
      status: 'Completed',
      previousStatus: 'Pending',
      createdAt: new Date(now - 1000 * 60 * 60 * 10).toISOString(),
      completedAt: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
    },
  ];
}

export function loadTasks(): Task[] {
  try {
    const initialized = localStorage.getItem(INITIALIZED_STORAGE_KEY);
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!initialized) {
      const seeded = createSeedTasks();
      localStorage.setItem(INITIALIZED_STORAGE_KEY, 'true');
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return createSeedTasks();
  }
}

export function saveTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(INITIALIZED_STORAGE_KEY, 'true');
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  dailyRemindersEnabled: true,
  reminderTime: '09:00',
  browserNotificationsEnabled: false,
  defaultSort: 'dueDateAsc',
  dismissedReminderDate: null,
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota errors
  }
}

export interface TaskFilterOptions {
  searchQuery: string;
  priority: TaskPriority | 'All';
  category: TaskCategory | 'All';
  status: TaskStatus | 'All';
  organizationTab?: TaskOrganizationTab;
  sortBy: SortOption;
  scope: 'all' | 'today' | 'upcoming' | 'completed';
}

export function filterAndSortTasks(tasks: Task[], opts: TaskFilterOptions): Task[] {
  const query = opts.searchQuery.trim().toLowerCase();

  const filtered = tasks.filter((task) => {
    // Scope filter from sidebar navigation
    if (opts.scope === 'today' && !isTaskToday(task)) return false;
    if (opts.scope === 'upcoming' && !isTaskUpcoming(task)) return false;
    if (opts.scope === 'completed' && task.status !== 'Completed') return false;

    // Organization tab filter (in My Tasks view)
    if (opts.scope === 'all' && opts.organizationTab && opts.organizationTab !== 'all') {
      if (opts.organizationTab === 'pending' && !isTaskPendingGroup(task)) return false;
      if (opts.organizationTab === 'in_progress' && task.status !== 'In Progress') return false;
      if (opts.organizationTab === 'overdue' && !isTaskOverdue(task)) return false;
      if (opts.organizationTab === 'completed' && task.status !== 'Completed') return false;
    }

    // Search by title
    if (query && !task.title.toLowerCase().includes(query)) return false;

    // Dropdown filters
    if (opts.priority !== 'All' && task.priority !== opts.priority) return false;
    if (opts.category !== 'All' && task.category !== opts.category) return false;
    if (opts.status !== 'All' && task.status !== opts.status) return false;

    return true;
  });

  return [...filtered].sort((a, b) => {
    if (opts.sortBy === 'dueDateAsc') {
      const dateCmp = a.dueDate.localeCompare(b.dueDate);
      if (dateCmp !== 0) return dateCmp;
      return b.createdAt.localeCompare(a.createdAt);
    }
    if (opts.sortBy === 'dueDateDesc') {
      const dateCmp = b.dueDate.localeCompare(a.dueDate);
      if (dateCmp !== 0) return dateCmp;
      return b.createdAt.localeCompare(a.createdAt);
    }
    if (opts.sortBy === 'createdDesc') {
      return b.createdAt.localeCompare(a.createdAt);
    }
    return a.createdAt.localeCompare(b.createdAt);
  });
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number; // Pending + In Progress
  inProgress: number;
  overdue: number;
  todayTotal: number;
  todayPending: number;
  upcomingCount: number;
  completionRate: number;
}

export function computeTaskStats(tasks: Task[]): TaskStats {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'Completed').length;
  const pending = tasks.filter((t) => t.status !== 'Completed').length;
  const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
  const overdue = tasks.filter((t) => isTaskOverdue(t)).length;
  const todayTasks = tasks.filter((t) => isTaskToday(t));
  const todayTotal = todayTasks.length;
  const todayPending = todayTasks.filter((t) => t.status !== 'Completed').length;
  const upcomingCount = tasks.filter((t) => isTaskUpcoming(t)).length;
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

  return {
    total,
    completed,
    pending,
    inProgress,
    overdue,
    todayTotal,
    todayPending,
    upcomingCount,
    completionRate,
  };
}

export function generateTaskId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
