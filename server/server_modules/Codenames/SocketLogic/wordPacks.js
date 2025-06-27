// @ts-check
const {
    packIdZodSchema
} = require("../ZodSchemas/codenamesZodSchemas");
const CodenamesDB = require("../db/codenamesDB");

const DIContainer = require("../GameLogic/container");
const {
    getWordsFromPack,
    getWordsForRoom,
    getNewWords,
    getGameboard
} = DIContainer.modules.gameboard;

async function getAllWordPacksEvent(io, socketData) {
    const result = await CodenamesDB.getAllWordPacks();
    if (!result.success) {
        return;
    }
    io.to(socketData.socketId).emit("word_packs", result.value);
};

async function getWordPackNoWordsEvent(io, socketData, packId) {
    let resultPackId = packIdZodSchema.safeParse(packId);
    if (!resultPackId.success) {
        console.log("Zod error:", resultPackId.error);
        return;
    }
    packId = resultPackId.data;

    const result = await CodenamesDB.getWordPackNoWords(packId);
    if (!result.success) {
        return;
    }
    io.to(socketData.socketId).emit("word_pack_no_words", result.value);
};

async function getWordsFromWordPackEvent(io, socketData, packId) {
    let result = packIdZodSchema.safeParse(packId);
    if (!result.success) {
        console.log("Zod error:", result.error);
        return;
    }
    packId = result.data;
    
    io.to(socketData.socketId).emit("words_from_word_pack", await getWordsFromPack(packId));
};

module.exports = {
    getAllWordPacksEvent,
    getWordPackNoWordsEvent,
    getWordsFromWordPackEvent
};