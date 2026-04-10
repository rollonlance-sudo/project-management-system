const Task = require('../models/Task');
const Comment = require('../models/Comment');
const ActivityLog = require('../models/ActivityLog');
const Column = require('../models/Column');

// Get tasks (optionally filter by projectId or columnId)
exports.getTasks = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.projectId) filter.projectId = req.query.projectId;
    if (req.query.columnId) filter.columnId = req.query.columnId;
    if (req.query.assignee) filter.assignee = req.query.assignee;

    const tasks = await Task.find(filter)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ order: 1 });

    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

// Create task
exports.createTask = async (req, res, next) => {
  try {
    const { columnId, projectId, title, description, assignee, dueDate, priority, labels } =
      req.body;

    const maxOrder = await Task.findOne({ columnId })
      .sort({ order: -1 })
      .select('order');

    const task = await Task.create({
      columnId,
      projectId,
      title,
      description,
      assignee: assignee || null,
      dueDate: dueDate || null,
      priority: priority || 'Medium',
      labels: labels || [],
      order: maxOrder ? maxOrder.order + 1 : 0,
      createdBy: req.user._id,
    });

    await ActivityLog.create({
      taskId: task._id,
      projectId,
      userId: req.user._id,
      action: 'created_task',
      details: `Created task "${title}"`,
    });

    const populated = await Task.findById(task._id)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

// Update task
exports.updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const changes = [];
    const fields = ['title', 'description', 'assignee', 'dueDate', 'priority', 'labels', 'columnId', 'order'];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        const oldVal = task[field];
        const newVal = req.body[field];
        if (String(oldVal) !== String(newVal)) {
          changes.push(`${field}: "${oldVal}" → "${newVal}"`);
        }
        task[field] = newVal;
      }
    });

    await task.save();

    if (changes.length > 0) {
      await ActivityLog.create({
        taskId: task._id,
        projectId: task.projectId,
        userId: req.user._id,
        action: 'updated_task',
        details: changes.join(', '),
      });
    }

    const populated = await Task.findById(task._id)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    res.json(populated);
  } catch (error) {
    next(error);
  }
};

// Delete task
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await ActivityLog.create({
      taskId: task._id,
      projectId: task.projectId,
      userId: req.user._id,
      action: 'deleted_task',
      details: `Deleted task "${task.title}"`,
    });

    await Comment.deleteMany({ taskId: task._id });
    await Task.findByIdAndDelete(task._id);

    res.json({ message: 'Task deleted' });
  } catch (error) {
    next(error);
  }
};

// Reorder / move tasks
exports.reorderTasks = async (req, res, next) => {
  try {
    const { tasks } = req.body; // [{ id, columnId, order }]

    const bulkOps = tasks.map((t) => ({
      updateOne: {
        filter: { _id: t.id },
        update: { columnId: t.columnId, order: t.order },
      },
    }));

    await Task.bulkWrite(bulkOps);

    res.json({ message: 'Tasks reordered' });
  } catch (error) {
    next(error);
  }
};

// Add comment
exports.addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const comment = await Comment.create({
      taskId: task._id,
      userId: req.user._id,
      text,
    });

    await ActivityLog.create({
      taskId: task._id,
      projectId: task.projectId,
      userId: req.user._id,
      action: 'added_comment',
      details: `Commented on "${task.title}"`,
    });

    const populated = await Comment.findById(comment._id).populate(
      'userId',
      'name email avatar'
    );

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

// Get comments for task
exports.getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ taskId: req.params.id })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: 1 });

    res.json(comments);
  } catch (error) {
    next(error);
  }
};

// Get user's tasks across all projects (for dashboard)
exports.getMyTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ assignee: req.user._id })
      .populate('assignee', 'name email avatar')
      .populate('projectId', 'title')
      .populate('columnId', 'title')
      .sort({ dueDate: 1 });

    res.json(tasks);
  } catch (error) {
    next(error);
  }
};
