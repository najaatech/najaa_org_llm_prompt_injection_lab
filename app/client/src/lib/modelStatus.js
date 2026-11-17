// Overall state of the local models: green = all running, amber = some, red = none, grey = unknown.
export function overallStatus(online, models) {
  if (!online || !Array.isArray(models) || models.length === 0) return { color: 'grey.500', label: online ? 'Local model status unknown' : 'Server connection interrupted' };
  const running = models.filter((m) => m.running).length;
  if (running === models.length) return { color: 'success.main', label: 'All local models are running' };
  if (running === 0) return { color: 'error.main', label: 'No local model is running' };
  return { color: 'warning.main', label: 'Some local models are not running' };
}
