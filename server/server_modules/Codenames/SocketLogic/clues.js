// @ts-check
const RoomContext = require("../db/roomContext");

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

async function sendClueEvent(io, socketData, clueText, teamColor) {
    let result = clueTextZodSchema.safeParse(clueText);
    if (!result.success) {
        console.log("Zod error:", result.error);
        return;
    }
    clueText = result.data;
    result = validTeamColorZodSchema.safeParse(teamColor);
    if (!result.success) {
        console.log("Zod error:", result.error);
        return;
    }
    teamColor = result.data;
    
    const room = new RoomContext(socketData.roomId);

    if (!(await checkPermissions(room, socketData.userCodenamesId, Permissions.MASTER))) {
        return;
    }
    
    let clueIDCounter = await room.getClueIDCounter();
    let gameRules = await room.getGameRules();
    let gameProcess = await room.getGameProcess();

    const newClue = {
        id: clueIDCounter++,
        text: clueText
    };

    await room.addNewClue(teamColor, newClue);

    gameProcess.masterTurn = false;
    if (!gameProcess.teamTimeStarted) {
        gameProcess.teamTimeStarted = true;
        gameProcess.timeLeft = gameRules.teamTurnTime;
        if (gameProcess.timeLeft === 0) {
            gameProcess.infiniteTime = true;
        } else {
            gameProcess.infiniteTime = false;
        }
    }
    
    await room.setClueIDCounter(clueIDCounter);
    await room.setGameProcess(gameProcess);
    
    io.to(socketData.roomId).emit("update_game_process", gameProcess);

    const clues = await room.getClues();

    io.to(socketData.roomId).emit("update_clues", clues);
}

async function editClueEvent(io, socketData, newClue) {
    let result = clueZodSchema.safeParse(newClue);
    if (!result.success) {
        console.log("Zod error:", result.error);
        return;
    }
    newClue = result.data;
    
    const room = new RoomContext(socketData.roomId);
    
    if (!(await checkPermissions(room, socketData.userCodenamesId, Permissions.HOST))) {
        return;
    }

    await room.updateClueByID(newClue.id, newClue);

    const clues = await room.getClues();

    io.to(socketData.roomId).emit("update_clues", clues);
}

async function getCluesEvent(io, socketData) {
    const room = new RoomContext(socketData.roomId);

    const clues = await room.getClues();

    io.to(socketData.socketId).emit("update_clues", clues);
}

module.exports = {
    sendClueEvent,
    editClueEvent,
    getCluesEvent
};