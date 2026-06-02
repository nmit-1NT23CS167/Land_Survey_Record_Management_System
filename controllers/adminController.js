const User = require('../models/User');
const Survey = require('../models/Survey');

exports.getDashboard = async (req, res) => {
  try {
    const [totalUsers, totalRecords, recentUsers, byRole] = await Promise.all([
      User.countDocuments(),
      Survey.countDocuments(),
      User.find().sort({ created_at: -1 }).limit(10)
        .select('full_name email role is_active last_login created_at'),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    ]);

    // Derive named counts from byRole so the view has clean variables
    const surveyOfficerCount = (byRole.find(r => r._id === 'survey_officer') || {}).count || 0;
    const adminCount         = (byRole.find(r => r._id === 'admin')          || {}).count || 0;
    const userCount          = (byRole.find(r => r._id === 'user')           || {}).count || 0;

    res.render('admin/dashboard', {
      title: 'Admin Panel',
      totalUsers,
      totalRecords,
      recentUsers,
      byRole,
      surveyOfficerCount,
      adminCount,
      userCount,
    });
  } catch (err) {
    console.error('Admin dashboard error:', err.message);
    req.flash('error', 'Failed to load admin dashboard.');
    res.redirect('/records/dashboard');
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ created_at: -1 });
    res.render('admin/users', { title: 'User Management', users });
  } catch (err) {
    console.error('Get users error:', err.message);
    req.flash('error', 'Failed to load users.');
    res.redirect('/admin');
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { role, is_active } = req.body;
    const validRoles = ['admin', 'survey_officer', 'user'];
    if (!validRoles.includes(role)) {
      req.flash('error', 'Invalid role specified.');
      return res.redirect('/admin/users');
    }
    await User.findByIdAndUpdate(req.params.id, {
      role,
      is_active: is_active === 'true',
    });
    req.flash('success', 'User updated successfully.');
    res.redirect('/admin/users');
  } catch (err) {
    console.error('Update user error:', err.message);
    req.flash('error', 'Failed to update user.');
    res.redirect('/admin/users');
  }
};

exports.deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.session.user._id.toString()) {
      req.flash('error', 'You cannot delete your own account.');
      return res.redirect('/admin/users');
    }
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) {
      req.flash('error', 'User not found.');
    } else {
      req.flash('success', `User ${deleted.full_name} deleted.`);
    }
    res.redirect('/admin/users');
  } catch (err) {
    console.error('Delete user error:', err.message);
    req.flash('error', 'Failed to delete user.');
    res.redirect('/admin/users');
  }
};