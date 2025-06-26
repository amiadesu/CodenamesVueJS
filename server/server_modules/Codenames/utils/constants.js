const validTeamColors = [
    "red", "green", "blue", "yellow"
];
const validPlayerTeamColors = [
    "red", "green", "blue", "yellow", "spectator"
];
const validWordColors = [
    "red", "green", "blue", "yellow", "white", "black", "unknown"
];

const Permissions = Object.freeze({
    SPECTATOR: 0,
    PLAYER: 1,
    MASTER: 2,
    HOST: 3
});

const validEventsWithoutAuthorization = [
    "create_room",
    "process_room",
    "setup_client"
];

const defaultRoomData = { // MUST NOT include roomId
    users : [],
    words : [],
    traitors: [],
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
        fieldSize: "6x6",
        game_mode: "default",
        wordPack: {
            packId: "english",
            name: "English word pack (standart)"
        },
        locked: false
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
        }
    },
    endTurnSelectors: [],    
    clues: {
        "red" : [],
        "yellow" : [],
        "blue" : [],
        "green" : []
    },
    clueIDCounter : 0,
    chatMessages: [],
    countdownInterval : null,
    gameWinStatus : {
        gameIsEnded: false,
        winner: ""
    },
};
const additionalValidKeys = ["createdAt", "updatedAt"];

const bannedRooms = new Set(["default", "rules"]);
const deleteAfterMNumber = 15;  // minutes (number)
const updateAfterMNumber = 5;   // minutes (number)
// Convert to strings for Redis operations
const deleteAfterS = String(deleteAfterMNumber * 60);       // '900' (15 minutes in seconds)
const updateAfterS = String(updateAfterMNumber * 60);       // '300' (5 minutes in seconds)

// Need some additional window to ensure that data updates properly
const expireAfterS = String((deleteAfterMNumber + updateAfterMNumber) * 60); // '1200' (20 minutes in seconds)

// Milliseconds versions (as strings)
const deleteAfterMs = String(Number(deleteAfterS) * 1000);  // '900000'
const updateAfterMs = String(Number(updateAfterS) * 1000);  // '300000'
const expireAfterMs = String(Number(expireAfterS) * 1000);  // '1200000'
const messagesLimitNumber = 100;
const cluesLimitNumber = 100;
const messagesLimit = String(messagesLimitNumber);
const cluesLimit = String(cluesLimitNumber);

const LOCK_TTL = 3000;

module.exports = {
    validTeamColors,
    validPlayerTeamColors,
    validWordColors,
    Permissions,
    validEventsWithoutAuthorization,
    defaultRoomData,
    additionalValidKeys,
    bannedRooms,
    deleteAfterMNumber,
    updateAfterMNumber,
    deleteAfterS,
    updateAfterS,
    expireAfterS,
    deleteAfterMs,
    updateAfterMs,
    expireAfterMs,
    messagesLimitNumber,
    cluesLimitNumber,
    messagesLimit,
    cluesLimit,
    LOCK_TTL
};