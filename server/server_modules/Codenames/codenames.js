// @ts-check

const path = require('path');
const z = require("zod/v4");

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
    wordZodSchema,
    chatMessageZodSchema
} = require("./ZodSchemas/codenamesZodSchemas");
const { 
    usernameZodSchema,
    userColorZodSchema,
    userZodSchema,
    roomIdZodSchema
} = require("../Global/ZodSchemas/globalZodSchemas");
const CodenamesDB = require("./db/codenamesDB");
const {
    isObject,
    makeID,
    makeColor,
    randChoice,
    shuffle
} = require("../../utils/extra");
const {
    setupWordPackWatcher
} = require("./db/wordPacksDB");



const DIContainer = require("./GameLogic/container");
const {
    validateUser,
    checkPermissions
} = DIContainer.modules.permissionsValidation;
const {
    getWordsFromPack,
    getWordsForRoom,
    getNewWords,
    getGameboard
} = DIContainer.modules.gameboard;
const {
    toggleWord,
    toggleWordNoSave,
    clearWord,
    clearWordNoSave,
    revealWord,
    wordAutoselect,
    clearAllSelections
} = DIContainer.modules.words;
const {
    updateTeamOrder,
    updateUser,
    passTurn,
    processWin,
    clearTimer,
    updateGameTimer,
    removeAllPlayers,
    removePlayer,
    randomizePlayers,
    transferHost
} = DIContainer.modules.gameManager;
const {
    clearRoles,
    setupGamemode,
    startNewGame
} = DIContainer.modules.gameSetup;



const codenamesPacksFolderPath = path.join(__dirname, '..', '..', 'WordPacks', 'Codenames');

const {
    processUser,
    updateGlobalUser
} = require("../Global/logic/userRegistration");

const {
    Permissions,
    validEventsWithoutAuthorization
} = require("./utils/constants");
const {
    createNewRoomRateLimiter,
    startNewGameRateLimiter,
    refreshGameboardRateLimiter
} = require("./utils/rateLimiters");

const RoomQueueManager = require("./SocketLogic/roomQueueManager");

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

let eventCount = 0;

