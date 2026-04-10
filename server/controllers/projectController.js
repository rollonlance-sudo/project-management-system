const Project = require('../models/Project');
const Column = require('../models/Column');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');

// Get all projects for current user
exports.getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.user._id },
        { 'members.userId': req.user._id },
      ],
    })
      .populate('owner', 'name email avatar')
      .populate('members.userId', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    next(error);
  }
};

// Get single project
exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.userId', 'name email avatar');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check access
    const isMember =
      project.owner._id.toString() === req.user._id.toString() ||
      project.members.some(
        (m) => m.userId && m.userId._id.toString() === req.user._id.toString()
      );

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(project);
  } catch (error) {
    next(error);
  }
};

// Create project
exports.createProject = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    const project = await Project.create({
      title,
      description,
      owner: req.user._id,
      members: [{ userId: req.user._id, role: 'Admin' }],
    });

    // Create default columns
    const defaultColumns = ['To Do', 'In Progress', 'Done'];
    await Column.insertMany(
      defaultColumns.map((title, index) => ({
        projectId: project._id,
        title,
        order: index,
      }))
    );

    await ActivityLog.create({
      projectId: project._id,
      userId: req.user._id,
      action: 'created_project',
      details: `Created project "${title}"`,
    });

    const populated = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members.userId', 'name email avatar');

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

// Update project
exports.updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      const member = project.members.find(
        (m) => m.userId.toString() === req.user._id.toString()
      );
      if (!member || member.role !== 'Admin') {
        return res.status(403).json({ message: 'Only admins can edit projects' });
      }
    }

    const { title, description } = req.body;
    project.title = title || project.title;
    project.description = description !== undefined ? description : project.description;
    await project.save();

    const populated = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members.userId', 'name email avatar');

    res.json(populated);
  } catch (error) {
    next(error);
  }
};

// Delete project
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can delete a project' });
    }

    // Delete all related data
    const columns = await Column.find({ projectId: project._id });
    const columnIds = columns.map((c) => c._id);

    await Task.deleteMany({ projectId: project._id });
    await Column.deleteMany({ projectId: project._id });
    await ActivityLog.deleteMany({ projectId: project._id });
    await Project.findByIdAndDelete(project._id);

    res.json({ message: 'Project deleted' });
  } catch (error) {
    next(error);
  }
};

// Invite member
exports.inviteMember = async (req, res, next) => {
  try {
    const { email, role } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      const member = project.members.find(
        (m) => m.userId.toString() === req.user._id.toString()
      );
      if (!member || member.role !== 'Admin') {
        return res.status(403).json({ message: 'Only admins can invite members' });
      }
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found. They need to sign up first.' });
    }

    const alreadyMember = project.members.some(
      (m) => m.userId.toString() === user._id.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    project.members.push({
      userId: user._id,
      role: role || 'Member',
    });
    await project.save();

    await ActivityLog.create({
      projectId: project._id,
      userId: req.user._id,
      action: 'invited_member',
      details: `Invited ${user.name} (${user.email}) as ${role || 'Member'}`,
    });

    const populated = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members.userId', 'name email avatar');

    res.json(populated);
  } catch (error) {
    next(error);
  }
};

// Get project board (columns + tasks)
exports.getBoard = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isMember =
      project.owner.toString() === req.user._id.toString() ||
      project.members.some(
        (m) => m.userId.toString() === req.user._id.toString()
      );

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const columns = await Column.find({ projectId: project._id }).sort({ order: 1 });
    const tasks = await Task.find({ projectId: project._id })
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ order: 1 });

    const board = columns.map((col) => ({
      ...col.toObject(),
      tasks: tasks.filter((t) => t.columnId.toString() === col._id.toString()),
    }));

    res.json(board);
  } catch (error) {
    next(error);
  }
};

// Get project activity
exports.getActivity = async (req, res, next) => {
  try {
    const activities = await ActivityLog.find({ projectId: req.params.id })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(activities);
  } catch (error) {
    next(error);
  }
};

// Update member role
exports.updateMemberRole = async (req, res, next) => {
  try {
    const { userId, role } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can change roles' });
    }

    const member = project.members.find(
      (m) => m.userId.toString() === userId
    );
    if (!member) {
      return res.status(404).json({ message: 'Member not found in project' });
    }

    member.role = role;
    await project.save();

    const populated = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members.userId', 'name email avatar');

    res.json(populated);
  } catch (error) {
    next(error);
  }
};

// Remove member
exports.removeMember = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can remove members' });
    }

    project.members = project.members.filter(
      (m) => m.userId.toString() !== userId
    );
    await project.save();

    const populated = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members.userId', 'name email avatar');

    res.json(populated);
  } catch (error) {
    next(error);
  }
};
