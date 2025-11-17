import { query } from './db.js';

export function startScheduler(logger) {
  // Run every day at ~02:00 UTC (approx; container uptime based)
  const dayMs = 24 * 60 * 60 * 1000;
  const run = async () => {
    try {
      // Example: mark subscriptions pending for too long as 'attention'
      await query(
        "UPDATE subscriptions SET status='attention', updated_at=now() WHERE status='pending' AND created_at < now() - interval '3 days'"
      );
      logger.info('daily subscription maintenance completed');
    } catch (e) {
      logger.error({ err: e }, 'scheduler error');
    }
  };

  setInterval(run, dayMs);
  // kick once on boot after short delay
  setTimeout(run, 30 * 1000);
}
