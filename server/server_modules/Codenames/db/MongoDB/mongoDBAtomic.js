// @ts-check
const roomSchema = require("../../MongoDBSchemas/Room");
const wordPackSchema = require("../../MongoDBSchemas/WordPack");

const { logger } = require("../../../../utils/logger");

const {
    validTeamColors,
    defaultRoomData,
    deleteAfterMs,
    messagesLimitNumber,
    cluesLimitNumber
} = require("../../utils/constants");

class MongoDBAtomic {
    constructor() {
        this.client = null;
    }

    async init(mongoDBClient) {
        if (!mongoDBClient) throw new Error('MongoDB client is required');
        this.client = mongoDBClient;
        this.Room = this.client.model("Room", roomSchema);
        this.WordPack = this.client.model("WordPack", wordPackSchema);
    }

    async createRoom(roomId) {
        try {
            const resultVersion = await this.getRoomData(roomId, '__v');
            const currentVersion = resultVersion.success ? resultVersion.value : null;

            const updatedRoom = await this.Room.findOneAndUpdate(
                {
                    roomId: roomId,
                    $or: [
                        { __v: { $exists: false } },
                        currentVersion ? {
                            $and: [
                                {
                                    $or: [
                                        { updatedAt: { $lt: new Date(Date.now() - +deleteAfterMs) } },
                                        { users: { $not: { $elemMatch: { online: true } } } }
                                    ]
                                },
                                { __v: currentVersion }
                            ]
                        } : { _id: null } // the last will never match
                    ],
                },
                { 
                    $set: structuredClone(defaultRoomData),
                    $inc: { __v: 1 }
                },
                { 
                    upsert: true, 
                    new: true,
                    setDefaultsOnInsert: true
                }
            ).exec();

            if (!updatedRoom) {
                throw new Error("Couldn't create room or version conflict");
            }

            return { success: true, message: "Created room successfully" };
        } catch (error) {
            if (error.code === 11000) { // Duplicate Key Error code                
                return { success: false, message: "Room already exists" };
            }
            logger.error(`Error while creating room: ${error}`);
            return { success: false, error: error.message };
        }
    }

    async getRoomData(roomId, key) {
        try {
            const result = await this.Room.findOne({ roomId: roomId })
                .select(`${key} -_id`)
                .lean()
                .exec();

            const value = result ? result[key] : null;

            return { success: true, value: value };
        } catch (error) {
            logger.error(`Error while getting room data: ${error}`);
            return { success: false, error: error.message };
        }
    }

    async setRoomData(roomId, key, value) {
        try {
            let updatedRoom = null;
            if (key) {
                updatedRoom = await this.Room.findOneAndUpdate(
                    { roomId: roomId },
                    { $set: { [key]: value } },
                    { 
                        new: true,
                        upsert: false
                    }
                ).exec();
            }
            else {
                // Update multiple keys at once
                // Maybe should add some checks for this...
                updatedRoom = await this.Room.findOneAndUpdate(
                    { roomId: roomId },
                    { $set: value },
                    { 
                        new: true,
                        upsert: false
                    }
                ).exec();
            }
        
            if (!updatedRoom) {
                throw new Error('Room not found');
            }
        
            return { success: true, message: "Setted room data successfully" };
        } catch (error) {
            logger.error(`Error while setting room data: ${error}`);
            return { success: false, error: error.message };
        }
    }

    async addChatMessage(roomId, newMessage) {
        try {
            const updatedRoom = await this.Room.findOneAndUpdate(
                { roomId: roomId },
                { 
                    $push: {
                        chatMessages: {
                            $each: [newMessage],
                            $slice: -messagesLimitNumber
                        }
                    }
                },
                { 
                    new: true,
                    upsert: false
                }
            ).exec();
        
            if (!updatedRoom) {
                throw new Error('Room not found');
            }
        
            return { success: true, message: "Added new message successfully" };
        } catch (error) {
            logger.error(`Error while adding message: ${error}`);
            return { success: false, error: error.message };
        }
    }

    // Clue Operations
    async addClue(roomId, teamColor, newClue) {
        try {
            const updatedRoom = await this.Room.findOneAndUpdate(
                { roomId: roomId },
                { 
                    $push: {
                        [`clues.${teamColor}`]: {
                            $each: [newClue],
                            $slice: -cluesLimitNumber
                        }
                    }
                },
                { 
                    new: true,
                    upsert: false
                }
            ).exec();
        
            if (!updatedRoom) {
                throw new Error('Room not found');
            }
        
            return { success: true, message: "Added new clue successfully" };
        } catch (error) {
            logger.error(`Error while adding clue: ${error}`);
            return { success: false, error: error.message };
        }
    }

    async updateClue(roomId, clueId, newClue) {
        try {
            const resultVersion = await this.getRoomData(roomId, '__v');
            if (!resultVersion.success) {
                return resultVersion;
            }
            const version = resultVersion.value || 0;

            let found = false;
            for (const color of validTeamColors) {
                const result = await this.Room.updateOne(
                    { 
                        roomId: roomId, 
                        [`clues.${color}.id`]: clueId,
                        __v: version
                    },
                    { 
                        $set: { [`clues.${color}.$`]: newClue },
                        $inc: { __v: 1 }
                    }
                ).exec();

                if (result.modifiedCount > 0) {
                    found = true;
                    break;
                }
            }

            if (!found) {
                throw new Error("Clue not found or version conflict");
            }
    
            return { success: true, message: "Clue updated successfully" };
        } catch (error) {
            logger.error(`Error while updating clue: ${error}`);
            return { success: false, error: error.message };
        }
    }

