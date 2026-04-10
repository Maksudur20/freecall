// IncomingCallDialog - Dialog for incoming calls
import React from 'react';
import { useCall } from '../../hooks/useCall.js';
import CallStatus from './CallStatus.jsx';

/**
 * IncomingCallDialog Component
 * Displays incoming call notification with accept/decline buttons
 *
 * @component
 * @example
 * <IncomingCallDialog />
 */
const IncomingCallDialog = ({ onAccept = null, onDecline = null }) => {
  const { incomingCall, acceptCall, declineCall, isLoading } = useCall({
    autoInit: false, // Depends on parent initialization
  });

  if (!incomingCall) {
    return null;
  }

  const handleAccept = async () => {
    try {
      await acceptCall(incomingCall.callId || incomingCall._id);
      onAccept?.();
    } catch (error) {
      console.error('Error accepting call:', error);
    }
  };

  const handleDecline = () => {
    declineCall(incomingCall.callId || incomingCall._id);
    onDecline?.();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-96">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex justify-center items-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-blue-600 animate-pulse"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {incomingCall.callerName || 'Unknown'}
          </h2>

          <p className="text-gray-600 mb-4">
            {incomingCall.type === 'video' ? 'Video call' : 'Voice call'}
          </p>

          <CallStatus status="ringing" />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          {/* Decline Button */}
          <button
            onClick={handleDecline}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Decline
          </button>

          {/* Accept Button */}
          <button
            onClick={handleAccept}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 C22.9702544,11.6889879 22.9702544,11.5318905 22.9702544,11.4748931 L22.9702544,11.3177956 C22.9702544,10.375211 22.6563168,9.43262673 21.714504,8.9613346 L4.13399899,0.163680832 C3.34915502,0.0505050506 2.40734225,0.162088713 1.77946707,0.688549618 C0.994623095,1.21500962 0.837654321,2.30596384 1.15159189,3.09149026 L3.03521743,9.53248324 C3.03521743,9.68957054 3.19218622,9.84666784 3.50612381,9.84666784 L16.6915026,10.6321548 C16.6915026,10.6321548 17.1624089,10.6321548 17.1624089,10.2451987 L17.1624089,12.1289189 C17.1624089,12.4744748 16.6915026,12.4744748 16.6915026,12.4744748 Z" />
            </svg>
            Accept
          </button>
        </div>

        {/* Call Type Indicator */}
        <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          {incomingCall.type === 'video' ? (
            <span className="inline-flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14l4 4v12z" />
              </svg>
              Video call
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              Voice call
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default IncomingCallDialog;
