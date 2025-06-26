const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

let words = [];

const fs = require('node:fs');
try {
    const data = fs.readFileSync('./words.txt', 'utf8');
    words = data.split("\r\n");
    console.log(words);
} catch (err) {
    console.error(err);
}

const app = express();
const corsOptions = {
    origin: 'http://localhost:5173',
    methods: ["GET", "POST"], 
    credentials: true,            //access-control-allow-credentials:true
    optionSuccessStatus: 200
};
app.use(cors(corsOptions));
const server = http.createServer(app);
const globalio = new Server(server, {
    path: "/codenames",
    cors: corsOptions
});
const io = globalio.of("/codenames");
// const io = globalio;

app.get("/", (req, res, next) => {
    res.send("Poshel nahui.");
});

const defaultData = {
    counter : 0,
    users : [],
    currentWords : [],
    hiddenWords : [],
    gameRules : {
        teamAmount: 2,
        maximumPlayers: 4,
        teamOrder: ["red", "green"],
        countdownTime: 0.5,
        firstMasterTurnTime: 12,
        masterTurnTime: 6,
        teamTurnTime: 6,
        extraTime: 15,
        freezeTime: false,
        limitedGuesses: true,
        guessesLimit: 5,
        baseCards: 7,
        extraCards: [3, 2, 1, 0],
        blackCards: 1,
        maxCards: 36,
        fieldSize: "6x6"
    },
    teams : {
        "red" : {
            master: null,
            team: []
        },
        "yellow" : {
            master: null,
            team: []
        },
        "blue" : {
            master: null,
            team: []
        },
        "green" : {
            master: null,
            team: []
        }
    },
    gameProcess : {
        isGoing: false,
        wordsCount: {
            "red": 10,
            "yellow": 0,
            "blue": 0,
            "green": 9,
            "white": 0,
            "black": 0
        },
        clues: {
            "red" : [],
            "yellow" : [],
            "blue" : [],
            "green" : []
        },
        currentTurn: "red",
        guessesCount: 0,
        isFirstTurn: true,
        masterTurn: true,
        timeLeft: 3599,
        teamTimeStarted: false,
        infiniteTime: false,
        blacklisted: {
            "red" : false,
            "yellow" : false,
            "blue" : false,
            "green" : false
        },
        endTurnSelected: []
    },
    countdownInterval : null,
    gameWinStatus : {
        gameIsEnded: false,
        winner: ""
    }
};

const roomsData = {
    "default" : structuredClone(defaultData)
};

function createRoom(roomId) {
    if (roomId in roomsData) {
        return;
    }
    roomsData[roomId] = structuredClone(defaultData);
}

function getRoomData(roomId, key) {
    if (!(key in roomsData["default"])) {
        console.log("Invalid key given: ", key);
        return;
    }
    return roomsData[roomId][key];
}

function setRoomData(roomId, key, object) {
    if (!(key in roomsData["default"])) {
        console.log("Invalid key given: ", key);
        return;
    }
    roomsData[roomId][key] = object;
}

function makeID(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}