    // Selector Operations
    async addEndTurnSelector(roomId, selector) {
        try {
            const updatedRoom = await this.Room.findOneAndUpdate(
                { roomId: roomId },
                { 
                    $push: {
                        endTurnSelectors: selector
                    },
                    $inc: { __v: 1 }
                },
                { 
                    new: true,
                    upsert: false
                }
            ).exec();
        
            if (!updatedRoom) {
                throw new Error('Room not found');
            }
        
            return { success: true, message: "Added end turn selector successfully" };
        } catch (error) {
            logger.error(`Error while adding end turn selector: ${error}`);
            return { success: false, error: error.message };
        }
    }

    async removeEndTurnSelector(roomId, selectorId) {
        try {
            const updatedRoom = await this.Room.findOneAndUpdate(
                { roomId: roomId, ["endTurnSelectors.id"]: selectorId },
                { 
                    $pull: {
                        endTurnSelectors: {
                            id: selectorId
                        }
                    },
                    $inc: { __v: 1 }
                },
                { 
                    new: true,
                    upsert: false
                }
            ).exec();
        
            if (!updatedRoom) {
                throw new Error('Room not found or selector not present');
            }
        
            return { success: true, message: "Removed end turn selector successfully" };
        } catch (error) {
            logger.error(`Error while removing end turn selector: ${error}`);
            return { success: false, error: error.message };
        }
    }

    async addWordSelector(roomId, wordText, selector) {
        try {
            const updatedRoom = await this.Room.findOneAndUpdate(
                {
                    roomId,
                    ["words.text"]: wordText
                },
                {
                    $push: {
                        ["words.$.selectedBy"]: selector
                    },
                    $inc: { __v: 1 }
                },
                {
                    new: true,
                    upsert: false
                }
            ).exec();
        
            if (!updatedRoom) {
                throw new Error('Room not found');
            }
        
            return { success: true, message: "Added word selector successfully" };
        } catch (error) {
            logger.error(`Error while adding word selector: ${error}`);
            return { success: false, error: error.message };
        }
    }

    async removeWordSelector(roomId, wordText, selectorId) {
        try {
            const updatedRoom = await this.Room.findOneAndUpdate(
                { 
                    roomId: roomId,
                    ["words.text"]: wordText
                },
                { 
                    $pull: {
                        ["words.$.selectedBy"]: {
                            id: selectorId
                        }
                    },
                    $inc: { __v: 1 }
                },
                { 
                    new: true,
                    upsert: false
                }
            ).exec();
        
            if (!updatedRoom) {
                throw new Error('Room not found or selector not present');
            }
        
            return { success: true, message: "Removed word selector successfully" };
        } catch (error) {
            logger.error(`Error while removing word selector: ${error}`);
            return { success: false, error: error.message };
        }
    }

    async getWordPack(packId) {
        try {
            const result = await this.WordPack.findOne({ packId: packId })
                .select(`-_id`)
                .lean()
                .exec();
            if (result) {
                return { success: true, value: result };
            }
            return { success: true, value: null, message: `Couldn't find word pack with id ${packId}` };
        } catch(error) {
            logger.error(`Error while getting word pack: ${error}`);
            return { success: false, error: error.message };
        }
    }

    async getWordPackVersion(packId) {
        try {
            const result = await this.WordPack.findOne({ packId: packId })
                .select(`__v -_id`)
                .lean()
                .exec();
            if (result && result['__v']) {
                return { success: true, value: result['__v'] };
            }
            if (!result) {
                return { success: true, value: null, message: `Couldn't find word pack with id ${packId}` };
            }
            return { success: true, value: null, message: `Word pack with id ${packId} has no version attribute` };
        } catch(error) {
            logger.error(`Error while getting word pack: ${error}`);
            return { success: false, error: error.message };
        }
    }
    
    async getWordPackNoWords(packId) {
        try {
            const result = await this.WordPack.findOne({ packId: packId })
                .select(`-words -_id`)
                .lean()
                .exec();
            if (result) {
                return { success: true, value: result };
            }
            return { success: true, value: null, message: `Couldn't find word pack with id ${packId}` };
        } catch(error) {
            logger.error(`Error while getting word pack without words: ${error}`);
            return { success: false, error: error.message };
        }
    }
    
    async getWordPackWordsOnly(packId) {
        try {
            const result = await this.WordPack.findOne({ packId: packId })
                .select(`words -_id`)
                .lean()
                .exec();
            if (result && result['words']) {
                return { success: true, value: result['words'] };
            }
            if (!result) {
                return { success: true, value: null, message: `Couldn't find word pack with id ${packId}` };
            }
            return { success: true, value: [], message: `Word pack with id ${packId} has no words` };
        } catch(error) {
            logger.error(`Error while getting words from word pack: ${error}`);
            return { success: false, error: error.message };
        }
    }
    
    async getAllWordPacks() {
        try {
            const result = await this.WordPack.find({})
                .select("-words -_id")
                .lean()
                .exec();
            if (result) {
                return { success: true, value: result };
            }
            return { success: true, value: null, message: "No word packs were found" };
        } catch(error) {
            logger.error(`Error while getting all word packs: ${error}`);
            return { success: false, error: error.message };
        }
    }
    
    async setWordPack(packData) {
        try {
            const resultVersion = await this.getWordPackVersion(packData.packId);
            if (!resultVersion.success) {
                return resultVersion;
            }
            const version = resultVersion.value || 0;

            const updatedWordPack = await this.WordPack.findOneAndUpdate(
                { 
                    packId: packData.packId,
                    __v: version
                },
                {
                    $set: {
                        ...packData
                    },
                    $inc: { __v: 1 }
                },
                { upsert: true, new: true }
            ).exec();

            if (!updatedWordPack) {
                throw new Error('Version conflict');
            }
            
            return { success: true, message: 'Word pack was updated successfully' };
        } catch (error) {
            console.error('Error updating word pack:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new MongoDBAtomic();