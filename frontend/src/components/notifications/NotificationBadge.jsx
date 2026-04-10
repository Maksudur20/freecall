// NotificationBadge Component
// Shows unread notification count

import useNotifications from '../../hooks/useNotifications.js';

export function NotificationBadge({ size = 'md', className = '' }) {
  const { badgeCount } = useNotifications({ autoInit: true, fetchOnMount: false });

  // Size variants
  const sizeClasses = {
    sm: 'w-4 h-4 text-xs',
    md: 'w-5 h-5 text-sm',
    lg: 'w-6 h-6 text-base',
  };

  if (badgeCount === 0) return null;

  return (
    <div className={`
      absolute top-0 right-0
      ${sizeClasses[size]}
      bg-red-500 text-white
      rounded-full
      flex items-center justify-center
      font-bold
      ${className}
    `}>
      {badgeCount > 99 ? '99+' : badgeCount}
    </div>
  );
}

export default NotificationBadge;
