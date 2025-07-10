// @ts-check
const {
    shuffle
} = require("../../../utils/extra");

let io = null;

async function updateTeamOrder(room) {
    let gameRules = await room.getGameRules();
    
    if (gameRules.teamAmount !== gameRules.teamOrder.length) {
        if (gameRules.teamAmount === 2) {
            gameRules.teamOrder = ["red", "green"];
        }
        else if (gameRules.teamAmount === 3) {
            gameRules.teamOrder = ["red", "blue", "green"];
        }
        else {
            gameRules.teamOrder = ["red", "yellow", "blue", "green"];
        }
    }
    shuffle(gameRules.teamOrder);

    let gameProcess = await room.getGameProcess();
    gameProcess.currentTurn = gameRules.teamOrder[0];
    await room.setGameRules(gameRules);
    await room.setGameProcess(gameProcess);
}

async function updateUser(room, newUser) {
    let users = await room.getUsers();
    let teams = await room.getTeams();

    const objIndex = users.findIndex((obj) => obj.id === newUser.id);
    users[objIndex] = newUser;
    ["red", "yellow", "blue", "green"].forEach((color) => {
        const index = teams[color].team.findIndex((player) => player.id === newUser.id);
        if (teams[color].master?.id === newUser.id) {
            teams[color].master = newUser;
        } else if (index !== -1) {
            teams[color].team[index] = newUser;
        }
    });

    if (!newUser.online && newUser.state.teamColor === "spectator") {
        users = users.filter((user) => user.online || user.host || user.state.teamColor !== "spectator");
    }

    await room.setUsers(users);
    await room.setTeams(teams);
}

async function passTurn(room) {
    await clearTimer(room);

    let gameRules = await room.getGameRules();
    let gameProcess = await room.getGameProcess();

    gameProcess.selectionIsGoing = false;
    gameProcess.guessesCount = 0;

    let notBlacklisted = "";
    let blacklistedCnt = 0;
    gameRules.teamOrder.forEach((color) => {
        if (gameProcess.blacklisted[color]) {
            blacklistedCnt++;
        } else {
            notBlacklisted = color;
        }
    });
    if (blacklistedCnt === gameRules.teamAmount - 1) {
        await processWin(room, notBlacklisted);
        return;
    }

    const startedFrom = gameProcess.currentTurn;
    const teamAmount = gameRules.teamOrder.length;
    let index = (gameRules.teamOrder.indexOf(startedFrom) + 1) % teamAmount;
    do {
        if (!gameProcess.blacklisted[gameRules.teamOrder[index]]) {
            gameProcess.currentTurn = gameRules.teamOrder[index];

            await room.setGameProcess(gameProcess);
            return;
        }
        index = (index + 1) % teamAmount;
    } while (gameRules.teamOrder[index] !== startedFrom);
    if (gameProcess.blacklisted[startedFrom]) {
        await processWin(room, "tie");
    } else {
        await processWin(room, startedFrom);
    }
}

async function processWin(room, winner) {
    let gameProcess = await room.getGameProcess();
    gameProcess.selectionIsGoing = false;
    gameProcess.isGoing = false;

    await room.setGameProcess(gameProcess);

    io.to(room.roomId).emit("update_game_process", gameProcess);

    let gameRules = await room.getGameRules();
    let gameWinStatus = await room.getGameWinStatus();
    let words = await room.getWords();

    gameRules.locked = false;
    
    gameWinStatus.gameIsEnded = true;
    gameWinStatus.winner = winner;
    for (let i = 0; i < gameRules.maxCards; i++) {
        words[i].hiddenColor = words[i].color;
    }

    await room.setGameRules(gameRules);
    await room.setGameWinStatus(gameWinStatus);
    await room.setWords(words);

    let traitors = await room.getTraitors();

    io.to(room.roomId).emit("update_game_rules", gameRules);
    io.to(room.roomId).emit("end_game", gameWinStatus, traitors);
}

async function clearTimer(room) {
    let gameRules = await room.getGameRules();
    let gameProcess = await room.getGameProcess();

    if (gameProcess.isFirstTurn) {
        gameProcess.isFirstTurn = false;
        gameProcess.timeLeft = gameRules.firstMasterTurnTime;
    } else {
        gameProcess.timeLeft = gameRules.masterTurnTime;
    }
    if (gameProcess.timeLeft === 0) {
        gameProcess.infiniteTime = true;
    } else {
        gameProcess.infiniteTime = false;
    }
    gameProcess.masterTurn = true;
    gameProcess.teamTimeStarted = false;

    await room.setGameProcess(gameProcess);
}

async function updateGameTimer(room, interval = 1) {
    let gameRules = await room.getGameRules();
    let gameProcess = await room.getGameProcess();

    if (gameRules.freezeTime || gameProcess.infiniteTime) {
        return false;
    }
    gameProcess.timeLeft -= interval;
    if (gameProcess.timeLeft <= 0) {
        if (gameProcess.teamTimeStarted) {
            await room.setGameProcess(gameProcess);

            return true;
        }
        gameProcess.timeLeft = gameRules.teamTurnTime;
        if (gameProcess.timeLeft === 0) {
            gameProcess.infiniteTime = true;
        } else {
            gameProcess.infiniteTime = false;
        }
        gameProcess.teamTimeStarted = true;
    }
    await room.setGameProcess(gameProcess);

    return false;
}

