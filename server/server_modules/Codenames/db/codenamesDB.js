// @ts-check



const mongoose = require("mongoose");
const roomSchema = require("../MongoDBSchemas/Room");
const wordPackSchema = require("../MongoDBSchemas/WordPack");

const { config } = require("../../../utils/config");

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
    selectorZodSchema,
    wordZodSchema,
    chatMessageZodSchema
} = require("../ZodSchemas/codenamesZodSchemas");

const {
    makeID
} = require("../../../utils/extra");
const {
    defaultRoomData,
    additionalValidKeys,
    bannedRooms,
    deleteAfterMNumber,
    updateAfterMNumber,
    deleteAfterS,
    updateAfterS,
    expireAfterS,
    deleteAfterMs,
    updateAfterMs,
    expireAfterMs,
    messagesLimit,
    cluesLimit,
    LOCK_TTL
} = require("../utils/constants");

const { createClient } = require("redis");
const mongoDBAtomic = require("./MongoDB/mongoDBAtomic");
const redisAtomic = require("./Redis/redisAtomic");

// @ts-ignore TS18028
class CodenamesDB {
    #redisClient
    #mongoDBClient
    #Room
    #WordPack
    #redisAvailable = false

    constructor() {
        this.#redisClient = createClient(config.redis.clientOptions);
        this.#redisClient.on('error', err => console.log('Redis Codenames Client Error', err));
    }

    async initialize() {
        try {
            this.#mongoDBClient = await mongoose.createConnection(`${config.mognoDB.baseUrl}/codenames`).asPromise();
            this.#Room = this.#mongoDBClient.model("Room", roomSchema);
            this.#WordPack = this.#mongoDBClient.model("WordPack", wordPackSchema);

            await mongoDBAtomic.init(this.#mongoDBClient);

            console.log('Connected to Codenames MongoDB');
        } catch (error) {
            console.error('Could not connect to Codenames MongoDB:', error);
            throw error;
        }
        try {
            await this.#redisClient.connect();
            await redisAtomic.init(this.#redisClient);
    
            // await this.#redisClient.flushAll("ASYNC");
            
            console.log('Connected to Codenames Redis');

            this.#redisAvailable = true;
            this.#setupAutomaticRoomPropagation();
    
        } catch (error) {
            console.error('Could not connect to Codenames Redis:', error);
            this.#redisAvailable = false;
        }
    }

    #validKey(key) {
        return (defaultRoomData.hasOwnProperty(key) || additionalValidKeys.includes(key));
    }

    async #fetchDataFromMongoDB(roomId, key) {
        try {
            const result = await mongoDBAtomic.getRoomData(roomId, key);
            console.log(result);

            const value = result.success ? result.value : null;

            if (this.#redisAvailable && value) {
                await redisAtomic.set(roomId, key, value, expireAfterS);
            }

            return { success: true, value: value };
        } catch (error) {
            console.log("Error while fetching data from MongoDB:", error);
            return { success: false, error: error.message };
        }
        
    }

