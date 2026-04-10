// CallControls - Control buttons for call management
import React from 'react';
import { useCall } from '../../hooks/useCall.js';

/**
 * CallControls Component
 * Provides buttons for mute/unmute, camera toggle, and end call
 *
 * @component
 * @param {string} callId - The call ID
 * @param {Object} options - Configuration options
 * @param {Function} options.onEndCall - Callback when call ends
 * @param {boolean} options.showStats - Show connection stats (default: false)
 * @example
 * <CallControls callId="call123" onEndCall={() => console.log('ended')} />
 */
const CallControls = ({ callId = null, options = {} }) => {
  const { showStats = false, onEndCall = null } = options;

  const { isMuted, isCameraOn, toggleMute, toggleCamera, endCall, connectionStatus } =
    useCall({
      autoInit: false,
    });

  const handleEndCall = () => {
    if (callId) {
      endCall(callId);
      onEndCall?.();
    }
  };

  const isCalling = connectionStatus === 'connected' || connectionStatus === 'connecting';

  return (
    <div className="flex items-center justify-center gap-4 p-4">
      {/* Mute Button */}
      <button
        onClick={toggleMute}
        disabled={!isCalling}
        title={isMuted ? 'Unmute' : 'Mute'}
        className={`
          relative w-12 h-12 rounded-full transition-all transform
          ${isMuted
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-gray-700 hover:bg-gray-800 text-white'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
          hover:scale-110 active:scale-95
        `}
      >
        <svg
          className="w-5 h-5 mx-auto"
          fill={isMuted ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isMuted ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707a1 1 0 011.414 1.414L9.914 6H15a3 3 0 110 6H9.914l1.793 1.793a1 1 0 01-1.414 1.414L5.586 15z"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4"
            />
          )}
        </svg>

        {/* Indicator */}
        {isMuted && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border border-white"></span>
        )}
      </button>

      {/* Camera Button */}
      <button
        onClick={toggleCamera}
        disabled={!isCalling}
        title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
        className={`
          relative w-12 h-12 rounded-full transition-all transform
          ${isCameraOn
            ? 'bg-gray-700 hover:bg-gray-800 text-white'
            : 'bg-red-500 hover:bg-red-600 text-white'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
          hover:scale-110 active:scale-95
        `}
      >
        <svg
          className="w-5 h-5 mx-auto"
          fill={isCameraOn ? 'none' : 'currentColor'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isCameraOn ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4.243 4.243m9.172-9.172l.707-.707a5.996 5.996 0 018.484 8.484l-.707.707m0 0a4 4 0 01-5.656 0m5.656 0l4.243-4.243a2 2 0 00-2.83-2.83l-2.829 2.829m-9.172 9.172l-.707.707a5.996 5.996 0 008.484 8.484l.707-.707"
            />
          )}
        </svg>

        {/* Indicator */}
        {!isCameraOn && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border border-white"></span>
        )}
      </button>

      {/* End Call Button */}
      <button
        onClick={handleEndCall}
        disabled={!isCalling}
        title="End call"
        className={`
          w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white
          transition-all transform
          disabled:opacity-50 disabled:cursor-not-allowed
          hover:scale-110 active:scale-95
        `}
      >
        <svg
          className="w-5 h-5 mx-auto"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 C22.9702544,11.6889879 22.9702544,11.5318905 22.9702544,11.4748931 L22.9702544,11.3177956 C22.9702544,10.375211 22.6563168,9.43262673 21.714504,8.9613346 L4.13399899,0.163680832 C3.34915502,0.0505050506 2.40734225,0.162088713 1.77946707,0.688549618 C0.994623095,1.21500962 0.837654321,2.30596384 1.15159189,3.09149026 L3.03521743,9.53248324 C3.03521743,9.68957054 3.19218622,9.84666784 3.50612381,9.84666784 L16.6915026,10.6321548 C16.6915026,10.6321548 17.1624089,10.6321548 17.1624089,10.2451987 L17.1624089,12.1289189 C17.1624089,12.4744748 16.6915026,12.4744748 16.6915026,12.4744748 Z" />
        </svg>
      </button>
    </div>
  );
};

export default CallControls;
