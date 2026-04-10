// CallStatus - Connection status indicator
import React from 'react';

/**
 * CallStatus Component
 * Shows connection status with visual indicators
 *
 * @component
 * @param {string} status - Connection status (idle, connecting, connected, disconnected, failed, ringing)
 * @param {Object} stats - Connection statistics
 * @example
 * <CallStatus status="connected" stats={{ latency: 45 }} />
 */
const CallStatus = ({ status = 'idle', stats = null }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'connecting':
        return {
          icon: '📡',
          text: 'Connecting...',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          isAnimated: true,
        };
      case 'connected':
        return {
          icon: '✓',
          text: 'Connected',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          isAnimated: false,
        };
      case 'disconnected':
        return {
          icon: '✕',
          text: 'Disconnected',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          isAnimated: false,
        };
      case 'failed':
        return {
          icon: '⚠',
          text: 'Connection Failed',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          isAnimated: false,
        };
      case 'ringing':
        return {
          icon: '📞',
          text: 'Ringing...',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          isAnimated: true,
        };
      default:
        return {
          icon: '◯',
          text: 'Idle',
          color: 'text-gray-400',
          bgColor: 'bg-gray-50',
          isAnimated: false,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${config.bgColor}`}>
      <span className={`${config.color} ${config.isAnimated ? 'animate-pulse' : ''}`}>
        {config.icon}
      </span>
      <span className={`text-sm font-medium ${config.color}`}>
        {config.text}
      </span>

      {/* Latency indicator */}
      {stats?.latency != null && (
        <span className="text-xs text-gray-500 ml-2">
          ({stats.latency}ms)
        </span>
      )}
    </div>
  );
};

export default CallStatus;
