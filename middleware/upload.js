const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isProof = file.fieldname === 'ownership_proofs';
    cb(null, isProof ? 'public/uploads/proofs' : 'public/uploads/images');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  if (allowedTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, PDF, DOC, DOCX allowed.'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter,
});

module.exports = upload;
