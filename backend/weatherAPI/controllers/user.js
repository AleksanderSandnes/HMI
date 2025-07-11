const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const userController = {
  register: asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    console.log('Registration request received:', {
      username,
      email,
      password: '***',
    });

    if (!username || !email || !password) {
      console.log('Missing fields:', { username, email, password: !!password });
      res.status(400);
      throw new Error('Please fill in all fields');
    }

    try {
      const userExists = await User.findOne({ email });
      if (userExists) {
        console.log('User already exists with email:', email);
        res.status(400);
        throw new Error('User already exists');
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const userCreated = await User.create({
        username,
        password: hashedPassword,
        email,
      });

      console.log('User created successfully:', userCreated.id);

      res.status(201).json({
        username: userCreated.username,
        email: userCreated.email,
        id: userCreated.id,
      });
    } catch (error) {
      console.error('Registration error:', error);
      if (error.code === 11000) {
        res.status(400);
        throw new Error('Email already exists');
      }
      throw error;
    }
  }),

  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign({ id: user._id }, 'anykey', { expiresIn: '30d' });
    res.json({
      message: 'Logged in successfully',
      token,
      id: user._id,
      email: user.email,
      username: user.username,
    });
  }),

  profile: asyncHandler(async (req, res) => {
    const user = await User.findById(req.user).select('-password');
    res.json({ user });
  }),

  // Update user profile (username, email)
  updateProfile: asyncHandler(async (req, res) => {
    const { username, email } = req.body;
    const userId = req.user;

    // Validation
    if (!username || !email) {
      res.status(400);
      throw new Error('Username and email are required');
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400);
      throw new Error('Invalid email format');
    }

    try {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({
        email,
        _id: { $ne: userId },
      });

      if (existingUser) {
        res.status(400);
        throw new Error('Email is already in use by another account');
      }

      // Update user
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { username, email },
        { new: true, runValidators: true }
      ).select('-password');

      if (!updatedUser) {
        res.status(404);
        throw new Error('User not found');
      }

      console.log(
        `[UserController] Profile updated for user ${updatedUser.email}`
      );

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: updatedUser._id,
          username: updatedUser.username,
          email: updatedUser.email,
        },
      });
    } catch (error) {
      console.error('Profile update error:', error);
      if (error.code === 11000) {
        res.status(400);
        throw new Error('Email is already in use');
      }
      throw error;
    }
  }),

  // Update user password
  updatePassword: asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user;

    // Validation
    if (!currentPassword || !newPassword) {
      res.status(400);
      throw new Error('Current password and new password are required');
    }

    if (newPassword.length < 6) {
      res.status(400);
      throw new Error('New password must be at least 6 characters long');
    }

    try {
      // Get user with password
      const user = await User.findById(userId);
      if (!user) {
        res.status(404);
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isCurrentPasswordValid) {
        res.status(400);
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const salt = await bcrypt.genSalt(12);
      const hashedNewPassword = await bcrypt.hash(newPassword, salt);

      // Update password
      await User.findByIdAndUpdate(userId, {
        password: hashedNewPassword,
      });

      console.log(`[UserController] Password updated for user ${user.email}`);

      res.json({
        success: true,
        message: 'Password updated successfully',
      });
    } catch (error) {
      console.error('Password update error:', error);
      throw error;
    }
  }),

  // Get user profile data
  getProfile: asyncHandler(async (req, res) => {
    try {
      const user = await User.findById(req.user).select('-password');

      if (!user) {
        res.status(404);
        throw new Error('User not found');
      }

      res.json({
        success: true,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }),
};

module.exports = userController;
