// @ts-check
const mongoose = require("mongoose");
const userSchema = require("../MongoDBSchemas/User");

const { config } = require("../../../utils/config");

const { createClient } = require("redis");
const mongoDBAtomic = require("./MongoDB/mongoDBAtomic");
const redisAtomic = require("./Redis/redisAtomic");

const {
    userExample,
    validKeys,
    bannedRooms,
    deleteAfterMNumber,
    updateAfterMNumber,
    deleteAfterS,
    updateAfterS,
    expireAfterS,
    deleteAfterMs,
    updateAfterMs,
    expireAfterMs,
    messagesLimitNumber,
    cluesLimitNumber,
    messagesLimit,
    cluesLimit,
    LOCK_TTL
} = require("../utils/constants");

class GlobalDB {

    #redisClient;
    #mongoDBClient;
    #User;
    #redisAvailable = false;
    
    constructor() {
        this.#redisClient = createClient(config.redis.clientOptions);
        this.#redisClient.on('error', err => console.log('Redis Global Client Error', err));
    }

    async initialize() {
        try {
            this.#mongoDBClient = await mongoose.createConnection(`${config.mognoDB.baseUrl}/global`).asPromise();
            this.#User = this.#mongoDBClient.model("User", userSchema);

            await mongoDBAtomic.init(this.#mongoDBClient);

            console.log('Connected to Global MongoDB');
        } catch(error) {
            console.error('Could not connect to Global MongoDB:', error);
            throw error;
        }
        try {
            await this.#redisClient.connect();
            await redisAtomic.init(this.#redisClient);
            
            console.log('Connected to Global Redis');

            this.#redisAvailable = true;
            this.#setupAutomaticRoomPropagation();
    
        } catch (error) {
            console.error('Could not connect to Global Redis:', error);
            this.#redisAvailable = false;
        }
    }

    #validKey(key) {
        return (validKeys.includes(key));
    }

    async #fetchDataFromMongoDB(userId, key) {
        try {
            const result = await mongoDBAtomic.getUserData(userId, key);
            console.log(result);

            const value = result.success ? result.value : null;

            if (this.#redisAvailable && value) {
                await redisAtomic.set(userId, key, value, expireAfterS);
            }

            return { success: true, value: value };
        } catch (error) {
            console.log("Error while fetching data from MongoDB:", error);
            return { success: false, error: error.message };
        }
        
    }

    #getRedisKey(userId, key) {
        if (!userId) throw new Error('User ID is required');
        return key ? `user:${userId}:${key.replace(/\./g, ':')}` : `user:${userId}`;
    }

    async #createRedisEntry(userId, key, skipLock = false) {
        if (!this.#redisAvailable) return;

        const redisKey = this.#getRedisKey(userId, key);
        const hydrate = async () => {
            const exists = await this.#redisClient.exists(redisKey);
            if (!exists) {
                const result = await this.#fetchDataFromMongoDB(userId, key);
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
                const result = await this.#fetchDataFromMongoDB(userId, key);
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
                    const reply = await this.#redisClient.scan(cursor, { MATCH: 'user:*', COUNT: 100 });
                    cursor = reply.cursor;
                    updateKeys.push(...reply.keys);
                } while (cursor !== "0");

                const userDataMap = new Map();

                for (const key of updateKeys) {
                    const [, userId, field] = key.split(':');
                    const value = await this.#redisClient.get(key);
                    if (value) {
                        let roomData = userDataMap.get(userId);
                        if (!roomData) {
                            roomData = {};
                            userDataMap.set(userId, roomData);
                        }
                        roomData[field] = JSON.parse(value);
                    }
                }

                for (const [userId, data] of userDataMap) {
                    await mongoDBAtomic.setUserData(userId, null, data);
                }
            } catch (err) {
                console.error('Sync worker error:', err);
            }
        }, +updateAfterMs);
    }

    async createUserEntry(userId) {
        try {
            if (userId === "") {
                throw new Error("User ID is empty");
            }

            let count = 0;

            while (count < 5) {
                const result = await mongoDBAtomic.createUser(userId);
                if (result.success || !result.retryable) {
                    return result;
                }
                count++;
            }

            return { success: false, error: "Couldn't create user in 5 attempts" };
        } catch (error) {
            console.log("Error on creating room:", error);
            return { success: false, error: error.message };
        }
    }
    
    async getUserData(userId, key) {
        try {
            if (userId === "") {
                throw new Error("User ID is empty");
            }

            if (!this.#validKey(key)) {
                throw new Error(`Invalid key given: (${key})`);
            }

            if (this.#redisAvailable) {
                const redisKey = this.#getRedisKey(userId, key);

                if (await this.#redisClient.exists(redisKey)) {
                    const result = await redisAtomic.get(userId, key, expireAfterS);
                    if (result.success && result.value !== undefined) {
                        return result;
                    }
                }

                return await this.#withRedisLock(redisKey, async () => {
                    if (await this.#redisClient.exists(redisKey)) {
                        const result = await redisAtomic.get(userId, key, expireAfterS);
                        if (result.success && result.value !== undefined) {
                            return result;
                        }
                    }

                    const dbResult = await this.#fetchDataFromMongoDB(userId, key);
                    if (!dbResult.success) {
                        return dbResult;
                    }
                    const value = dbResult.value;
    
                    return { success: true, value: value };
                });
            }
    
            const dbResult = await this.#User.findOne({ _id: userId })
                .select(`${key} -_id`)
                .lean()
                .exec();

            const value = dbResult ? dbResult[key] : null;

            return { success: true, value: value };
        }
        catch (error) {
            console.log("Error on getting user data:", error);
            return { success: false, error: error.message };
        }
    }
    
    async getFullUserData(userId) {
        try {
            if (userId === "") {
                throw new Error("User ID is empty");
            }

            return await mongoDBAtomic.getFullUserData(userId);
        } catch (error) {
            console.log("Error on getting full user data:", error);
            return { success: false, error: error.message };
        }
    }
    
    async setUserData(userId, key, value) {
        try {
            if (userId === "") {
                throw new Error("User ID is empty");
            }

            if (!this.#validKey(key)) {
                throw new Error(`Invalid key given: (${key})`);
            }

            if (this.#redisAvailable) {
                const redisKey = this.#getRedisKey(userId, key);
                return await this.#withRedisLock(redisKey, async () => {
                    await this.#createRedisEntry(userId, key);

                    const result = await redisAtomic.set(userId, key, value, expireAfterS);
                    return result;
                });
            }
    
            return await mongoDBAtomic.setUserData(userId, key, value);
        } catch (error) {
            console.error("Error while updating user data:", error);
            return { success: false, error: error.message };
        }
    }
    
    async updateUserData(userId, newData) {
        try {
            if (userId === "") {
                throw new Error("User ID is empty");
            }

            console.log(newData);

            const keys = Object.keys(newData);

            for (const key of keys) {
                if (!this.#validKey(key)) {
                    throw new Error(`Invalid key given: ${key}`);
                }
            }

            const values = Object.values(newData);

            if (this.#redisAvailable) {
                return await this.#withMultiRedisLocks(keys, async () => {
                    await Promise.all(
                        keys.map((key) => this.#createRedisEntry(userId, key, true))
                    );
                    
                    const result = await redisAtomic.setMultiple(userId, keys, values);
                    return result;
                });
            }
    
            return await mongoDBAtomic.setUserData(userId, null, newData);
        } catch (error) {
            console.error("Error while updating user data:", error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new GlobalDB();