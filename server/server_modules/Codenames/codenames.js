// @ts-check
const path = require('path');
const z = require("zod/v4");

const { logger } = require("../../utils/logger");

const {
    validTeamColorZodSchema,
    validPlayerTeamColorZodSchema,
    packIdZodSchema,
    gameRulesZodSchemaNonStrict,
    clueTextZodSchema,
    clueZodSchema,
    playerIdZodSchema,
    playerZodSchema,
    chatMessageZodSchema
} = require("./ZodSchemas/codenamesZodSchemas");
const { 
    usernameZodSchema,
    roomIdZodSchema
} = require("../Global/ZodSchemas/globalZodSchemas");
const CodenamesDB = require("./db/codenamesDB");
const {
    setupWordPackWatcher
} = require("./db/wordPacksDB");

const DIContainer = require("./GameLogic/container");
const {
    validateUser
} = DIContainer.modules.permissionsValidation;
const {
    updateUser
} = DIContainer.modules.gameManager;

const codenamesPacksFolderPath = path.join(__dirname, '..', '..', 'WordPacks', 'Codenames');

const {
    processUser
} = require("../Global/logic/userRegistration");

const {
    validEventsWithoutAuthorization
} = require("./utils/constants");
const {
    createNewRoomRateLimiter,
    startNewGameRateLimiter,
    randomizeTeamOrderRateLimiter,
    refreshGameboardRateLimiter,
    playerRelatedHostActionsRateLimiter,
    playerProfileRateLimiter,
    wordRateLimiter,
    sendNewChatMessageRateLimiter
} = require("./utils/rateLimiters");

const RoomQueueManager = require("./SocketLogic/roomQueueManager");
const SocketContext = require("./SocketLogic/socketContext");

const RoomContext = require("./db/roomContext");

let io = null;
let roomQueueManager = null;

function setupCodenames(codenamesIo) {
    io = codenamesIo;
    roomQueueManager = new RoomQueueManager(io);
    DIContainer.init(io);
    CodenamesDB.initialize().then(() => {
        setupWordPackWatcher(codenamesPacksFolderPath);
        createIOListener();
    });
}

