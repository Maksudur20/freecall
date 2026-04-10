// Conversation/Chat Model
import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    name: {
      type: String,
      default: null, // For group chats
    },
    description: {
      type: String,
      default: null,
    },
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    groupAvatar: {
      type: String,
      default: null,
    },
    groupAvatarPublicId: {
      type: String,
      default: null,
      description: 'Cloudinary public ID for group avatar (for deletion)',
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    unreadCount: new mongoose.Schema(
      {},
      { strict: false } // Dynamic keys for each user
    ),
    isPinned: {
      type: Boolean,
      default: false,
    },
    isMuted: {
      type: Boolean,
      default: false,
    },
    muteNotifications: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ lastMessage: 1 });
ConversationSchema.index({ updatedAt: -1 });
ConversationSchema.index({ isGroupChat: 1 });

const Conversation = mongoose.model('Conversation', ConversationSchema);

export default Conversation;
