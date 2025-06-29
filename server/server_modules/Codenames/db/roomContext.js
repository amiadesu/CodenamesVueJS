const CodenamesDB = require('./codenamesDB');
const { Mutex } = require('async-mutex');

/**
 * @type {Room}
 */
class RoomContext {
    constructor(roomId) {
        this.roomId = roomId;
        this.#cache = {};
        this.#dirty = new Set();
        this.alwaysGetNewData = true;
        this.#mutex = new Mutex();
    }

    #cache;
    #dirty;
    #mutex;

    async #withLock(fn) {
        const release = await this.#mutex.acquire();
        try {
            return await fn();
        } finally {
            release();
        }
    }

    async get(field, forceNew = true) {
        return this.#withLock(async () => {
            if (!(field in this.#cache) || (this.alwaysGetNewData && forceNew)) {
                this.#cache[field] = (await CodenamesDB.getRoomData(this.roomId, field)).value;
            }
            return this.#cache[field];
        });
    }

    async set(field, value, forceUpdate = true) {
        return this.#withLock(async () => {
            if (forceUpdate) {
                await CodenamesDB.setRoomData(this.roomId, field, value);
                return;
            }
            this.#cache[field] = value;
            this.#dirty.add(field);
        });
    }

    async preload(fields) {
        return this.#withLock(async () => {
            await Promise.all(fields.map(async (field) => {
                if (!(field in this.#cache)) {
                    this.#cache[field] = (await CodenamesDB.getRoomData(this.roomId, field)).value;
                }
            }));
        });
    }

    async save() {
        return this.#withLock(async () => {
            await Promise.all([...this.#dirty].map(async (field) => {
                await CodenamesDB.setRoomData(this.roomId, field, this.#cache[field]);
            }));
            this.#dirty.clear();
        });
    }

    // Helper for common fields
    async getClueIDCounter(forceNew = true)                   { return await this.get('clueIDCounter', forceNew); }
    async setClueIDCounter(clueIDCounter, forceUpdate = true) { return await this.set('clueIDCounter', clueIDCounter, forceUpdate); }

    async getUsers(forceNew = true)                           { return await this.get('users', forceNew); }
    async setUsers(users, forceUpdate = true)                 { return await this.set('users', users, forceUpdate); }

    async getTeams(forceNew = true)                           { return await this.get('teams', forceNew); }
    async setTeams(teams, forceUpdate = true)                 { return await this.set('teams', teams, forceUpdate); }

    async getTraitors(forceNew = true)                        { return await this.get('traitors', forceNew); }
    async setTraitors(traitors, forceUpdate = true)           { return await this.set('traitors', traitors, forceUpdate); }

    async getWords(forceNew = true)                           { return await this.get('words', forceNew); }
    async setWords(words, forceUpdate = true)                 { return await this.set('words', words, forceUpdate); }

    async getGameRules(forceNew = true)                       { return await this.get('gameRules', forceNew); }
    async setGameRules(gr, forceUpdate = true)                { return await this.set('gameRules', gr, forceUpdate); }

    async getGameProcess(forceNew = true)                     { return await this.get('gameProcess', forceNew); }
    async setGameProcess(gp, forceUpdate = true)              { return await this.set('gameProcess', gp, forceUpdate); }

    async getGameWinStatus(forceNew = true)                   { return await this.get('gameWinStatus', forceNew); }
    async setGameWinStatus(gws, forceUpdate = true)           { return await this.set('gameWinStatus', gws, forceUpdate); }

    async getChatMessages(forceNew = true)                    { return await this.get('chatMessages', forceNew); }
    async setChatMessages(cm, forceUpdate = true)             { return await this.set('chatMessages', cm, forceUpdate); }

    async getEndTurnSelectors(forceNew = true)                { return await this.get('endTurnSelectors', forceNew); }
    async setEndTurnSelectors(ets, forceUpdate = true)        { return await this.set('endTurnSelectors', ets, forceUpdate); }

    async addWordSelector(wordText, selectorObject) {
        return this.#withLock(async () => {
            return await CodenamesDB.addWordSelector(this.roomId, wordText, selectorObject);
        });
    }
    async removeWordSelector(wordText, selectorId) {
        return this.#withLock(async () => {
            return await CodenamesDB.removeWordSelector(this.roomId, wordText, selectorId);
        });
    }

    async getClues(forceNew = true)                           { return await this.get('clues', forceNew); }
    async setClues(clues, forceUpdate = true)                 { return await this.set('clues', clues, forceUpdate); }
    async addNewClue(teamColor, newClueObject) {
        return this.#withLock(async () => {
            return await CodenamesDB.addNewClue(this.roomId, teamColor, newClueObject);
        });
    }
    async updateClueByID(clueId, newClueObject) {
        return this.#withLock(async () => {
            return await CodenamesDB.updateClue(this.roomId, clueId, newClueObject);
        });
    }
}
 
module.exports = RoomContext;