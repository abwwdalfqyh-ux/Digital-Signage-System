import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

let echo = null;

if (import.meta.env.VITE_REVERB_APP_KEY) {
    echo = new Echo({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY,
        wsHost: import.meta.env.VITE_REVERB_HOST,
        wsPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
        wssPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
        forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
        enabledTransports: ['ws', 'wss'],
        authorizer: (channel, options) => {
            return {
                authorize: (socketId, callback) => {
                    const token = localStorage.getItem('token');
                    fetch(`${import.meta.env.VITE_API_URL}/broadcasting/auth`, {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            socket_id: socketId,
                            channel_name: channel.name
                        })
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Could not authorize');
                        }
                        return response.json();
                    })
                    .then(data => {
                        callback(false, data);
                    })
                    .catch(error => {
                        callback(true, error);
                    });
                }
            };
        }
    });
} else {
    console.warn("Laravel Echo: VITE_REVERB_APP_KEY is missing. WebSockets are disabled.");
    const dummyChannel = { listen: () => dummyChannel };
    echo = {
        private: () => dummyChannel,
        channel: () => dummyChannel,
        leave: () => {}
    };
}

export default echo;
