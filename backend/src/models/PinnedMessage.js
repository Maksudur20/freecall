import mongoose from 'mongoose';

const pinnedMessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      required: true,
      index: true,
    },
    pinnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    pinnedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    reason: String,
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Ensure one message can be pinned once per conversation
pinnedMessageSchema.index({ conversationId: 1, messageId: 1 }, { unique: true });
// Index for ordering pins
pinnedMessageSchema.index({ conversationId: 1, order: 1 });

export default mongoose.model('PinnedMessage', pinnedMessageSchema);
