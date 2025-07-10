const mongoose = require("mongoose");

const {
    messagesLimitNumber,
    cluesLimitNumber
} = require("../utils/constants");

const roomSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true
    },
    users : {
        type: [Object],
        default: []
    },
    words : {
        type: [Object],
        default: []
    },
    traitors: {
        type: [Object],
        default: []
    },
    gameRules : {
        type: Object,
        default: {
            teamAmount: 2,
            maximumPlayers: 4,
            teamOrder: ["red", "green"],
            countdownTime: 0.5,
            firstMasterTurnTime: 120,
            masterTurnTime: 60,
            teamTurnTime: 60,
            extraTime: 15,
            freezeTime: false,
            limitedGuesses: false,
            guessesLimit: 0,
            baseCards: 7,
            extraCards: [3, 2, 1, 0],
            blackCards: 1,
            maxCards: 36,
            fieldSize: "6x6",
            game_mode: "standard",
            wordPack: {
                packId: "english",
                name: "English word pack (standart)"
            },
            locked: false
        }
    },
    teams : {
        type: Object,
        default: {
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
        }
    },
    gameProcess : {
        type: Object,
        default: {
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
            selectionIsGoing: false,
            blacklisted: {
                "red" : false,
                "yellow" : false,
                "blue" : false,
                "green" : false
            }
        }
    },
    endTurnSelectors : {
        type: Array,
        default: []
    },
    clueIDCounter : {
        type: Number,
        default: 0
    },
    clues : {
        red : {
            type: [Object],
            default: [],
            validate: {
                validator: (array) => array.length <= cluesLimitNumber,
                message: `Array exceeds maximum size of ${cluesLimitNumber}`
            }
        },
        yellow : {
            type: [Object],
            default: [],
            validate: {
                validator: (array) => array.length <= cluesLimitNumber,
                message: `Array exceeds maximum size of ${cluesLimitNumber}`
            }
        },
        blue : {
            type: [Object],
            default: [],
            validate: {
                validator: (array) => array.length <= cluesLimitNumber,
                message: `Array exceeds maximum size of ${cluesLimitNumber}`
            }
        },
        green : {
            type: [Object],
            default: [],
            validate: {
                validator: (array) => array.length <= cluesLimitNumber,
                message: `Array exceeds maximum size of ${cluesLimitNumber}`
            }
        }
    },
    chatMessages: {
        type: [Object[{
            senderName: String,
            senderID: String,
            messageText: String
        }]],
        default: [],
        validate: {
            validator: (array) => array.length <= messagesLimitNumber,
            message: `Array exceeds maximum size of ${messagesLimitNumber}`
        }
    },
    countdownInterval : {
        type: Number,
        default: null
    },
    gameWinStatus : {
        type: Object,
        default: {
            gameIsEnded: false,
            winner: ""
        }
    },
    createdAt : {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: {
        updatedAt: 'updatedAt' 
    }
});

// Middleware to handle the array size limit
roomSchema.pre('save', function(next) {
    for (const color in this.clues) {
        if (this.clues[color].length > 100) {
            // Remove the oldest element(s) if over limit
            this.clues[color] = this.clues[color].slice(-100); // Keep only the last 100 elements
        }
    }
    if (this.chatMessages.length > messagesLimitNumber) {
        this.chatMessages = this.chatMessages.slice(-messagesLimitNumber);
    }
    this.updatedAt = Date.now();
    next();
});

module.exports = roomSchema;
