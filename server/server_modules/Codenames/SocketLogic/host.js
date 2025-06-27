// @ts-check
const z = require("zod/v4");

const RoomContext = require("../db/roomContext");

const {
    Permissions
} = require("../utils/constants");
const {
    refreshGameboardRateLimiter
} = require("../utils/rateLimiters");

const DIContainer = require("../GameLogic/container");
const {
    checkPermissions
} = DIContainer.modules.permissionsValidation;
const {
    clearAllSelections
} = DIContainer.modules.words;
const {
    passTurn,
    removeAllPlayers,
    removePlayer,
    randomizePlayers,
    transferHost,
    updateTeamOrder
} = DIContainer.modules.gameManager;
const {
    getNewWords
} = DIContainer.modules.gameboard;

const {
    totalCards
} = require("../utils/helpers");

const {
    validTeamColorZodSchema,
    validPlayerTeamColorZodSchema,
    validWordColorZodSchema,
    packIdZodSchema,
    gameRulesZodSchemaNonStrict,
    gameRulesZodSchemaStrict,
    clueTextZodSchema,
    clueZodSchema,
    playerIdZodSchema,
    playerZodSchema,
    wordZodSchema,
    chatMessageZodSchema
} = require("../ZodSchemas/codenamesZodSchemas");

// Requires mutex!!!
async function setNewGameRulesEvent(io, socketData, newGameRules) {
    let result = gameRulesZodSchemaNonStrict.safeParse(newGameRules);
    if (!result.success) {
        console.log("Zod error:", result.error);
        return;
    }
    newGameRules = result.data;

    const room = new RoomContext(socketData.roomId);
    
    if (!(await checkPermissions(room, socketData.userCodenamesId, Permissions.HOST))) {
        return;
    }

    let gameRules = await room.getGameRules();

    const oldTeamAmount = gameRules.teamAmount;
    if (oldTeamAmount < newGameRules.teamAmount) {
        if (oldTeamAmount === 2) {
            if (newGameRules.teamAmount >= 3) {
                newGameRules.teamOrder.push("blue");
            }
            if (newGameRules.teamAmount >= 4) {
                newGameRules.teamOrder.push("yellow");
            }
        } else if (oldTeamAmount === 3) {
            if (newGameRules.teamAmount >= 4) {
                newGameRules.teamOrder.push("yellow");
            }
        }
    } else if (oldTeamAmount > newGameRules.teamAmount) {
        if (oldTeamAmount === 4) {
            if (newGameRules.teamAmount <= 3) {
                newGameRules.teamOrder = newGameRules.teamOrder.filter((color) => color !== "yellow");
            }
            if (newGameRules.teamAmount <= 2) {
                newGameRules.teamOrder = newGameRules.teamOrder.filter((color) => color !== "blue");
            }
        } else if (oldTeamAmount === 3) {
            if (newGameRules.teamAmount <= 2) {
                newGameRules.teamOrder = newGameRules.teamOrder.filter((color) => color !== "blue");
            }
        }
    }
    
    gameRules = newGameRules;
    switch(gameRules.fieldSize) {
        case "5x5":
            gameRules.maxCards = 25;
            break;
        case "5x6":
            gameRules.maxCards = 30;
            break;
        case "6x6":
            gameRules.maxCards = 36;
            break;
        case "6x7":
            gameRules.maxCards = 42;
            break;
        case "7x7":
            gameRules.maxCards = 49;
            break;
    }

    await room.setGameRules(gameRules);

    io.to(room.roomId).emit("update_game_rules", gameRules);
};

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

    if (!(await checkPermissions(room, socketData.userCodenamesId, Permissions.HOST))) {
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

async function randomizeTeamOrderEvent(io, socketData) {
    const room = new RoomContext(socketData.roomId);

    if (!(await checkPermissions(room, socketData.userCodenamesId, Permissions.HOST))) {
        return;
    }

    await updateTeamOrder(room);
    
    let gameRules = await room.getGameRules();
    
    io.to(socketData.roomId).emit("update_game_rules", gameRules);
};

async function passTurnEvent(io, socketData) {
    const room = new RoomContext(socketData.roomId);

    if (!(await checkPermissions(room, socketData.userCodenamesId, Permissions.HOST))) {
        return;
    }
    
    let users = await room.getUsers();
    let teams = await room.getTeams();

    await clearAllSelections(room);
    await passTurn(room);

    let gameProcess = await room.getGameProcess();

    io.to(socketData.roomId).emit("update_game_process", gameProcess);
    io.to(socketData.roomId).emit("request_new_gameboard");
    io.to(socketData.roomId).emit("update_users", teams, users);
};

async function removeAllPlayersEvent(io, socketData, withMasters) {
    let result = z.boolean().safeParse(withMasters);
    if (!result.success) {
        console.log("Zod error:", result.error);
        return;
    }
    withMasters = result.data;
    
    const room = new RoomContext(socketData.roomId);

    if (!(await checkPermissions(room, socketData.userCodenamesId, Permissions.HOST))) {
        return;
    }

    await removeAllPlayers(room, withMasters);

    let users = await room.getUsers();
    let teams = await room.getTeams();

    io.to(socketData.roomId).emit("update_users", teams, users);
};

async function removePlayerEvent(io, socketData, playerId) {
    let result = playerIdZodSchema.safeParse(playerId);
    if (!result.success) {
        console.log("Zod error:", result.error);
        return;
    }
    playerId = result.data;
    
    const room = new RoomContext(socketData.roomId);
    
    if (!(await checkPermissions(room, socketData.userCodenamesId, Permissions.HOST))) {
        return;
    }

    await removePlayer(room, playerId);

    let users = await room.getUsers();
    let teams = await room.getTeams();

    io.to(socketData.roomId).emit("update_users", teams, users);
};

async function randomizePlayersEvent(io, socketData, withMasters) {
    let result = z.boolean().safeParse(withMasters);
    if (!result.success) {
        console.log("Zod error:", result.error);
        return;
    }
    withMasters = result.data;
    
    const room = new RoomContext(socketData.roomId);
    
    if (!(await checkPermissions(room, socketData.userCodenamesId, Permissions.HOST))) {
        return;
    }

    await randomizePlayers(room, withMasters);

    let users = await room.getUsers();
    let teams = await room.getTeams();

    io.to(socketData.roomId).emit("update_users", teams, users);
};

async function transferHostEvent(io, socketData, playerId) {
    let result = playerIdZodSchema.safeParse(playerId);
    if (!result.success) {
        console.log("Zod error:", result.error);
        return;
    }
    playerId = result.data;
    
    const room = new RoomContext(socketData.roomId);
    
    if (!(await checkPermissions(room, socketData.userCodenamesId, Permissions.HOST))) {
        return;
    }

    await transferHost(room, socketData.userCodenamesId, playerId);

    let users = await room.getUsers();
    let teams = await room.getTeams();

    io.to(socketData.roomId).emit("update_users", teams, users);
};

module.exports = {
    setNewGameRulesEvent,
    refreshGameboardEvent,
    randomizeTeamOrderEvent,
    passTurnEvent,
    removeAllPlayersEvent,
    removePlayerEvent,
    randomizePlayersEvent,
    transferHostEvent
};