import { format } from 'date-fns';
import { HiOutlineCalendar, HiOutlineUser, HiOutlineChatAlt } from 'react-icons/hi';

const priorityColors = {
  Low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  High: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function TaskCard({ task, onClick, isDragging }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-gray-700 rounded-lg p-3 mb-2 cursor-pointer border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 transition-all ${
        isDragging ? 'shadow-lg ring-2 ring-blue-500' : 'shadow-sm'
      }`}
    >
      {/* Labels */}
      {task.labels?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.map((label, i) => (
            <span
              key={i}
              className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
        {task.title}
      </p>

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-gray-400">
        {task.priority && (
          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${priorityColors[task.priority]}`}>
            {task.priority}
          </span>
        )}
        {task.dueDate && (
          <span className="flex items-center gap-1">
            <HiOutlineCalendar />
            {format(new Date(task.dueDate), 'MMM d')}
          </span>
        )}
        {task.assignee && (
          <span className="flex items-center gap-1 ml-auto">
            {task.assignee.avatar ? (
              <img
                src={task.assignee.avatar}
                alt=""
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-medium">
                {task.assignee.name?.[0]?.toUpperCase()}
              </div>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
