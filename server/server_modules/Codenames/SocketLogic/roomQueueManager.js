// @ts-check
const Queue = require('bull');
const { Mutex } = require('async-mutex');
const redis = require('redis');

const {
    getGameboardEvent,
    selectWordEvent,
    processClickEvent
} = require("./gameboard");
const {
    sendClueEvent,
    editClueEvent,
    getCluesEvent
} = require("./clues");
const {
    editUserNameEvent,
    changeUserColorEvent,
    stateChangedEvent
} = require("./user");
const {
    getAllWordPacksEvent,
    getWordPackNoWordsEvent,
    getWordsFromWordPackEvent
} = require("./wordPacks");
const {
    setNewGameRulesEvent,
    refreshGameboardEvent,
    randomizeTeamOrderEvent,
    passTurnEvent,
    removeAllPlayersEvent,
    removePlayerEvent,
    randomizePlayersEvent,
    transferHostEvent
} = require("./host");
const {
    startNewGameEvent,
    getTraitorsEvent
} = require("./gameProcess");
const { config } = require("../../../utils/config");

class RoomQueueManager {
    constructor(io) {
        if (!io) {
            throw new Error('Socket.IO instance is required');
        }

        this.queues = new Map();
        this.mutexes = new Map();
        this.io = io;
        
        this.redisClient = redis.createClient(config.redis.clientOptions);
        this.redisClient.on('error', (err) => {
            console.error('Redis client error:', err);
        });

        // Event processors now expect positional arguments
        this.eventProcessors = {
            // Gameboard events
            'get_gameboard': this.processGetGameboard.bind(this),
            'select_word': this.processSelectWord.bind(this),
            'process_click': this.processProcessClick.bind(this),

            // Clues events
            'send_clue': this.processSendClue.bind(this), 
            'edit_clue': this.processEditClue.bind(this), 
            'get_clues': this.processGetClues.bind(this),

            // User-specific events
            'edit_user_name': this.processEditUserName.bind(this),
            'change_user_color': this.processChangeUserColor.bind(this),
            'state_changed': this.processStateChanged.bind(this),

            // Word pack events
            'get_all_word_packs': this.processGetAllWordPacks.bind(this),
            'get_word_pack_no_words': this.processGetWordPackNoWords.bind(this),
            'get_words_from_word_pack': this.processGetWordsFromWordPack.bind(this),

            // Host-specific events
            'set_new_game_rules': this.processSetNewGameRules.bind(this),
            'refresh_gameboard': this.processRefreshGameboard.bind(this),
            'randomize_team_order': this.processRandomizeTeamOrder.bind(this),
            'pass_turn': this.processPassTurn.bind(this),
            'remove_all_players': this.processRemoveAllPlayers.bind(this),
            'remove_player': this.processRemovePlayer.bind(this),
            'randomize_players': this.processRandomizePlayers.bind(this),
            'transfer_host': this.processTransferHost.bind(this),

            // Game process events
            'start_new_game': this.processStartNewGame.bind(this),
            'get_traitors': this.processGetTraitors.bind(this)
        };
    }

    /**
     * Get or create a mutex for a room
     * @param {string} roomId 
     * @returns {Mutex}
     */
    getMutex(roomId) {
        if (!this.mutexes.has(roomId)) {
            this.mutexes.set(roomId, new Mutex());
        }
        return this.mutexes.get(roomId);
    }

    getQueue(roomId) {
        if (!this.queues.has(roomId)) {
            const queueName = `room-${roomId}`;
            const queue = new Queue(queueName, {
                redis: config.redis.clientOptions,
                defaultJobOptions: {
                    removeOnComplete: 10,
                    removeOnFail: 20,
                    attempts: 3,
                    // backoff: {
                    //     type: 'exponential',
                    //     delay: 1000
                    // }
                }
            });

            queue.on('error', (error) => {
                console.error(`Queue ${queueName} error:`, error);
            });

            queue.process(async (job) => {
                try {
                    const { eventType, args } = job.data;
                    // console.log(`Processing ${eventType} for room ${roomId}`, args);
                    
                    if (this.eventProcessors[eventType]) {
                        // Spread the args array into positional parameters
                        return await this.eventProcessors[eventType](...args);
                    }
                    throw new Error(`Unknown event type: ${eventType}`);
                } catch (error) {
                    console.error(`Job ${job.id} failed:`, error);
                    throw error;
                }
            });
            
            this.queues.set(roomId, queue);
        }
        return this.queues.get(roomId);
    }

