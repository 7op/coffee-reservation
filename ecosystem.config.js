export default {
  apps: [{
    name: 'coffee-server',
    script: 'server.js',
    env_production: {
      NODE_ENV: 'production',
      PORT: 4000,
      MONGODB_URI: 'mongodb+srv://admin:Bader12345@hyam.blt6o.mongodb.net/coffee-reservation?retryWrites=true&w=majority&appName=hyam'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
}; 