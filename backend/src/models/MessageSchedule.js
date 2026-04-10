import mongoose from 'mongoose';

const messageScheduleSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'video', 'audio', 'file'],
      default: 'text',
    },
    mediaUrl: String,
    scheduledTime: {
      type: Date,
      required: true,
      index: true,
    },
    isDelivered: {
      type: Boolean,
      default: false,
    },
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    status: {
      type: String,
      enum: ['scheduled', 'sent', 'failed', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    failureReason: String,
  },
  { timestamps: true }
);

// Index for finding pending scheduled messages
messageScheduleSchema.index({ scheduledTime: 1, isDelivered: 1 });
messageScheduleSchema.index({ senderId: 1, status: 1 });

export default mongoose.model('MessageSchedule', messageScheduleSchema);
