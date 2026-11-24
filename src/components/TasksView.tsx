import React from 'react';
import { Search, Plus, X, RotateCcw, CheckSquare } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import {
  SortOption,
  Task,
  TaskCategory,
  TaskOrganizationTab,
  TaskPriority,
  TaskStatus,
} from '../types/task';
import { TaskStats, filterAndSortTasks, isTaskOverdue, isTaskPendingGroup } from '../utils/taskHelpers';
import { TaskCard } from './TaskCard';

interface TasksViewProps {
  scope: 'all' | 'today' | 'upcoming' | 'completed';
  tasks: Task[];
  stats: TaskStats;
  organizationTab: TaskOrganizationTab;
  onChangeOrganizationTab: (tab: TaskOrganizationTab) => void;
  searchQuery: string;
  onChangeSearch: (q: string) => void;
  priorityFilter: TaskPriority | 'All';
  onChangePriorityFilter: (p: TaskPriority | 'All') => void;
  categoryFilter: TaskCategory | 'All';
  onChangeCategoryFilter: (c: TaskCategory | 'All') => void;
  statusFilter: TaskStatus | 'All';
  onChangeStatusFilter: (s: TaskStatus | 'All') => void;
  sortBy: SortOption;
  onChangeSortBy: (s: SortOption) => void;
  onResetFilters: () => void;
  onOpenNewTask: () => void;
  onToggleComplete: (taskId: string) => void;
  onChangeStatus: (taskId: string, status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onRequestDelete: (task: Task) => void;
}

const SCOPE_META: Record<
  'all' | 'today' | 'upcoming' | 'completed',
  { title: string; subtitle: string }
> = {
  all: {
    title: 'My Tasks',
    subtitle: 'Organize, filter, and track every task across your schedule.',
  },
  today: {
    title: "Today's Tasks",
    subtitle: 'Tasks scheduled for completion today.',
  },
  upcoming: {
    title: 'Upcoming Tasks',
    subtitle: 'Active tasks with deadlines beyond today.',
  },
  completed: {
    title: 'Completed Tasks',
    subtitle: 'Finished tasks. Reopen or undo any item if plans change.',
  },
};

export const TasksView: React.FC<TasksViewProps> = ({
  scope,
  tasks,
  stats,
  organizationTab,
  onChangeOrganizationTab,
  searchQuery,
  onChangeSearch,
  priorityFilter,
  onChangePriorityFilter,
  categoryFilter,
  onChangeCategoryFilter,
  statusFilter,
  onChangeStatusFilter,
  sortBy,
  onChangeSortBy,
  onResetFilters,
  onOpenNewTask,
  onToggleComplete,
  onChangeStatus,
  onEditTask,
  onRequestDelete,
}) => {
  const visibleTasks = filterAndSortTasks(tasks, {
    searchQuery,
    priority: priorityFilter,
    category: categoryFilter,
    status: statusFilter,
    organizationTab,
    sortBy,
    scope,
  });

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    priorityFilter !== 'All' ||
    categoryFilter !== 'All' ||
    statusFilter !== 'All' ||
    (scope === 'all' && organizationTab !== 'all');

  const orgTabs: { id: TaskOrganizationTab; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: stats.total },
    {
      id: 'pending',
      label: 'Pending',
      count: tasks.filter((t) => isTaskPendingGroup(t)).length,
    },
    { id: 'in_progress', label: 'In Progress', count: stats.inProgress },
    {
      id: 'overdue',
      label: 'Overdue',
      count: tasks.filter((t) => isTaskOverdue(t)).length,
    },
    { id: 'completed', label: 'Completed', count: stats.completed },
  ];

  const { title, subtitle } = SCOPE_META[scope];

  return (
    <div className="space-y-5">
      {/* Page Title & Primary CTA */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
            {title}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
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

      {/* Organization Segmented Tabs (shown in My Tasks) */}
      {scope === 'all' && (
        <div
          role="tablist"
          aria-label="Task organization views"
          className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-x-auto"
        >
          {orgTabs.map((tab) => {
            const active = organizationTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onChangeOrganizationTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  active
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`font-mono tabular-nums ${
                    tab.id === 'overdue' && tab.count > 0 && !active
                      ? 'text-red-600 dark:text-red-400'
                      : active
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Search, Filter & Sort Toolbar */}
      <section
        aria-label="Search and filter tasks"
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search by Title */}
          <div className="md:col-span-4 relative">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Search tasks by title"
              value={searchQuery}
              onChange={(e) => onChangeSearch(e.target.value)}
              placeholder="Search tasks by title..."
              className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 pl-10 pr-9 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-950 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onChangeSearch('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filters & Sort */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <select
              aria-label="Filter by priority"
              value={priorityFilter}
              onChange={(e) => onChangePriorityFilter(e.target.value as TaskPriority | 'All')}
              className="h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-xs sm:text-sm text-slate-700 dark:text-slate-200 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 cursor-pointer"
            >
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(e) => onChangeCategoryFilter(e.target.value as TaskCategory | 'All')}
              className="h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-xs sm:text-sm text-slate-700 dark:text-slate-200 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Work">Work</option>
              <option value="Study">Study</option>
              <option value="Personal">Personal</option>
              <option value="Other">Other</option>
            </select>

            <select
              aria-label="Filter by task status"
              value={statusFilter}
              onChange={(e) => onChangeStatusFilter(e.target.value as TaskStatus | 'All')}
              disabled={scope === 'completed'}
              className="h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-xs sm:text-sm text-slate-700 dark:text-slate-200 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 cursor-pointer disabled:opacity-50"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>

            <select
              aria-label="Sort tasks"
              value={sortBy}
              onChange={(e) => onChangeSortBy(e.target.value as SortOption)}
              className="h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-xs sm:text-sm text-slate-700 dark:text-slate-200 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 cursor-pointer"
            >
              <option value="dueDateAsc">Due Date (Earliest)</option>
              <option value="dueDateDesc">Due Date (Latest)</option>
              <option value="createdDesc">Created (Newest)</option>
              <option value="createdAsc">Created (Oldest)</option>
            </select>
          </div>
        </div>

        {/* Active Filter Summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="tabular-nums">
            Showing <strong className="font-semibold text-slate-900 dark:text-slate-200">{visibleTasks.length}</strong>{' '}
            {visibleTasks.length === 1 ? 'task' : 'tasks'}
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              <span>Reset filters</span>
            </button>
          )}
        </div>
      </section>

      {/* Task List or Empty State */}
      {visibleTasks.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <CheckSquare className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="mt-4 font-display text-lg font-semibold text-slate-900 dark:text-white">
            {hasActiveFilters ? 'No tasks match your filters' : 'No tasks here yet'}
          </h2>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {hasActiveFilters
              ? 'Try clearing your search query or adjusting the priority, category, or status filters.'
              : scope === 'completed'
                ? 'Tasks you mark as completed will appear here so you can review or undo them.'
                : 'Create your first task with a due date and priority to start tracking progress.'}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Reset Filters
              </button>
            )}
            <button
              type="button"
              onClick={onOpenNewTask}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Add Task</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {visibleTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleComplete={onToggleComplete}
                onChangeStatus={onChangeStatus}
                onEdit={onEditTask}
                onRequestDelete={onRequestDelete}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
