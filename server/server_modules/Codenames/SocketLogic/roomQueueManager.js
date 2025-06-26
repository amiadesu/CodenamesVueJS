// @ts-check
const Queue = require('bull');
const redis = require('redis');
const {
    getGameboardEvent,
    refreshGameboardEvent
} = require("./gameboard");
const {
    sendClueEvent,
    editClueEvent,
    getCluesEvent
} = require("./clues");
const { config } = require("../../../utils/config");

class RoomQueueManager {
    constructor(io) {
        if (!io) {
            throw new Error('Socket.IO instance is required');
        }

        this.queues = new Map();
        this.io = io;
        
        this.redisClient = redis.createClient(config.redis.clientOptions);
        this.redisClient.on('error', (err) => {
            console.error('Redis client error:', err);
        });

        // Event processors now expect positional arguments
        this.eventProcessors = {
            'get_gameboard': this.processGetGameboard.bind(this),
            'refresh_gameboard': this.processRefreshGameboard.bind(this),
            'send_clue': this.processSendClue.bind(this), 
            'edit_clue': this.processEditClue.bind(this), 
            'get_clues': this.processGetClues.bind(this),
        };
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

        // console.log(`Adding ${eventType} to room ${roomId} queue`, args);
        const queue = this.getQueue(roomId);
        
        return await queue.add({ 
            eventType,
            args // Store arguments as an array
        });
    }

    // Processor methods now take positional arguments
    async processGetGameboard(socketData) {
        return await getGameboardEvent(this.io, socketData);
    }

    async processRefreshGameboard(socketData) {
        return await refreshGameboardEvent(this.io, socketData);
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

    async cleanupRoomQueue(roomId) {
        if (this.queues.has(roomId)) {
            const queue = this.queues.get(roomId);
            try {
                await queue.close();
                await queue.obliterate({ force: true });
                this.queues.delete(roomId);
                console.log(`Queue for room ${roomId} cleaned up successfully`);
            } catch (error) {
                console.error(`Error cleaning up queue for room ${roomId}:`, error);
                throw error;
            }
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