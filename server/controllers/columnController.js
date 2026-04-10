const Column = require('../models/Column');
const Task = require('../models/Task');
const Project = require('../models/Project');

// Create column
exports.createColumn = async (req, res, next) => {
  try {
    const { projectId, title } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const maxOrder = await Column.findOne({ projectId })
      .sort({ order: -1 })
      .select('order');

    const column = await Column.create({
      projectId,
      title,
      order: maxOrder ? maxOrder.order + 1 : 0,
    });

    res.status(201).json({ ...column.toObject(), tasks: [] });
  } catch (error) {
    next(error);
  }
};

// Update column
exports.updateColumn = async (req, res, next) => {
  try {
    const column = await Column.findByIdAndUpdate(
      req.params.id,
      { title: req.body.title },
      { new: true }
    );

    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }

    res.json(column);
  } catch (error) {
    next(error);
  }
};

// Delete column
exports.deleteColumn = async (req, res, next) => {
  try {
    const column = await Column.findById(req.params.id);
    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }

    // Move tasks to the first remaining column or delete them
    const otherColumn = await Column.findOne({
      projectId: column.projectId,
      _id: { $ne: column._id },
    }).sort({ order: 1 });

    if (otherColumn) {
      await Task.updateMany(
        { columnId: column._id },
        { columnId: otherColumn._id }
      );
    } else {
      await Task.deleteMany({ columnId: column._id });
    }

    await Column.findByIdAndDelete(column._id);

    res.json({ message: 'Column deleted' });
  } catch (error) {
    next(error);
  }
};

// Reorder columns
exports.reorderColumns = async (req, res, next) => {
  try {
    const { columns } = req.body; // [{ id, order }]

    const bulkOps = columns.map((col) => ({
      updateOne: {
        filter: { _id: col.id },
        update: { order: col.order },
      },
    }));

    await Column.bulkWrite(bulkOps);

    res.json({ message: 'Columns reordered' });
  } catch (error) {
    next(error);
  }
};
