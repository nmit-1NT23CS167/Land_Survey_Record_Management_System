const User = require('../models/User');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');

exports.getLogin = (req, res) => {
  if (req.session.user) return res.redirect('/records/dashboard');
  res.render('auth/login', { title: 'Login - Land Survey System' });
};

exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      req.flash('error', 'Email and password are required.');
      return res.redirect('/login');
    }

    const user = await User.findOne({ email: email.toLowerCase().trim(), is_active: true })
      .select('+password');

    if (!user || !(await user.comparePassword(password))) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/login');
    }

    user.last_login = new Date();
    await user.save({ validateBeforeSave: false });

    // Store _id as plain string — critical to avoid ObjectId serialisation issues
    req.session.user = {
      _id:        user._id.toString(),
      full_name:  user.full_name,
      email:      user.email,
      role:       user.role,
      department: user.department || '',
    };

    req.flash('success', `Welcome back, ${user.full_name}.`);
    res.redirect('/records/dashboard');
  } catch (err) {
    console.error('Login error:', err.message);
    req.flash('error', 'Login failed. Please try again.');
    res.redirect('/login');
  }
};

exports.getRegister = (req, res) => {
  if (req.session.user) return res.redirect('/records/dashboard');
  res.render('auth/register', { title: 'Register - Land Survey System' });
};

exports.postRegister = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array().map(e => e.msg).join(', '));
    return res.redirect('/register');
  }

  try {
    const { full_name, email, password, phone, department } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      req.flash('error', 'An account with this email already exists.');
      return res.redirect('/register');
    }

    await User.create({ full_name, email, password, phone, department, role: 'user' });

    req.flash('success', 'Registration successful. Please log in.');
    res.redirect('/login');
  } catch (err) {
    console.error('Register error:', err.message);
    req.flash('error', 'Registration failed: ' + err.message);
    res.redirect('/register');
  }
};

exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) console.error('Session destroy error:', err);
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
};

exports.getProfile = async (req, res) => {
  try {
    // Guard 1: session must exist
    if (!req.session || !req.session.user || !req.session.user._id) {
      req.flash('error', 'Session expired. Please log in again.');
      return res.redirect('/login');
    }

    const userId = req.session.user._id;

    // Guard 2: must be a valid MongoDB ObjectId string
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error('Profile: invalid ObjectId in session:', userId);
      req.flash('error', 'Invalid session. Please log out and log in again.');
      return res.redirect('/login');
    }

    const profileUser = await User.findById(userId).lean();

    // Guard 3: user must still exist in DB
    if (!profileUser) {
      req.flash('error', 'Your account was not found. Please contact an administrator.');
      return res.redirect('/records/dashboard');
    }

    res.render('auth/profile', {
      title: 'My Profile',
      profileUser,
    });
  } catch (err) {
    console.error('Profile error:', err.message);
    req.flash('error', 'Could not load profile. Please try again.');
    res.redirect('/records/dashboard');
  }
};