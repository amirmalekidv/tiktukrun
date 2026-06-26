module.exports = {
  apps: [
    {
      name: 'tiktakrun-web',
      script: 'node',
      args: '.next/standalone/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
        NEXT_PUBLIC_USE_MOCK: 'false',
        NEXT_PUBLIC_API_URL: 'http://localhost:4000',
        NEXT_PUBLIC_WS_URL: 'http://localhost:4000',
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
    },
  ],
}
