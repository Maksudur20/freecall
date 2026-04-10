// Notification Model
import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    type: {
      type: String,
      enum: [
        'friend_request',
        'friend_accepted',
        'message',
        'typing',
        'call_incoming',
        'call_missed',
        'mention',
        'reaction',
        'system'
      ],
      required: true,
    },
    title: String,
    description: String,
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null, // Can reference Message, FriendRequest, etc.
    },
    referenceModel: String,
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    actionUrl: String,
    metadata: new mongoose.Schema({}, { strict: false }),
  },
  {
    timestamps: true,
  }
);

// Indexes
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', NotificationSchema);

export default Notification;
