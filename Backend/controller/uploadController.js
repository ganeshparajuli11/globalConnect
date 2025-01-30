const uploadMiddleware = require("../middleware/uploadMiddleware");

// Single file upload
const uploadFile = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }
    res.json({ fileUrl: `/uploads/${req.file.filename}` });
};

// Multiple file upload
const uploadMultipleFiles = (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
    }
    const fileUrls = req.files.map(file => `/uploads/${file.filename}`);
    res.json({ fileUrls });
};

module.exports = { uploadFile, uploadMultipleFiles };
