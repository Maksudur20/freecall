// User Model
import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    emailVerified: {
      type: Boolean,
      default: false,
      description: 'Whether the email has been verified by the user',
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
      description: 'Timestamp when email was verified',
    },
    verificationTokenHash: {
      type: String,
      default: null,
      select: false,
      description: 'Hashed email verification token (not stored plain)',
    },
    passwordResetTokenHash: {
      type: String,
      default: null,
      select: false,
      description: 'Hashed password reset token (not stored plain)',
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    profilePicturePublicId: {
      type: String,
      default: null,
      description: 'Cloudinary public ID for profile picture (for deletion)',
    },
    coverPhoto: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['online', 'away', 'offline', 'dnd'],
      default: 'offline',
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    role: {
      type: String,
      enum: ['user', 'moderator', 'admin'],
      default: 'user',
    },
    phoneNumber: {
      type: String,
      default: null,
    },
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    deviceTokens: [
      {
        token: String,
        device: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    agreedToTerms: {
      type: Boolean,
      default: false,
    },
    agreedToTermsAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (passwordToCheck) {
  return bcryptjs.compare(passwordToCheck, this.password);
};

// Hide sensitive fields from JSON
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

// Indexes
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ createdAt: -1 });

const User = mongoose.model('User', UserSchema);

export default User;
