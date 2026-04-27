const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { Schema } = mongoose;

const userSchema = new Schema({
  username:     { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String },
  providers:    [{ type: String, enum: ['local', 'google'] }],
  googleId:     { type: String, unique: true, sparse: true },
  avatarUrl:    { type: String },
  displayName:  { type: String, trim: true },
  preferences:  { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

function slugifyUsernameCandidate(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 24);
}

async function reserveUniqueUsername(model, base) {
  const seed = slugifyUsernameCandidate(base) || 'autodexxuser';
  let candidate = seed;
  let attempt = 1;

  while (await model.exists({ username: candidate })) {
    candidate = `${seed}${attempt}`.slice(0, 30);
    attempt += 1;
  }

  return candidate;
}

// Hash password before saving
userSchema.statics.register = async function (username, email, password) {
  const hash = await bcrypt.hash(password, 10);
  return this.create({ username, email, passwordHash: hash, providers: ['local'] });
};

userSchema.statics.findOrCreateGoogleUser = async function ({ googleId, email, name, picture }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  let user = await this.findOne({ $or: [{ googleId }, { email: normalizedEmail }] });

  if (user) {
    user.googleId = googleId;
    user.avatarUrl = picture || user.avatarUrl;
    user.displayName = name || user.displayName;
    user.providers = Array.from(new Set([...(user.providers || []), 'google']));
    await user.save();
    return user;
  }

  const username = await reserveUniqueUsername(this, normalizedEmail.split('@')[0] || name || 'autodexxuser');
  return this.create({
    username,
    email: normalizedEmail,
    googleId,
    avatarUrl: picture,
    displayName: name,
    providers: ['google'],
  });
};

// Verify password
userSchema.methods.comparePassword = function (password) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(password, this.passwordHash);
};

// Never expose passwordHash in JSON
userSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.passwordHash;
    if (!Array.isArray(ret.providers) || !ret.providers.length) {
      ret.providers = ['local'];
    }
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
