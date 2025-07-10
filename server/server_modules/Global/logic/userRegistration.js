// @ts-check
const { logger } = require("../../../utils/logger");

const GlobalDB = require("../db/globalDB");
const crypto = require("crypto");

async function setupUserRegistration() {
    await GlobalDB.initialize();
}

async function processUser(userId, socketId, allSockets) {
    const resultNewUser = await GlobalDB.createUserEntry(userId);
    if (!resultNewUser.success) {
        logger.warn(resultNewUser.error);
        return null;
    }
    const newUser = resultNewUser.newUser;
    const realUserID = resultNewUser.realUserID;

    if (!newUser) {
        await disconnectAllSockets(realUserID, allSockets);
    }

    let resultGetSockets = await GlobalDB.getUserData(realUserID, "sockets");
    if (!resultGetSockets.success) {
        logger.warn(resultGetSockets.error);
        return null;
    }
    let sockets = resultGetSockets.value;

    sockets.push(socketId);

    const resultSetSockets = await GlobalDB.setUserData(realUserID, "sockets", sockets);
    if (!resultSetSockets.success) {
        logger.warn(resultSetSockets.error);
        return null;
    }

    let resultUserData = await GlobalDB.getFullUserData(realUserID);
    if (!resultUserData.success) {
        logger.warn(resultUserData.error);
        return null;
    }
    let userData = resultUserData.value;

    userData.userID = userData._id.toString();
    return userData;
}

async function updateGlobalUser(userId, newUserData) {
    let dataToUpdate = {};
    if (newUserData.name) {
        dataToUpdate.name = newUserData.name;
    }
    if (newUserData.color) {
        dataToUpdate.color = newUserData.color;
    }
    const resultUpdate = await GlobalDB.updateUserData(userId, dataToUpdate);
    if (!resultUpdate.success) {
        logger.warn(resultUpdate.error);
        return null;
    }
}

async function disconnectAllSockets(userId, allSockets) {
    const resultGetSockets = await GlobalDB.getUserData(userId, "sockets");
    if (!resultGetSockets.success) {
        logger.warn(resultGetSockets.error);
        return null;
    }
    let sockets = resultGetSockets.value;

    sockets.forEach((socketId) => {
        const socket = allSockets.get(socketId);
        if (socket) {
            socket.emit("stop_session");
            socket.disconnect();
        }
    });

    const resultSetSockets = await GlobalDB.setUserData(userId, "sockets", []);
    if (!resultSetSockets.success) {
        logger.warn(resultSetSockets.error);
        return null;
    }
}

module.exports = {
    setupUserRegistration,
    processUser,
    updateGlobalUser
};