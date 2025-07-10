const fs = require('fs');
const path = require('path');

const { logger } = require("../../../../utils/logger");

const {
    messagesLimit,
    cluesLimit
} = require("../../utils/constants");

class RedisAtomic {
    static SCRIPT_NAMES = Object.freeze([
        'add_new_chat_message',
        'add_new_clue',
        'update_clue',
        'add_end_turn_selector',
        'remove_end_turn_selector',
        'add_word_selector',
        'remove_word_selector'
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

    #getRedisKey(roomId, key) {
        if (!roomId) throw new Error('Room ID is required');
        return key ? `room:${roomId}:${key.replace(/\./g, ':')}` : `room:${roomId}`;
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
            console.error("Error loading Lua scripts:", error);
            return { success: false, error: error.message };
        }
    }

    async get(roomId, key, expireAfterS) {
        try {
            const redisKey = this.#getRedisKey(roomId, key);
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

    async set(roomId, key, value, expireAfterS) {
        try {
            const redisKey = this.#getRedisKey(roomId, key);
            await this.client.set(redisKey, JSON.stringify(value), { EX: expireAfterS });
            return { success: true, message: "Setted data successfully" };
        } catch (error) {
            logger.error(`Error while setting data: ${error}`);
            return { success: false, error: error.message };
        }
    }

    // Non-standart operations defined in .lua scripts
    async #executeAtomicOperation(operation, roomId, keys = [], args = []) {
        if (!this.scripts.has(operation)) {
            throw new Error(`Operation ${operation} not supported`);
        }
        try {
            const updatedAtKey = this.#getRedisKey(roomId, "updatedAt");
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
                    return this.#executeAtomicOperation(operation, roomId, keys, args);
                }
                throw new Error(result.err);
            }

            return { 
                success: true, 
                data: result,
                message: result.ok || 'Operation completed successfully'
            };
        } catch (error) {
            console.error(`${operation} failed:`, error);
            return { 
                success: false, 
                error: error.message,
                retryable: error.message.includes('NOSCRIPT')
            };
        }
    }

    // Chat Operations
    async addChatMessage(roomId, newMessage, expireAfterS) {
        return this.#executeAtomicOperation('add_new_chat_message', roomId,
            [this.#getRedisKey(roomId, "chatMessages")],
            [JSON.stringify(newMessage), messagesLimit, expireAfterS]
        );
    }

    // Clue Operations
    async addClue(roomId, teamColor, newClue, expireAfterS) {
        return this.#executeAtomicOperation('add_new_clue', roomId,
            [this.#getRedisKey(roomId, "clues")],
            [teamColor, JSON.stringify(newClue), cluesLimit, expireAfterS]
        );
    }

    async updateClue(roomId, clueId, newClue, expireAfterS) {
        return this.#executeAtomicOperation('update_clue', roomId,
            [this.#getRedisKey(roomId, "clues")],
            [clueId.toString(), JSON.stringify(newClue), expireAfterS]
        );
    }

    // Selector Operations
    async addEndTurnSelector(roomId, selector, expireAfterS) {
        return this.#executeAtomicOperation('add_end_turn_selector', roomId,
            [this.#getRedisKey(roomId, "endTurnSelectors")],
            [JSON.stringify(selector), expireAfterS]
        );
    }

    async removeEndTurnSelector(roomId, selectorId, expireAfterS) {
        return this.#executeAtomicOperation('remove_end_turn_selector', roomId,
            [this.#getRedisKey(roomId, "endTurnSelectors")],
            [selectorId, expireAfterS]
        );
    }

    async addWordSelector(roomId, wordText, selector, expireAfterS) {
        return this.#executeAtomicOperation('add_word_selector', roomId,
            [this.#getRedisKey(roomId, "words")],
            [wordText, JSON.stringify(selector), expireAfterS]
        );
    }

    async removeWordSelector(roomId, wordText, selectorId, expireAfterS) {
        return this.#executeAtomicOperation('remove_word_selector', roomId,
            [this.#getRedisKey(roomId, "words")],
            [wordText, selectorId, expireAfterS]
        );
    }
}

module.exports = new RedisAtomic();