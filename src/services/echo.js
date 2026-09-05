import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Expose Pusher to window for Laravel Echo
window.Pusher = Pusher;

let echoInstance = null;

export const getEcho = () => {
  const pusherKey = import.meta.env.VITE_PUSHER_APP_KEY;
  const pusherCluster = import.meta.env.VITE_PUSHER_APP_CLUSTER || 'ap1';
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

  // If Pusher key is not set yet, return null gracefully
  if (!pusherKey) {
    return null;
  }

  if (!echoInstance) {
    const token = localStorage.getItem('tally_token');

    echoInstance = new Echo({
      broadcaster: 'pusher',
      key: pusherKey,
      cluster: pusherCluster,
      forceTLS: true,
      authEndpoint: `${apiBaseUrl}/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          Accept: 'application/json',
        },
      },
    });
  }

  return echoInstance;
};

export const updateEchoToken = (token) => {
  if (echoInstance && token) {
    echoInstance.options.auth.headers.Authorization = `Bearer ${token}`;
  }
};

export const disconnectEcho = () => {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
  }
};
