const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { isAuthenticated } = require('../middleware/auth');

router.get('/', (req, res) => res.redirect(req.session.user ? '/records/dashboard' : '/login'));
router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);
router.get('/register', authController.getRegister);
router.post('/register', [
  body('full_name').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], authController.postRegister);
router.get('/logout', isAuthenticated, authController.logout);
router.get('/profile', isAuthenticated, authController.getProfile);

module.exports = router;
