import { useEffect, useState } from 'react';

export default function LiveNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [connection, setConnection] = useState('connecting');
  const token = localStorage.getItem('token');

  useEffect(() => {
    const controller = new AbortController();

    async function listen() {
      while (!controller.signal.aborted) {
        try {
          setConnection('connecting');
          const response = await fetch('/api/notifications/stream', {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal
          });
          if (!response.ok || !response.body) {
            throw new Error('Notification stream is unavailable.');
          }

          setConnection('live');
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          while (!controller.signal.aborted) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
            let boundary = buffer.indexOf('\n\n');
            while (boundary !== -1) {
              const block = buffer.slice(0, boundary);
              buffer = buffer.slice(boundary + 2);
              const data = block.split('\n').find((line) => line.startsWith('data: '));
              if (data) {
                try {
                  const notification = JSON.parse(data.slice(6));
                  setNotifications((current) => [notification, ...current].slice(0, 4));
                } catch (parseError) {
                  console.error('Invalid notification received:', parseError);
                }
              }
              boundary = buffer.indexOf('\n\n');
            }
          }
          if (!controller.signal.aborted) setConnection('reconnecting');
        } catch (error) {
          if (controller.signal.aborted) break;
          console.error('Notification stream disconnected:', error.message);
          setConnection('reconnecting');
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    listen();
    return () => controller.abort();
  }, [token]);

  return (
    <section className="card live-notifications" aria-live="polite">
      <div className="live-notifications-heading">
        <h2>Live notifications</h2>
        <span className={`notification-connection notification-${connection}`}>
          {connection === 'live' ? 'Connected' : connection === 'connecting' ? 'Connecting…' : 'Reconnecting…'}
        </span>
      </div>
      {notifications.length === 0 ? (
        <p className="empty">Appointment and record updates will appear here.</p>
      ) : (
        <ul className="notification-list">
          {notifications.map((notification) => (
            <li key={notification.id}>{notification.message}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
