// @ts-check
const RoomContext = require("../db/roomContext");

const {
    Permissions
} = require("../utils/constants");

const DIContainer = require("../GameLogic/container");
const {
    getUserTeamPermissions,
} = DIContainer.modules.permissionsValidation;
const {
    getGameboard
} = DIContainer.modules.gameboard;
const {
    revealWord
} = DIContainer.modules.words;
const {
    toggleWord
} = DIContainer.modules.wordHelpers

async function getGameboardEvent(io, socketData) {
    const room = new RoomContext(socketData.roomId);

    const words = await getGameboard(room, socketData.userCodenamesId);

    const gameRules = await room.getGameRules();

    io.to(socketData.socketId).emit("send_new_gameboard", words);
    io.to(socketData.socketId).emit("update_game_rules", gameRules);
}

async function selectWordEvent(io, socketData, selectedWordText) { 
    const room = new RoomContext(socketData.roomId);
    
    let words = await room.getWords();
    if (!words.some((word) => word.text === selectedWordText) && selectedWordText !== "endTurn") {
        console.log("Invalid word was selected:", selectedWordText);
        return;
    }
    
    let users = await room.getUsers();
    const gameProcess = await room.getGameProcess();

    const selecterIndex = users.findIndex((obj) => obj.id === socketData.userCodenamesId);

    if (users[selecterIndex].state.teamColor !== gameProcess.currentTurn) {
        return;
    }

    await toggleWord(room, selectedWordText, selecterIndex, socketData.countdownInterval);

    let gameRules = await room.getGameRules();
    words = await room.getWords();

    async function shouldRevealWord() {
        const teams = await room.getTeams();
        const words = await room.getWords();
        const gameProcess = await room.getGameProcess();

        const wordObjectIndex = words.findIndex((word) => word.text === selectedWordText);
        let selectors = null;
        if (wordObjectIndex === -1) {
            selectors = await room.getEndTurnSelectors();
        } else {
            selectors = words[wordObjectIndex].selectedBy;
        }

        return selectors.length === teams[gameProcess.currentTurn].team.length && selectors.length !== 0;
    }

    async function notifyClient() {
        const teams = await room.getTeams();
        const users = await room.getUsers();
        const endTurnSelectors = await room.getEndTurnSelectors();
        const gameRules = await room.getGameRules();
        const gameProcess = await room.getGameProcess();
        const selecterIndex = users.findIndex((obj) => obj.id === socketData.userCodenamesId);
        io.to(socketData.roomId).emit("request_new_gameboard");
        io.to(socketData.roomId).emit("update_game_process", gameProcess);
        io.to(socketData.roomId).emit("update_users", teams, users);
        io.to(socketData.socketId).emit("update_client", teams, users, users[selecterIndex], endTurnSelectors, gameRules, gameProcess);
    }

    if (await shouldRevealWord()) {
        io.to(socketData.roomId).emit("start_countdown", selectedWordText);
        if (socketData.countdownInterval) {
            clearInterval(socketData.countdownInterval);
        }
        let timer = gameRules.countdownTime;
        let freezed = false;
        socketData.countdownInterval = setInterval(async () => {
            timer -= 0.01;

            if (timer <= 0 && !freezed) {
                freezed = true;
                timer = 0;
                io.to(socketData.roomId).emit("stop_countdown");
                if (await shouldRevealWord()) {
                    await revealWord(room, selectedWordText);
                    await notifyClient();
                }
                clearInterval(socketData.countdownInterval);
            }

            io.to(socketData.roomId).emit("update_countdown", 1 - timer / gameRules.countdownTime);
        }, 10);
    } else {
        clearInterval(socketData.countdownInterval);
        io.to(socketData.roomId).emit("stop_countdown");
    }

    await notifyClient();
};

async function processClickEvent(io, socketData, clickedWordText) {
    const room = new RoomContext(socketData.roomId);

    let words = await room.getWords();
    if (!words.some((word) => word.text === clickedWordText)) {
        console.log("Invalid word was selected:", clickedWordText);
        return;
    }

    const userTeamPermissionsLevel = await getUserTeamPermissions(room, socketData.userCodenamesId);

    if (userTeamPermissionsLevel === Permissions.MASTER) {
        return;
    }
    
    io.to(socketData.roomId).emit("click_word", clickedWordText, socketData.userCodenamesId);
};

module.exports = {
    getGameboardEvent,
    selectWordEvent,
    processClickEvent
};