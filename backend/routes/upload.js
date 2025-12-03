// routes/upload.js

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define the directory for file storage
const uploadDir = path.join(__dirname, '..', 'uploads'); 

// Create the 'uploads' directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Set up file storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Save files to the 'uploads' folder
    },
    filename: (req, file, cb) => {
        // Create a unique filename: fieldname-timestamp-originalname.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Create the upload middleware instance
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // Limit file size to 10MB
});

module.exports = upload;