// @ts-check
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
} = require("./gameManager");
const {
    getWordsFromPack,
    getWordsForRoom,
    getNewWords,
    getGameboard
} = require("./gameboard");
const {
    isObject,
    makeID,
    makeColor,
    randChoice,
    shuffle
} = require("../../../utils/extra");

async function clearRoles(room) {
    // let users = await getCodenamesRoomData(roomId, "users");
    // let teams = await getCodenamesRoomData(roomId, "teams");
    // let traitors = await getCodenamesRoomData(roomId, "traitors");

    await room.setTraitors([]);

    // for (let i = 0; i < users.length; i++) {
    //     ["red", "yellow", "blue", "green"].forEach((color) => {
    //         const index = teams[color].team.findIndex((player) => player.id === users[i].id);;
    //         if (teams[color].master?.id === users[i].id) {
    //             teams[color].master = users[i];
    //         } else if (index !== -1) {
    //             teams[color].team[index] = users[i];
    //         }
    //     });
    // };

    // await setCodenamesRoomData(roomId, "users", users);
    // await setCodenamesRoomData(roomId, "teams", teams);
}

async function setupGamemode(room) {
    let gameRules = await room.getGameRules();

    if (gameRules.game_mode === "traitor") {
        let users = await room.getUsers();
        let teams = await room.getTeams();
        let traitors = await room.getTraitors();

        ["red", "yellow", "blue", "green"].forEach((color) => {
            const selectedPlayer = randChoice(teams[color].team);
            if (selectedPlayer) {
                traitors.push(selectedPlayer);
            }
        });

        await room.setTraitors(traitors);
    }
}

async function startNewGame(room, randomizeTeamOrder, getNewGameboard) {
    let clueIDCounter = await room.getClueIDCounter();
    let gameRules = await room.getGameRules();
    let gameProcess = await room.getGameProcess();
    let clues = await room.getClues();
    let gameWinStatus = await room.getGameWinStatus();

    gameRules.locked = true;

    // Maybe this needs to be changed if there will be complains
    gameRules.freezeTime = false;
    gameProcess.infiniteTime = false;

    gameProcess.selectionIsGoing = false;
    gameProcess.isFirstTurn = true;
    gameProcess.isGoing = true;
    gameProcess.guessesCount = 0;
    clueIDCounter = 0;
    gameWinStatus = {
        gameIsEnded: false,
        winner: ""
    };
    clues = {
        "red" : [],
        "yellow" : [],
        "blue" : [],
        "green" : []
    };
    gameProcess.blacklisted = {
        "red" : false,
        "yellow" : false,
        "blue" : false,
        "green" : false
    };

    await room.setClueIDCounter(clueIDCounter);
    await room.setGameRules(gameRules);
    await room.setGameProcess(gameProcess);
    await room.setClues(clues);
    await room.setGameWinStatus(gameWinStatus);

    await clearRoles(room);
    await setupGamemode(room);
    if (randomizeTeamOrder) {
        await updateTeamOrder(room);
    }
    if (getNewGameboard) {
        await getNewWords(room);
    }
    await clearTimer(room);
}

module.exports = {
    clearRoles,
    setupGamemode,
    startNewGame
};