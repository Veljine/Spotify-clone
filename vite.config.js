import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        allowedHosts: [
            'noncivilizable-aydan-defenselessly.ngrok-free.dev',
        ],
        proxy: {
            '/deezer': {
                target: 'https://api.deezer.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/deezer/, ''),
            },
        },
    },
});