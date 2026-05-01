export function getHealthStatus() {
  return {
    status: 'ok' as const,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
  };
}
