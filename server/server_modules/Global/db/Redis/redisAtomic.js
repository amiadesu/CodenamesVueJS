// @ts-check
const { logger } = require("../../../../utils/logger");

const fs = require('fs');
const path = require('path');
const { expireAfterS } = require('../../utils/constants');

class RedisAtomic {
    static SCRIPT_NAMES = Object.freeze([
        'set_multiple'
    ]);

    constructor() {
        this.scripts = new Map();
        this.client = null;
    }

    async init(redisClient) {
        if (!redisClient) throw new Error('Redis client is required');
        this.client = redisClient;
        const { success, error } = await this.#loadLuaScripts();
        if (!success) throw new Error(`Failed to load scripts: ${error}`);
    }

    #getRedisKey(userId, key) {
        if (!userId) throw new Error('User ID is required');
        return key ? `user:${userId}:${key.replace(/\./g, ':')}` : `user:${userId}`;
    }

    async #loadLuaScript(fileName) {
        const filePath = path.resolve(__dirname, "LuaScripts", fileName);
        return fs.promises.readFile(filePath, 'utf8');
    }

    async #loadLuaScripts() {
        try {
            await Promise.all(RedisAtomic.SCRIPT_NAMES.map(async (name) => {
                const script = await this.#loadLuaScript(`${name}.lua`);
                const sha1 = await this.client.scriptLoad(script);
                this.scripts.set(name, sha1);
            }));
            return { success: true, message: "Scripts were loaded successfully" };
        } catch (error) {
            logger.error(`Error loading Lua scripts: ${error}`);
            return { success: false, error: error.message };
        }
    }

    async get(userId, key, expireAfterS) {
        try {
            const redisKey = this.#getRedisKey(userId, key);
            let data = await this.client.getEx(redisKey, { EX: expireAfterS });
            if (data) {
                data = JSON.parse(data);
                return { success: true, value: data };
            }
            return { success: true, value: null, message: "Couldn't find anything" };
        } catch (error) {
            logger.error(`Error while getting data: ${error}`);
            return { success: false, error: error.message };
        }
    }

    async set(userId, key, value, expireAfterS) {
        try {
            const redisKey = this.#getRedisKey(userId, key);
            await this.client.set(redisKey, JSON.stringify(value), { EX: expireAfterS });
            return { success: true, message: "Setted data successfully" };
        } catch (error) {
            logger.error(`Error while setting data: ${error}`);
            return { success: false, error: error.message };
        }
    }

    // Non-standart operations defined in .lua scripts
    async #executeAtomicOperation(operation, userId, keys = [], args = []) {
        if (!this.scripts.has(operation)) {
            throw new Error(`Operation ${operation} not supported`);
        }
        try {
            const updatedAtKey = this.#getRedisKey(userId, "updatedAt");
            const updatedAt = Date.now().toString();

            const allKeys = [...keys, updatedAtKey];
            const allArgs = [...args, updatedAt];

            const result = await this.client.evalSha(
                this.scripts.get(operation),
                { keys: allKeys, arguments: allArgs }
            );

            if (result?.err) {
                if (result.err.includes('NOSCRIPT')) {
                    await this.#loadLuaScripts();
                    return this.#executeAtomicOperation(operation, userId, keys, args);
                }
                throw new Error(result.err);
            }

            return { 
                success: true, 
                data: result,
                message: result.ok || 'Operation completed successfully'
            };
        } catch (error) {
            logger.error(`${operation} failed: ${error}`);
            return { 
                success: false, 
                error: error.message,
                retryable: error.message.includes('NOSCRIPT')
            };
        }
    }

    async setMultiple(userId, keys, values) {
        return this.#executeAtomicOperation('set_multiple', userId,
            keys.map((key) => this.#getRedisKey(userId, key)),
            [...values.map((value) => JSON.stringify(value)), expireAfterS]
        );
    }
}

module.exports = new RedisAtomic();