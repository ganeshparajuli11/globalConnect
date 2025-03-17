const { createCanvas } = require('canvas');
const express = require('express');
const router = express.Router();

const generateLogo = (req, res) => {
  const canvas = createCanvas(300, 100);
  const ctx = canvas.getContext('2d');

  // Set background color
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Set text properties
  ctx.font = 'bold 40px Arial';
  ctx.textBaseline = 'middle';

  // Draw "global" text
  ctx.fillStyle = '#4F46E5';
  ctx.fillText('global', 10, canvas.height / 2);

  // Measure the width of "global" text to position "Connect" correctly
  const globalTextWidth = ctx.measureText('global').width;

  // Draw "Connect" text
  ctx.fillStyle = '#000000';
  ctx.fillText('Connect', 10 + globalTextWidth, canvas.height / 2);

  // Convert canvas to image and send as response
  const buffer = canvas.toBuffer('image/png');
  res.set('Content-Type', 'image/png');
  res.send(buffer);
};

// Route to serve the logo
router.get('/logo', generateLogo);

module.exports = router;