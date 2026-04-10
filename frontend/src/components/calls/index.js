// Call Components - Export all call-related components
export { default as IncomingCallDialog } from './IncomingCallDialog.jsx';
export { default as CallActive } from './CallActive.jsx';
export { default as CallControls } from './CallControls.jsx';
export { default as CallStatus } from './CallStatus.jsx';

// Convenience export for common usage
export const CallComponents = {
  IncomingCallDialog: require('./IncomingCallDialog.jsx').default,
  CallActive: require('./CallActive.jsx').default,
  CallControls: require('./CallControls.jsx').default,
  CallStatus: require('./CallStatus.jsx').default,
};
