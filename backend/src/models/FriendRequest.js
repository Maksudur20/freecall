// Friend Request Model
import mongoose from 'mongoose';

const FriendRequestSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'blocked'],
      default: 'pending',
    },
    message: {
      type: String,
      maxlength: 200,
      default: '',
    },
    respondedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure no duplicate pending requests
FriendRequestSchema.index({ senderId: 1, recipientId: 1, status: 1 }, { unique: false });

const FriendRequest = mongoose.model('FriendRequest', FriendRequestSchema);

export default FriendRequest;
