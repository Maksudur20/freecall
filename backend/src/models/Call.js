// Call History Model
import mongoose from 'mongoose';

const CallSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
    },
    callerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['audio', 'video'],
      default: 'audio',
    },
    status: {
      type: String,
      enum: ['initiated', 'ringing', 'answered', 'declined', 'missed', 'ended'],
      default: 'initiated',
    },
    startTime: Date,
    endTime: Date,
    duration: {
      type: Number,
      default: 0, // in seconds
    },
    missedReason: String,
    declinedReason: String,
  },
  {
    timestamps: true,
  }
);

// Calculate duration before saving
CallSchema.pre('save', function (next) {
  if (this.startTime && this.endTime) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  }
  next();
});

// Indexes
CallSchema.index({ callerId: 1, createdAt: -1 });
CallSchema.index({ receiverId: 1, createdAt: -1 });
CallSchema.index({ conversationId: 1 });
CallSchema.index({ createdAt: -1 });

const Call = mongoose.model('Call', CallSchema);

export default Call;