function makeColor() {
    return '#' + (Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0');
}

function shuffle(array) {
    if (array.length === 1) {
        return;
    }

    if (array.length === 2) {
        [array[0], array[1]] = [array[1], array[0]];
        return;
    }

    let currentIndex = array.length;
    // const oldArray = [...array];
  
    // do {
    //     // While there remain elements to shuffle...
    //     while (currentIndex != 0) {
    
    //         // Pick a remaining element...
    //         let randomIndex = Math.floor(Math.random() * currentIndex);
    //         currentIndex--;
        
    //         // And swap it with the current element.
    //         [array[currentIndex], array[randomIndex]] = [
    //         array[randomIndex], array[currentIndex]];
    //     }
    // } while (array.every((val, index) => val === oldArray[index]));

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

        // Pick a remaining element...
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
    
        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
}

function getNewWords(roomId) {
    shuffle(words);

    let gameRules = getRoomData(roomId, "gameRules");
    let gameProcess = getRoomData(roomId, "gameProcess");
    let currentWords = getRoomData(roomId, "currentWords");
    let hiddenWords = getRoomData(roomId, "hiddenWords");

    const newWordsArray = words.splice(0, gameRules.maxCards);
    console.log(gameRules.maxCards, newWordsArray);
    const colors = gameRules.teamOrder.concat(["black", "white"]);
    const amount = {
        "red": 10,
        "yellow": 0,
        "blue": 0,
        "green": 9,
        "white": 0,
        "black": 1
    };

    let extraIndex = 0;
    let currentAmount = gameRules.baseCards + gameRules.extraCards[extraIndex];
    let total = 0;

    const newWords = [];
    colors.forEach((color) => {
        if (color === "white") {
            let count = 0;
            while (total < gameRules.maxCards) {
                newWords.push({
                    text: newWordsArray[total],
                    color: "white",
                    selectedBy: []
                });
                total++;
                count++;
            }
            amount["white"] = count;
        } else if (color === "black") {
            for (let i = 0; i < gameRules.blackCards; i++) {
                newWords.push({
                    text: newWordsArray[total],
                    color: "black",
                    selectedBy: []
                });
                total++;
            }
            amount[color] = gameRules.blackCards;
        } else {
            for (let i = 0; i < currentAmount; i++) {
                newWords.push({
                    text: newWordsArray[total],
                    color: color,
                    selectedBy: []
                });
                total++;
            }
            if (extraIndex < gameRules.teamAmount - 2) {
                extraIndex++;
            } else {
                extraIndex = 3;
            }
            amount[color] = currentAmount;
            currentAmount = gameRules.baseCards + gameRules.extraCards[extraIndex];
        }
    });

    // const newWords = newWordsArray.map((word) => {
    //     return {
    //         text: word,
    //         color: "white"
    //     };
    // });
    shuffle(newWords);
    gameProcess.wordsCount = amount;
    currentWords = newWords;
    hiddenWords = newWords.map((word) => {
        const clone = structuredClone(word);
        clone.color = "unknown";
        return clone;
    });

    setRoomData(roomId, "gameProcess", gameProcess);
    setRoomData(roomId, "currentWords", currentWords);
    setRoomData(roomId, "hiddenWords", hiddenWords);

    console.log(newWords);

    return newWords;
}

function updateTeamOrder(roomId) {
    let gameRules = getRoomData(roomId, "gameRules");
    let gameProcess = getRoomData(roomId, "gameProcess");
    
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
    gameProcess.currentTurn = gameRules.teamOrder[0];

    setRoomData(roomId, "gameRules", gameRules);
    setRoomData(roomId, "gameProcess", gameProcess);
}

function updateUser(roomId, newUser) {
    let users = getRoomData(roomId, "users");
    let teams = getRoomData(roomId, "teams");

    const objIndex = users.findIndex((obj) => obj.id === newUser.id);
    users[objIndex] = newUser;
    ["red", "yellow", "blue", "green"].forEach((color) => {
        const index = teams[color].team.findIndex((player) => player.id === newUser.id);;
        if (teams[color].master?.id === newUser.id) {
            teams[color].master = newUser;
        } else if (index !== -1) {
            teams[color].team[index] = newUser;
        }
    });

    setRoomData(roomId, "users", users);
    setRoomData(roomId, "teams", teams);
}

function getGameboard(roomId, userId) {
    let users = getRoomData(roomId, "users");

    const isMaster = users.some((user) => user.id === userId && user.state.master === true);
    if (isMaster) {
        let currentWords = getRoomData(roomId, "currentWords");
        return currentWords;
    }
    let hiddenWords = getRoomData(roomId, "hiddenWords");
    return hiddenWords;
}

function toggleWord(roomId, wordText, selecterIndex) {
    let users = getRoomData(roomId, "users");
    let gameProcess = getRoomData(roomId, "gameProcess");
    let currentWords = getRoomData(roomId, "currentWords");
    let hiddenWords = getRoomData(roomId, "hiddenWords");

    const wordObjectIndex = currentWords.findIndex((word) => word.text === wordText);
    const selecterId = users[selecterIndex].id;
    const selecterObject = {
        id: selecterId,
        color: users[selecterIndex].color
    };
    if (users[selecterIndex].state.selecting !== "" && users[selecterIndex].state.selecting !== wordText) {
        clearInterval(roomId, countdownInterval);
        toggleWord(roomId, users[selecterIndex].state.selecting, selecterIndex);
    }
    if (wordText === "endTurn") {
        const index = gameProcess.endTurnSelected.findIndex((selecter) => selecter.id === selecterId);
        if (index > -1) {
            gameProcess.endTurnSelected.splice(index, 1);
            users[selecterIndex].state.selecting = "";
        } else {
            gameProcess.endTurnSelected.push(selecterObject);
            users[selecterIndex].state.selecting = wordText;
        }
    }
    else if (wordObjectIndex !== -1) {
        const index = currentWords[wordObjectIndex].selectedBy.findIndex((selecter) => selecter.id === selecterId);
        if (index > -1) {
            currentWords[wordObjectIndex].selectedBy.splice(index, 1);
            hiddenWords[wordObjectIndex].selectedBy.splice(index, 1);
            users[selecterIndex].state.selecting = "";
        } else {
            currentWords[wordObjectIndex].selectedBy.push(selecterObject);
            hiddenWords[wordObjectIndex].selectedBy.push(selecterObject);
            users[selecterIndex].state.selecting = wordText;
        }
    }
    
    setRoomData(roomId, "users", users);
    setRoomData(roomId, "gameProcess", gameProcess);
    setRoomData(roomId, "currentWords", currentWords);
    setRoomData(roomId, "hiddenWords", hiddenWords);
}

function clearWord(roomId, wordText) {
    let users = getRoomData(roomId, "users");
    let gameProcess = getRoomData(roomId, "gameProcess");
    let currentWords = getRoomData(roomId, "currentWords");
    let hiddenWords = getRoomData(roomId, "hiddenWords");

    const data = {
        users, gameProcess, currentWords, hiddenWords
    }

    clearWordNoSave(wordText, data);
    
    setRoomData(roomId, "users", data.users);
    setRoomData(roomId, "gameProcess", data.gameProcess);
    setRoomData(roomId, "currentWords", data.currentWords);
    setRoomData(roomId, "hiddenWords", data.hiddenWords);
}

function clearWordNoSave(wordText, data) {
    if (wordText === "endTurn") {
        const selecters = data.gameProcess.endTurnSelected;
        selecters.forEach((selecter) => {
            const userIndex = data.users.findIndex((user) => user.id === selecter.id);
            data.users[userIndex].state.selecting = "";
        });
        data.gameProcess.endTurnSelected = [];
    } else {
        const wordObjectIndex = data.currentWords.findIndex((word) => word.text === wordText);
        if (wordObjectIndex === -1) {
            return;
        }
        const selecters = data.currentWords[wordObjectIndex].selectedBy;
        selecters.forEach((selecter) => {
            const userIndex = data.users.findIndex((user) => user.id === selecter.id);
            data.users[userIndex].state.selecting = "";
        });
        data.currentWords[wordObjectIndex].selectedBy = [];
        data.hiddenWords[wordObjectIndex].selectedBy = [];
    }
}

function revealWord(roomId, wordText) {
    if (wordText === "endTurn") {
        clearWord(roomId, wordText);
        passTurn(roomId);
        return;
    }

    let gameRules = getRoomData(roomId, "gameRules");
    let gameProcess = getRoomData(roomId, "gameProcess");
    let currentWords = getRoomData(roomId, "currentWords");
    let hiddenWords = getRoomData(roomId, "hiddenWords");

    gameProcess.guessesCount++;
    const wordObjectIndex = currentWords.findIndex((word) => word.text === wordText);
    hiddenWords[wordObjectIndex].color = currentWords[wordObjectIndex].color;
    clearWord(roomId, wordText);
    gameProcess.wordsCount[currentWords[wordObjectIndex].color]--;
    if (["red", "yellow", "blue", "green"].includes(currentWords[wordObjectIndex].color)) {
        if (gameProcess.wordsCount[currentWords[wordObjectIndex].color] === 0 && 
            !gameProcess.blacklisted[currentWords[wordObjectIndex].color]) {
            processWin(roomId, currentWords[wordObjectIndex].color);
        }
    }
    if (currentWords[wordObjectIndex].color === "black") {
        gameProcess.blacklisted[gameProcess.currentTurn] = true;
        passTurn(roomId);
    } else if (currentWords[wordObjectIndex].color !== gameProcess.currentTurn) {
        passTurn(roomId);
    } else {
        gameProcess.timeLeft = (gameProcess.timeLeft + gameRules.extraTime) % 3600;
        if (gameRules.limitedGuesses && gameProcess.guessesCount >= gameRules.guessesLimit) {
            passTurn(roomId);
        }
    }
    
    setRoomData(roomId, "gameProcess", gameProcess);
    setRoomData(roomId, "currentWords", currentWords);
    setRoomData(roomId, "hiddenWords", hiddenWords);
}

function wordAutoselect(roomId) {
    let teams = getRoomData(roomId, "teams");
    let gameProcess = getRoomData(roomId, "gameProcess");
    let currentWords = getRoomData(roomId, "currentWords");

    let total = gameProcess.endTurnSelected.length;
    let most = gameProcess.endTurnSelected.length;
    let mostCnt = 1;
    let currentMostWord = "endTurn";
    let selectedSomething = false;
    currentWords.forEach((word) => {
        const selectersCnt = word.selectedBy.length;
        if (selectersCnt > most) {
            mostCnt = 1;
            most = word.selectedBy.length;
            currentMostWord = word.text;
        } else if (selectersCnt === most && selectersCnt !== 0) {
            mostCnt++;
        }
        total += selectersCnt;
    });
    
    if (most > teams[gameProcess.currentTurn].team.length - total && mostCnt === 1) {
        revealWord(roomId, currentMostWord);
        selectedSomething = true;
    }
    clearAllSelections(roomId);
    return selectedSomething;
}

function clearAllSelections(roomId) {
    let users = getRoomData(roomId, "users");
    let gameProcess = getRoomData(roomId, "gameProcess");
    let currentWords = getRoomData(roomId, "currentWords");
    let hiddenWords = getRoomData(roomId, "hiddenWords");

    const data = {
        users, gameProcess, currentWords, hiddenWords
    }

    clearWordNoSave("endTurn", data);
    currentWords.forEach((word) => {
        clearWordNoSave(word.text, data);
    });
    
    setRoomData(roomId, "users", data.users);
    setRoomData(roomId, "gameProcess", data.gameProcess);
    setRoomData(roomId, "currentWords", data.currentWords);
    setRoomData(roomId, "hiddenWords", data.hiddenWords);
}

function passTurn(roomId) {
    let gameRules = getRoomData(roomId, "gameRules");
    let gameProcess = getRoomData(roomId, "gameProcess");

    clearTimer(roomId);
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
        processWin(roomId, notBlacklisted);
        return;
    }

    const startedFrom = gameProcess.currentTurn;
    const teamAmount = gameRules.teamOrder.length;
    let index = (gameRules.teamOrder.indexOf(startedFrom) + 1) % teamAmount;
    do {
        if (!gameProcess.blacklisted[gameRules.teamOrder[index]]) {
            gameProcess.currentTurn = gameRules.teamOrder[index];

            setRoomData(roomId, "gameProcess", gameProcess);
            return;
        }
        index = (index + 1) % teamAmount;
    } while (gameRules.teamOrder[index] !== startedFrom);
    if (gameProcess.blacklisted[startedFrom]) {
        processWin(roomId, "tie");
    } else {
        processWin(roomId, startedFrom);
    }
}

