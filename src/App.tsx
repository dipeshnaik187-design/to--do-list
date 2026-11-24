import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Menu, Plus } from 'lucide-react';
import {
  AppSettings,
  NavSection,
  SortOption,
  Task,
  TaskCategory,
  TaskFormValues,
  TaskOrganizationTab,
  TaskPriority,
  TaskStatus,
  ToastItem,
} from './types/task';
import {
  computeTaskStats,
  createSeedTasks,
  generateTaskId,
  getTodayDateString,
  loadSettings,
  loadTasks,
  saveSettings,
  saveTasks,
} from './utils/taskHelpers';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { TasksView } from './components/TasksView';
import { SettingsView } from './components/SettingsView';
import { TaskFormModal } from './components/TaskFormModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ToastContainer } from './components/ToastContainer';

const NAV_LABELS: Record<NavSection, string> = {
  dashboard: 'Dashboard',
  all: 'My Tasks',
  today: "Today's Tasks",
  upcoming: 'Upcoming Tasks',
  completed: 'Completed Tasks',
  settings: 'Settings',
};

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [activeNav, setActiveNav] = useState<NavSection>('dashboard');
  const [organizationTab, setOrganizationTab] = useState<TaskOrganizationTab>('all');

  // Search, filter & sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'All'>('All');
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'All'>('All');
  const [sortBy, setSortBy] = useState<SortOption>(() => loadSettings().defaultSort);

  // Modals & mobile drawer
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastTimersRef = useRef<Record<string, number>>({});
  const lastBrowserNotifiedDateRef = useRef<string | null>(null);

  // Persist tasks
  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  // Persist settings & apply theme class to <html>
  useEffect(() => {
    saveSettings(settings);
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings]);

  // Cleanup toast timers on unmount
  useEffect(() => {
    return () => {
      Object.values(toastTimersRef.current).forEach((timerId) => {
        window.clearTimeout(timerId);
      });
    };
  }, []);

  const dismissToast = useCallback((id: string) => {
    if (toastTimersRef.current[id]) {
      window.clearTimeout(toastTimersRef.current[id]);
      delete toastTimersRef.current[id];
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (
      message: string,
      variant: 'success' | 'info' | 'warning' = 'success',
      undoOptions?: { taskId: string; label?: string }
    ) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const item: ToastItem = {
        id,
        message,
        variant,
        undoTaskId: undoOptions?.taskId,
        undoLabel: undoOptions?.label,
      };

      setToasts((prev) => [...prev.slice(-2), item]);

      const timerId = window.setTimeout(() => {
        dismissToast(id);
      }, 4500);
      toastTimersRef.current[id] = timerId;
    },
    [dismissToast]
  );

  const stats = useMemo(() => computeTaskStats(tasks), [tasks]);

  // Check daily browser notification schedule once per minute
  useEffect(() => {
    if (
      !settings.dailyRemindersEnabled ||
      !settings.browserNotificationsEnabled ||
      typeof window === 'undefined' ||
      !('Notification' in window) ||
      Notification.permission !== 'granted'
    ) {
      return;
    }

    const checkReminder = () => {
      const today = getTodayDateString();
      if (lastBrowserNotifiedDateRef.current === today) return;

      const now = new Date();
      const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;

      if (currentHHMM >= settings.reminderTime && (stats.todayPending > 0 || stats.overdue > 0)) {
        lastBrowserNotifiedDateRef.current = today;
        new Notification('ClearDay Daily Task Reminder', {
          body: `You have ${stats.todayPending} tasks due today and ${stats.overdue} overdue tasks.`,
        });
      }
    };

    checkReminder();
    const interval = window.setInterval(checkReminder, 60000);
    return () => window.clearInterval(interval);
  }, [
    settings.dailyRemindersEnabled,
    settings.browserNotificationsEnabled,
    settings.reminderTime,
    stats.todayPending,
    stats.overdue,
  ]);

  const handleNavigate = (nav: NavSection, tab?: TaskOrganizationTab) => {
    setActiveNav(nav);
    if (nav === 'all') {
      setOrganizationTab(tab ?? 'all');
    }
    if (nav === 'completed') {
      setStatusFilter('All');
    }
  };

  const handleOpenNewTask = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (values: TaskFormValues) => {
    if (editingTask) {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== editingTask.id) return t;
          const isNowCompleted = values.status === 'Completed';
          const wasCompleted = t.status === 'Completed';
          return {
            ...t,
            ...values,
            previousStatus:
              isNowCompleted && !wasCompleted
                ? (t.status as 'Pending' | 'In Progress')
                : !isNowCompleted
                  ? undefined
                  : t.previousStatus,
            completedAt: isNowCompleted
              ? t.completedAt ?? new Date().toISOString()
              : undefined,
          };
        })
      );
      setIsTaskModalOpen(false);
      setEditingTask(null);
      showToast('Task updated successfully.', 'success');
    } else {
      const newTask: Task = {
        id: generateTaskId(),
        title: values.title,
        description: values.description,
        dueDate: values.dueDate,
        priority: values.priority,
        category: values.category,
        status: values.status,
        createdAt: new Date().toISOString(),
        completedAt: values.status === 'Completed' ? new Date().toISOString() : undefined,
      };
      setTasks((prev) => [newTask, ...prev]);
      setIsTaskModalOpen(false);
      showToast('Task added successfully.', 'success');
    }
  };

  const handleToggleComplete = (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;

    const wasCompleted = target.status === 'Completed';

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        if (wasCompleted) {
          return {
            ...t,
            status: t.previousStatus ?? 'Pending',
            previousStatus: undefined,
            completedAt: undefined,
          };
        }
        return {
          ...t,
          previousStatus: t.status === 'In Progress' ? 'In Progress' : 'Pending',
          status: 'Completed',
          completedAt: new Date().toISOString(),
        };
      })
    );

    if (wasCompleted) {
      showToast('Task moved back to active.', 'info');
    } else {
      showToast(`Completed "${target.title}"`, 'success', {
        taskId: target.id,
        label: 'Undo',
      });
    }
  };

  const handleUndoCompleteFromToast = (taskId: string, toastId: string) => {
    dismissToast(toastId);
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId || t.status !== 'Completed') return t;
        return {
          ...t,
          status: t.previousStatus ?? 'Pending',
          previousStatus: undefined,
          completedAt: undefined,
        };
      })
    );
    showToast('Task completion undone.', 'info');
  };

  const handleChangeStatus = (taskId: string, newStatus: TaskStatus) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target || target.status === newStatus) return;

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        if (newStatus === 'Completed') {
          return {
            ...t,
            previousStatus: t.status === 'In Progress' ? 'In Progress' : 'Pending',
            status: 'Completed',
            completedAt: new Date().toISOString(),
          };
        }
        return {
          ...t,
          status: newStatus,
          previousStatus: undefined,
          completedAt: undefined,
        };
      })
    );

    if (newStatus === 'Completed') {
      showToast(`Completed "${target.title}"`, 'success', {
        taskId: target.id,
        label: 'Undo',
      });
    } else {
      showToast(`Status updated to ${newStatus}.`, 'success');
    }
  };

  const handleConfirmDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setTaskToDelete(null);
    showToast('Task deleted successfully.', 'success');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setPriorityFilter('All');
    setCategoryFilter('All');
    setStatusFilter('All');
    setOrganizationTab('all');
    setSortBy(settings.defaultSort);
  };

  const handleUpdateSettings = (partial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      if (partial.defaultSort) {
        setSortBy(partial.defaultSort);
      }
      return next;
    });
  };

  const handleClearCompleted = () => {
    setTasks((prev) => prev.filter((t) => t.status !== 'Completed'));
    showToast('Completed tasks cleared.', 'success');
  };

  const handleRestoreDemoTasks = () => {
    setTasks(createSeedTasks());
    showToast('Sample tasks restored.', 'info');
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-150">
      {/* Sidebar Navigation */}
      <Sidebar
        activeNav={activeNav}
        onSelectNav={(nav) => handleNavigate(nav)}
        stats={stats}
        theme={settings.theme}
        onToggleTheme={() =>
          handleUpdateSettings({
            theme: settings.theme === 'dark' ? 'light' : 'dark',
          })
        }
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden flex h-10 w-10 -ml-2 items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="hidden sm:inline text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap">
                ClearDay
              </span>
              <span
                className="hidden sm:inline text-slate-300 dark:text-slate-700"
                aria-hidden="true"
              >
                /
              </span>
              <span className="font-display font-semibold text-slate-900 dark:text-white truncate">
                {NAV_LABELS[activeNav]}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenNewTask}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>New Task</span>
          </button>
        </header>

        {/* Main Workspace Viewport */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {activeNav === 'dashboard' && (
            <DashboardView
              tasks={tasks}
              stats={stats}
              settings={settings}
              onNavigate={handleNavigate}
              onOpenNewTask={handleOpenNewTask}
              onToggleComplete={handleToggleComplete}
              onDismissDailyReminder={() =>
                handleUpdateSettings({ dismissedReminderDate: getTodayDateString() })
              }
            />
          )}

          {(activeNav === 'all' ||
            activeNav === 'today' ||
            activeNav === 'upcoming' ||
            activeNav === 'completed') && (
            <TasksView
              scope={activeNav}
              tasks={tasks}
              stats={stats}
              organizationTab={organizationTab}
              onChangeOrganizationTab={setOrganizationTab}
              searchQuery={searchQuery}
              onChangeSearch={setSearchQuery}
              priorityFilter={priorityFilter}
              onChangePriorityFilter={setPriorityFilter}
              categoryFilter={categoryFilter}
              onChangeCategoryFilter={setCategoryFilter}
              statusFilter={statusFilter}
              onChangeStatusFilter={setStatusFilter}
              sortBy={sortBy}
              onChangeSortBy={setSortBy}
              onResetFilters={handleResetFilters}
              onOpenNewTask={handleOpenNewTask}
              onToggleComplete={handleToggleComplete}
              onChangeStatus={handleChangeStatus}
              onEditTask={handleOpenEditTask}
              onRequestDelete={setTaskToDelete}
            />
          )}

          {activeNav === 'settings' && (
            <SettingsView
              settings={settings}
              tasks={tasks}
              onUpdateSettings={handleUpdateSettings}
              onClearCompleted={handleClearCompleted}
              onRestoreDemoTasks={handleRestoreDemoTasks}
              onNotify={(msg, variant) => showToast(msg, variant)}
            />
          )}
        </main>
      </div>

      {/* Create / Edit Task Modal */}
      <TaskFormModal
        isOpen={isTaskModalOpen}
        editingTask={editingTask}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleSaveTask}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        task={taskToDelete}
        onCancel={() => setTaskToDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Toast Notifications */}
      <ToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
        onUndo={handleUndoCompleteFromToast}
      />
    </div>
  );
}
