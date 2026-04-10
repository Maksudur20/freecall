// Example: Live Features Implementation in Components
// Copy and adapt these examples to your components

import { useRef, useEffect, useState } from 'react';
import {
  useLiveFeatures,
  useTypingIndicator,
  usePresence,
  useCallFeatures,
  useMessageFeatures,
} from '../hooks/useLiveFeatures';
import { useChatStore } from '../store/chatStore';
import { useUserStore } from '../store/userStore';

// ============================================
// EXAMPLE 1: Chat Window with Live Features
// ============================================
export function ChatWindowExample({ conversationId }) {
  const { messages, typingUsers } = useChatStore();
  const { currentUser } = useUserStore();
  const [inputValue, setInputValue] = useState('');
  const typingTimeoutRef = useRef(null);

  const { sendMessage, startTyping, endTyping, markAsSeen, addReaction } =
    useLiveFeatures({
      conversationId,
      userId: currentUser?._id,
    });

  // Mark conversation as seen when opened
  useEffect(() => {
    markAsSeen();
  }, [conversationId]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);

    // Start typing (only once)
    if (!typingTimeoutRef.current) {
      startTyping(currentUser?.name);
    }

    // Reset timer
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      endTyping();
      typingTimeoutRef.current = null;
    }, 1000);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    sendMessage(inputValue.trim());
    setInputValue('');
    endTyping();
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = null;
  };

  const handleAddReaction = (messageId, emoji) => {
    addReaction(messageId, emoji);
  };

  return (
    <div className="chat-window">
      <div className="messages-container">
        {messages.map((msg) => (
          <div key={msg._id} className="message">
            <strong>{msg.senderName}:</strong> {msg.content}
            <div className="message-reactions">
              {msg.reactions?.map((reaction) => (
                <span key={reaction.emoji} className="reaction">
                  {reaction.emoji} {reaction.count}
                </span>
              ))}
            </div>
            <div className="message-actions">
              <button onClick={() => handleAddReaction(msg._id, '👍')}>
                👍
              </button>
              <button onClick={() => handleAddReaction(msg._id, '❤️')}>
                ❤️
              </button>
              <button onClick={() => handleAddReaction(msg._id, '😂')}>
                😂
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Typing Indicator */}
      {Object.keys(typingUsers).length > 0 && (
        <div className="typing-indicator">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
          <p>{Object.values(typingUsers).join(', ')} are typing...</p>
        </div>
      )}

      {/* Message Input */}
      <div className="input-area">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type a message..."
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
}

// ============================================
// EXAMPLE 2: Message Input with Typing Indicator
// ============================================
export function MessageInputExample({ conversationId }) {
  const { currentUser } = useUserStore();
  const typingTimeoutRef = useRef(null);

  const { startTyping, stopTyping } = useTypingIndicator(
    conversationId,
    currentUser?._id,
    currentUser?.name
  );

  const handleChange = () => {
    if (!typingTimeoutRef.current) {
      startTyping();
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
      typingTimeoutRef.current = null;
    }, 2000);
  };

  const handleBlur = () => {
    clearTimeout(typingTimeoutRef.current);
    stopTyping();
    typingTimeoutRef.current = null;
  };

  return (
    <input
      type="text"
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder="Start typing..."
    />
  );
}

// ============================================
// EXAMPLE 3: User Presence/Status
// ============================================
export function UserPresenceExample() {
  const { currentUser, onlineUsers } = useUserStore();
  const { setOnline, setAway, setOffline, getOnlineUsers, emitActivity } =
    usePresence(currentUser?._id);

  useEffect(() => {
    // Set online when component mounts
    setOnline();
    getOnlineUsers();

    // Refresh online users list every 30 seconds
    const interval = setInterval(getOnlineUsers, 30000);

    // Emit activity every minute to show user is active
    const activityInterval = setInterval(emitActivity, 60000);

    // Set offline when component unmounts
    return () => {
      clearInterval(interval);
      clearInterval(activityInterval);
      setOffline();
    };
  }, []);

  return (
    <div className="presence-panel">
      <div className="status-controls">
        <button onClick={setOnline} className="status-btn online">
          Online
        </button>
        <button onClick={setAway} className="status-btn away">
          Away
        </button>
        <button onClick={setOffline} className="status-btn offline">
          Offline
        </button>
      </div>

      <div className="online-users">
        <h3>Online Users ({onlineUsers.length})</h3>
        <ul>
          {onlineUsers.map((user) => (
            <li key={user._id} className="online-user">
              <span className="status-dot online"></span>
              {user.name}
              <span className="time-ago">
                {user.lastActivity && (
                  <>
                    {new Date(user.lastActivity).toLocaleTimeString()}
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ============================================
// EXAMPLE 4: Video Call Interface
// ============================================
export function VideoCallExample({ incomingCallId, targetUserId }) {
  const { conversationId } = useParams();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);

  const [isMuted, setIsMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [callStatus, setCallStatus] = useState('idle');

  const {
    initiateCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleCamera,
    sendOffer,
    sendAnswer,
    sendICECandidate,
  } = useCallFeatures();

  // Setup WebRTC
  useEffect(() => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: ['stun:stun.l.google.com:19302'] },
        { urls: ['stun:stun1.l.google.com:19302'] },
      ],
    });

    peerConnectionRef.current = pc;

    // Get local media
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      });

    // Handle remote stream
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Send ICE candidates
    pc.onicecandidate = ({ candidate }) => {
      if (candidate && incomingCallId) {
        sendICECandidate(incomingCallId, candidate);
      }
    };

    // Listen for WebRTC events
    const handleOffer = async ({ detail }) => {
      if (detail.callId === incomingCallId) {
        await pc.setRemoteDescription(
          new RTCSessionDescription(detail.offer)
        );
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendAnswer(incomingCallId, answer);
      }
    };

    const handleAnswer = async ({ detail }) => {
      if (detail.callId === incomingCallId) {
        await pc.setRemoteDescription(
          new RTCSessionDescription(detail.answer)
        );
      }
    };

    const handleICE = async ({ detail }) => {
      if (detail.callId === incomingCallId) {
        try {
          await pc.addIceCandidate(
            new RTCIceCandidate(detail.candidate)
          );
        } catch (e) {
          console.error('Error adding ICE candidate:', e);
        }
      }
    };

    window.addEventListener('webrtc:offer', handleOffer);
    window.addEventListener('webrtc:answer', handleAnswer);
    window.addEventListener('webrtc:ice', handleICE);

    return () => {
      window.removeEventListener('webrtc:offer', handleOffer);
      window.removeEventListener('webrtc:answer', handleAnswer);
      window.removeEventListener('webrtc:ice', handleICE);
      pc.close();
    };
  }, [incomingCallId]);

  const handleInitiateCall = async () => {
    setCallStatus('calling');
    initiateCall(targetUserId, conversationId);

    // Create and send offer
    const pc = peerConnectionRef.current;
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendOffer(incomingCallId, offer);
  };

  const handleAcceptCall = () => {
    setCallStatus('connected');
    acceptCall(incomingCallId);
  };

  const handleDeclineCall = () => {
    declineCall(incomingCallId);
    setCallStatus('idle');
  };

  const handleEndCall = () => {
    endCall(incomingCallId);
    setCallStatus('idle');
  };

  const handleToggleMute = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    toggleMute(incomingCallId, newMuteState);
  };

  const handleToggleCamera = () => {
    const newCameraState = !cameraOn;
    setCameraOn(newCameraState);
    toggleCamera(incomingCallId, newCameraState);
  };

  return (
    <div className="video-call">
      <div className="video-container">
        <div className="local-video">
          <video ref={localVideoRef} autoPlay muted playsInline />
          <span className="label">You</span>
        </div>
        <div className="remote-video">
          <video ref={remoteVideoRef} autoPlay playsInline />
          <span className="label">Caller</span>
        </div>
      </div>

      <div className="call-status">
        <span className="status-badge">{callStatus.toUpperCase()}</span>
      </div>

      <div className="call-controls">
        {callStatus === 'idle' && (
          <>
            <button
              className="btn btn-primary"
              onClick={handleInitiateCall}
            >
              Start Call
            </button>
            <button
              className="btn btn-success"
              onClick={handleAcceptCall}
            >
              Accept Call
            </button>
            <button
              className="btn btn-danger"
              onClick={handleDeclineCall}
            >
              Decline
            </button>
          </>
        )}

        {callStatus === 'connected' && (
          <>
            <button
              className={`btn ${isMuted ? 'muted' : ''}`}
              onClick={handleToggleMute}
            >
              {isMuted ? '🔇 Unmute' : '🔊 Mute'}
            </button>
            <button
              className={`btn ${!cameraOn ? 'disabled' : ''}`}
              onClick={handleToggleCamera}
            >
              {cameraOn ? '📹 Camera On' : '📷 Camera Off'}
            </button>
            <button
              className="btn btn-danger"
              onClick={handleEndCall}
            >
              End Call
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================
// EXAMPLE 5: Complete Chat App Integration
// ============================================
export function ChatAppExample() {
  const { conversationId } = useParams();
  const { currentUser } = useUserStore();

  // Initialize all live features once at app level
  const features = useLiveFeatures({
    autoInit: true,
    conversationId,
    userId: currentUser?._id,
  });

  return (
    <div className="chat-app">
      <UserPresenceExample />
      <ChatWindowExample conversationId={conversationId} />
    </div>
  );
}

// ============================================
// EXAMPLE 6: Minimal Setup (App.jsx)
// ============================================
export function AppExample() {
  const { currentUser } = useUserStore();

  // Just initialize once - everything else is automatic
  useLiveFeatures({
    autoInit: true,
    userId: currentUser?._id,
  });

  return <YourAppRoutes />;
}