function processWin(roomId, winner) {
    let gameRules = getRoomData(roomId, "gameRules");
    let gameProcess = getRoomData(roomId, "gameProcess");
    let gameWinStatus = getRoomData(roomId, "gameWinStatus");
    let currentWords = getRoomData(roomId, "currentWords");
    let hiddenWords = getRoomData(roomId, "hiddenWords");

    gameProcess.isGoing = false;
    gameWinStatus.gameIsEnded = true;
    gameWinStatus.winner = winner;
    for (let i = 0; i < gameRules.maxCards; i++) {
        hiddenWords[i].color = currentWords[i].color;
    }

    setRoomData(roomId, "gameProcess", gameProcess);
    setRoomData(roomId, "gameWinStatus", gameWinStatus);
    setRoomData(roomId, "hiddenWords", hiddenWords);

    io.to(roomId).emit("request_game_process");
    io.to(roomId).emit("end_game", gameWinStatus);
}

function clearTimer(roomId) {
    let gameRules = getRoomData(roomId, "gameRules");
    let gameProcess = getRoomData(roomId, "gameProcess");

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

    setRoomData(roomId, "gameProcess", gameProcess);
}

function updateGameTimer(roomId, interval = 1) {
    let gameRules = getRoomData(roomId, "gameRules");
    let gameProcess = getRoomData(roomId, "gameProcess");

    if (gameRules.freezeTime || gameProcess.infiniteTime) {
        return false;
    }
    gameProcess.timeLeft -= interval;
    if (gameProcess.timeLeft <= 0) {
        if (gameProcess.teamTimeStarted) {
            setRoomData(roomId, "gameProcess", gameProcess);
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
    setRoomData(roomId, "gameProcess", gameProcess);
    return false;
}

function startNewGame(roomId) {
    let counter = getRoomData(roomId, "counter");
    let gameProcess = getRoomData(roomId, "gameProcess");
    let gameWinStatus = getRoomData(roomId, "gameWinStatus");

    gameProcess.isFirstTurn = true;
    counter = 0;
    updateTeamOrder(roomId);
    getNewWords(roomId);
    clearTimer(roomId);
    gameWinStatus = {
        gameIsEnded: false,
        winner: ""
    };
    gameProcess.clues = {
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

    setRoomData(roomId, "counter", counter);
    setRoomData(roomId, "gameProcess", gameProcess);
    setRoomData(roomId, "gameWinStatus", gameWinStatus);
}

function removeAllPlayers(roomId, withMasters) {
    let teams = getRoomData(roomId, "teams");
    let users = getRoomData(roomId, "users");

    ["red", "yellow", "blue", "green"].forEach((color) => {
        if (withMasters && teams[color].master) {
            const masterId = teams[color].master.id;
            const masterIndex = users.findIndex((user) => user.id === masterId);
            users[masterIndex].state.teamColor = "spectator";
            users[masterIndex].state.master = false;
            teams[color].master = null;
        }
        teams[color].team.forEach((player) => {
            const playerId = player.id;
            const playerIndex = users.findIndex((user) => user.id === playerId);
            users[playerIndex].state.teamColor = "spectator";
            users[playerIndex].state.master = false;
        });
        teams[color].team = [];
    });

    setRoomData(roomId, "teams", teams);
    setRoomData(roomId, "users", users);
}

function totalCards(roomId) {
    let gameRules = getRoomData(roomId, "gameRules");

    let extraSum = 0;
    for (let i = 0; i < gameRules.teamAmount - 1; i++) {
        extraSum += gameRules.extraCards[i];
    }
    const totalCardAmount = gameRules.teamAmount * gameRules.baseCards + 
                            extraSum + gameRules.blackCards;
    return totalCardAmount;
}

io.on('connection', (socket, next) => {
    // const page = socket.handshake.query.page;
    // console.log(page);

    // if (page === "codenames") {
    //     next();
    // } else {
    //     return;
    // }
    console.log('User connected:', socket.id);
    console.log(socket.handshake);

    let userId = socket.id;
    let user = null;
    let roomId = "default";
    let settedUp = false;

    // socket.join(roomId);

    // socket.join(userId);
    // console.log(socket.id);

    socket.on("create_room", () => {

    });
    
    socket.on("process_room", (newRoomId) => {
        roomId = newRoomId;
        socket.join(roomId);
    });

    socket.on("setup_client", (newRoomId) => {
        roomId = newRoomId;
        socket.join(roomId);

        createRoom(roomId);

        settedUp = true;
        let users = getRoomData(roomId, "users");
        let teams = getRoomData(roomId, "teams");
        let gameRules = getRoomData(roomId, "gameRules");
        let gameProcess = getRoomData(roomId, "gameProcess");

        const objIndex = users.findIndex((obj) => obj.id === userId);
        if (objIndex !== -1) {
            users[objIndex].online = true;
            user = users[objIndex];
        }
        else {
            user = {
                name: `user_${makeID(5)}`,
                color: makeColor(),
                id: userId,
                roomId: roomId,
                state: {
                    teamColor: "spectator",
                    master: false,
                    selecting: ""
                },
                online: true,
                host: false
            };

            if (users.length === 0) {
                user.host = true;
            }

            users.push(user);
        }

        setRoomData(roomId, "users", users);
        
        socket.to(roomId).emit("update_users", teams, users);
        socket.emit("update_client", teams, users, user, gameRules, gameProcess);
    });

    socket.on("edit_user", (newUser) => {
        let users = getRoomData(roomId, "users");
        let teams = getRoomData(roomId, "teams");

        const objIndex = users.findIndex((obj) => obj.id === newUser.id);
        users[objIndex].name = newUser.name;
        updateUser(roomId, users[objIndex]);

        setRoomData(roomId, "users", users);

        io.to(roomId).emit("update_users", teams, users);
    });

    socket.on("state_changed", (previousColor, newUser) => {
        let users = getRoomData(roomId, "users");
        let teams = getRoomData(roomId, "teams");

        const objIndex = users.findIndex((obj) => obj.id === newUser.id);
        // if (objIndex === -1) {

        // }
        if (previousColor !== "spectator") {
            const objIndex = teams[previousColor].team.findIndex((player) => player.id === newUser.id);
            if (teams[previousColor].master?.id === newUser.id) {
                teams[previousColor].master = null;
            } else if (objIndex !== -1) {
                teams[previousColor].team.splice(objIndex, 1);
            }
        }
        if (newUser.state.teamColor !== "spectator") {
            if (newUser.state.master) {
                teams[newUser.state.teamColor].master = newUser;
            } else {
                teams[newUser.state.teamColor].team.push(newUser);
            }
        }
        let updateEveryone = false;
        if (newUser.state.selecting !== "") {
            updateEveryone = true;
            toggleWord(roomId, newUser.state.selecting, objIndex);
        }
        users[objIndex].state = newUser.state;
        users[objIndex].state.selecting = "";

        setRoomData(roomId, "users", users);
        setRoomData(roomId, "teams", teams);

        io.to(roomId).emit("update_users", teams, users);
        if (updateEveryone) {
            io.to(roomId).emit("request_new_gameboard");
        } else {
            const words = getGameboard(roomId, userId);
            socket.emit("send_new_gameboard", words);
        }
    });

    socket.on("notify_server_about_change", () => {
        socket.emit("notify_client_about_change");
    });

    socket.on("get_gameboard", () => {
        let gameRules = getRoomData(roomId, "gameRules");
        let currentWords = getRoomData(roomId, "currentWords");

        if (currentWords.length === 0) {
            currentWords = getNewWords(roomId);
        }
        const words = getGameboard(roomId, userId);

        setRoomData(roomId, "currentWords", currentWords);

        socket.emit("send_new_gameboard", words);
        socket.emit("update_game_rules", gameRules);
    });

    socket.on("refresh_gameboard", () => {
        let gameRules = getRoomData(roomId, "gameRules");
        let currentWords = getRoomData(roomId, "currentWords");

        const newCardsAmount = totalCards(roomId);
        if (newCardsAmount > gameRules.maxCards) {
            socket.emit("error_message", "cardAmountError");
            return;
        } 
        currentWords = getNewWords(roomId);

        setRoomData(roomId, "currentWords", currentWords);

        io.to(roomId).emit("request_new_gameboard");
    });

    socket.on("randomize_team_order", () => {
        let gameRules = getRoomData(roomId, "gameRules");

        updateTeamOrder(roomId);
        io.to(roomId).emit("update_game_rules", gameRules);
    });

    socket.on("set_new_game_rules", (newGameRules) => {
        let gameRules = getRoomData(roomId, "gameRules");
        
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
        
        setRoomData(roomId, "gameRules", gameRules);

        io.to(roomId).emit("update_game_rules", gameRules);
    });

    socket.on("start_game", () => {
        let gameRules = getRoomData(roomId, "gameRules");
        let gameProcess = getRoomData(roomId, "gameProcess");

        if (gameProcess.isGoing) {
            processWin(roomId, "tie");
        } else {
            const newCardsAmount = totalCards(roomId);
            if (newCardsAmount > gameRules.maxCards) {
                socket.emit("error_message", "cardAmountError");
                return;
            } 

            let gameWinStatus = getRoomData(roomId, "gameWinStatus");

            gameProcess.isGoing = true;
            startNewGame(roomId);
            io.to(roomId).emit("end_game", gameWinStatus);
        }
        const timerInterval = setInterval(() => {
            const stopTimer = updateGameTimer(roomId, 0.5);
            if (stopTimer) {
                let users = getRoomData(roomId, "users");
                let teams = getRoomData(roomId, "teams");

                const selectedSomething = wordAutoselect(roomId);
                io.to(roomId).emit("request_game_process");
                io.to(roomId).emit("request_new_gameboard");
                io.to(roomId).emit("update_users", teams, users);
                if (!selectedSomething) {
                    passTurn(roomId);
                }
            }
            if (!gameProcess.isGoing) {
                clearInterval(timerInterval);
            }
            io.to(roomId).emit("request_game_process");
        }, 100);

        setRoomData(roomId, "gameProcess", gameProcess);
        
        io.to(roomId).emit("request_game_process");
        io.to(roomId).emit("request_new_gameboard");
    });

    socket.on("send_clue", (clueText, teamColor) => {
        let counter = getRoomData(roomId, "counter");
        let gameRules = getRoomData(roomId, "gameRules");
        let gameProcess = getRoomData(roomId, "gameProcess");

        gameProcess.clues[teamColor].push({
            text: clueText,
            id: counter++
        });
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

        setRoomData(roomId, "counter", counter);
        setRoomData(roomId, "gameProcess", gameProcess);
        
        io.to(roomId).emit("request_game_process");
        // io.emit("request_clues");
    });

    socket.on("edit_clue", (newClue) => {
        let gameProcess = getRoomData(roomId, "gameProcess");

        let clueIndex = -1;
        for (let color in gameProcess.clues) {
            clueIndex = gameProcess.clues[color].findIndex((clue) => clue.id === newClue.id);
            if (clueIndex !== -1) {
                gameProcess.clues[color][clueIndex].text = newClue.text;
                break;
            }
        }

        setRoomData(roomId, "gameProcess", gameProcess);
        
        io.to(roomId).emit("request_game_process");
    });

    socket.on("get_clues", () => {
        let gameProcess = getRoomData(roomId, "gameProcess");

        socket.emit("update_clues", gameProcess.clues);
    });

    socket.on("select_word", (selectedWord) => {
        let teams = getRoomData(roomId, "teams");
        let users = getRoomData(roomId, "users");
        let gameRules = getRoomData(roomId, "gameRules");
        let gameProcess = getRoomData(roomId, "gameProcess");
        let currentWords = getRoomData(roomId, "currentWords");

        console.log(userId);

        const selecterIndex = users.findIndex((obj) => obj.id === userId);
        toggleWord(roomId, selectedWord, selecterIndex);

        const wordObjectIndex = currentWords.findIndex((word) => word.text === selectedWord);
        const selecters = wordObjectIndex !== -1 ? currentWords[wordObjectIndex].selectedBy : gameProcess.endTurnSelected;

        console.log(wordObjectIndex, selectedWord, currentWords);

        if (selecters.length === teams[gameProcess.currentTurn].team.length) {
            io.to(roomId).emit("start_countdown", selectedWord);
            let timer = gameRules.countdownTime;
            countdownInterval = setInterval(() => {
                timer -= 0.01;

                if (timer <= 0) {
                    timer = 0;
                    io.to(roomId).emit("stop_countdown");
                    revealWord(roomId, selectedWord);
                    io.to(roomId).emit("request_new_gameboard");
                    io.to(roomId).emit("request_game_process");
                    clearInterval(countdownInterval);
                }

                console.log(timer / gameRules.countdownTime);

                io.to(roomId).emit("update_countdown", 1 - timer / gameRules.countdownTime);
            }, 10);
        } else {
            clearInterval(countdownInterval);
            io.to(roomId).emit("stop_countdown");
        }

        console.log(currentWords);

        io.to(roomId).emit("request_new_gameboard");
        io.to(roomId).emit("request_game_process");
        io.to(roomId).emit("update_users", teams, users);
        socket.emit("update_client", teams, users, users[selecterIndex], gameRules, gameProcess);
    });

    socket.on("proceed_click", (clickedWordText) => {
        io.to(roomId).emit("click_word", clickedWordText, userId);
    });

    socket.on("get_game_process", () => {
        let gameProcess = getRoomData(roomId, "gameProcess");

        socket.emit("update_game_process", gameProcess);
    });

    socket.on("pass_turn", () => {
        let teams = getRoomData(roomId, "teams");
        let users = getRoomData(roomId, "users");

        clearAllSelections(roomId);
        passTurn(roomId);
        io.to(roomId).emit("request_game_process");
        io.to(roomId).emit("request_new_gameboard");
        io.to(roomId).emit("update_users", teams, users);
    });

    socket.on("remove_all_players", (withMasters) => {
        let teams = getRoomData(roomId, "teams");
        let users = getRoomData(roomId, "users");

        removeAllPlayers(roomId, withMasters);
        io.to(roomId).emit("update_users", teams, users);
    });

    socket.on('disconnect', () => {
        if (!settedUp) {
            console.log("Some shit is going on...");
            return;
        }
        let teams = getRoomData(roomId, "teams");
        let users = getRoomData(roomId, "users");

        console.log('User disconnected:', socket.handshake.address);
        const objIndex = users.findIndex((obj) => obj.id === userId);
        users[objIndex].online = false;
        updateUser(roomId, users[objIndex]);
        io.to(roomId).emit("update_users", teams, users);
    });
});

server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});