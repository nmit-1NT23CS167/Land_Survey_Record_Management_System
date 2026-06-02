const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.use(isAuthenticated, isAdmin);
router.get('/', adminController.getDashboard);
router.get('/users', adminController.getUsers);
router.post('/users/:id/role', adminController.updateUserRole);
router.post('/users/:id/delete', adminController.deleteUser);

module.exports = router;
