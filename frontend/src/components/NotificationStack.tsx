import { useNotifications } from '../context/NotificationContext';

export function NotificationStack() {
  const { notifications, remove } = useNotifications();

  return (
    <div className="notification-stack">
      {notifications.map((notification) => (
        <button
          key={notification.id}
          className={`notification ${notification.type}`}
          onClick={() => remove(notification.id)}
          type="button"
        >
          {notification.message}
        </button>
      ))}
    </div>
  );
}
