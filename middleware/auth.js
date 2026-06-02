// middleware/auth.js

exports.isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) return next();
  req.flash('error', 'Please log in to access this page.');
  res.redirect('/login');
};

exports.isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'admin') return next();
  req.flash('error', 'Access denied. Admin privileges required.');
  res.redirect('/records/dashboard');
};

exports.isAdminOrOfficer = (req, res, next) => {
  const role = req.session.user && req.session.user.role;
  if (role === 'admin' || role === 'survey_officer') return next();
  req.flash('error', 'Access denied. Insufficient privileges.');
  res.redirect('/records/dashboard');
};

exports.attachUser = (req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
};
