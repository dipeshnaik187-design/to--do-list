import React from 'react';
import {
  Check,
  Calendar,
  Pencil,
  Trash2,
  RotateCcw,
  AlertCircle,
  Flag,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Task, TaskStatus } from '../types/task';
import { formatDueDate, isTaskOverdue, isTaskToday } from '../utils/taskHelpers';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (taskId: string) => void;
  onChangeStatus: (taskId: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onRequestDelete: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleComplete,
  onChangeStatus,
  onEdit,
  onRequestDelete,
}) => {
  const isCompleted = task.status === 'Completed';
  const overdue = isTaskOverdue(task);
  const dueToday = isTaskToday(task);

  const priorityColorClass =
    task.priority === 'High'
      ? 'text-red-600 dark:text-red-400'
      : task.priority === 'Medium'
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-slate-500 dark:text-slate-400';

  const statusColorClass =
    task.status === 'Completed'
      ? 'text-emerald-600 dark:text-emerald-400'
      : task.status === 'In Progress'
        ? 'text-blue-600 dark:text-blue-400'
        : 'text-slate-600 dark:text-slate-400';

  const dateColorClass = overdue
    ? 'text-red-600 dark:text-red-400 font-medium'
    : dueToday && !isCompleted
      ? 'text-blue-600 dark:text-blue-400 font-medium'
      : 'text-slate-500 dark:text-slate-400';

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
      className={`group rounded-xl border bg-white dark:bg-slate-900 p-4 sm:p-5 transition-colors duration-150 ${
        isCompleted
          ? 'border-slate-200/80 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/60'
          : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700/80 shadow-xs'
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Interactive Completion Toggle */}
        <button
          type="button"
          onClick={() => onToggleComplete(task.id)}
          aria-label={isCompleted ? `Mark "${task.title}" as pending` : `Mark "${task.title}" as completed`}
          className="mt-0.5 flex h-10 w-10 -m-2 items-center justify-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 shrink-0"
        >
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors duration-150 ${
              isCompleted
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 group-hover:border-blue-500'
            }`}
          >
            {isCompleted && <Check className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden="true" />}
          </span>
        </button>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div className="min-w-0">
              <h3
                className={`font-display text-base font-semibold leading-snug break-words ${
                  isCompleted
                    ? 'line-through text-slate-400 dark:text-slate-500'
                    : 'text-slate-900 dark:text-slate-100'
                }`}
              >
                {task.title}
              </h3>

              {task.description && (
                <p
                  className={`mt-1 text-sm leading-relaxed break-words ${
                    isCompleted
                      ? 'text-slate-400 dark:text-slate-500'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {task.description}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 shrink-0 pt-1 sm:pt-0">
              {isCompleted ? (
                <button
                  type="button"
                  onClick={() => onToggleComplete(task.id)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  title="Undo task completion"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Undo</span>
                </button>
              ) : (
                <select
                  aria-label={`Change status for ${task.title}`}
                  value={task.status}
                  onChange={(e) => onChangeStatus(task.id, e.target.value as TaskStatus)}
                  className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              )}

              <button
                type="button"
                onClick={() => onEdit(task)}
                aria-label={`Edit "${task.title}"`}
                title="Edit task"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-950/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => onRequestDelete(task)}
                aria-label={`Delete "${task.title}"`}
                title="Delete task"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/50 transition-colors focus:outline-none focus-visible:ring-2 focus:ring-red-600"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Unboxed Metadata Row with Typographic Separators */}
          <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
            <span className={`inline-flex items-center gap-1 font-medium ${priorityColorClass}`}>
              <Flag className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{task.priority} priority</span>
            </span>

            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
              ·
            </span>

            <span className="text-slate-600 dark:text-slate-400">{task.category}</span>

            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
              ·
            </span>

            <span className={`inline-flex items-center gap-1 font-mono tabular-nums ${dateColorClass}`}>
              {overdue ? (
                <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>
                {formatDueDate(task.dueDate)}
                {overdue ? ' (Overdue)' : ''}
              </span>
            </span>

            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
              ·
            </span>

            <span className={`font-medium ${statusColorClass}`}>{task.status}</span>
          </div>
        </div>
      </div>
    </motion.article>
  );
};
