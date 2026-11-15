const clients = new Set();

function publishNotification(notification) {
  const event = JSON.stringify({ id: Date.now(), ...notification });
  for (const client of clients) {
    const matchesUser = notification.userId && client.userId === notification.userId;
    const matchesRole = notification.roles && notification.roles.includes(client.role);
    if (client.response.destroyed || client.response.writableEnded) {
      clients.delete(client);
    } else if (matchesUser || matchesRole) {
      client.response.write(`data: ${event}\n\n`);
    }
  }
}

function addNotificationClient(user, response) {
  const client = {
    userId: user.id,
    role: user.role,
    response
  };
  clients.add(client);
  response.status(200).set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  response.flushHeaders();
  response.write(': connected\n\n');

  const heartbeat = setInterval(() => response.write(': keep-alive\n\n'), 20000);
  response.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(client);
  });
}

module.exports = { publishNotification, addNotificationClient };
