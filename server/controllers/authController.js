const User = require('../models/User');
const admin = require('../config/firebase');

// Register / sync user after Firebase auth
exports.register = async (req, res, next) => {
  try {
    const { name, email, avatar, firebaseUid } = req.body;

    let user = await User.findOne({ firebaseUid });
    if (user) {
      return res.json(user);
    }

    user = await User.create({
      name,
      email,
      avatar: avatar || '',
      firebaseUid,
    });

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

// Login — verify token and return user
exports.login = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);

    let user = await User.findOne({ firebaseUid: decodedToken.uid });
    if (!user) {
      // Auto-create user from Firebase token
      user = await User.create({
        name: decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
        email: decodedToken.email,
        avatar: decodedToken.picture || '',
        firebaseUid: decodedToken.uid,
      });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

// Get current user
exports.getMe = async (req, res) => {
  res.json(req.user);
};

// Search users by email (for invitations)
exports.searchUsers = async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email query required' });
    }
    const users = await User.find({
      email: { $regex: email, $options: 'i' },
    })
      .select('name email avatar')
      .limit(10);
    res.json(users);
  } catch (error) {
    next(error);
  }
};
