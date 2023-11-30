module.exports = {
  apps: [
    {
      name: 'controller-perps-keeper-mainnet',
      cron_restart: '*/5 * * * *',
      max_memory_restart: '100M',
      script: './index.js',
      args: 'run',
      time: true,
    },
    {
      name: 'controller-perps-keeper-testnet',
      cron_restart: '*/5 * * * *',
      max_memory_restart: '100M',
      script: './index.js',
      args: 'run',
      time: true,
    },
  ],
};
