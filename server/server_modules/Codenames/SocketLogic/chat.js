// @ts-check
const CodenamesDB = require("../db/codenamesDB");

const RoomContext = require("../db/roomContext");

async function sendNewChatMessageEvent(io, socketData, messageText) {
    const room = new RoomContext(socketData.roomId);

    let users = await room.getUsers();

    const objIndex = users.findIndex((obj) => obj.id === socketData.userCodenamesId);
    let sender = users[objIndex];

    let result = await CodenamesDB.addChatMessageToRoomData(socketData.roomId, sender.name, socketData.userCodenamesId, messageText);

    await room.getChatMessages();

    const message = {
        senderName: sender.name,
        senderID: socketData.userCodenamesId,
        messageText: messageText
    };

    io.to(socketData.roomId).emit("add_chat_message", message);
};

module.exports = {
    sendNewChatMessageEvent
};