
const multer = require('multer');
const { v4: uuid } = require('uuid');
const path = require('path');
const HttpError = require('../model/errorModel');

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Directory to store files
    },
    filename: (req, file, cb) => {
        const spillitedFileName = file.originalname.split('.');
        const newFilename = `${spillitedFileName[0]}_${uuid()}.${spillitedFileName[spillitedFileName.length -1]}`;
        cb(null, newFilename); // Generating unique filenames
    }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new HttpError('Only images are allowed', 422));
    }
};

// Set up multer to handle multiple types of uploads (avatar and thumbnails)
const upload = multer({
    storage: storage,
    limits: { fileSize: 1000000 }, // 1MB size limit
    fileFilter: fileFilter
}).fields([
    { name: 'avatar', maxCount: 1 }, // Single avatar
    { name: 'thumbnail', maxCount: 2 } // Up to 2 post images (thumbnails)
]);

module.exports = upload;
