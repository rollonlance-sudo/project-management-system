import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { format } from 'date-fns';
import {
  HiOutlineX,
  HiOutlineTrash,
  HiOutlineChatAlt,
  HiOutlineClock,
} from 'react-icons/hi';
import toast from 'react-hot-toast';

const priorityOptions = ['Low', 'Medium', 'High'];

export default function TaskDetailModal({
  task,
  project,
  columns,
  onClose,
  onUpdate,
  onMove,
  onDelete,
}) {
  const { dbUser } = useAuth();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState(task.priority || 'Medium');
  const [dueDate, setDueDate] = useState(
    task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : ''
  );
  const [assignee, setAssignee] = useState(task.assignee?._id || '');
  const [labels, setLabels] = useState(task.labels?.join(', ') || '');
  const [selectedColumn, setSelectedColumn] = useState(task.columnId);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [activity, setActivity] = useState([]);
  const [tab, setTab] = useState('details');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [task._id]);

  const fetchComments = async () => {
    try {
      const res = await api.get(`/tasks/${task._id}/comments`);
      setComments(res.data);
    } catch (err) {
      console.error('Failed to load comments');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate: dueDate || null,
        assignee: assignee || null,
        labels: labels
          .split(',')
          .map((l) => l.trim())
          .filter(Boolean),
      };

      // If column changed, move task
      if (selectedColumn !== task.columnId) {
        body.columnId = selectedColumn;
        onMove(task._id, task.columnId, selectedColumn);
      }

      const res = await api.put(`/tasks/${task._id}`, body);
      onUpdate(res.data);
      toast.success('Task updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update task');
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await api.post(`/tasks/${task._id}/comments`, {
        text: newComment.trim(),
      });
      setComments([...comments, res.data]);
      setNewComment('');
    } catch (err) {
      toast.error('Failed to add comment');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-10 px-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-xl mb-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Task Details</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDelete(task._id)}
              className="p-1.5 text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 rounded-lg"
            >
              <HiOutlineTrash />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <HiOutlineX className="text-xl" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
          <button
            onClick={() => setTab('details')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === 'details'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setTab('comments')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              tab === 'comments'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <HiOutlineChatAlt />
            Comments ({comments.length})
          </button>
        </div>

        <div className="p-6">
          {tab === 'details' ? (
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Column */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Column
                  </label>
                  <select
                    value={selectedColumn}
                    onChange={(e) => setSelectedColumn(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {columns.map((col) => (
                      <option key={col._id} value={col._id}>
                        {col.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {priorityOptions.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Assignee */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Assignee
                  </label>
                  <select
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Unassigned</option>
                    {project?.members?.map((m) => (
                      <option key={m.userId?._id} value={m.userId?._id}>
                        {m.userId?.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Labels */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Labels (comma separated)
                </label>
                <input
                  value={labels}
                  onChange={(e) => setLabels(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="bug, frontend, urgent"
                />
              </div>

              {/* Save */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

              {/* Info */}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <HiOutlineClock />
                    Created {format(new Date(task.createdAt), 'MMM d, yyyy h:mm a')}
                  </span>
                  {task.createdBy && (
                    <span>by {task.createdBy.name}</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Comments Tab */
            <div>
              <div className="space-y-4 max-h-80 overflow-y-auto mb-4">
                {comments.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-8">
                    No comments yet. Start the conversation!
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment._id} className="flex gap-3">
                      {comment.userId?.avatar ? (
                        <img
                          src={comment.userId.avatar}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                          {comment.userId?.name?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {comment.userId?.name}
                          </span>
                          <span className="text-xs text-gray-400">
                            {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add comment */}
              <div className="flex gap-2">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Write a comment..."
                />
                <button
                  onClick={handleAddComment}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