function createIOListener() {
    io.use(async (socket, next) => {
        const userID = socket.handshake.auth.userID;
        logger.info(`Auth: ${userID}`);
    
        socket.userData = await processUser(userID, socket.id, io.sockets);
        const result = playerIdZodSchema.safeParse(socket.userData.codenamesID);
        if (!result.success) {
            logger.warn(`${userID} ${result.error}`);
            return;
        }
    
        next();
    });
    io.on('connection', async (socket) => {
        logger.info(`User connected: ${socket.id}`);

        const socketData = new SocketContext(socket);

        logger.info(`User id: ${socketData.userId}`);
        logger.info(`User Codenames ID: ${socketData.userCodenamesId}`);

        const originalOn = socket.on.bind(socket);
        socket.on = (event, handler) => {
            const wrapped = (...args) => {
                try {
                    const result = handler(...args);
                    if (!result?.catch) {
                        return;
                    }
                    result.catch((err) => {
                        logger.error(`[Socket Error - async handler: "${event}"] ${err}`);
                    });
                } catch (err) {
                    logger.error(`[Socket Error - sync handler: "${event}"] ${err}`);
                }
            };
            return originalOn(event, wrapped);
        };

        socket.use(async ([event, data, ...args], next) => {
            logger.info(`${socketData.socketId} ${event} ${data} ${args}`);
            if (!validEventsWithoutAuthorization.includes(event)) {
                if (socketData.roomId === "default") {
                    return next(new Error('Unauthorized event'));
                }
                const room = new RoomContext(socketData.roomId);
                const userIsAuthorized = await validateUser(room, socketData.userCodenamesId);
                if (!userIsAuthorized) {
                    return next(new Error('Unauthorized event'));
                }
                if (!socketData.status.settedUp) {
                    socket.emit("request_setup");
                    return;
                }
            }
            else if (!(typeof data === 'string' || data instanceof String || !data) || data === "default") {
                return next(new Error('Unauthorized event'));
            }
            next();
        });
        
        socket.on("error", (err) => {
            if (err && err.message === 'Unauthorized event') {
                logger.warn("Unauthorized access blocked.");
                socket.disconnect(true);
            }
        });

        socket.emit("update_local_storage_data", {
            userID: socket.userData.userID
        });

        socket.on("notify_server_about_change", () => {
            socket.emit("notify_client_about_change");
        });
    


        socket.on("create_room", async () => {
            try {
                await createNewRoomRateLimiter.consume(socketData.userId);
            }
            catch (rejRes) {
                logger.warn(`${socketData.socketId} is being rate limited: ${rejRes}`);
                socket.emit("error_message", { 
                    error_code: "action_rate_limit", 
                    error: `You are being rate limited. Retry after ${rejRes.msBeforeNext}ms.`,
                    retry_ms: rejRes.msBeforeNext
                });
                return;
            }

            const result = await CodenamesDB.getFreeRoom();
            if (!result.success) {
                logger.warn(result.error);
                socket.emit("error_message", { error_code: "no_free_room", error: "Couldn't find any free room. Please try again later." });
            }
            socket.emit("get_free_room_code", result.value);
        });
        
        socket.on("process_room", (newRoomId) => {
            let result = roomIdZodSchema.safeParse(newRoomId);
            if (!result.success) {
                logger.warn(`Zod error from ${socketData.socketId}: ${result.error}`);
                socket.emit("error_message", { error_code: "invalid_room_code", error: "The room code is not valid. The room code must contain from 1 to 16 characters and consist only of Latin letters and numbers." });
                return;
            }
            newRoomId = result.data;

            socketData.roomId = newRoomId;
            socket.join(socketData.roomId);
        });
    
        socket.on("setup_client", async (newRoomId) => {
            let result = roomIdZodSchema.safeParse(newRoomId);
            if (!result.success) {
                logger.warn(`Zod error from ${socketData.socketId}: ${result.error}`);
                socket.emit("error_message", { error_code: "invalid_room_code", error: "The room code is not valid. The room code must contain from 1 to 16 characters and consist only of Latin letters and numbers." });
                return;
            }
            newRoomId = result.data;

            if (socketData.status.setup_event.active) {
                socket.emit("error_message", { error_code: "still_being_set_up", error: "Your session is still being set up by the server." });
                return;
            }

            roomQueueManager.addSocket(socketData.socketId, socketData);

            socketData.status.setup_event.active = true;

            socketData.roomId = newRoomId;
            socket.join(socketData.roomId);

            try {
                const job = await roomQueueManager.addToRoomQueue(socketData.roomId, "setup_client", socketData.socketId);
                await job.finished();
            } catch (error) {
                logger.error(`Error queuing event: ${error}`);
                socket.emit('error', 'Failed to queue event');
            }

            socketData.status.setup_event.active = false;
        });
    
        

        socket.on("edit_user_name", async (newName) => {
            try {
                await playerProfileRateLimiter.consume(socketData.userId);
            }
            catch (rejRes) {
                logger.warn(`${socketData.socketId} is being rate limited: ${rejRes}`);
                // No error message emitting required
                return;
            }

            const result = usernameZodSchema.safeParse(newName);
            if (!result.success) {
                logger.warn(`Zod error from ${socketData.socketId}: ${result.error}`);
                return;
            }
            newName = result.data;

            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "edit_user_name", socketData.socketId, newName);
            } catch (error) {
                logger.error(`Error queuing event: ${error}`);
                socket.emit('error', 'Failed to queue event');
            }
        });

        socket.on("change_user_color", async () => {
            try {
                await playerProfileRateLimiter.consume(socketData.userId);
            }
            catch (rejRes) {
                logger.warn(`${socketData.socketId} is being rate limited: ${rejRes}`);
                // No error message emitting required
                return;
            }

            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "change_user_color", socketData.socketId);
            } catch (error) {
                logger.error(`Error queuing event: ${error}`);
                socket.emit('error', 'Failed to queue event');
            }
        });
    
        socket.on("state_changed", async (previousColor, newUser) => {
            const resultPlayerColor = validPlayerTeamColorZodSchema.safeParse(previousColor);
            if (!resultPlayerColor.success) {
                logger.warn(`Zod error from ${socketData.socketId}: ${resultPlayerColor.error}`);
                return;
            }
            previousColor = resultPlayerColor.data;
            const resultPlayer = playerZodSchema.safeParse(newUser);
            if (!resultPlayer.success) {
                logger.warn(`Zod error from ${socketData.socketId}: ${resultPlayer.error}`);
                return;
            }
            newUser = resultPlayer.data;

            if (newUser?.id !== socketData.userCodenamesId) {
                logger.warn(`An attempt to impersonate another user has been blocked from ${socketData.socketId}`);
                return;
            }

            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "state_changed", socketData.socketId, previousColor, newUser);
            } catch (error) {
                logger.error(`Error queuing event: ${error}`);
                socket.emit('error', 'Failed to queue event');
            }
        });
    
        

        socket.on("get_gameboard", async () => {
            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "get_gameboard", socketData.socketId);
            } catch (error) {
                logger.error(`Error queuing event: ${error}`);
                socket.emit('error', 'Failed to queue event');
            }
        });

        socket.on("select_word", async (selectedWordText) => {
            try {
                await wordRateLimiter.consume(socketData.userId);
            }
            catch (rejRes) {
                logger.warn(`${socketData.socketId} is being rate limited: ${rejRes}`);
                // No error message emitting required
                return;
            }

            const result = z.string().min(1).safeParse(selectedWordText);
            if (!result.success) {
                logger.warn(`Zod error from ${socketData.socketId}: ${result.error}`);
                return;
            }
            selectedWordText = result.data;

            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "select_word", socketData.socketId, selectedWordText);
            } catch (error) {
                logger.error(`Error queuing event: ${error}`);
                socket.emit('error', 'Failed to queue event');
            }
        });
    
        socket.on("process_click", async (clickedWordText) => {
            try {
                await wordRateLimiter.consume(socketData.userId);
            }
            catch (rejRes) {
                logger.warn(`${socketData.socketId} is being rate limited: ${rejRes}`);
                // No error message emitting required
                return;
            }

            const result = z.string().min(1).safeParse(clickedWordText);
            if (!result.success) {
                logger.warn(`Zod error from ${socketData.socketId}: ${result.error}`);
                return;
            }
            clickedWordText = result.data;

            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "process_click", socketData.socketId, clickedWordText);
            } catch (error) {
                logger.error(`Error queuing event: ${error}`);
                socket.emit('error', 'Failed to queue event');
            }
        });


    
        socket.on("get_all_word_packs", async () => {
            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "get_all_word_packs", socketData.socketId);
            } catch (error) {
                logger.error(`Error queuing event: ${error}`);
                socket.emit('error', 'Failed to queue event');
            }
        });
    
        socket.on("get_word_pack_no_words", async (packId) => {
            const resultPackId = packIdZodSchema.safeParse(packId);
            if (!resultPackId.success) {
                logger.warn(`Zod error from ${socketData.socketId}: ${resultPackId.error}`);
                return;
            }
            packId = resultPackId.data;

            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "get_word_pack_no_words", socketData.socketId, packId);
            } catch (error) {
                logger.error(`Error queuing event: ${error}`);
                socket.emit('error', 'Failed to queue event');
            }
        });
    
        socket.on("get_words_from_word_pack", async (packId) => {
            const resultPackId = packIdZodSchema.safeParse(packId);
            if (!resultPackId.success) {
                logger.warn(`Zod error from ${socketData.socketId}: ${resultPackId.error}`);
                return;
            }
            packId = resultPackId.data;

            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "get_words_from_word_pack", socketData.socketId, packId);
            } catch (error) {
                logger.error(`Error queuing event: ${error}`);
                socket.emit('error', 'Failed to queue event');
            }
        });


    
        socket.on("set_new_game_rules", async (newGameRules) => {
            const result = gameRulesZodSchemaNonStrict.safeParse(newGameRules);
            if (!result.success) {
                logger.warn(`Zod error from ${socketData.socketId}: ${result.error}`);
                return;
            }
            newGameRules = result.data;

            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "set_new_game_rules", socketData.socketId, newGameRules);
            } catch (error) {
                logger.error(`Error queuing event: ${error}`);
                socket.emit('error', 'Failed to queue event');
            }
        });

        socket.on("refresh_gameboard", async () => {
            try {
                await refreshGameboardRateLimiter.consume(socketData.userId);
            }
            catch (rejRes) {
                logger.warn(`${socketData.socketId} is being rate limited: ${rejRes}`);
                io.to(socketData.socketId).emit("error_message", { 
                    error_code: "action_rate_limit", 
                    error: `You are being rate limited. Retry after ${rejRes.msBeforeNext}ms.`,
                    retry_ms: rejRes.msBeforeNext
                });
                return;
            }

            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "refresh_gameboard", socketData.socketId);
            } catch (error) {
                logger.error(`Error queuing event: ${error}`);
                socket.emit('error', 'Failed to queue event');
            }
        });

        socket.on("randomize_team_order", async () => {
            try {
                await randomizeTeamOrderRateLimiter.consume(socketData.userId);
            }
            catch (rejRes) {
                logger.warn(`${socketData.socketId} is being rate limited: ${rejRes}`);
                // No error message emitting required
                return;
            }

            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "randomize_team_order", socketData.socketId);
            } catch (error) {
                logger.error(`Error queuing event: ${error}`);
                socket.emit('error', 'Failed to queue event');
            }
        });

        socket.on("pass_turn", async () => {
            try {
                await playerRelatedHostActionsRateLimiter.consume(socketData.userId);
            }
            catch (rejRes) {
                logger.warn(`${socketData.socketId} is being rate limited: ${rejRes}`);
                io.to(socketData.socketId).emit("error_message", { 
                    error_code: "action_rate_limit", 
                    error: `You are being rate limited. Retry after ${rejRes.msBeforeNext}ms.`,
                    retry_ms: rejRes.msBeforeNext
                });
                return;
            }

            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "pass_turn", socketData.socketId);
            } catch (error) {
                logger.error(`Error queuing event: ${error}`);
                socket.emit('error', 'Failed to queue event');
            }
        });
    
        socket.on("remove_all_players", async (withMasters) => {
            try {
                await playerRelatedHostActionsRateLimiter.consume(socketData.userId);
            }
            catch (rejRes) {
                logger.warn(`${socketData.socketId} is being rate limited: ${rejRes}`);
                io.to(socketData.socketId).emit("error_message", { 
                    error_code: "action_rate_limit", 
                    error: `You are being rate limited. Retry after ${rejRes.msBeforeNext}ms.`,
                    retry_ms: rejRes.msBeforeNext
                });
                return;
            }

            const result = z.boolean().safeParse(withMasters);
            if (!result.success) {
                logger.warn(`Zod error from ${socketData.socketId}: ${result.error}`);
                return;
            }
            withMasters = result.data;

            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "remove_all_players", socketData.socketId, withMasters);
            } catch (error) {
                logger.error(`Error queuing event: ${error}`);
                socket.emit('error', 'Failed to queue event');
            }
        });
    
        socket.on("remove_player", async (playerId) => {
            try {
                await playerRelatedHostActionsRateLimiter.consume(socketData.userId);
            }
            catch (rejRes) {
                logger.warn(`${socketData.socketId} is being rate limited: ${rejRes}`);
                io.to(socketData.socketId).emit("error_message", { 
                    error_code: "action_rate_limit", 
                    error: `You are being rate limited. Retry after ${rejRes.msBeforeNext}ms.`,
                    retry_ms: rejRes.msBeforeNext
                });
                return;
            }

            const result = playerIdZodSchema.safeParse(playerId);
            if (!result.success) {
                logger.warn(`Zod error from ${socketData.socketId}: ${result.error}`);
                return;
            }
            playerId = result.data;

            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "remove_player", socketData.socketId, playerId);
            } catch (error) {
                logger.error(`Error queuing event: ${error}`);
                socket.emit('error', 'Failed to queue event');
            }
        });
    
        socket.on("randomize_players", async (withMasters) => {
            try {
                await playerRelatedHostActionsRateLimiter.consume(socketData.userId);
            }
            catch (rejRes) {
                logger.warn(`${socketData.socketId} is being rate limited: ${rejRes}`);
                io.to(socketData.socketId).emit("error_message", { 
                    error_code: "action_rate_limit", 
                    error: `You are being rate limited. Retry after ${rejRes.msBeforeNext}ms.`,
                    retry_ms: rejRes.msBeforeNext
                });
                return;
            }

            const result = z.boolean().safeParse(withMasters);
            if (!result.success) {
                logger.warn(`Zod error from ${socketData.socketId}: ${result.error}`);
                return;
            }
            withMasters = result.data;

            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "randomize_players", socketData.socketId, withMasters);
            } catch (error) {
                logger.error(`Error queuing event: ${error}`);
                socket.emit('error', 'Failed to queue event');
            }
        });
        
        socket.on("transfer_host", async (playerId) => {
            try {
                await playerRelatedHostActionsRateLimiter.consume(socketData.userId);
            }
            catch (rejRes) {
                logger.warn(`${socketData.socketId} is being rate limited: ${rejRes}`);
                io.to(socketData.socketId).emit("error_message", { 
                    error_code: "action_rate_limit", 
                    error: `You are being rate limited. Retry after ${rejRes.msBeforeNext}ms.`,
                    retry_ms: rejRes.msBeforeNext
                });
                return;
            }

            const result = playerIdZodSchema.safeParse(playerId);
            if (!result.success) {
                logger.warn(`Zod error from ${socketData.socketId}: ${result.error}`);
                return;
            }
            playerId = result.data;

            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "transfer_host", socketData.socketId, playerId);
            } catch (error) {
                logger.error(`Error queuing event: ${error}`);
                socket.emit('error', 'Failed to queue event');
            }
        });


    
        socket.on("start_new_game", async (randomizeTeamOrder, getNewGameboard) => {
            try {
                await startNewGameRateLimiter.consume(socketData.userId);
            }
            catch (rejRes) {
                logger.warn(`${socketData.socketId} is being rate limited: ${rejRes}`);
                io.to(socketData.socketId).emit("error_message", { 
                    error_code: "action_rate_limit", 
                    error: `You are being rate limited. Retry after ${rejRes.msBeforeNext}ms.`,
                    retry_ms: rejRes.msBeforeNext
                });
                return;
            }
        
            const resultRandomizeTeamOrder = z.boolean().safeParse(randomizeTeamOrder);
            if (!resultRandomizeTeamOrder.success) {
                logger.warn(`Zod error from ${socketData.socketId}: ${resultRandomizeTeamOrder.error}`);
                return;
            }
            randomizeTeamOrder = resultRandomizeTeamOrder.data;
            const resultGetNewGameboard = z.boolean().safeParse(getNewGameboard);
            if (!resultGetNewGameboard.success) {
                logger.warn(`Zod error from ${socketData.socketId}: ${resultGetNewGameboard.error}`);
                return;
            }
            getNewGameboard = resultGetNewGameboard.data;

            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "start_new_game", socketData.socketId, randomizeTeamOrder, getNewGameboard);
            } catch (error) {
                logger.error(`Error queuing event: ${error}`);
                socket.emit('error', 'Failed to queue event');
            }
        });
    
        socket.on("get_traitors", async () => {
            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "get_traitors", socketData.socketId);
            } catch (error) {
                logger.error(`Error queuing event: ${error}`);
                socket.emit('error', 'Failed to queue event');
            }
        });

        socket.on("get_game_process", async () => {
            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "get_game_process", socketData.socketId);
            } catch (error) {
                logger.error(`Error queuing event: ${error}`);
                socket.emit('error', 'Failed to queue event');
            }
        });


    
        socket.on("send_clue", async (clueText, teamColor) => {
            const resultClueText = clueTextZodSchema.safeParse(clueText);
            if (!resultClueText.success) {
                logger.warn(`Zod error from ${socketData.socketId}: ${resultClueText.error}`);
                return;
            }
            clueText = resultClueText.data;
            const resultTeamColor = validTeamColorZodSchema.safeParse(teamColor);
            if (!resultTeamColor.success) {
                logger.warn(`Zod error from ${socketData.socketId}: ${resultTeamColor.error}`);
                return;
            }
            teamColor = resultTeamColor.data;
            
            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "send_clue", socketData.socketId, clueText, teamColor);
            } catch (error) {
                logger.error(`Error queuing event: ${error}`);
                socket.emit('error', 'Failed to queue event');
            }
        });
    
        socket.on("edit_clue", async (newClue) => {
            const result = clueZodSchema.safeParse(newClue);
            if (!result.success) {
                logger.warn(`Zod error from ${socketData.socketId}: ${result.error}`);
                return;
            }
            newClue = result.data;
            
            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "edit_clue", socketData.socketId, newClue);
            } catch (error) {
                logger.error(`Error queuing event: ${error}`);
                socket.emit('error', 'Failed to queue event');
            }
        });
    
        socket.on("get_clues", async () => {
            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "get_clues", socketData.socketId);
            } catch (error) {
                logger.error(`Error queuing event: ${error}`);
                socket.emit('error', 'Failed to queue event');
            }
        });



        socket.on("send_new_chat_message", async (messageText) => {
            try {
                await sendNewChatMessageRateLimiter.consume(socketData.userId);
            }
            catch (rejRes) {
                logger.warn(`${socketData.socketId} is being rate limited: ${rejRes}`);
                // No error message emitting required
                return;
            }

            const resultChatMessages = chatMessageZodSchema.safeParse(messageText);
            if (!resultChatMessages.success) {
                logger.warn(`Zod error from ${socketData.socketId}: ${resultChatMessages.error}`);
                return;
            }
            messageText = resultChatMessages.data;
            
            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "send_new_chat_message", socketData.socketId, messageText);
            } catch (error) {
                logger.error(`Error queuing event: ${error}`);
                socket.emit('error', 'Failed to queue event');
            }
        });
    
        socket.on('disconnect', async () => {
            const room = new RoomContext(socketData.roomId);

            roomQueueManager.removeSocket(socketData.socketId);

            if (!socketData.status.settedUp) {
                logger.warn(`User ${socketData.socketId} was not setted up but disconnected`);
                return;
            }
            if (!(await validateUser(room, socketData.userCodenamesId))) {
                logger.warn(`User ${socketData.socketId} was not validated but disconnected from room ${room.roomId}`);
                return;
            }

            let users = await room.getUsers();
    
            logger.info(`User ${socketData.socketId} disconnected`);

            const objIndex = users.findIndex((obj) => obj.id === socketData.userCodenamesId);
            let newUser = users[objIndex];
            newUser.online = false;
            await updateUser(room, newUser);

            let teams = await room.getTeams();
            users = await room.getUsers();

            io.to(socketData.roomId).emit("update_users", teams, users);

            if (users.every((user) => !user.online)) {
                logger.info(`Room ${room.roomId} is AFK now!`);
            }
            if (users.length === 0) {
                await roomQueueManager.cleanupRoomQueue(socketData.roomId);
            }
        });
    });
}

module.exports = {
    setupCodenames
}