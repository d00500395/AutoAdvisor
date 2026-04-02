const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { Schema } = mongoose;

const userSchema = new Schema({
  username:     { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
}, { timestamps: true });

// Hash password before saving
userSchema.statics.register = async function (username, email, password) {
  const hash = await bcrypt.hash(password, 10);
  return this.create({ username, email, passwordHash: hash });
};

// Verify password
userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

// Never expose passwordHash in JSON
userSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.passwordHash;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
