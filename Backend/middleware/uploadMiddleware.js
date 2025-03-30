const multer = require("multer");
const path = require("path");

// Define storage settings for posts
const postStorage = multer.diskStorage({
    destination: "./uploads/posts/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
});

// Define storage settings for profile images
const profileStorage = multer.diskStorage({
    destination: "./uploads/profile/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
});

// New storage for messages
const messageStorage = multer.diskStorage({
    destination: "./uploads/messages/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
});


// File type filter (only images allowed)
const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type! Only images are allowed."), false);
    }
};

// Multer upload configurations
const uploadPostMedia = multer({
    storage: postStorage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const uploadProfileImage = multer({
    storage: profileStorage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// New upload middleware for message images
const uploadMessageMedia = multer({
    storage: messageStorage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Export both upload configurations
module.exports = {
    uploadPostMedia,
    uploadProfileImage,
    uploadMessageMedia
};
