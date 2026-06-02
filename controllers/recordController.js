const Survey = require('../models/Survey');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// ─── Dashboard ────────────────────────────────────────────────────────────────
exports.getDashboard = async (req, res) => {
  try {
    const [total, active, disputed, recent] = await Promise.all([
      Survey.countDocuments(),
      Survey.countDocuments({ status: 'active' }),
      Survey.countDocuments({ status: 'disputed' }),
      Survey.find().sort({ created_at: -1 }).limit(5).select('plot_number owner_name state status created_at'),
    ]);

    const byState = await Survey.aggregate([
      { $group: { _id: '$state', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    const byType = await Survey.aggregate([
      { $group: { _id: '$land_type', count: { $sum: 1 } } },
    ]);

    res.render('records/dashboard', {
      title: 'Dashboard',
      stats: { total, active, disputed, under_review: total - active - disputed },
      recent,
      byState,
      byType,
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Could not load dashboard.');
    res.render('records/dashboard', { title: 'Dashboard', stats: {}, recent: [], byState: [], byType: [] });
  }
};

// ─── List / Search / Paginate ─────────────────────────────────────────────────
exports.getRecords = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const sortField = req.query.sort || 'created_at';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;

    const filter = buildFilter(req.query);

    const [records, total] = await Promise.all([
      Survey.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('plot_number survey_number owner_name area area_unit land_type state district status survey_date'),
      Survey.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.render('records/list', {
      title: 'Land Records',
      records,
      total,
      page,
      limit,
      totalPages,
      sortField,
      sortOrder: req.query.order || 'desc',
      query: req.query,
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to fetch records.');
    res.redirect('/records/dashboard');
  }
};

function buildFilter(q) {
  const filter = {};
  if (q.plot_number) filter.plot_number = new RegExp(q.plot_number, 'i');
  if (q.survey_number) filter.survey_number = new RegExp(q.survey_number, 'i');
  if (q.owner_name) filter.owner_name = new RegExp(q.owner_name, 'i');
  if (q.state) filter.state = new RegExp(q.state, 'i');
  if (q.district) filter.district = new RegExp(q.district, 'i');
  if (q.country) filter.country = new RegExp(q.country, 'i');
  if (q.land_type) filter.land_type = q.land_type;
  if (q.status) filter.status = q.status;
  if (q.date_from || q.date_to) {
    filter.survey_date = {};
    if (q.date_from) filter.survey_date.$gte = new Date(q.date_from);
    if (q.date_to) filter.survey_date.$lte = new Date(q.date_to);
  }
  return filter;
}

// ─── Add Record Form ──────────────────────────────────────────────────────────
exports.getAddRecord = (req, res) => {
  res.render('records/add', { title: 'Add Land Record', record: null });
};

// ─── Create Record ────────────────────────────────────────────────────────────
exports.postAddRecord = async (req, res) => {
  try {
    const data = { ...req.body };
    data.created_by = req.session.user._id;
    data.created_by_name = req.session.user.full_name;

    // Handle file uploads
    if (req.files) {
      if (req.files.ownership_proofs) {
        data.ownership_proofs = req.files.ownership_proofs.map(f => ({
          filename: f.filename,
          original_name: f.originalname,
          mimetype: f.mimetype,
          size: f.size,
          uploaded_by: req.session.user._id,
        }));
      }
      if (req.files.survey_images) {
        data.survey_images = req.files.survey_images.map(f => ({
          filename: f.filename,
          original_name: f.originalname,
          mimetype: f.mimetype,
          size: f.size,
          uploaded_by: req.session.user._id,
        }));
      }
    }

    data.audit_trail = [{
      action: 'created',
      performed_by: req.session.user._id,
      performed_by_name: req.session.user.full_name,
      ip_address: req.ip,
    }];

    await Survey.create(data);
    req.flash('success', `Record for plot ${data.plot_number} created successfully.`);
    res.redirect('/records');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to create record: ' + (err.code === 11000 ? 'Plot number already exists.' : err.message));
    res.redirect('/records/add');
  }
};

// ─── View Single Record ───────────────────────────────────────────────────────
exports.getRecord = async (req, res) => {
  try {
    const record = await Survey.findById(req.params.id).populate('audit_trail.performed_by', 'full_name');
    if (!record) { req.flash('error', 'Record not found.'); return res.redirect('/records'); }

    // Log view in audit
    record.audit_trail.push({
      action: 'viewed',
      performed_by: req.session.user._id,
      performed_by_name: req.session.user.full_name,
      ip_address: req.ip,
    });
    await record.save();

    res.render('records/view', { title: `Record - ${record.plot_number}`, record });
  } catch (err) {
    req.flash('error', 'Could not load record.');
    res.redirect('/records');
  }
};

// ─── Edit Record Form ─────────────────────────────────────────────────────────
exports.getEditRecord = async (req, res) => {
  try {
    const record = await Survey.findById(req.params.id);
    if (!record) { req.flash('error', 'Record not found.'); return res.redirect('/records'); }
    res.render('records/edit', { title: `Edit - ${record.plot_number}`, record });
  } catch (err) {
    req.flash('error', 'Could not load record for editing.');
    res.redirect('/records');
  }
};

// ─── Update Record ────────────────────────────────────────────────────────────
exports.postEditRecord = async (req, res) => {
  try {
    const record = await Survey.findById(req.params.id);
    if (!record) { req.flash('error', 'Record not found.'); return res.redirect('/records'); }

    const before = record.toObject();
    const updates = { ...req.body };
    delete updates._id;

    // Handle new file uploads
    if (req.files) {
      if (req.files.ownership_proofs) {
        const newFiles = req.files.ownership_proofs.map(f => ({
          filename: f.filename,
          original_name: f.originalname,
          mimetype: f.mimetype,
          size: f.size,
          uploaded_by: req.session.user._id,
        }));
        updates.ownership_proofs = [...record.ownership_proofs, ...newFiles];
      }
      if (req.files.survey_images) {
        const newFiles = req.files.survey_images.map(f => ({
          filename: f.filename,
          original_name: f.originalname,
          mimetype: f.mimetype,
          size: f.size,
          uploaded_by: req.session.user._id,
        }));
        updates.survey_images = [...record.survey_images, ...newFiles];
      }
    }

    // Track changes
    const changes = {};
    ['owner_name', 'area', 'lat', 'lng', 'state', 'district', 'status', 'land_type'].forEach(field => {
      if (updates[field] && updates[field] !== String(before[field])) {
        changes[field] = { from: before[field], to: updates[field] };
      }
    });

    updates.updated_by = req.session.user._id;
    updates.updated_by_name = req.session.user.full_name;

    await Survey.findByIdAndUpdate(req.params.id, {
      ...updates,
      $push: {
        audit_trail: {
          action: 'updated',
          performed_by: req.session.user._id,
          performed_by_name: req.session.user.full_name,
          changes,
          ip_address: req.ip,
        }
      }
    });

    req.flash('success', 'Record updated successfully.');
    res.redirect(`/records/${req.params.id}`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Update failed: ' + err.message);
    res.redirect(`/records/${req.params.id}/edit`);
  }
};

// ─── Delete Record ────────────────────────────────────────────────────────────
exports.deleteRecord = async (req, res) => {
  try {
    const record = await Survey.findById(req.params.id);
    if (!record) { req.flash('error', 'Record not found.'); return res.redirect('/records'); }

    // Clean up uploaded files
    [...(record.ownership_proofs || []), ...(record.survey_images || [])].forEach(doc => {
      const folder = doc.mimetype && doc.mimetype.startsWith('image') ? 'images' : 'proofs';
      const filePath = path.join(__dirname, `../public/uploads/${folder}/${doc.filename}`);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    await Survey.findByIdAndDelete(req.params.id);
    req.flash('success', `Record for plot ${record.plot_number} deleted.`);
    res.redirect('/records');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Delete failed: ' + err.message);
    res.redirect('/records');
  }
};

// ─── Export PDF ───────────────────────────────────────────────────────────────
exports.exportPDF = async (req, res) => {
  try {
    const record = await Survey.findById(req.params.id);
    if (!record) return res.status(404).send('Record not found');

    // Log export
    record.audit_trail.push({
      action: 'exported',
      performed_by: req.session.user._id,
      performed_by_name: req.session.user.full_name,
      ip_address: req.ip,
    });
    await record.save();

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="land-record-${record.plot_number}.pdf"`);
    doc.pipe(res);

    // ── Header ──
    doc.rect(0, 0, 595, 100).fill('#1a5c1a');
    doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold')
      .text('LAND SURVEY RECORD MANAGEMENT SYSTEM', 50, 30, { align: 'center' });
    doc.fontSize(11).font('Helvetica')
      .text('Official Land Survey Certificate', 50, 58, { align: 'center' });
    doc.fillColor('#000000');

    // ── Plot badge ──
    doc.moveDown(2);
    doc.roundedRect(50, 115, 495, 40, 5).fill('#e8f5e9');
    doc.fillColor('#1a5c1a').fontSize(14).font('Helvetica-Bold')
      .text(`Plot Number: ${record.plot_number}   |   Status: ${record.status.toUpperCase()}`, 60, 127);
    doc.fillColor('#000000');

    // ── Section helper ──
    const section = (title, y) => {
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a5c1a')
        .text(title, 50, y);
      doc.moveTo(50, y + 16).lineTo(545, y + 16).strokeColor('#4caf50').lineWidth(1).stroke();
      doc.fillColor('#000000').font('Helvetica').fontSize(10);
    };

    const field = (label, value, x, y) => {
      doc.font('Helvetica-Bold').text(`${label}:`, x, y, { continued: true });
      doc.font('Helvetica').text(` ${value || 'N/A'}`);
    };

    let y = 170;
    section('Ownership Details', y); y += 25;
    field('Owner Name', record.owner_name, 50, y); y += 18;
    field('Contact', record.owner_contact, 50, y);
    field('Aadhaar', record.owner_aadhaar, 300, y); y += 18;

    y += 10;
    section('Land Details', y); y += 25;
    field('Area', `${record.area} ${record.area_unit}`, 50, y);
    field('Land Type', record.land_type, 300, y); y += 18;
    field('Land Use', record.land_use, 50, y); y += 18;

    y += 10;
    section('Location Details', y); y += 25;
    field('Address', record.address, 50, y); y += 18;
    field('Village', record.village, 50, y);
    field('Taluka', record.taluka, 300, y); y += 18;
    field('District', record.district, 50, y);
    field('State', record.state, 300, y); y += 18;
    field('Country', record.country, 50, y);
    field('Pincode', record.pincode, 300, y); y += 18;
    field('Latitude', record.lat, 50, y);
    field('Longitude', record.lng, 300, y); y += 18;

    y += 10;
    section('Survey Information', y); y += 25;
    field('Survey Number', record.survey_number, 50, y); y += 18;
    field('Survey Date', record.survey_date ? new Date(record.survey_date).toDateString() : 'N/A', 50, y); y += 18;
    field('Registration Date', record.registration_date ? new Date(record.registration_date).toDateString() : 'N/A', 50, y); y += 18;

    if (record.remarks) {
      y += 10;
      section('Remarks', y); y += 25;
      doc.fontSize(10).font('Helvetica').text(record.remarks, 50, y, { width: 495 });
    }

    // Footer
    doc.rect(0, 760, 595, 82).fill('#1a5c1a');
    doc.fillColor('#ffffff').fontSize(9).font('Helvetica')
      .text(`Generated on: ${new Date().toLocaleString()}   |   Generated by: ${req.session.user.full_name}`, 50, 772, { align: 'center' })
      .text('This is a computer-generated document. For official use only.', 50, 790, { align: 'center' });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).send('PDF generation failed: ' + err.message);
  }
};

// ─── Map View ─────────────────────────────────────────────────────────────────
exports.getMapView = async (req, res) => {
  try {
    const records = await Survey.find({ lat: { $exists: true }, lng: { $exists: true } })
      .select('plot_number owner_name lat lng status land_type area area_unit state');
    res.render('records/map', { title: 'Map View', records });
  } catch (err) {
    req.flash('error', 'Could not load map data.');
    res.redirect('/records/dashboard');
  }
};

