// @ts-check
const RoomContext = require("../db/roomContext");

const {
    Permissions
} = require("../utils/constants");
const {
    refreshGameboardRateLimiter
} = require("../utils/rateLimiters");

const DIContainer = require("../GameLogic/container");
const {
    updateUser
} = DIContainer.modules.gameManager;
const {
    toggleWord
} = DIContainer.modules.words;
const {
    getGameboard
} = DIContainer.modules.gameboard;
const {
    updateGlobalUser
} = require("../../Global/logic/userRegistration");

const {
    validTeamColorZodSchema,
    validPlayerTeamColorZodSchema,
    validWordColorZodSchema,
    packIdZodSchema,
    gameRulesZodSchemaNonStrict,
    gameRulesZodSchemaStrict,
    clueTextZodSchema,
    clueZodSchema,
    playerIdZodSchema,
    playerZodSchema,
    wordZodSchema,
    chatMessageZodSchema
} = require("../ZodSchemas/codenamesZodSchemas");
const {
    usernameZodSchema
} = require("../../Global/ZodSchemas/globalZodSchemas");
const {
    makeColor
} = require("../../../utils/extra");

async function editUserNameEvent(io, socketData, newName) {
    const room = new RoomContext(socketData.roomId);

    let users = await room.getUsers();

    const objIndex = users.findIndex((obj) => obj.id === socketData.userCodenamesId);
    users[objIndex].name = newName;
    await updateUser(room, users[objIndex]);
    await updateGlobalUser(socketData.userId, { name: newName });

    users = await room.getUsers();
    let teams = await room.getTeams();

    io.to(socketData.roomId).emit("update_users", teams, users);
}

async function changeUserColorEvent(io, socketData) {
    const room = new RoomContext(socketData.roomId);

    let users = await room.getUsers();
    const newColor = makeColor();

    const objIndex = users.findIndex((obj) => obj.id === socketData.userCodenamesId);
    users[objIndex].color = newColor;
    await updateUser(room, users[objIndex]);
    await updateGlobalUser(socketData.userId, { color: newColor });

    users = await room.getUsers();
    let teams = await room.getTeams();

    io.to(socketData.roomId).emit("update_users", teams, users);
}

async function stateChangedEvent(io, socketData, previousColor, newUser) {
    const room = new RoomContext(socketData.roomId);
    
    let users = await room.getUsers();
    let teams = await room.getTeams();

    const objIndex = users.findIndex((obj) => obj.id === newUser.id);
    if (objIndex === -1) {
        return;
    }
    if (newUser.host && !users[objIndex].host) {
        console.log("Privilege escalation attempt was blocked.");
        return;
    }

    let updateEveryone = false;
    if (newUser.state.selecting !== "" && newUser.state.selecting === users[objIndex].state.selecting) {
        console.log(newUser.state.selecting, users[objIndex].state.selecting);
        updateEveryone = true;
        await toggleWord(room, newUser.state.selecting, objIndex, socketData.countdownInterval);
        console.log(newUser.state.selecting, users[objIndex].state.selecting);
        users = await room.getUsers();
        newUser.state.selection = "";
    }
    users[objIndex].state = newUser.state;
    users[objIndex].state.selecting = "";
    console.log(newUser.state.selecting, users[objIndex].state.selecting);

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

    await room.setUsers(users);
    await room.setTeams(teams);

    io.to(socketData.roomId).emit("update_users", teams, users);
    if (updateEveryone) {
        io.to(socketData.roomId).emit("request_new_gameboard");
    } else {
        const words = await getGameboard(room, socketData.userCodenamesId);
        io.to(socketData.socketId).emit("send_new_gameboard", words);
    }
}

module.exports = {
    editUserNameEvent,
    changeUserColorEvent,
    stateChangedEvent
};