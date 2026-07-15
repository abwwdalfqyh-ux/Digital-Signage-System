import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

let echo = null;
const pusherKey = import.meta.env.VITE_PUSHER_APP_KEY;

if (pusherKey) {
    echo = new Echo({
        broadcaster: 'pusher',
        key: pusherKey,
        cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'us2',
        forceTLS: true,
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
    console.warn("Laravel Echo: VITE_PUSHER_APP_KEY is missing. WebSockets are disabled.");
    const dummyChannel = { listen: () => dummyChannel };
    echo = {
        private: () => dummyChannel,
        channel: () => dummyChannel,
        leave: () => {}
    };
}

export default echo;
