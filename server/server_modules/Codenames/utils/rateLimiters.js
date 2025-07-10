const { RateLimiterMemory } = require('rate-limiter-flexible');

const createNewRoomRateLimiter = new RateLimiterMemory({
    points: 1,  // 1 event
    duration: 5 // per 5 seconds
});

const startNewGameRateLimiter = new RateLimiterMemory({
    points: 2,  // 2 events
    duration: 1 // per 1 second
});

const randomizeTeamOrderRateLimiter = new RateLimiterMemory({
    points: 2,  // 2 events
    duration: 1 // per 1 second
});

const refreshGameboardRateLimiter = new RateLimiterMemory({
    points: 2,  // 2 events
    duration: 1 // per 1 second
});

const playerRelatedHostActionsRateLimiter = new RateLimiterMemory({
    points: 4,  // 4 events
    duration: 1 // per 1 second
});

const playerProfileRateLimiter = new RateLimiterMemory({
    points: 3,  // 2 events
    duration: 1 // per 1 second
});

const wordRateLimiter = new RateLimiterMemory({
    points: 3,  // 3 events
    duration: 1 // per 1 second
});

const sendNewChatMessageRateLimiter = new RateLimiterMemory({
    points: 3,  // 3 events
    duration: 1 // per 1 second
});

module.exports = {
    createNewRoomRateLimiter,
    startNewGameRateLimiter,
    randomizeTeamOrderRateLimiter,
    refreshGameboardRateLimiter,
    playerRelatedHostActionsRateLimiter,
    playerProfileRateLimiter,
    wordRateLimiter,
    sendNewChatMessageRateLimiter
};