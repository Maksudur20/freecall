// Message Model
import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      default: null,
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'video', 'file', 'audio', 'call', 'typing'],
      default: 'text',
    },
    media: [
      {
        url: String,
        type: String, // 'image', 'video', 'document'
        name: String,
        size: Number,
      },
    ],
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    reactions: [
      {
        emoji: String,
        users: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
        ],
      },
    ],
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedBy: {
      oneForMe: Boolean,
      forEveryone: Boolean,
      deletedAt: Date,
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'seen', 'failed'],
      default: 'sent',
    },
    seenBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        seenAt: Date,
      },
    ],
    readReceipts: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        readAt: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1 });
MessageSchema.index({ createdAt: -1 });
MessageSchema.index({ 'seenBy.userId': 1 });

const Message = mongoose.model('Message', MessageSchema);

export default Message;
