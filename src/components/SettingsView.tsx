import React, { useState } from 'react';
import { Sun, Moon, Bell, Download, Trash2, RotateCcw } from 'lucide-react';
import { AppSettings, SortOption, Task } from '../types/task';

interface SettingsViewProps {
  settings: AppSettings;
  tasks: Task[];
  onUpdateSettings: (partial: Partial<AppSettings>) => void;
  onClearCompleted: () => void;
  onRestoreDemoTasks: () => void;
  onNotify: (message: string, variant?: 'success' | 'info' | 'warning') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  tasks,
  onUpdateSettings,
  onClearCompleted,
  onRestoreDemoTasks,
  onNotify,
}) => {
  const [confirmClearCompleted, setConfirmClearCompleted] = useState(false);
  const [confirmRestoreDemo, setConfirmRestoreDemo] = useState(false);

  const completedCount = tasks.filter((t) => t.status === 'Completed').length;
  const notificationSupported = typeof window !== 'undefined' && 'Notification' in window;

  const handleToggleBrowserNotifications = async () => {
    if (!notificationSupported) {
      onNotify('Browser notifications are not supported in this browser.', 'warning');
      return;
    }

    if (settings.browserNotificationsEnabled) {
      onUpdateSettings({ browserNotificationsEnabled: false });
      onNotify('Browser reminders turned off.', 'info');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        onUpdateSettings({ browserNotificationsEnabled: true });
        onNotify('Browser reminders enabled.', 'success');
      } else {
        onNotify('Notification permission was denied by the browser.', 'warning');
      }
    } catch {
      onNotify('Unable to request notification permission.', 'warning');
    }
  };

  const handleTestReminder = () => {
    const pendingToday = tasks.filter((t) => t.status !== 'Completed').length;
    if (notificationSupported && Notification.permission === 'granted' && settings.browserNotificationsEnabled) {
      new Notification('ClearDay Task Reminder', {
        body: `You have ${pendingToday} pending ${pendingToday === 1 ? 'task' : 'tasks'} in your workspace.`,
      });
    }
    onNotify(`Reminder check: ${pendingToday} active tasks waiting.`, 'info');
  };

  const handleExportTasks = () => {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clearday-tasks-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onNotify('Tasks exported as JSON.', 'success');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Customize theme, daily reminders, sorting preferences, and saved task data.
        </p>
      </div>

      {/* Appearance */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs">
        <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
          Appearance
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Switch between Light and Dark theme for comfortable viewing.
        </p>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onUpdateSettings({ theme: 'light' })}
            className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              settings.theme === 'light'
                ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/30 text-slate-900 dark:text-white'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Sun className="h-5 w-5 text-amber-500 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold">Light Mode</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Crisp white and royal blue palette
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onUpdateSettings({ theme: 'dark' })}
            className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              settings.theme === 'dark'
                ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-slate-900 dark:text-white'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Moon className="h-5 w-5 text-blue-500 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold">Dark Mode</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Low-glare slate surface palette
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* Daily Task Reminders */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Daily Task Reminders
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Show a daily summary banner for tasks due today and overdue items.
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={settings.dailyRemindersEnabled}
            aria-label="Toggle daily task reminders"
            onClick={() =>
              onUpdateSettings({
                dailyRemindersEnabled: !settings.dailyRemindersEnabled,
                dismissedReminderDate: null,
              })
            }
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              settings.dailyRemindersEnabled
                ? 'bg-blue-600'
                : 'bg-slate-200 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-xs transition-transform duration-150 ${
                settings.dailyRemindersEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div>
            <label
              htmlFor="reminder-time"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Preferred Reminder Time
            </label>
            <input
              id="reminder-time"
              type="time"
              value={settings.reminderTime}
              onChange={(e) => onUpdateSettings({ reminderTime: e.target.value })}
              className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm font-mono text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleToggleBrowserNotifications}
              className={`px-3.5 h-10 rounded-xl text-xs font-medium border transition-colors whitespace-nowrap ${
                settings.browserNotificationsEnabled
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {settings.browserNotificationsEnabled
                ? 'Browser Alerts: On'
                : 'Enable Browser Alerts'}
            </button>

            <button
              type="button"
              onClick={handleTestReminder}
              className="px-3.5 h-10 rounded-xl text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-950 transition-colors whitespace-nowrap"
            >
              Test Reminder
            </button>
          </div>
        </div>
      </section>

      {/* Default Sort & Data Management */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs space-y-5">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            Preferences &amp; Data
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Tasks are saved automatically in your browser's local storage.
          </p>
        </div>

        <div>
          <label
            htmlFor="default-sort"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Default Task Sort Order
          </label>
          <select
            id="default-sort"
            value={settings.defaultSort}
            onChange={(e) => onUpdateSettings({ defaultSort: e.target.value as SortOption })}
            className="w-full sm:w-64 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          >
            <option value="dueDateAsc">Due Date (Earliest First)</option>
            <option value="dueDateDesc">Due Date (Latest First)</option>
            <option value="createdDesc">Creation Date (Newest First)</option>
            <option value="createdAsc">Creation Date (Oldest First)</option>
          </select>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportTasks}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Export JSON ({tasks.length})</span>
          </button>

          {!confirmClearCompleted ? (
            <button
              type="button"
              disabled={completedCount === 0}
              onClick={() => setConfirmClearCompleted(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/70 transition-colors whitespace-nowrap disabled:opacity-40 disabled:pointer-events-none"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Clear Completed ({completedCount})</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-900 bg-red-50/70 dark:bg-red-950/30 px-3 py-1.5">
              <span className="text-xs font-medium text-red-700 dark:text-red-300">
                Remove {completedCount} completed?
              </span>
              <button
                type="button"
                onClick={() => {
                  onClearCompleted();
                  setConfirmClearCompleted(false);
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirmClearCompleted(false)}
                className="px-2 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:underline"
              >
                Cancel
              </button>
            </div>
          )}

          {!confirmRestoreDemo ? (
            <button
              type="button"
              onClick={() => setConfirmRestoreDemo(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Restore Sample Tasks</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                Replace list with samples?
              </span>
              <button
                type="button"
                onClick={() => {
                  onRestoreDemoTasks();
                  setConfirmRestoreDemo(false);
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700"
              >
                Restore
              </button>
              <button
                type="button"
                onClick={() => setConfirmRestoreDemo(false)}
                className="px-2 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:underline"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
