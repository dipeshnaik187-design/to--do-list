import React from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ListTodo,
  ArrowRight,
  Plus,
  X,
  Check,
} from 'lucide-react';
import {
  AppSettings,
  NavSection,
  Task,
  TaskCategory,
  TaskOrganizationTab,
  TaskPriority,
} from '../types/task';
import {
  TaskStats,
  formatDueDate,
  getTodayDateString,
  isTaskOverdue,
  isTaskToday,
} from '../utils/taskHelpers';

interface DashboardViewProps {
  tasks: Task[];
  stats: TaskStats;
  settings: AppSettings;
  onNavigate: (nav: NavSection, tab?: TaskOrganizationTab) => void;
  onOpenNewTask: () => void;
  onToggleComplete: (taskId: string) => void;
  onDismissDailyReminder: () => void;
}

const CATEGORIES: TaskCategory[] = ['Work', 'Study', 'Personal', 'Other'];
const PRIORITIES: TaskPriority[] = ['High', 'Medium', 'Low'];

export const DashboardView: React.FC<DashboardViewProps> = ({
  tasks,
  stats,
  settings,
  onNavigate,
  onOpenNewTask,
  onToggleComplete,
  onDismissDailyReminder,
}) => {
  const todayStr = getTodayDateString();
  const formattedToday = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const showReminderBanner =
    settings.dailyRemindersEnabled &&
    settings.dismissedReminderDate !== todayStr &&
    (stats.todayPending > 0 || stats.overdue > 0);

  // Focus queue: overdue first, then today's pending tasks, sorted by priority
  const priorityWeight: Record<TaskPriority, number> = { High: 0, Medium: 1, Low: 2 };
  const focusTasks = tasks
    .filter((t) => t.status !== 'Completed' && (isTaskOverdue(t) || isTaskToday(t)))
    .sort((a, b) => {
      const aOver = isTaskOverdue(a) ? 0 : 1;
      const bOver = isTaskOverdue(b) ? 0 : 1;
      if (aOver !== bOver) return aOver - bOver;
      return priorityWeight[a.priority] - priorityWeight[b.priority];
    })
    .slice(0, 5);

  const kpiCards = [
    {
      label: 'Total Tasks',
      value: stats.total,
      icon: ListTodo,
      iconBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
      subtext: `${stats.upcomingCount} upcoming`,
      onClick: () => onNavigate('all', 'all'),
    },
    {
      label: 'Completed Tasks',
      value: stats.completed,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
      subtext: `${stats.completionRate}% of total`,
      onClick: () => onNavigate('completed'),
    },
    {
      label: 'Pending Tasks',
      value: stats.pending,
      icon: Clock,
      iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
      subtext: `${stats.inProgress} in progress`,
      onClick: () => onNavigate('all', 'pending'),
    },
    {
      label: 'Overdue Tasks',
      value: stats.overdue,
      icon: AlertTriangle,
      iconBg:
        stats.overdue > 0
          ? 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
      subtext: stats.overdue > 0 ? 'Needs attention' : 'All on schedule',
      highlightDanger: stats.overdue > 0,
      onClick: () => onNavigate('all', 'overdue'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{formattedToday}</p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
            Productivity Overview
          </h1>
        </div>
        <button
          type="button"
          onClick={onOpenNewTask}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Daily Task Reminder Banner */}
      {showReminderBanner && (
        <section
          aria-label="Daily task reminder"
          className="rounded-xl border border-blue-200 dark:border-blue-900/80 bg-blue-50/70 dark:bg-blue-950/30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shrink-0">
              <Bell className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                Daily Task Reminder · {settings.reminderTime}
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                You have{' '}
                <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                  {stats.todayPending}
                </span>{' '}
                {stats.todayPending === 1 ? 'task' : 'tasks'} due today
                {stats.overdue > 0 && (
                  <>
                    {' '}
                    and{' '}
                    <span className="font-mono font-semibold tabular-nums text-red-600 dark:text-red-400">
                      {stats.overdue}
                    </span>{' '}
                    overdue {stats.overdue === 1 ? 'task' : 'tasks'}
                  </>
                )}
                .
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {stats.overdue > 0 && (
              <button
                type="button"
                onClick={() => onNavigate('all', 'overdue')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-700 dark:text-red-300 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors whitespace-nowrap"
              >
                Review Overdue
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigate('today')}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              Open Today's Tasks
            </button>
            <button
              type="button"
              onClick={onDismissDailyReminder}
              aria-label="Dismiss today's reminder"
              title="Dismiss for today"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-blue-100/70 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-blue-900/40 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </section>
      )}

      {/* 4-Column KPI Strip */}
      <section aria-label="Task metrics" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              type="button"
              onClick={card.onClick}
              className="text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:border-blue-300 dark:hover:border-blue-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {card.label}
                </span>
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.iconBg}`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between gap-2">
                <span
                  className={`font-display text-3xl font-bold tabular-nums tracking-tight ${
                    card.highlightDanger
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {card.value}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  {card.subtext}
                </span>
              </div>
            </button>
          );
        })}
      </section>

      {/* Completion Progress Bar Section */}
      <section
        aria-label="Overall task completion progress"
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Task Completion Progress
            </h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400 tabular-nums">
              {stats.completed} of {stats.total} {stats.total === 1 ? 'task' : 'tasks'} completed
            </p>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-3xl font-bold tabular-nums text-blue-600 dark:text-blue-400">
              {stats.completionRate}%
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              complete
            </span>
          </div>
        </div>

        <div
          role="progressbar"
          aria-valuenow={stats.completionRate}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Overall task completion percentage"
          className="mt-4 h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"
        >
          <div
            className="h-full rounded-full bg-blue-600 dark:bg-blue-500 transition-[width] duration-300 ease-out"
            style={{ width: `${stats.completionRate}%` }}
          />
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600 dark:text-slate-400">
          <span className="tabular-nums">
            <strong className="font-semibold text-slate-900 dark:text-slate-200">
              {stats.todayTotal}
            </strong>{' '}
            scheduled today
          </span>
          <span className="tabular-nums">
            <strong className="font-semibold text-slate-900 dark:text-slate-200">
              {stats.inProgress}
            </strong>{' '}
            in progress
          </span>
          <span className="tabular-nums">
            <strong className="font-semibold text-slate-900 dark:text-slate-200">
              {stats.upcomingCount}
            </strong>{' '}
            upcoming
          </span>
        </div>
      </section>

      {/* Two-Column Workspace: Focus Queue & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Today's & Overdue Focus */}
        <section className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Due Today &amp; Overdue
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                High-attention items requiring action
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('today')}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap shrink-0"
            >
              <span>View Today</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          {focusTasks.length === 0 ? (
            <div className="py-10 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
                You are caught up for today
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                No overdue or pending tasks remaining for today.
              </p>
              <button
                type="button"
                onClick={onOpenNewTask}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-950 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Schedule a task</span>
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {focusTasks.map((task) => {
                const overdue = isTaskOverdue(task);
                return (
                  <li
                    key={task.id}
                    className="py-3.5 first:pt-4 last:pb-1 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => onToggleComplete(task.id)}
                        aria-label={`Complete "${task.title}"`}
                        className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-md border border-slate-300 dark:border-slate-600 hover:border-blue-600 text-transparent hover:text-blue-600 transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                      >
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {task.title}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <span
                            className={
                              task.priority === 'High'
                                ? 'text-red-600 dark:text-red-400 font-medium'
                                : task.priority === 'Medium'
                                  ? 'text-amber-600 dark:text-amber-400 font-medium'
                                  : ''
                            }
                          >
                            {task.priority}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{task.category}</span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={`font-mono tabular-nums ${
                              overdue ? 'text-red-600 dark:text-red-400 font-medium' : ''
                            }`}
                          >
                            {formatDueDate(task.dueDate)}
                            {overdue ? ' (Overdue)' : ''}
                          </span>
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Right: Category & Priority Breakdown */}
        <section className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs space-y-6">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Tasks by Category
            </h2>
            <div className="mt-4 space-y-3">
              {CATEGORIES.map((category) => {
                const count = tasks.filter((t) => t.category === category).length;
                const pct = stats.total === 0 ? 0 : Math.round((count / stats.total) * 100);
                return (
                  <div key={category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {category}
                      </span>
                      <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        {count}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-600 dark:bg-blue-500 transition-[width] duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-5 border-t border-slate-100 dark:border-slate-800">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              Active Tasks by Priority
            </h3>
            <div className="mt-3.5 space-y-3">
              {PRIORITIES.map((priority) => {
                const activeCount = tasks.filter(
                  (t) => t.status !== 'Completed' && t.priority === priority
                ).length;
                const activeTotal = stats.pending;
                const pct = activeTotal === 0 ? 0 : Math.round((activeCount / activeTotal) * 100);
                const barColor =
                  priority === 'High'
                    ? 'bg-red-500'
                    : priority === 'Medium'
                      ? 'bg-amber-500'
                      : 'bg-slate-400 dark:bg-slate-500';
                return (
                  <div key={priority} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {priority} Priority
                      </span>
                      <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        {activeCount}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor} transition-[width] duration-300`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
