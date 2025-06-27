const {
    passTurn,
    processWin
} = require("./gameManager");

async function toggleWord(room, wordText, selectorIndex, countdownInterval) {
    let users = await room.getUsers();

    const selectorId = users[selectorIndex].id;
    const selectorObject = {
        id: selectorId,
        color: users[selectorIndex].color
    };
    if (users[selectorIndex].state.selecting !== "" && users[selectorIndex].state.selecting !== wordText) {
        clearInterval(countdownInterval);
        await toggleWordNoSave(room, users[selectorIndex].state.selecting, selectorIndex);
        await room.save();
        users = await room.getUsers();
    }
    
    let words = await room.getWords();

    const wordObjectIndex = words.findIndex((word) => word.text === wordText);

    if (wordObjectIndex !== -1 || wordText === "endTurn") {
        if (users[selectorIndex].state.selecting !== "") {
            await room.removeWordSelector(wordText, selectorId);
            users[selectorIndex].state.selecting = "";
        }
        else {
            await room.addWordSelector(wordText, selectorObject);
            users[selectorIndex].state.selecting = wordText;
        }
    }

    await room.setUsers(users);

    await room.save();
}

async function toggleWordNoSave(room, wordText, selectorIndex) {
    let users = await room.getUsers(false);
    let words = await room.getWords(false);

    const wordObjectIndex = words.findIndex((word) => word.text === wordText);
    const selectorId = users[selectorIndex].id;
    const selectorObject = {
        id: selectorId,
        color: users[selectorIndex].color
    };

    if (wordObjectIndex !== -1 || wordText === "endTurn") {
        if (users[selectorIndex].state.selecting !== "") {
            await room.removeWordSelector(wordText, selectorId);
            users[selectorIndex].state.selecting = "";
        }
        else {
            await room.addWordSelector(wordText, selectorObject);
            users[selectorIndex].state.selecting = wordText;
        }
    }

    await room.setUsers(users, false);
}

async function clearWord(room, wordText) {
    await clearWordNoSave(room, wordText);

    await room.save();
}

async function clearWordNoSave(room, wordText) {
    let users = await room.getUsers(false);

    if (wordText === "endTurn") {
        let selectors = await room.getEndTurnSelectors();

        selectors.forEach((selector) => {
            const userIndex = users.findIndex((user) => user.id === selector.id);
            if (userIndex !== -1) {
                users[userIndex].state.selecting = "";
            }
            users[userIndex].state.selecting = "";
        });

        await room.setEndTurnSelectors([], false);
    } else {
        let words = await room.getWords(false);

        const wordObjectIndex = words.findIndex((word) => word.text === wordText);
        if (wordObjectIndex === -1) {
            return;
        }
        const selectors = words[wordObjectIndex].selectedBy;
        selectors.forEach((selector) => {
            const userIndex = users.findIndex((user) => user.id === selector.id);
            if (userIndex !== -1) {
                users[userIndex].state.selecting = "";
            }
        });
        words[wordObjectIndex].selectedBy = [];

        await room.setWords(words, false);
    }
    
    await room.setUsers(users, false);
}

async function revealWord(room, wordText) {
    if (wordText === "endTurn") {
        await clearWord(room, wordText);
        await passTurn(room);
        return;
    }
    
    await clearWord(room, wordText);

    let gameRules = await room.getGameRules();
    let gameProcess = await room.getGameProcess();
    let words = await room.getWords();

    const wordObjectIndex = words.findIndex((word) => word.text === wordText);
    if (!words[wordObjectIndex].selectable) {
        return;
    }
    words[wordObjectIndex].hiddenColor = words[wordObjectIndex].color;
    words[wordObjectIndex].selectable = false;
    words[wordObjectIndex].revealed = true;
    
    gameProcess.guessesCount++;
    gameProcess.wordsCount[words[wordObjectIndex].color]--;
    
    await room.setGameProcess(gameProcess);
    await room.setWords(words);

    if (["red", "yellow", "blue", "green"].includes(words[wordObjectIndex].color)) {
        if (gameProcess.wordsCount[words[wordObjectIndex].color] === 0 && 
            !gameProcess.blacklisted[words[wordObjectIndex].color]) {
                return await processWin(room, words[wordObjectIndex].color); // return?
        }
    }

    let shouldPassTurn = false;
    if (words[wordObjectIndex].color === "black") {
        gameProcess.blacklisted[gameProcess.currentTurn] = true;
        shouldPassTurn = true;
    } else if (words[wordObjectIndex].color !== gameProcess.currentTurn) {
        shouldPassTurn = true;
    } else {
        gameProcess.timeLeft = (gameProcess.timeLeft + gameRules.extraTime) % 3600;
        if (gameRules.limitedGuesses && gameProcess.guessesCount >= gameRules.guessesLimit) {
            shouldPassTurn = true;
        }
    }

    await room.setGameProcess(gameProcess);

    if (shouldPassTurn) {
        await passTurn(room);
    }
}

async function wordAutoselect(room) {
    let teams = await room.getTeams();
    let gameProcess = await room.getGameProcess();
    let words = await room.getWords();
    let endTurnSelectors = await room.getEndTurnSelectors();

    let total = endTurnSelectors.length;
    let most = endTurnSelectors.length;
    let mostCnt = 1;
    let currentMostWord = "endTurn";
    let selectedSomething = false;
    words.forEach((word) => {
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
        await revealWord(room, currentMostWord);
        selectedSomething = true;
    }
    await clearAllSelections(room);

    return selectedSomething;
}

async function clearAllSelections(room) {
    let words = await room.getWords();

    await clearWordNoSave(room, "endTurn");
    words.forEach(async (word) => {
        await clearWordNoSave(room, word.text);
    });

    await room.save();
}

module.exports = {
    toggleWord,
    toggleWordNoSave,
    clearWord,
    clearWordNoSave,
    revealWord,
    wordAutoselect,
    clearAllSelections
};