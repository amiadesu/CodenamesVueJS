// @ts-check

const {
    toggleWord,
    toggleWordNoSave,
    clearWord,
    clearWordNoSave,
    clearAllSelections
} = require("./wordHelpers");

const {
    passTurn,
    processWin
} = require("./gameManager");

async function revealWord(room, wordText) {
    let gameProcess = await room.getGameProcess();
    if (gameProcess.selectionIsGoing) {
        return;
    }
    gameProcess.selectionIsGoing = true;
    await room.setGameProcess(gameProcess);

    if (wordText === "endTurn") {
        await clearWord(room, wordText);
        await passTurn(room);
        return;
    }
    
    await clearWord(room, wordText);

    let gameRules = await room.getGameRules();
    let words = await room.getWords();
    gameProcess = await room.getGameProcess();
    

    

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

    gameProcess.selectionIsGoing = false;

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

    if (!Array.isArray(words)) {
        return false;
    }

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
        console.log("Selecting", currentMostWord);
        await revealWord(room, currentMostWord);
        selectedSomething = true;
    }
    await clearAllSelections(room);

    return selectedSomething;
}

module.exports = {
    revealWord,
    wordAutoselect
};