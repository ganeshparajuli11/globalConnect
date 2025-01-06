const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  age: { type: Number, required: true },
  role: { type: String, default: 'user' },
  verified: { type: Boolean, default: false },
  profile_image: { type: String, default: null },
  location: { type: String, default: null },
  reported_count: { type: Number, default: 0 },
  status: { type: String, default: 'Active' },
  date_created: { type: Date, default: Date.now },
  last_login: { type: Date, default: null },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  console.log('Hashed Password:', this.password); // Log to check hashed password
  next();
});


userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};


module.exports = mongoose.model('User', userSchema);
