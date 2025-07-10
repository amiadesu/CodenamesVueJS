// @ts-check
const {
    updateTeamOrder,
    clearTimer
} = require("./gameManager");
const {
    getNewWords
} = require("./gameboard");
const {
    randChoice
} = require("../../../utils/extra");

async function clearRoles(room) {
    await room.setTraitors([]);
}

async function setupGamemode(room) {
    let gameRules = await room.getGameRules();

    if (gameRules.game_mode === "traitor") {
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
    let gameRules = await room.getGameRules();
    let gameProcess = await room.getGameProcess();

    gameRules.locked = true;

    // Maybe this needs to be changed if there will be complains
    gameRules.freezeTime = false;
    gameProcess.infiniteTime = false;

    gameProcess.selectionIsGoing = false;
    gameProcess.isFirstTurn = true;
    gameProcess.isGoing = true;
    gameProcess.guessesCount = 0;
    let clueIDCounter = 0;
    let gameWinStatus = {
        gameIsEnded: false,
        winner: ""
    };
    let clues = {
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