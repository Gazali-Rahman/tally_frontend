import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Expose Pusher to window for Laravel Echo
window.Pusher = Pusher;

let echoInstance = null;

export const getEcho = () => {
  const pusherKey = import.meta.env.VITE_PUSHER_APP_KEY;
  const pusherCluster = import.meta.env.VITE_PUSHER_APP_CLUSTER || 'ap1';
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

  // If Pusher key is not set yet in Vercel / env, warn gracefully
  if (!pusherKey) {
    console.warn('[Tally Real-Time] VITE_PUSHER_APP_KEY belum diset. Fitur WebSocket tidak aktif.');
    return null;
  }

  if (!echoInstance) {
    // Enable pusher logging for easy debugging
    Pusher.logToConsole = false;

    echoInstance = new Echo({
      broadcaster: 'pusher',
      key: pusherKey,
      cluster: pusherCluster,
      forceTLS: true,
      authorizer: (channel, options) => {
        return {
          authorize: (socketId, callback) => {
            const token = localStorage.getItem('tally_token');
            const authUrl = `${apiBaseUrl}/broadcasting/auth`;

            fetch(authUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
              },
              body: JSON.stringify({
                socket_id: socketId,
                channel_name: channel.name,
              }),
            })
              .then(async (res) => {
                if (!res.ok) {
                  const errBody = await res.text();
                  console.error('[Tally Echo Auth Error]', res.status, errBody);
                  throw new Error(`Broadcasting auth failed (${res.status})`);
                }
                return res.json();
              })
              .then((data) => callback(null, data))
              .catch((err) => {
                console.error('[Tally Echo Auth Failed]', err);
                callback(err, null);
              });
          },
        };
      },
    });
  }

  return echoInstance;
};

export const updateEchoToken = (token) => {
  // Token is dynamically read in the authorizer above
};

export const disconnectEcho = () => {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
  }
};

