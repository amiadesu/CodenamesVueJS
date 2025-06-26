// @ts-check
const RoomContext = require("../db/roomContext");

const {
    totalCards
} = require("../utils/helpers");

const {
    Permissions
} = require("../utils/constants");
const {
    refreshGameboardRateLimiter
} = require("../utils/rateLimiters");

const DIContainer = require("../GameLogic/container");
const {
    validateUser,
    checkPermissions
} = DIContainer.modules.permissionsValidation;
const {
    getWordsFromPack,
    getWordsForRoom,
    getNewWords,
    getGameboard
} = DIContainer.modules.gameboard;
const {
    toggleWord,
    toggleWordNoSave,
    clearWord,
    clearWordNoSave,
    revealWord,
    wordAutoselect,
    clearAllSelections
} = DIContainer.modules.words;

async function getGameboardEvent(io, socketData) {
    const room = new RoomContext(socketData.roomId);

    const words = await getGameboard(room, socketData.userCodenamesId);

    const gameRules = await room.getGameRules();

    io.to(socketData.socketId).emit("send_new_gameboard", words);
    io.to(socketData.socketId).emit("update_game_rules", gameRules);
}

async function refreshGameboardEvent(io, socketData) {
    try {
        await refreshGameboardRateLimiter.consume(socketData.userId);
    }
    catch (rejRes) {
        io.to(socketData.socketId).emit("error_message", { 
            error_code: "action_rate_limit", 
            error: `You are being rate limited. Retry after ${rejRes.msBeforeNext}ms.`,
            retry_ms: rejRes.msBeforeNext
        });
        return;
    }

    const room = new RoomContext(socketData.roomId);

    if (!checkPermissions(room, socketData.userCodenamesId, Permissions.HOST)) {
        return;
    }

    let gameRules = await room.getGameRules();

    const newCardsAmount = totalCards(gameRules);
    if (newCardsAmount > gameRules.maxCards) {
        io.to(socketData.socketId).emit("error_message", { error_code: "card_amount_overflow", error: "Distributed card amount is larger that max cards amount." });
        return;
    } 
    await getNewWords(room);

    io.to(socketData.roomId).emit("request_new_gameboard");
}

module.exports = {
    getGameboardEvent,
    refreshGameboardEvent
};