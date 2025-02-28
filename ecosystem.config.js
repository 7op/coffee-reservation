export default {
  apps: [{
    name: 'coffee-server',
    script: 'server.js',
    env_production: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 4000,
      MONGODB_URI: process.env.MONGODB_URI
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
}; 