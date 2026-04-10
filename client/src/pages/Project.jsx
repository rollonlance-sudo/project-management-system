import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import TaskCard from '../components/TaskCard';
import TaskDetailModal from '../components/TaskDetailModal';
import InviteMemberModal from '../components/InviteMemberModal';
import Skeleton from '../components/Skeleton';
import {
  HiOutlinePlus,
  HiOutlineDotsVertical,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineUserAdd,
  HiOutlineArrowLeft,
  HiOutlineCog,
} from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function Project() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { dbUser } = useAuth();
  const [project, setProject] = useState(null);
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingProject, setEditingProject] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [addingTaskToColumn, setAddingTaskToColumn] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingColumnId, setEditingColumnId] = useState(null);
  const [editColumnTitle, setEditColumnTitle] = useState('');
  const [columnMenu, setColumnMenu] = useState(null);

  const fetchBoard = useCallback(async () => {
    try {
      const [projectRes, boardRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/projects/${projectId}/board`),
      ]);
      setProject(projectRes.data);
      setBoard(boardRes.data);
      setProjectTitle(projectRes.data.title);
      setProjectDesc(projectRes.data.description || '');
    } catch (err) {
      toast.error('Failed to load project');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [projectId, navigate]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  const handleDragEnd = async (result) => {
    const { source, destination, type } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (type === 'column') {
      const reordered = Array.from(board);
      const [moved] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, moved);
      setBoard(reordered);

      try {
        await api.put('/columns/reorder', {
          columns: reordered.map((col, i) => ({ id: col._id, order: i })),
        });
      } catch {
        fetchBoard();
      }
      return;
    }

    // Task drag
    const sourceCol = board.find((c) => c._id === source.droppableId);
    const destCol = board.find((c) => c._id === destination.droppableId);

    if (source.droppableId === destination.droppableId) {
      const tasks = Array.from(sourceCol.tasks);
      const [moved] = tasks.splice(source.index, 1);
      tasks.splice(destination.index, 0, moved);

      const newBoard = board.map((c) =>
        c._id === sourceCol._id ? { ...c, tasks } : c
      );
      setBoard(newBoard);

      try {
        await api.put('/tasks/reorder', {
          tasks: tasks.map((t, i) => ({ id: t._id, columnId: sourceCol._id, order: i })),
        });
      } catch {
        fetchBoard();
      }
    } else {
      const sourceTasks = Array.from(sourceCol.tasks);
      const destTasks = Array.from(destCol.tasks);
      const [moved] = sourceTasks.splice(source.index, 1);
      moved.columnId = destCol._id;
      destTasks.splice(destination.index, 0, moved);

      const newBoard = board.map((c) => {
        if (c._id === sourceCol._id) return { ...c, tasks: sourceTasks };
        if (c._id === destCol._id) return { ...c, tasks: destTasks };
        return c;
      });
      setBoard(newBoard);

      try {
        const allTasks = [
          ...sourceTasks.map((t, i) => ({ id: t._id, columnId: sourceCol._id, order: i })),
          ...destTasks.map((t, i) => ({ id: t._id, columnId: destCol._id, order: i })),
        ];
        await api.put('/tasks/reorder', { tasks: allTasks });
      } catch {
        fetchBoard();
      }
    }
  };

  const handleAddColumn = async () => {
    if (!newColumnTitle.trim()) return;
    try {
      const res = await api.post('/columns', {
        projectId,
        title: newColumnTitle.trim(),
      });
      setBoard([...board, res.data]);
      setNewColumnTitle('');
      setAddingColumn(false);
    } catch (err) {
      toast.error('Failed to add column');
    }
  };

  const handleRenameColumn = async (colId) => {
    if (!editColumnTitle.trim()) return;
    try {
      await api.put(`/columns/${colId}`, { title: editColumnTitle.trim() });
      setBoard(board.map((c) => (c._id === colId ? { ...c, title: editColumnTitle.trim() } : c)));
      setEditingColumnId(null);
    } catch (err) {
      toast.error('Failed to rename column');
    }
  };

  const handleDeleteColumn = async (colId) => {
    try {
      await api.delete(`/columns/${colId}`);
      setBoard(board.filter((c) => c._id !== colId));
      setColumnMenu(null);
      toast.success('Column deleted');
    } catch (err) {
      toast.error('Failed to delete column');
    }
  };

  const handleAddTask = async (columnId) => {
    if (!newTaskTitle.trim()) return;
    try {
      const res = await api.post('/tasks', {
        columnId,
        projectId,
        title: newTaskTitle.trim(),
      });
      setBoard(
        board.map((c) =>
          c._id === columnId ? { ...c, tasks: [...c.tasks, res.data] } : c
        )
      );
      setNewTaskTitle('');
      setAddingTaskToColumn(null);
    } catch (err) {
      toast.error('Failed to add task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      setBoard(
        board.map((c) => ({
          ...c,
          tasks: c.tasks.filter((t) => t._id !== taskId),
        }))
      );
      setSelectedTask(null);
      toast.success('Task deleted');
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const handleUpdateProject = async () => {
    try {
      const res = await api.put(`/projects/${projectId}`, {
        title: projectTitle,
        description: projectDesc,
      });
      setProject(res.data);
      setEditingProject(false);
      toast.success('Project updated');
    } catch (err) {
      toast.error('Failed to update project');
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm('Are you sure you want to delete this project? This cannot be undone.')) return;
    try {
      await api.delete(`/projects/${projectId}`);
      toast.success('Project deleted');
      navigate('/');
    } catch (err) {
      toast.error('Failed to delete project');
    }
  };

  const isOwner = project?.owner?._id === dbUser?._id;

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <div className="flex gap-4 overflow-x-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-72">
              <Skeleton className="h-10 mb-3" />
              <Skeleton className="h-24 mb-2" count={3} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Project Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <HiOutlineArrowLeft className="text-lg" />
          </button>
          {editingProject ? (
            <div className="flex-1 flex items-center gap-2">
              <input
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="text-xl font-bold bg-transparent border-b-2 border-blue-500 outline-none px-1 text-gray-900 dark:text-white"
                autoFocus
              />
              <button
                onClick={handleUpdateProject}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg"
              >
                Save
              </button>
              <button
                onClick={() => setEditingProject(false)}
                className="px-3 py-1 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
            </div>
          ) : (
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex-1">
              {project?.title}
            </h1>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <HiOutlineUserAdd />
              Invite
            </button>
            {isOwner && (
              <>
                <button
                  onClick={() => setEditingProject(true)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <HiOutlinePencil />
                </button>
                <button
                  onClick={handleDeleteProject}
                  className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 rounded-lg"
                >
                  <HiOutlineTrash />
                </button>
              </>
            )}
          </div>
        </div>
        {project?.description && !editingProject && (
          <p className="text-sm text-gray-500 dark:text-gray-400 ml-10">
            {project.description}
          </p>
        )}
        {/* Members */}
        <div className="flex items-center gap-2 ml-10 mt-2">
          <div className="flex -space-x-2">
            {project?.members?.slice(0, 6).map((m, i) =>
              m.userId?.avatar ? (
                <img
                  key={i}
                  src={m.userId.avatar}
                  alt={m.userId.name}
                  title={`${m.userId.name} (${m.role})`}
                  className="w-7 h-7 rounded-full border-2 border-white dark:border-gray-800 object-cover"
                />
              ) : (
                <div
                  key={i}
                  title={`${m.userId?.name} (${m.role})`}
                  className="w-7 h-7 rounded-full border-2 border-white dark:border-gray-800 bg-blue-500 flex items-center justify-center text-white text-xs font-medium"
                >
                  {m.userId?.name?.[0]?.toUpperCase() || '?'}
                </div>
              )
            )}
          </div>
          <span className="text-xs text-gray-400">
            {project?.members?.length} member{project?.members?.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="board" direction="horizontal" type="column">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex gap-4 items-start h-full"
              >
                {board.map((column, colIndex) => (
                  <Draggable key={column._id} draggableId={column._id} index={colIndex}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="flex-shrink-0 w-72 bg-gray-100 dark:bg-gray-800/50 rounded-xl flex flex-col max-h-[calc(100vh-220px)]"
                      >
                        {/* Column header */}
                        <div
                          {...provided.dragHandleProps}
                          className="flex items-center justify-between px-3 py-2.5"
                        >
                          {editingColumnId === column._id ? (
                            <input
                              value={editColumnTitle}
                              onChange={(e) => setEditColumnTitle(e.target.value)}
                              onBlur={() => handleRenameColumn(column._id)}
                              onKeyDown={(e) =>
                                e.key === 'Enter' && handleRenameColumn(column._id)
                              }
                              className="flex-1 text-sm font-semibold bg-white dark:bg-gray-700 border border-blue-500 rounded px-2 py-1 outline-none"
                              autoFocus
                            />
                          ) : (
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                              {column.title}
                              <span className="text-xs font-normal text-gray-400 bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
                                {column.tasks.length}
                              </span>
                            </h3>
                          )}
                          <div className="relative">
                            <button
                              onClick={() =>
                                setColumnMenu(columnMenu === column._id ? null : column._id)
                              }
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                            >
                              <HiOutlineDotsVertical className="text-gray-400" />
                            </button>
                            {columnMenu === column._id && (
                              <div className="absolute right-0 top-8 w-40 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1 z-10">
                                <button
                                  onClick={() => {
                                    setEditColumnTitle(column.title);
                                    setEditingColumnId(column._id);
                                    setColumnMenu(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2"
                                >
                                  <HiOutlinePencil />
                                  Rename
                                </button>
                                <button
                                  onClick={() => handleDeleteColumn(column._id)}
                                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2"
                                >
                                  <HiOutlineTrash />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Tasks */}
                        <Droppable droppableId={column._id} type="task">
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`flex-1 overflow-y-auto px-3 pb-3 min-h-[40px] ${
                                snapshot.isDraggingOver
                                  ? 'bg-blue-50 dark:bg-blue-900/20 rounded-lg'
                                  : ''
                              }`}
                            >
                              {column.tasks.map((task, taskIndex) => (
                                <Draggable
                                  key={task._id}
                                  draggableId={task._id}
                                  index={taskIndex}
                                >
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                    >
                                      <TaskCard
                                        task={task}
                                        onClick={() => setSelectedTask(task)}
                                        isDragging={snapshot.isDragging}
                                      />
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>

                        {/* Add task */}
                        <div className="px-3 pb-3">
                          {addingTaskToColumn === column._id ? (
                            <div>
                              <input
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                onKeyDown={(e) =>
                                  e.key === 'Enter' && handleAddTask(column._id)
                                }
                                placeholder="Task title..."
                                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                              />
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => handleAddTask(column._id)}
                                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg"
                                >
                                  Add
                                </button>
                                <button
                                  onClick={() => {
                                    setAddingTaskToColumn(null);
                                    setNewTaskTitle('');
                                  }}
                                  className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setAddingTaskToColumn(column._id)}
                              className="w-full flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                              <HiOutlinePlus />
                              Add task
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}

                {/* Add column */}
                <div className="flex-shrink-0 w-72">
                  {addingColumn ? (
                    <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-3">
                      <input
                        value={newColumnTitle}
                        onChange={(e) => setNewColumnTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
                        placeholder="Column title..."
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={handleAddColumn}
                          className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => {
                            setAddingColumn(false);
                            setNewColumnTitle('');
                          }}
                          className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingColumn(true)}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-500 bg-gray-100/50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800/50 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl transition-colors"
                    >
                      <HiOutlinePlus />
                      Add column
                    </button>
                  )}
                </div>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          project={project}
          columns={board}
          onClose={() => setSelectedTask(null)}
          onUpdate={(updatedTask) => {
            setBoard(
              board.map((c) => ({
                ...c,
                tasks: c.tasks.map((t) => (t._id === updatedTask._id ? updatedTask : t)),
              }))
            );
            setSelectedTask(updatedTask);
          }}
          onMove={(taskId, fromColId, toColId) => {
            setBoard(
              board.map((c) => {
                if (c._id === fromColId) {
                  return { ...c, tasks: c.tasks.filter((t) => t._id !== taskId) };
                }
                if (c._id === toColId) {
                  const task = board
                    .find((col) => col._id === fromColId)
                    ?.tasks.find((t) => t._id === taskId);
                  if (task) {
                    return { ...c, tasks: [...c.tasks, { ...task, columnId: toColId }] };
                  }
                }
                return c;
              })
            );
          }}
          onDelete={handleDeleteTask}
        />
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteMemberModal
          projectId={projectId}
          onClose={() => setShowInviteModal(false)}
          onInvited={(updatedProject) => {
            setProject(updatedProject);
            setShowInviteModal(false);
          }}
        />
      )}

      {/* Click away from column menu */}
      {columnMenu && (
        <div className="fixed inset-0 z-0" onClick={() => setColumnMenu(null)} />
      )}
    </div>
  );
}
