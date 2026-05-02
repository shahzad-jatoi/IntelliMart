const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
const config = require('../config');
const { sendOtpEmail } = require('../utils/email');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, { expiresIn: '30d' });
};

// Generate 6-digit OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Step 1: Send OTP to email for registration
// @route   POST /api/auth/send-otp
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Delete any previous OTPs for this email
    await Otp.deleteMany({ email });

    // Generate and save new OTP
    const code = generateOtp();
    await Otp.create({ email, code });

    // Send OTP email
    await sendOtpEmail(email, code);

    res.json({ message: 'Verification code sent to your email', email });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Step 2: Verify OTP and complete registration
// @route   POST /api/auth/verify-otp
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp, name, password, role } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Find the OTP record
    const otpRecord = await Otp.findOne({
      email,
      code: otp,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // OTP is valid — create the user
    const allowedRole = ['seller', 'buyer'].includes(role) ? role : 'buyer';

    const user = await User.create({ name, email, password, role: allowedRole });

    // Delete the OTP record
    await Otp.deleteMany({ email });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register a new user (legacy, kept for backward compatibility)
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Only allow 'seller' and 'buyer' roles via registration
    const allowedRole = ['seller', 'buyer'].includes(role) ? role : 'buyer';

    const user = await User.create({ name, email, password, role: allowedRole });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    createdAt: req.user.createdAt,
  });
};