    /**
     * Add event to room's queue with positional arguments
     * @param {string} roomId 
     * @param {string} eventType 
     * @param {Array} args Positional arguments for the event processor
     * @returns {Promise<Queue.Job>}
     */
    async addToRoomQueue(roomId, eventType, ...args) {
        if (!roomId || !eventType) {
            throw new Error('roomId and eventType are required');
        }

        const release = await this.getMutex(roomId).acquire();
        try {
            const queue = this.getQueue(roomId);
            return await queue.add({ 
                eventType,
                args // Store arguments as an array
            });
        } finally {
            release();
        }
    }

    // Processor methods now take positional arguments
    async processGetGameboard(socketData) {
        return await getGameboardEvent(this.io, socketData);
    }

    async processSelectWord(socketData, selectedWordText) {
        return await selectWordEvent(this.io, socketData, selectedWordText);
    }

    async processProcessClick(socketData, clickedWordText) {
        return await processClickEvent(this.io, socketData, clickedWordText);
    }



    async processSendClue(socketData, clueText, teamColor) {
        return await sendClueEvent(this.io, socketData, clueText, teamColor);
    }

    async processEditClue(socketData, newClue) {
        return await editClueEvent(this.io, socketData, newClue);
    }

    async processGetClues(socketData) {
        return await getCluesEvent(this.io, socketData);
    }



    async processEditUserName(socketData, newName) {
        return await editUserNameEvent(this.io, socketData, newName);
    }

    async processChangeUserColor(socketData) {
        return await changeUserColorEvent(this.io, socketData);
    }

    async processStateChanged(socketData, previousColor, newUser) {
        return await stateChangedEvent(this.io, socketData, previousColor, newUser);
    }



    async processGetAllWordPacks(socketData) {
        return await getAllWordPacksEvent(this.io, socketData);
    }

    async processGetWordPackNoWords(socketData, packId) {
        return await getWordPackNoWordsEvent(this.io, socketData, packId);
    }

    async processGetWordsFromWordPack(socketData, packId) {
        return await getWordsFromWordPackEvent(this.io, socketData, packId);
    }



    // Requires mutex
    async processSetNewGameRules(socketData, newGameRules) {
        return await setNewGameRulesEvent(this.io, socketData, newGameRules);
    }

    async processRefreshGameboard(socketData) {
        return await refreshGameboardEvent(this.io, socketData);
    }

    async processRandomizeTeamOrder(socketData) {
        return await randomizeTeamOrderEvent(this.io, socketData);
    }

    async processPassTurn(socketData) {
        return await passTurnEvent(this.io, socketData);
    }

    async processRemoveAllPlayers(socketData, withMasters) {
        return await removeAllPlayersEvent(this.io, socketData, withMasters);
    }

    async processRemovePlayer(socketData, playerId) {
        return await removePlayerEvent(this.io, socketData, playerId);
    }

    async processRandomizePlayers(socketData, withMasters) {
        return await randomizePlayersEvent(this.io, socketData, withMasters);
    }

    async processTransferHost(socketData, playerId) {
        return await transferHostEvent(this.io, socketData, playerId);
    }



    async processStartNewGame(socketData, randomizeTeamOrder, getNewGameboard) {
        return await startNewGameEvent(this.io, socketData, randomizeTeamOrder, getNewGameboard);
    }

    async processGetTraitors(socketData) {
        return await getTraitorsEvent(this.io, socketData);
    }


    async cleanupRoomQueue(roomId) {
        if (!this.mutexes.has(roomId)) {
            return; // No mutex means no queue to clean up
        }
    
        const mutex = this.getMutex(roomId);
        const release = await mutex.acquire();
        
        try {
            if (this.queues.has(roomId)) {
                const queue = this.queues.get(roomId);
                await queue.close();
                await queue.obliterate({ force: true });
                this.queues.delete(roomId);
                console.log(`Queue for room ${roomId} cleaned up successfully`);
            }
        } catch (error) {
            console.error(`Error cleaning up queue for room ${roomId}:`, error);
            throw error;
        } finally {
            release();
            // Only delete the mutex AFTER we've released it
            this.mutexes.delete(roomId);
        }
    }

    async shutdown() {
        const cleanupPromises = Array.from(this.queues.keys()).map(roomId => 
            this.cleanupRoomQueue(roomId)
        );
        await Promise.all(cleanupPromises);
        await this.redisClient.quit();
    }
}

module.exports = RoomQueueManager;