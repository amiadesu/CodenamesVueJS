// @ts-check
const z = require("zod/v4");

const RoomContext = require("../db/roomContext");

const {
    Permissions
} = require("../utils/constants");
const {
    startNewGameRateLimiter
} = require("../utils/rateLimiters");

const DIContainer = require("../GameLogic/container");
const {
    validateUser,
    checkPermissions
} = DIContainer.modules.permissionsValidation;
const {
    updateTeamOrder,
    updateUser,
    passTurn,
    processWin,
    clearTimer,
    updateGameTimer,
    removeAllPlayers,
    removePlayer,
    randomizePlayers,
    transferHost
} = DIContainer.modules.gameManager;
const {
    clearRoles,
    setupGamemode,
    startNewGame
} = DIContainer.modules.gameSetup;
const {
    wordAutoselect
} = DIContainer.modules.words;

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

async function startNewGameEvent(io, socketData, randomizeTeamOrder, getNewGameboard) {
    try {
        await startNewGameRateLimiter.consume(socketData.userId);
    }
    catch (rejRes) {
        io.to(socketData.socketId).emit("error_message", { 
            error_code: "action_rate_limit", 
            error: `You are being rate limited. Retry after ${rejRes.msBeforeNext}ms.`,
            retry_ms: rejRes.msBeforeNext
        });
        return;
    }

    let result = z.boolean().safeParse(randomizeTeamOrder);
    if (!result.success) {
        console.log("Zod error:", result.error);
        return;
    }
    randomizeTeamOrder = result.data;
    result = z.boolean().safeParse(getNewGameboard);
    if (!result.success) {
        console.log("Zod error:", result.error);
        return;
    }
    getNewGameboard = result.data;
    
    const room = new RoomContext(socketData.roomId);
    
    if (!(await checkPermissions(room, socketData.userCodenamesId, Permissions.HOST))) {
        return;
    }

    let gameRules = await room.getGameRules();
    let resultGameRules = gameRulesZodSchemaStrict.safeParse(gameRules);
    if (!resultGameRules.success) {
        console.log("Zod error:", result.error);
        io.to(socketData.socketId).emit("error_message", { error_code: "invalid_game_rules", error: "Game rules object is invalid." });
        return;
    }



    gameRules = await room.getGameRules();
    let gameProcess = await room.getGameProcess();

    if (gameProcess.isGoing) {
        clearInterval(socketData.timerInterval);
        await processWin(room, "tie");
    } else {
        const newCardsAmount = totalCards(gameRules);
        if (newCardsAmount > gameRules.maxCards) {
            io.to(socketData.socketId).emit("error_message", { error_code: "card_amount_overflow", error: "Distributed card amount is larger that max cards amount." });
            return;
        } 

        await startNewGame(room, randomizeTeamOrder, getNewGameboard);

        gameRules = await room.getGameRules();

        io.to(room.roomId).emit("update_game_rules", gameRules);

        let gameWinStatus = await room.getGameWinStatus();
        io.to(room.roomId).emit("start_game", gameWinStatus);
        io.to(room.roomId).emit("setup_new_game");
        
        if (socketData.timerInterval) {
            clearInterval(socketData.timerInterval);
        }
        socketData.timerInterval = setInterval(async () => {
            const stopTimer = await updateGameTimer(room, 0.5);
            if (stopTimer) {
                let users = await room.getUsers();
                let teams = await room.getTeams();

                const selectedSomething = await wordAutoselect(room);
                const gp = await room.getGameProcess();
                io.to(room.roomId).emit("update_game_process", gp);
                io.to(room.roomId).emit("request_new_gameboard");
                io.to(room.roomId).emit("update_users", teams, users);
                if (!selectedSomething) {
                    await passTurn(room);
                }
            }
            const gameProcess = await room.getGameProcess();
            if (!gameProcess.isGoing) {
                clearInterval(socketData.timerInterval);
            }
            io.to(room.roomId).emit("update_game_process", gameProcess);
        }, 500);
    }

    gameProcess = await room.getGameProcess();

    io.to(room.roomId).emit("update_game_process", gameProcess);

    const clues = await room.getClues();

    io.to(socketData.roomId).emit("update_clues", clues);

    io.to(room.roomId).emit("request_new_gameboard");
};

async function getTraitorsEvent(io, socketData) {
    const room = new RoomContext(socketData.roomId);

    let users = await room.getUsers();
    let traitors = await room.getTraitors();

    const objIndex = users.findIndex((obj) => obj.id === socketData.userCodenamesId);
    if (objIndex !== -1 && users[objIndex].state.master === true) {
        traitors = traitors.filter((traitor) => traitor.state.teamColor !== users[objIndex].state.teamColor);
    } else if (traitors.some((traitor) => traitor.id === socketData.userCodenamesId)) {
        traitors = traitors.filter((traitor) => traitor.id === socketData.userCodenamesId);
    } else {
        traitors = [];
    }
    
    io.to(socketData.socketId).emit("update_traitors", traitors);
};

module.exports = {
    startNewGameEvent,
    getTraitorsEvent
};