// @ts-check
const CodenamesDB = require("../db/codenamesDB");

const DIContainer = require("../GameLogic/container");
const {
    getWordsFromPack
} = DIContainer.modules.gameboard;

async function getAllWordPacksEvent(io, socketData) {
    const result = await CodenamesDB.getAllWordPacks();
    if (!result.success) {
        return;
    }
    io.to(socketData.socketId).emit("word_packs", result.value);
};

async function getWordPackNoWordsEvent(io, socketData, packId) {
    const result = await CodenamesDB.getWordPackNoWords(packId);
    if (!result.success) {
        return;
    }
    io.to(socketData.socketId).emit("word_pack_no_words", result.value);
};

async function getWordsFromWordPackEvent(io, socketData, packId) {
    io.to(socketData.socketId).emit("words_from_word_pack", await getWordsFromPack(packId));
};

module.exports = {
    getAllWordPacksEvent,
    getWordPackNoWordsEvent,
    getWordsFromWordPackEvent
};