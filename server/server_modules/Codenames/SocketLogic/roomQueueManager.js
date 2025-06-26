// @ts-check
const Queue = require('bull');
const redis = require('redis');
const {
    getGameboardEvent,
    refreshGameboardEvent
} = require("./gameboard");

const { config } = require("../../../utils/config");

class RoomQueueManager {
    constructor(io) {
        this.queues = new Map(); // Stores queues by roomId
        this.redisClient = redis.createClient();
        this.io = io; // Store Socket.IO instance
        
        // Event processors registry
        this.eventProcessors = {
            'get_gameboard': this.processGetGameboard.bind(this),
            'refresh_gameboard': this.processRefreshGameboard.bind(this)
            // Add more event types as needed
        };
    }

    // Get or create queue for a room
    getQueue(roomId) {
        if (!this.queues.has(roomId)) {
            const queue = new Queue(`room-${roomId}`, {
                redis: config.redis.clientOptions,
                defaultJobOptions: {
                    removeOnComplete: 10, // or a number to keep N jobs
                }
            });
        
            // Single processor that handles all event types
            queue.process(async (job) => {
                const { eventType, eventData } = job.data;
                
                if (this.eventProcessors[eventType]) {
                    // Use this.io instead of undefined 'io'
                    return await this.eventProcessors[eventType](eventData);
                }
                throw new Error(`Unknown event type: ${eventType}`);
            });
            
            this.queues.set(roomId, queue);
        }
        return this.queues.get(roomId);
    }

    // Add event to room's queue
    async addToRoomQueue(roomId, eventType, eventData) {
        console.log(roomId, eventType, eventData);
        const queue = this.getQueue(roomId);
        const job = await queue.add({ eventType, eventData }, {
            attempts: 3,
            backoff: 1000
        });
        console.log('Job added with ID:', job.id);
    }

    async processGetGameboard(data) {
        return getGameboardEvent(this.io, data.socketData);
    }

    async processRefreshGameboard(data) {
        return refreshGameboardEvent(this.io, data.socketData);
    }

    // Event processors for different event types
    async processMessageEvent(roomId, data) {
        this.io.to(roomId).emit('new-message', data);
        return { status: 'message-processed' };
    }

    async processNotificationEvent(roomId, data) {
        this.io.to(roomId).emit('notification', data);
        return { status: 'notification-processed' };
    }

    async processUpdateEvent(roomId, data) {
        this.io.to(roomId).emit('update', data);
        // Example of more complex processing
        // await someDatabaseOperation(data);
        return { status: 'update-processed' };
    }

    // Cleanup when room becomes empty
    async cleanupRoomQueue(roomId) {
        if (this.queues.has(roomId)) {
            const queue = this.queues.get(roomId);
            await queue.obliterate({ force: true }); // Completely remove queue
            this.queues.delete(roomId);
        }
    }
}

module.exports = RoomQueueManager;