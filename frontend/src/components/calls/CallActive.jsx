// CallActive - Main active call window with video/audio display
import React, { useEffect, useRef } from 'react';
import { useCall } from '../../hooks/useCall.js';
import CallControls from './CallControls.jsx';
import CallStatus from './CallStatus.jsx';

/**
 * CallActive Component
 * Main call window with local and remote video/audio streams
 * Displays call controls, status, and connection information
 *
 * @component
 * @example
 * <CallActive />
 */
const CallActive = () => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const {
    activeCall,
    localStream,
    remoteStreams,
    isMuted,
    isCameraOn,
    connectionStatus,
    isConnected,
  } = useCall({
    autoInit: false,
  });

  // Set up local video stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Set up remote video stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStreams && Object.keys(remoteStreams).length > 0) {
      const remoteStream = Object.values(remoteStreams)[0];
      if (remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    }
  }, [remoteStreams]);

  if (!activeCall) {
    return null;
  }

  const callDuration = activeCall.duration || 0;
  const remotePeerName = activeCall.callerName || activeCall.receiverName || 'Unknown';
  const isVideoCall = activeCall.type === 'video';
  const hasRemoteVideo = remoteStreams && Object.keys(remoteStreams).length > 0;

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col z-50">
      {/* Header */}
      <div className="bg-gray-800 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{remotePeerName}</h2>
            <CallStatus status={connectionStatus} />
          </div>
        </div>

        {/* Duration */}
        <div className="text-right">
          <div className="text-2xl font-mono font-bold">
            {Math.floor(callDuration / 60)
              .toString()
              .padStart(2, '0')}
            :{(callDuration % 60).toString().padStart(2, '0')}
          </div>
          <div className="text-xs text-gray-400">{activeCall.type} call</div>
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
        {/* Remote Video (Full Screen) */}
        {isVideoCall && hasRemoteVideo ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex-1 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <div className="text-center">
              <svg
                className="w-24 h-24 mx-auto text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <p className="text-gray-400 text-lg font-medium">{remotePeerName}</p>
              <p className="text-gray-500 text-sm mt-2">
                {isMuted ? '🔇 Muted' : '🔊 Audio only'}
              </p>
            </div>
          </div>
        )}

        {/* Local Video (Picture in Picture) */}
        {isCameraOn && isVideoCall && localStream && (
          <div className="absolute bottom-24 right-4 w-48 h-40 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600 shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Mute Indicator on Local Video */}
            {isMuted && (
              <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                Muted
              </div>
            )}
          </div>
        )}

        {/* Audio Only Indicator */}
        {!isCameraOn && (
          <div className="absolute top-4 left-4 bg-gray-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13.5a1 1 0 11-3 0 1 1 0 013 0z" />
              <path
                fillRule="evenodd"
                d="M13.933 13.933a5.5 5.5 0 00-7.866-7.866m15.98 2.84a.75.75 0 00-1.06-1.061 10.5 10.5 0 0110.606 10.606.75.75 0 001.06-1.06 12 12 0 00-12.12-12.12zM12 20a8 8 0 100-16 8 8 0 000 16z"
                clipRule="evenodd"
              />
            </svg>
            Audio call
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="bg-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-xs text-gray-400 text-center">
              {isConnected()
                ? '✓ Connected'
                : connectionStatus === 'connecting'
                  ? 'Connecting...'
                  : connectionStatus}
            </div>
          </div>

          <CallControls
            callId={activeCall.callId || activeCall._id}
            options={{ showStats: false }}
          />

          <div className="flex-1" />
        </div>
      </div>
    </div>
  );
};

export default CallActive;
