// @ts-check
const CodenamesDB = require("../db/codenamesDB");
const {
    isObject,
    makeID,
    makeColor,
    randChoice,
    shuffle
} = require("../../../utils/extra");

async function getWordsFromPack(packId) {
    const result = await CodenamesDB.getWordPackWordsOnly(packId);
    if (!result.success) {
        return [];
    }
    return result.value;
}

async function getWordsForRoom(room) {
    let gameRules = await room.getGameRules();
    console.log(gameRules);
    const words = await getWordsFromPack(gameRules.wordPack.packId);
    return words;
}

async function getNewWords(room) {
    const words = await getWordsForRoom(room);
    shuffle(words);

    let gameRules = await room.getGameRules();

    const newWordsArray = words.splice(0, gameRules.maxCards);
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
                    hiddenColor: "unknown",
                    selectedBy: [],
                    selectable: true,
                    revealed: false
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
                    hiddenColor: "unknown",
                    selectedBy: [],
                    selectable: true,
                    revealed: false
                });
                total++;
            }
            amount[color] = gameRules.blackCards;
        } else {
            for (let i = 0; i < currentAmount; i++) {
                newWords.push({
                    text: newWordsArray[total],
                    color: color,
                    hiddenColor: "unknown",
                    selectedBy: [],
                    selectable: true,
                    revealed: false
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

    shuffle(newWords);

    let gameProcess = await room.getGameProcess();
    gameProcess.wordsCount = amount;
    await room.setGameProcess(gameProcess);
    await room.setWords(newWords);

    return newWords;
}

async function getGameboard(room, userCodenamesId) {
    let users = await room.getUsers();
    let traitors = await room.getTraitors();

    const index = users.findIndex((user) => user.id === userCodenamesId);
    const user = users[index];

    const isMaster = user.state.master;
    const isTraitor = traitors.some((traitor) => traitor.id === userCodenamesId);
    if (isMaster) {
        let words = await room.getWords();
        if (words.length === 0) {
            await getNewWords(room);
            words = await room.getWords();
        }
        words = words.map((word) => {
            word.selectable = false;
            delete word.hiddenColor;
            return word;
        });
        return words;
    }
    else if (isTraitor) {
        let words = await room.getWords();
        if (words.length === 0) {
            await getNewWords(room);
            words = await room.getWords();
        }
        words = words.map((word) => {
            if (word.color === "white" || word.color === user.state.teamColor) {
                word.color = word.hiddenColor;
            }
            delete word.hiddenColor;
            return word;
        });
        return words;
    }
    let words = await room.getWords();
    if (words.length === 0) {
        await getNewWords(room);
        words = await room.getWords();
    }
    words = words.map((word) => {
        word.color = word.hiddenColor;
        delete word.hiddenColor;
        return word;
    });
    return words;
}

module.exports = {
    getWordsFromPack,
    getWordsForRoom,
    getNewWords,
    getGameboard
}