import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

export const ROLES = ['customer', 'admin'];
export const FIT_PREFERENCES = ['slim', 'regular', 'loose'];

// bcrypt cost factor: each +1 doubles the hashing time. 12 ≈ 200–300 ms, a good balance
// between slowing down password guessing and keeping login fast.
const BCRYPT_ROUNDS = 12;

// Saved result of the last body scan (filled in Phase 3). Everything is optional
// until the first scan. The photo itself is never stored.
const fitProfileSchema = new mongoose.Schema(
  {
    heightCm: Number,
    weightKg: Number,
    measurements: {
      shoulder_cm: Number,
      chest_cm: Number,
      waist_cm: Number,
      torso_cm: Number,
      arm_cm: Number,
      leg_cm: Number,
    },
    skinTone: { tone: String, undertone: String, hex: String },
    colorSuggestions: [{ _id: false, name: String, hex: String }],
    confidence: Number,
    updatedAt: Date,
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // select: false → never loaded unless a query explicitly asks for it (+passwordHash)
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'customer' },
    fitProfile: { type: fitProfileSchema, default: undefined },
    fitPreference: { type: String, enum: FIT_PREFERENCES, default: 'regular' },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      // Belt and braces: even if the hash was loaded, it never goes out in a response
      transform: (_doc, ret) => {
        delete ret.passwordHash;
        return ret;
      },
    },
  },
);

userSchema.methods.checkPassword = function checkPassword(plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

userSchema.statics.hashPassword = function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
};

export const User = mongoose.model('User', userSchema);