function createIOListener() {
    io.use(async (socket, next) => {
        const userID = socket.handshake.auth.userID;
        console.log("Auth:", userID);
    
        socket.userData = await processUser(userID, socket.id, io.sockets);
        const result = playerIdZodSchema.safeParse(socket.userData.codenamesID);
        if (!result.success) {
            console.log(result.error);
            return;
        }
    
        next();
    });
    io.on('connection', async (socket) => {
        console.log('User connected:', socket.id);

        const socketData = {
            socketId: socket.id,
            userId: socket.userData.userID,
            userCodenamesId: socket.userData.codenamesID,
            user: null,
            roomId: "default",
            settedUp: false,
            countdownInterval: null,
            timerInterval: null,
            status: {
                settedUp: false,
                setup_event: {
                    active: false
                }
            }
        };
        console.log('User id:', socketData.userId);
        console.log("User Codenames ID:", socketData.userCodenamesId);

        let user = null;

        const originalOn = socket.on.bind(socket);
        socket.on = (event, handler) => {
            const wrapped = (...args) => {
                try {
                    const result = handler(...args);
                    if (result?.catch) {
                        result.catch((err) => {
                            console.error(`[Socket Error - async handler: "${event}"]`, err);
                        });
                    }
                } catch (err) {
                    console.error(`[Socket Error - sync handler: "${event}"]`, err);
                }
            };
            return originalOn(event, wrapped);
        };

        socket.use(async ([event, data, ...args], next) => {
            console.log(event, data, ...args);
            eventCount++;
            console.log(eventCount);
            if (!validEventsWithoutAuthorization.includes(event)) {
                if (socketData.roomId === "default") {
                    return next(new Error('Unauthorized event'));
                }
                const room = new RoomContext(socketData.roomId);
                const userIsAuthorized = await validateUser(room, socketData.userCodenamesId);
                if (!userIsAuthorized) {
                    return next(new Error('Unauthorized event'));
                }
            }
            else {
                if (!(typeof data === 'string' || data instanceof String || !data) || data === "default") {
                    return next(new Error('Unauthorized event'));
                }
            }
            next();
        });
        
        socket.on("error", (err) => {
            if (err && err.message === 'Unauthorized event') {
                console.log("Unauthorized access blocked.");
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
                socket.emit("error_message", { 
                    error_code: "action_rate_limit", 
                    error: `You are being rate limited. Retry after ${rejRes.msBeforeNext}ms.`,
                    retry_ms: rejRes.msBeforeNext
                });
                return;
            }

            const result = await CodenamesDB.getFreeRoom();
            if (!result.success) {
                console.log(result.error);
                socket.emit("error_message", { error_code: "no_free_room", error: "Couldn't find any free room. Please try again later." });
            }
            socket.emit("get_free_room_code", result.value);
        });
        
        socket.on("process_room", (newRoomId) => {
            let result = roomIdZodSchema.safeParse(newRoomId);
            if (!result.success) {
                console.log("Zod error:", result.error);
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
                console.log("Zod error:", result.error);
                socket.emit("error_message", { error_code: "invalid_room_code", error: "The room code is not valid. The room code must contain from 1 to 16 characters and consist only of Latin letters and numbers." });
                return;
            }
            newRoomId = result.data;

            if (socketData.status.setup_event.active) {
                socket.emit("error_message", { error_code: "still_being_set_up", error: "Your session is still being set up by the server." });
                return;
            }

            socketData.status.setup_event.active = true;

            socketData.roomId = newRoomId;
            socket.join(socketData.roomId);

            const room = new RoomContext(socketData.roomId);
    
            const shouldGetNewWords = await CodenamesDB.createRoom(room.roomId);

            if (!shouldGetNewWords.success) {
                return;
            }

            if (shouldGetNewWords.value) {
                await getNewWords(room);
            }
            let users = await room.getUsers();
            let teams = await room.getTeams();
            let gameRules = await room.getGameRules();
            let gameProcess = await room.getGameProcess();
    
            const objIndex = users.findIndex((obj) => obj.id === socketData.userCodenamesId);
            if (objIndex !== -1) {
                users[objIndex].online = true;
                user = users[objIndex];
                await updateUser(room, users[objIndex]);
                users = await room.getUsers();
                teams = await room.getTeams();
            }
            else {
                user = {
                    name: socket.userData.name,
                    color: socket.userData.color,
                    id: socketData.userCodenamesId,
                    roomId: socketData.roomId,
                    state: {
                        teamColor: "spectator",
                        master: false,
                        selecting: ""
                    },
                    online: true,
                    host: false
                };
    
                if (users.length === 0) {
                    user.host = true;
                }
    
                users.push(user);
            }
            
            await room.setUsers(users);
    
            socketData.status.settedUp = true;

            const endTurnSelectors = await room.getEndTurnSelectors();
            const clues = await room.getClues();
            let gameWinStatus = await room.getGameWinStatus();
            let chatMessages = await room.getChatMessages();
            
            socket.to(socketData.roomId).emit("update_users", teams, users);
            socket.emit("update_client_setup", teams, users, user, gameRules, gameProcess, endTurnSelectors, clues, gameWinStatus, chatMessages);
            socket.emit("set_initialized");
            socket.emit("request_new_gameboard");

            socketData.status.setup_event.active = false;
        });
    
        

        socket.on("edit_user_name", async (newName) => {
            const result = usernameZodSchema.safeParse(newName);
            if (!result.success) {
                console.log("Zod error:", result.error);
                return;
            }
            newName = result.data;

            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "edit_user_name", socketData, newName);
            } catch (error) {
                console.error('Error queuing event:', error);
                socket.emit('error', 'Failed to queue event');
            }
        });

        socket.on("change_user_color", async () => {
            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "change_user_color", socketData);
            } catch (error) {
                console.error('Error queuing event:', error);
                socket.emit('error', 'Failed to queue event');
            }
        });
    
        socket.on("state_changed", async (previousColor, newUser) => {
            const resultPlayerColor = validPlayerTeamColorZodSchema.safeParse(previousColor);
            if (!resultPlayerColor.success) {
                console.log("Zod error:", resultPlayerColor.error);
                return;
            }
            previousColor = resultPlayerColor.data;
            const resultPlayer = playerZodSchema.safeParse(newUser);
            if (!resultPlayer.success) {
                console.log("Zod error:", resultPlayer.error);
                return;
            }
            newUser = resultPlayer.data;

            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "state_changed", socketData, previousColor, newUser);
            } catch (error) {
                console.error('Error queuing event:', error);
                socket.emit('error', 'Failed to queue event');
            }
        });
    
        

        socket.on("get_gameboard", async () => {
            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "get_gameboard", socketData);
            } catch (error) {
                console.error('Error queuing event:', error);
                socket.emit('error', 'Failed to queue event');
            }
        });

        socket.on("select_word", async (selectedWordText) => {
            const result = z.string().min(1).safeParse(selectedWordText);
            if (!result.success) {
                console.log("Zod error:", result.error);
                return;
            }
            selectedWordText = result.data;

            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "select_word", socketData, selectedWordText);
            } catch (error) {
                console.error('Error queuing event:', error);
                socket.emit('error', 'Failed to queue event');
            }
        });
    
        socket.on("proceed_click", async (clickedWordText) => {
            const result = z.string().min(1).safeParse(clickedWordText);
            if (!result.success) {
                console.log("Zod error:", result.error);
                return;
            }
            clickedWordText = result.data;

            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "proceed_click", socketData, clickedWordText);
            } catch (error) {
                console.error('Error queuing event:', error);
                socket.emit('error', 'Failed to queue event');
            }
        });


    
        socket.on("get_all_word_packs", async () => {
            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "get_all_word_packs", socketData);
            } catch (error) {
                console.error('Error queuing event:', error);
                socket.emit('error', 'Failed to queue event');
            }
        });
    
        socket.on("get_word_pack_no_words", async (packId) => {
            const resultPackId = packIdZodSchema.safeParse(packId);
            if (!resultPackId.success) {
                console.log("Zod error:", resultPackId.error);
                return;
            }
            packId = resultPackId.data;

            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "get_word_pack_no_words", socketData, packId);
            } catch (error) {
                console.error('Error queuing event:', error);
                socket.emit('error', 'Failed to queue event');
            }
        });
    
        socket.on("get_words_from_word_pack", async (packId) => {
            const resultPackId = packIdZodSchema.safeParse(packId);
            if (!resultPackId.success) {
                console.log("Zod error:", resultPackId.error);
                return;
            }
            packId = resultPackId.data;

            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "get_words_from_word_pack", socketData, packId);
            } catch (error) {
                console.error('Error queuing event:', error);
                socket.emit('error', 'Failed to queue event');
            }
        });


    
        socket.on("set_new_game_rules", async (newGameRules) => {
            const result = gameRulesZodSchemaNonStrict.safeParse(newGameRules);
            if (!result.success) {
                console.log("Zod error:", result.error);
                return;
            }
            newGameRules = result.data;

            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "set_new_game_rules", socketData, newGameRules);
            } catch (error) {
                console.error('Error queuing event:', error);
                socket.emit('error', 'Failed to queue event');
            }
        });

        socket.on("refresh_gameboard", async () => {
            try {
                await refreshGameboardRateLimiter.consume(socketData.userId);
            }
            catch (rejRes) {
                io.to(socketData.socketId).emit("error_message", { 
                    error_code: "action_rate_limit", 
                    error: `You are being rate limited. Retry after ${rejRes.msBeforeNext}ms.`,
                    retry_ms: rejRes.msBeforeNext
                });
                return;
            }

            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "refresh_gameboard", socketData);
            } catch (error) {
                console.error('Error queuing event:', error);
                socket.emit('error', 'Failed to queue event');
            }
        });

        socket.on("randomize_team_order", async () => {
            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "randomize_team_order", socketData);
            } catch (error) {
                console.error('Error queuing event:', error);
                socket.emit('error', 'Failed to queue event');
            }
        });

        socket.on("pass_turn", async () => {
            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "pass_turn", socketData);
            } catch (error) {
                console.error('Error queuing event:', error);
                socket.emit('error', 'Failed to queue event');
            }
        });
    
        socket.on("remove_all_players", async (withMasters) => {
            const result = z.boolean().safeParse(withMasters);
            if (!result.success) {
                console.log("Zod error:", result.error);
                return;
            }
            withMasters = result.data;

            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "remove_all_players", socketData, withMasters);
            } catch (error) {
                console.error('Error queuing event:', error);
                socket.emit('error', 'Failed to queue event');
            }
        });
    
        socket.on("remove_player", async (playerId) => {
            const result = playerIdZodSchema.safeParse(playerId);
            if (!result.success) {
                console.log("Zod error:", result.error);
                return;
            }
            playerId = result.data;

            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "remove_player", socketData, playerId);
            } catch (error) {
                console.error('Error queuing event:', error);
                socket.emit('error', 'Failed to queue event');
            }
        });
    
        socket.on("randomize_players", async (withMasters) => {
            const result = z.boolean().safeParse(withMasters);
            if (!result.success) {
                console.log("Zod error:", result.error);
                return;
            }
            withMasters = result.data;

            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "randomize_players", socketData, withMasters);
            } catch (error) {
                console.error('Error queuing event:', error);
                socket.emit('error', 'Failed to queue event');
            }
        });
        
        socket.on("transfer_host", async (playerId) => {
            const result = playerIdZodSchema.safeParse(playerId);
            if (!result.success) {
                console.log("Zod error:", result.error);
                return;
            }
            playerId = result.data;

            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "transfer_host", socketData, playerId);
            } catch (error) {
                console.error('Error queuing event:', error);
                socket.emit('error', 'Failed to queue event');
            }
        });


    
        socket.on("start_new_game", async (randomizeTeamOrder, getNewGameboard) => {
            try {
                await startNewGameRateLimiter.consume(socketData.userId);
            }
            catch (rejRes) {
                io.to(socketData.socketId).emit("error_message", { 
                    error_code: "action_rate_limit", 
                    error: `You are being rate limited. Retry after ${rejRes.msBeforeNext}ms.`,
                    retry_ms: rejRes.msBeforeNext
                });
                return;
            }
        
            const resultRandomizeTeamOrder = z.boolean().safeParse(randomizeTeamOrder);
            if (!resultRandomizeTeamOrder.success) {
                console.log("Zod error:", resultRandomizeTeamOrder.error);
                return;
            }
            randomizeTeamOrder = resultRandomizeTeamOrder.data;
            const resultGetNewGameboard = z.boolean().safeParse(getNewGameboard);
            if (!resultGetNewGameboard.success) {
                console.log("Zod error:", resultGetNewGameboard.error);
                return;
            }
            getNewGameboard = resultGetNewGameboard.data;

            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "start_new_game", socketData, randomizeTeamOrder, getNewGameboard);
            } catch (error) {
                console.error('Error queuing event:', error);
                socket.emit('error', 'Failed to queue event');
            }
        });
    
        socket.on("get_traitors", async () => {
            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "get_traitors", socketData);
            } catch (error) {
                console.error('Error queuing event:', error);
                socket.emit('error', 'Failed to queue event');
            }
        });

        socket.on("get_game_process", async () => {
            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "get_game_process", socketData);
            } catch (error) {
                console.error('Error queuing event:', error);
                socket.emit('error', 'Failed to queue event');
            }
        });


    
        socket.on("send_clue", async (clueText, teamColor) => {
            const resultClueText = clueTextZodSchema.safeParse(clueText);
            if (!resultClueText.success) {
                console.log("Zod error:", resultClueText.error);
                return;
            }
            clueText = resultClueText.data;
            const resultTeamColor = validTeamColorZodSchema.safeParse(teamColor);
            if (!resultTeamColor.success) {
                console.log("Zod error:", resultTeamColor.error);
                return;
            }
            teamColor = resultTeamColor.data;
            
            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "send_clue", socketData, clueText, teamColor);
            } catch (error) {
                console.error('Error queuing event:', error);
                socket.emit('error', 'Failed to queue event');
            }
        });
    
        socket.on("edit_clue", async (newClue) => {
            const result = clueZodSchema.safeParse(newClue);
            if (!result.success) {
                console.log("Zod error:", result.error);
                return;
            }
            newClue = result.data;
            
            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "edit_clue", socketData, newClue);
            } catch (error) {
                console.error('Error queuing event:', error);
                socket.emit('error', 'Failed to queue event');
            }
        });
    
        socket.on("get_clues", async () => {
            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "get_clues", socketData);
            } catch (error) {
                console.error('Error queuing event:', error);
                socket.emit('error', 'Failed to queue event');
            }
        });



        socket.on("send_new_chat_message", async (messageText) => {
            const resultChatMessages = chatMessageZodSchema.safeParse(messageText);
            if (!resultChatMessages.success) {
                console.log("Zod error:", resultChatMessages.error);
                return;
            }
            messageText = resultChatMessages.data;
            
            try {
                await roomQueueManager.addToRoomQueue(socketData.roomId, "send_new_chat_message", socketData, messageText);
            } catch (error) {
                console.error('Error queuing event:', error);
                socket.emit('error', 'Failed to queue event');
            }
        });
    
        socket.on('disconnect', async () => {
            const room = new RoomContext(socketData.roomId);

            if (!socketData.status.settedUp) {
                console.log("Some shit is going on... user was not setted up");
                return;
            }
            if (!(await validateUser(room, socketData.userCodenamesId))) {
                console.log("Some shit is going on... user was not validated");
                return;
            }

            let users = await room.getUsers();
    
            console.log('User disconnected:', socket.handshake.address);

            const objIndex = users.findIndex((obj) => obj.id === socketData.userCodenamesId);
            console.log(objIndex);
            let newUser = users[objIndex];
            newUser.online = false;
            await updateUser(room, newUser);

            let teams = await room.getTeams();
            users = await room.getUsers();
            if (users.every((user) => !user.online)) {
                console.log("Room is AFK now!");
            }
            io.to(socketData.roomId).emit("update_users", teams, users);
        });
    });
}

module.exports = {
    setupCodenames
}

// TODO:
// move disconnect to /SocketLogic/user.js
// add actual functionality for the sake of RoomQueueManager.cleanupRoomQueue being called
// clear up code that left