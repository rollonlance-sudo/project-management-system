import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Skeleton from '../components/Skeleton';
import CreateProjectModal from '../components/CreateProjectModal';
import {
  HiOutlinePlus,
  HiOutlineClock,
  HiOutlineExclamation,
  HiOutlineCalendar,
  HiOutlineFolder,
} from 'react-icons/hi';
import { format, isToday, isPast, isFuture, addDays } from 'date-fns';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { dbUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projectsRes, tasksRes] = await Promise.all([
        api.get('/projects'),
        api.get('/tasks/my-tasks'),
      ]);
      setProjects(projectsRes.data);
      setMyTasks(tasksRes.data);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const overdueTasks = myTasks.filter(
    (t) => t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate))
  );
  const todayTasks = myTasks.filter(
    (t) => t.dueDate && isToday(new Date(t.dueDate))
  );
  const upcomingTasks = myTasks.filter(
    (t) => t.dueDate && isFuture(new Date(t.dueDate)) && !isToday(new Date(t.dueDate))
  );

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Skeleton className="h-24" count={3} />
        </div>
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-40" count={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {dbUser?.name?.split(' ')[0]}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Here's what's happening across your projects
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
        >
          <HiOutlinePlus />
          New Project
        </button>
      </div>

      {/* Task Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg">
              <HiOutlineExclamation className="text-red-600 dark:text-red-400 text-xl" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {overdueTasks.length}
              </p>
              <p className="text-sm text-red-600/70 dark:text-red-400/70">Overdue</p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg">
              <HiOutlineClock className="text-yellow-600 dark:text-yellow-400 text-xl" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {todayTasks.length}
              </p>
              <p className="text-sm text-yellow-600/70 dark:text-yellow-400/70">Due Today</p>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
              <HiOutlineCalendar className="text-blue-600 dark:text-blue-400 text-xl" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {upcomingTasks.length}
              </p>
              <p className="text-sm text-blue-600/70 dark:text-blue-400/70">Upcoming</p>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Your Projects
      </h2>
      {projects.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <HiOutlineFolder className="mx-auto text-4xl text-gray-400 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">No projects yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Create your first project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project._id}
              to={`/projects/${project._id}`}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-md transition-shadow group"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1">
                {project.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
                {project.description || 'No description'}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {project.members?.slice(0, 4).map((m, i) =>
                    m.userId?.avatar ? (
                      <img
                        key={i}
                        src={m.userId.avatar}
                        alt=""
                        className="w-7 h-7 rounded-full border-2 border-white dark:border-gray-800 object-cover"
                      />
                    ) : (
                      <div
                        key={i}
                        className="w-7 h-7 rounded-full border-2 border-white dark:border-gray-800 bg-blue-500 flex items-center justify-center text-white text-xs font-medium"
                      >
                        {m.userId?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                    )
                  )}
                  {project.members?.length > 4 && (
                    <div className="w-7 h-7 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                      +{project.members.length - 4}
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {format(new Date(project.createdAt), 'MMM d, yyyy')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(project) => {
            setProjects([project, ...projects]);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}
