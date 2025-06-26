const { RateLimiterMemory } = require('rate-limiter-flexible');

const createNewRoomRateLimiter = new RateLimiterMemory({
    points: 1,  // 1 event
    duration: 5 // per 5 seconds
});

const startNewGameRateLimiter = new RateLimiterMemory({
    points: 2,  // 2 events
    duration: 1 // per 1 second
});

const refreshGameboardRateLimiter = new RateLimiterMemory({
    points: 2,  // 2 events
    duration: 1 // per 1 second
});

module.exports = {
    createNewRoomRateLimiter,
    startNewGameRateLimiter,
    refreshGameboardRateLimiter
};