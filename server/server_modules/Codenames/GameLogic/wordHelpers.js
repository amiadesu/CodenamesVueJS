// @ts-check

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
        if (Array.isArray(selectors)) {
            selectors.forEach((selector) => {
                const userIndex = users.findIndex((user) => user.id === selector.id);
                if (userIndex !== -1) {
                    users[userIndex].state.selecting = "";
                }
                users[userIndex].state.selecting = "";
            });
        }

        await room.setEndTurnSelectors([], false);
    } else {
        let words = await room.getWords(false);

        const wordObjectIndex = words.findIndex((word) => word.text === wordText);
        if (wordObjectIndex === -1) {
            return;
        }
        const selectors = words[wordObjectIndex].selectedBy;
        if (Array.isArray(selectors)) {
            selectors.forEach((selector) => {
                const userIndex = users.findIndex((user) => user.id === selector.id);
                if (userIndex !== -1) {
                    users[userIndex].state.selecting = "";
                }
            });
        }
        words[wordObjectIndex].selectedBy = [];

        await room.setWords(words, false);
    }
    
    await room.setUsers(users, false);
}

async function clearAllSelections(room) {
    let words = await room.getWords();

    await clearWord(room, "endTurn");

    if (!Array.isArray(words)) {
        return;
    }
    
    words.forEach(async (word) => {
        await clearWord(room, word.text);
    });

    await room.save();
}

module.exports = {
    toggleWord,
    toggleWordNoSave,
    clearWord,
    clearWordNoSave,
    clearAllSelections
};