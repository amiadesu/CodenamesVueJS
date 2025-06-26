const {
    Permissions
} = require("../utils/constants");

async function validateUser(room, userRoomId) {
    let users = await room.getUsers();

    const objIndex = users.findIndex((obj) => obj.id === userRoomId);

    return (objIndex !== -1);
}

async function checkPermissions(room, userCodenamesId, permission) {
    let users = await room.getUsers();
    const index = users.findIndex((user) => user.id === userCodenamesId);
    if (index === -1) {
        return false;
    }
    const user = users[index];
    let userPermissionsLevel = Permissions.SPECTATOR;
    if (user.state.color !== "spectator") {
        userPermissionsLevel = Permissions.PLAYER;
    }
    if (user.state.master) {
        userPermissionsLevel = Permissions.MASTER;
    }
    if (user.host) {
        userPermissionsLevel = Permissions.HOST;
    }
    return permission <= userPermissionsLevel;
}

module.exports = {
    validateUser,
    checkPermissions
};