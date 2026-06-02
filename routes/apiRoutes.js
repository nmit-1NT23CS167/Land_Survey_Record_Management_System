const express = require('express');
const router = express.Router();
const Survey = require('../models/Survey');
const { isAuthenticated } = require('../middleware/auth');

// All API routes require authentication
router.use(isAuthenticated);

// GET /api/records - paginated JSON
router.get('/records', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const filter = {};
    if (req.query.state) filter.state = new RegExp(req.query.state, 'i');
    if (req.query.status) filter.status = req.query.status;

    const [records, total] = await Promise.all([
      Survey.find(filter).sort({ created_at: -1 }).skip((page - 1) * limit).limit(limit)
        .select('plot_number owner_name lat lng status land_type state area area_unit'),
      Survey.countDocuments(filter),
    ]);

    res.json({ success: true, data: records, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/records/:id
router.get('/records/:id', async (req, res) => {
  try {
    const record = await Survey.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/map-data - all records with coords for map
router.get('/map-data', async (req, res) => {
  try {
    const records = await Survey.find({ lat: { $exists: true }, lng: { $exists: true } })
      .select('plot_number owner_name lat lng status land_type area area_unit state');
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/stats
router.get('/stats', async (req, res) => {
  try {
    const [total, byStatus, byType, byState] = await Promise.all([
      Survey.countDocuments(),
      Survey.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Survey.aggregate([{ $group: { _id: '$land_type', count: { $sum: 1 } } }]),
      Survey.aggregate([{ $group: { _id: '$state', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
    ]);
    res.json({ success: true, data: { total, byStatus, byType, byState } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