    #getRedisKey(roomId, key) {
        if (!roomId) throw new Error('Room ID is required');
        return key ? `room:${roomId}:${key.replace(/\./g, ':')}` : `room:${roomId}`;
    }

    async #createRedisEntry(roomId, key, skipLock = false) {
        if (!this.#redisAvailable) return;

        const redisKey = this.#getRedisKey(roomId, key);
        const hydrate = async () => {
            const exists = await this.#redisClient.exists(redisKey);
            if (!exists) {
                const result = await this.#fetchDataFromMongoDB(roomId, key);
                if (!result.success) {
                    console.error("Failed to fetch from Mongo during Redis entry creation:", result.error);
                }
            }
        };

        if (skipLock) {
            return await hydrate();
        }
    
        const lockKey = `lock:${redisKey}`;
        const lockValue = `${process.pid}-${Date.now()}-${Math.random()}`;
        
    
        const lockSet = await this.#redisClient.set(lockKey, lockValue, { NX: true, PX: LOCK_TTL });
    
        if (!lockSet) return;
    
        try {
            const exists = await this.#redisClient.exists(redisKey);
            if (!exists) {
                const result = await this.#fetchDataFromMongoDB(roomId, key);
                if (!result.success) {
                    console.error("Failed to fetch from Mongo during Redis entry creation:", result.error);
                }
            }
        } finally {
            const currentValue = await this.#redisClient.get(lockKey);
            if (currentValue === lockValue) {
                await this.#redisClient.del(lockKey);
            }
        }
    }

    async #withRedisLock(redisKey, fn) {
        const lockKey = `lock:${redisKey}`;
        const lockValue = `${process.pid}-${Date.now()}-${Math.random()}`;
        console.log(lockKey, lockValue);
        const acquired = await this.#redisClient.set(lockKey, lockValue, { NX: true, PX: LOCK_TTL });
        console.log(acquired);
        if (!acquired) return { success: false, error: "Could not acquire lock" };
    
        try {
            return await fn();
        } finally {
            const currentValue = await this.#redisClient.get(lockKey);
            if (currentValue === lockValue) {
                await this.#redisClient.del(lockKey);
            }
        }
    }

    async #withMultiRedisLocks(keys, fn) {
        const sorted = [...keys].sort();
        const acquire = async (index) => {
            if (index === sorted.length) return await fn();
            return await this.#withRedisLock(sorted[index], () => acquire(index + 1));
        };
        return await acquire(0);
    }

    #setupAutomaticRoomPropagation() {
        if (!this.#redisAvailable) return;

        setInterval(async () => {
            try {
                const updateKeys = [];
                let cursor = "0";
                do {
                    const reply = await this.#redisClient.scan(cursor, { MATCH: 'room:*', COUNT: 100 });
                    cursor = reply.cursor;
                    updateKeys.push(...reply.keys);
                } while (cursor !== "0");

                const roomDataMap = new Map();

                for (const key of updateKeys) {
                    const [, roomId, field] = key.split(':');
                    const value = await this.#redisClient.get(key);
                    if (value) {
                        let roomData = roomDataMap.get(roomId);
                        if (!roomData) {
                            roomData = {};
                            roomDataMap.set(roomId, roomData);
                        }
                        roomData[field] = JSON.parse(value);
                    }
                }

                for (const [roomId, data] of roomDataMap) {
                    await mongoDBAtomic.setRoomData(roomId, null, data);
                }
            } catch (err) {
                console.error('Sync worker error:', err);
            }
        }, +updateAfterMs);
    }

    async getFreeRoom() {
        try {
            let newRoomId = makeID(8);
            let resultUsers = await this.getRoomData(newRoomId, "users");
            if (!resultUsers.success) { 
                return resultUsers;
            }
            let resultUpdatedAt = await this.getRoomData(newRoomId, "updatedAt");
            if (!resultUpdatedAt.success) {
                return resultUpdatedAt;
            }

            let users = resultUsers.value;
            let count = 0;
            while (users && count < 100) {
                const now = new Date();
                const updatedAt = new Date(resultUpdatedAt.value);
                const differenceInMs = now - updatedAt;
                const roomIsAFK = users.every((user) => !user.online);
                if (roomIsAFK && differenceInMs >= +deleteAfterMs && await this.deleteRoom(newRoomId)) {
                    break;
                }
                newRoomId = makeID(8);
                resultUsers = await this.getRoomData(newRoomId, "users");
                if (!resultUsers.success) { 
                    return resultUsers;
                }
                users = resultUsers.value;
                count++;
            }

            if (count === 100) {
                return { success: false, error: "Couldn't create a new free room code in 100 iterations." };
            }
            return { success: true, value: newRoomId };
        } catch (error) {
            console.log("Error on getting free room:", error);
            return { success: false, error: error.message };
        }
    }

    async createRoom(roomId) {
        try {
            if (bannedRooms.has(roomId)) {
                throw new Error(`Specified room ID (${roomId}) is banned`);
            }

            return await mongoDBAtomic.createRoom(roomId);
        } catch (error) {
            console.log("Error on creating room:", error);
            return { success: false, error: error.message };
        }
    }

    async deleteRoom(roomId) {
        const result = await this.#Room.deleteOne({ roomId: roomId }).exec();
        return result.deletedCount !== 0;
    }

    async getRoomData(roomId, key) {
        try {
            if (bannedRooms.has(roomId)) {
                throw new Error(`Specified room ID (${roomId}) is banned`);
            }
            if (!this.#validKey(key)) {
                throw new Error(`Invalid key given: (${key})`);
            }

            if (this.#redisAvailable) {
                const redisKey = this.#getRedisKey(roomId, key);

                if (await this.#redisClient.exists(redisKey)) {
                    const result = await redisAtomic.get(roomId, key, expireAfterS);
                    if (result.success && result.value !== undefined) {
                        return result;
                    }
                }

                return await this.#withRedisLock(redisKey, async () => {
                    if (await this.#redisClient.exists(redisKey)) {
                        const result = await redisAtomic.get(roomId, key, expireAfterS);
                        if (result.success && result.value !== undefined) {
                            return result;
                        }
                    }

                    const dbResult = await this.#fetchDataFromMongoDB(roomId, key);
                    if (!dbResult.success) {
                        return dbResult;
                    }
                    const value = dbResult.value;
    
                    return { success: true, value: value };
                });
            }
    
            const dbResult = await this.#Room.findOne({ roomId: roomId })
                .select(`${key} -_id`)
                .lean()
                .exec();

            const value = dbResult ? dbResult[key] : null;

            return { success: true, value: value };
        }
        catch (error) {
            console.log("Error on getting codenames data:", error);
            return { success: false, error: error.message };
        }
    }

    async setRoomData(roomId, key, value) {
        // console.log(roomId, key, value);
        try {
            if (bannedRooms.has(roomId)) {
                throw new Error(`Specified room ID (${roomId}) is banned`);
            }
            if (!this.#validKey(key)) {
                throw new Error(`Invalid key given: (${key})`);
            }

            if (this.#redisAvailable) {
                const redisKey = this.#getRedisKey(roomId, key);
                return await this.#withRedisLock(redisKey, async () => {
                    await this.#createRedisEntry(roomId, key);

                    const result = await redisAtomic.set(roomId, key, value, expireAfterS);
                    return result;
                });
            }
    
            return await mongoDBAtomic.setRoomData(roomId, key, value);
        } catch (error) {
            console.error("Error while updating room data:", error);
            return { success: false, error: error.message };
        }
    }

    async addChatMessageToRoomData(roomId, senderName, senderID, messageText) {
        try {
            if (bannedRooms.has(roomId)) {
                throw new Error(`Specified room ID (${roomId}) is banned`);
            }
    
            const newMessage = {
                senderName,
                senderID,
                messageText
            };
            const resultNewMessage = chatMessageZodSchema.safeParse(newMessage);
            if (!resultNewMessage) {
                throw new Error(`Invalid message: ${newMessage}`);
            }

            if (this.#redisAvailable) {
                const redisKey = this.#getRedisKey(roomId, "chatMessages");
                return await this.#withRedisLock(redisKey, async () => {
                    await this.#createRedisEntry(roomId, "chatMessages");

                    const result = await redisAtomic.addChatMessage(roomId, newMessage, expireAfterS);
                    if (!result.success) {
                        return result;
                    }
                    return { success: true, message: 'Chat message added successfully' };
                });
            }

            return await mongoDBAtomic.addChatMessage(roomId, newMessage);
        } catch (error) {
            console.error('Error on adding chat message:', error);
            return { success: false, error: error.message };
        }
    }
    
    async addNewClue(roomId, teamColor, newClue) {
        try {
            if (bannedRooms.has(roomId)) {
                throw new Error(`Specified room ID (${roomId}) is banned`);
            }
    
            const resultTeamColor = validTeamColorZodSchema.safeParse(teamColor);
            if (!resultTeamColor.success) {
                throw new Error(`Invalid team color: ${teamColor}`);
            }
    
            const resultClue = clueZodSchema.safeParse(newClue);
            if (!resultClue.success) {
                throw new Error(`Clue object is invalid: ${newClue}`);
            }

            if (this.#redisAvailable) {
                const redisKey = this.#getRedisKey(roomId, "clues");
                return await this.#withRedisLock(redisKey, async () => {
                    await this.#createRedisEntry(roomId, "clues");

                    const result = await redisAtomic.addClue(roomId, teamColor, newClue, expireAfterS);
                    if (!result.success) {
                        return result;
                    }
                    const resultMessage = `Successfully added clue with ID ${newClue.id} to team ${teamColor}`;
                    console.log(resultMessage);
                    return { success: true, message: resultMessage };
                });
            }

            return await mongoDBAtomic.addClue(roomId, teamColor, newClue);
        } catch (error) {
            console.error("Error on adding clue:", error);
            return { success: false, error: error.message };
        }
    }
    
    async updateClue(roomId, clueId, newClue) {
        try {
            if (bannedRooms.has(roomId)) {
                throw new Error(`Specified room ID (${roomId}) is banned`);
            }
    
            const resultClue = clueZodSchema.safeParse(newClue);
            if (!resultClue.success) {
                throw new Error(`Clue object is invalid: ${newClue}`);
            }

            if (this.#redisAvailable) {
                const redisKey = this.#getRedisKey(roomId, "clues");
                return await this.#withRedisLock(redisKey, async () => {
                    await this.#createRedisEntry(roomId, "clues");

                    const result = await redisAtomic.updateClue(roomId, clueId, newClue, expireAfterS);
                    if (!result.success) {
                        return result;
                    }
                    const resultMessage = `Successfully updated clue with ID ${clueId}`;
                    console.log(resultMessage);
                    return { success: true, message: resultMessage };
                });
            }

            return await mongoDBAtomic.updateClue(roomId, clueId, newClue);
        } catch (error) {
            console.error("Error on updating clue:", error);
            return { success: false, error: error.message };
        }
    }
    
    async addEndTurnSelector(roomId, newEndTurnSelector) {
        try {
            if (bannedRooms.has(roomId)) {
                throw new Error(`Specified room ID (${roomId}) is banned`);
            }
    
            const resultEndTurnSelector = selectorZodSchema.safeParse(newEndTurnSelector);
            if (!resultEndTurnSelector.success) {
                throw new Error(`Selector object is invalid: ${newEndTurnSelector}`);
            }

            if (this.#redisAvailable) {
                const redisKey = this.#getRedisKey(roomId, "endTurnSelectors");
                return await this.#withRedisLock(redisKey, async () => {
                    await this.#createRedisEntry(roomId, "endTurnSelectors");

                    const result = await redisAtomic.addEndTurnSelector(roomId, newEndTurnSelector, expireAfterS);
                    if (!result.success) {
                        return result;
                    }
                    const resultMessage = `Successfully added selector with ID ${newEndTurnSelector.id}`;
                    console.log(resultMessage);
                    return { success: true, message: resultMessage };
                });
            }

            return await mongoDBAtomic.addEndTurnSelector(roomId, newEndTurnSelector);
        } catch (error) {
            console.error("Error on adding end turn selector:", error);
            return { success: false, error: error.message };
        }
    }
    
    async removeEndTurnSelector(roomId, selectorId) {
        try {
            if (bannedRooms.has(roomId)) {
                throw new Error(`Specified room ID (${roomId}) is banned`);
            }
    
            const resultSelectorId = playerIdZodSchema.safeParse(selectorId);
            if (!resultSelectorId.success) {
                throw new Error(`Selector ID is invalid: ${selectorId}`);
            }

            if (this.#redisAvailable) {
                const redisKey = this.#getRedisKey(roomId, "endTurnSelectors");
                return await this.#withRedisLock(redisKey, async () => {
                    await this.#createRedisEntry(roomId, "endTurnSelectors");

                    const result = await redisAtomic.removeEndTurnSelector(roomId, selectorId, expireAfterS);
                    if (!result.success) {
                        return result;
                    }
                    const resultMessage = `Successfully removed selector with ID ${selectorId}`;
                    console.log(resultMessage);
                    return { success: true, message: resultMessage };
                });
            }

            return await mongoDBAtomic.removeEndTurnSelector(roomId, selectorId);
        } catch (error) {
            console.error("Error removing selector:", error);
            return { success: false, error: error.message };
        }
    }
    
    async addWordSelector(roomId, wordText, newSelector) {
        if (wordText === "endTurn") {
            return await this.addEndTurnSelector(roomId, newSelector);
        }
        try {
            if (bannedRooms.has(roomId)) {
                throw new Error(`Specified room ID (${roomId}) is banned`);
            }
            
            const resultSelector = selectorZodSchema.safeParse(newSelector);
            if (!resultSelector.success) {
                throw new Error(`Selector object is invalid: ${newSelector}`);
            }

            if (this.#redisAvailable) {
                const redisKey = this.#getRedisKey(roomId, "words");
                return await this.#withRedisLock(redisKey, async () => {
                    await this.#createRedisEntry(roomId, "words");

                    const result = await redisAtomic.addWordSelector(roomId, wordText, newSelector, expireAfterS);
                    if (!result.success) {
                        return result;
                    }
                    const resultMessage = `Successfully removed selector with ID ${newSelector.id}`;
                    console.log(resultMessage);
                    return { success: true, message: resultMessage };
                });
            }

            return await mongoDBAtomic.addWordSelector(roomId, wordText, newSelector);
        } catch (error) {
            console.error("Error adding selector:", error);
            return { success: false, error: error.message };
        }
    }
    
    async removeWordSelector(roomId, wordText, selectorId) {
        if (wordText === "endTurn") {
            return await this.removeEndTurnSelector(roomId, selectorId);
        }
        try {
            if (bannedRooms.has(roomId)) {
                throw new Error(`Specified room ID (${roomId}) is banned`);
            }
    
            const resultSelectorId = playerIdZodSchema.safeParse(selectorId);
            if (!resultSelectorId.success) {
                throw new Error(`Selector ID is invalid: ${selectorId}`);
            }

            if (this.#redisAvailable) {
                const redisKey = this.#getRedisKey(roomId, "words");
                return await this.#withRedisLock(redisKey, async () => {
                    await this.#createRedisEntry(roomId, "words");

                    const result = await redisAtomic.removeWordSelector(roomId, wordText, selectorId, expireAfterS);
                    if (!result.success) {
                        return result;
                    }
                    const resultMessage = `Successfully removed selector with ID ${selectorId}`;
                    console.log(resultMessage);
                    return { success: true, message: resultMessage };
                });
            }

            return await mongoDBAtomic.removeWordSelector(roomId, wordText, selectorId);
        } catch (error) {
            console.error("Error removing selector:", error);
            return { success: false, error: error.message };
        }
    }
    
    async getWordPack(packId) {
        try {
            return await mongoDBAtomic.getWordPack(packId);
        } catch(error) {
            console.log("Error while getting word pack:", error);
            return { success: false, error: error.message };
        }
    }
    
    async getWordPackNoWords(packId) {
        try {
            return await mongoDBAtomic.getWordPackNoWords(packId);
        } catch(error) {
            console.log("Error while getting word pack without words:", error);
            return { success: false, error: error.message };
        }
    }
    
    async getWordPackWordsOnly(packId) {
        try {
            return await mongoDBAtomic.getWordPackWordsOnly(packId);
        } catch(error) {
            console.log("Error while getting words from word pack:", error);
            return { success: false, error: error.message };
        }
    }
    
    async getAllWordPacks() {
        try {
            return await mongoDBAtomic.getAllWordPacks();
        } catch(error) {
            console.log("Error while getting all word packs:", error);
            return { success: false, error: error.message };
        }
    }
    
    async setWordPack(packData) {
        try {
            return await mongoDBAtomic.setWordPack(packData);
        } catch (error) {
            console.error('Error updating word pack:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new CodenamesDB();