async function removeAllPlayers(room, withMasters) {
    let users = await room.getUsers();
    let teams = await room.getTeams();

    ["red", "yellow", "blue", "green"].forEach((color) => {
        if (withMasters && teams[color].master) {
            const masterId = teams[color].master.id;
            const masterIndex = users.findIndex((user) => user.id === masterId);
            users[masterIndex].state.teamColor = "spectator";
            users[masterIndex].state.master = false;
            teams[color].master = null;
        }
        if (Array.isArray(teams[color].team)) {
            teams[color].team.forEach((player) => {
                const playerId = player.id;
                const playerIndex = users.findIndex((user) => user.id === playerId);
                users[playerIndex].state.teamColor = "spectator";
                users[playerIndex].state.master = false;
            });
        }
        teams[color].team = [];
    });

    users = users.filter((user) => user.online || user.host || user.state.teamColor !== "spectator");

    await room.setUsers(users);
    await room.setTeams(teams);
}

async function removePlayer(room, playerId) {
    let users = await room.getUsers();
    let teams = await room.getTeams();

    const index = users.findIndex((user) => user.id === playerId);
    if (index === -1) {
        return;
    }
    const color = users[index].state.teamColor;
    if (color === "spectator") {
        return;
    }
    users[index].state.teamColor = "spectator";
    users[index].state.master = false;
    if (teams[color].master?.id === playerId) {
        teams[color].master = null;
    } else {
        teams[color].team = teams[color].team.filter((user) => user.id !== playerId);
    }

    users = users.filter((user) => user.online || user.host || user.state.teamColor !== "spectator");

    await room.setUsers(users);
    await room.setTeams(teams);
}

async function randomizePlayers(room, withMasters = true) {
    let users = await room.getUsers();
    let teams = await room.getTeams();
    let gameRules = await room.getGameRules();
    
    const allPlayers = [];

    for (const [color, teamData] of Object.entries(teams)) {
        allPlayers.push(...teamData.team);
        if (withMasters) {
            if (teamData.master) {
                allPlayers.push(teamData.master);
            }
            teams[color].master = null;
        }
        teams[color].team = [];
    }

    shuffle(allPlayers);

    const colors = gameRules.teamOrder.slice();

    let n = allPlayers.length;
    const k = colors.length;

    function updateColors(players, isMaster = false) {
        if (!Array.isArray(players)) {
            return;
        }

        players.forEach((player, index, newArray) => {
            newArray[index].state.teamColor = colors[index];
            newArray[index].state.master = isMaster;
            const userIndex = users.findIndex((user) => user.id === player.id);
            if (userIndex !== -1) {
                users[userIndex].state.teamColor = colors[index];
                users[userIndex].state.master = isMaster;
            }
        });
    }

    async function saveData() {
        await room.setUsers(users);
        await room.setTeams(teams);
    }

    if (withMasters) {
        const players = allPlayers.splice(0, k);
        if (players.length < k) {
            shuffle(colors);
        }
        updateColors(players, true);
        colors.forEach((color, index) => {
            if (index >= players.length) {
                return;
            }
            teams[color].master = players[index];
        });
        n -= k;
        if (n <= 0) {
            await saveData();
            return;
        }
    }

    while (n >= k) {
        const players = allPlayers.splice(0, k);
        updateColors(players, false);
        colors.forEach((color, index) => {
            teams[color].team.push(players[index]);
        });
        n -= k;
    }

    const players = allPlayers.splice(0, n);
    shuffle(colors);
    updateColors(players, false);
    colors.forEach((color, index) => {
        if (index >= players.length) {
            return;
        }
        teams[color].team.push(players[index]);
    });

    await saveData();
}

async function transferHost(room, hostId, playerId) {
    let users = await room.getUsers();
    let teams = await room.getTeams();

    const hostIndex = users.findIndex((user) => user.id === hostId);
    const playerIndex = users.findIndex((user) => user.id === playerId);
    if (hostIndex === -1 || playerIndex === -1) {
        return;
    }
    const hostColor = users[hostIndex].state.teamColor;
    const playerColor = users[playerIndex].state.teamColor;
    users[hostIndex].host = false;
    users[playerIndex].host = true;
    if (hostColor !== "spectator") {
        if (teams[hostColor].master?.id === hostId) {
            teams[hostColor].master.host = false;
        } else {
            const hostIndexInTeam = teams[hostColor].team.findIndex((user) => user.id === hostId);
            if (hostIndexInTeam !== -1) {
                teams[hostColor].team[hostIndexInTeam].host = false;
            }
        }
    }
    if (playerColor !== "spectator") {
        if (teams[playerColor].master?.id === playerId) {
            teams[playerColor].master.host = true;
        } else {
            const playerIndexInTeam = teams[playerColor].team.findIndex((user) => user.id === playerId);
            if (playerIndexInTeam !== -1) {
                teams[playerColor].team[playerIndexInTeam].host = true;
            }
        }
    }

    await room.setUsers(users);
    await room.setTeams(teams);
}

module.exports = {
    init(DIContainer) {
        io = DIContainer.io;
    },
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
};