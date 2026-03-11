/**
 * Simple In-Memory Rate Limiting Middleware
 *
 * This middleware tracks requests by IP address and limits them based on the provided options.
 * It includes a cleanup mechanism to prevent memory leaks by removing stale IP entries from the map.
 */
const rateLimit = (options) => {
    const requests = new Map();
    const { windowMs, max, message } = options;

    // Periodic cleanup to prevent memory leaks
    const cleanup = () => {
        const now = Date.now();
        const windowStart = now - windowMs;
        for (const [ip, timestamps] of requests.entries()) {
            const validTimestamps = timestamps.filter(t => t > windowStart);
            if (validTimestamps.length === 0) {
                requests.delete(ip);
            } else {
                requests.set(ip, validTimestamps);
            }
        }
    };

    // Run cleanup every windowMs to remove stale entries
    const timer = setInterval(cleanup, windowMs);

    // Ensure the timer doesn't prevent the process from exiting
    if (timer.unref) {
        timer.unref();
    }

    const middleware = (req, res, next) => {
        const ip = req.ip;
        const now = Date.now();
        const windowStart = now - windowMs;

        let clientRequests = requests.get(ip) || [];

        // Filter out requests outside the current window
        clientRequests = clientRequests.filter(timestamp => timestamp > windowStart);

        if (clientRequests.length >= max) {
            return res.status(429).json({
                message: message || 'Too many requests, please try again later.'
            });
        }

        clientRequests.push(now);
        requests.set(ip, clientRequests);
        next();
    };

    // Expose internal state for testing purposes
    middleware._requests = requests;
    middleware._cleanup = cleanup;

    return middleware;
};

module.exports = rateLimit;
