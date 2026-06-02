const express = require('express');
const router = express.Router();
const recordController = require('../controllers/recordController');
const { isAuthenticated, isAdminOrOfficer, isAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/dashboard', isAuthenticated, recordController.getDashboard);
router.get('/map', isAuthenticated, recordController.getMapView);
router.get('/', isAuthenticated, recordController.getRecords);
router.get('/add', isAuthenticated, isAdminOrOfficer, recordController.getAddRecord);
router.post('/add', isAuthenticated, isAdminOrOfficer,
  upload.fields([{ name: 'ownership_proofs', maxCount: 5 }, { name: 'survey_images', maxCount: 10 }]),
  recordController.postAddRecord
);
router.get('/:id', isAuthenticated, recordController.getRecord);
router.get('/:id/edit', isAuthenticated, isAdminOrOfficer, recordController.getEditRecord);
router.post('/:id/edit', isAuthenticated, isAdminOrOfficer,
  upload.fields([{ name: 'ownership_proofs', maxCount: 5 }, { name: 'survey_images', maxCount: 10 }]),
  recordController.postEditRecord
);
router.post('/:id/delete', isAuthenticated, isAdmin, recordController.deleteRecord);
router.get('/:id/pdf', isAuthenticated, recordController.exportPDF);

module.exports = router;
