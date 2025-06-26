// @ts-check

const path = require('path');
const z = require("zod/v4");
const { Mutex } = require('async-mutex');
const mutex = new Mutex();

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

const RoomContext = require("./db/roomContext");

let io = null;

function setupCodenames(codenamesIo) {
    io = codenamesIo;
    DIContainer.init(io);
    CodenamesDB.initialize().then(() => {
        setupWordPackWatcher(codenamesPacksFolderPath);
        createIOListener();
    });
}

async function safeRoomDataAccess(room, callback) {
    const release = await mutex.acquire();
    try {
        await callback(room);
    } finally {
        release();
    }
}

function totalCards(gameRules) {
    let extraSum = 0;
    for (let i = 0; i < gameRules.teamAmount - 1; i++) {
        extraSum += gameRules.extraCards[i];
    }
    const totalCardAmount = gameRules.teamAmount * gameRules.baseCards + 
                            extraSum + gameRules.blackCards;
    return totalCardAmount;
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

        let userId = socket.userData.userID;
        let userCodenamesId = socket.userData.codenamesID;
        console.log('User id:', userId);
        console.log("User Codenames ID:", userCodenamesId);
        let user = null;
        let roomId = "default";
        let settedUp = false;
        let countdownInterval = null;
        let timerInterval = null;
        let status = {
            setup_event : {
                active: false
            }
        };

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
                if (roomId === "default") {
                    return next(new Error('Unauthorized event'));
                }
                const room = new RoomContext(roomId);
                const userIsAuthorized = await validateUser(room, userCodenamesId);
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
    


        socket.on("create_room", async () => {
            try {
                await createNewRoomRateLimiter.consume(userId);
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

            roomId = newRoomId;
            socket.join(roomId);
        });
    
        socket.on("setup_client", async (newRoomId) => {
            let result = roomIdZodSchema.safeParse(newRoomId);
            if (!result.success) {
                console.log("Zod error:", result.error);
                socket.emit("error_message", { error_code: "invalid_room_code", error: "The room code is not valid. The room code must contain from 1 to 16 characters and consist only of Latin letters and numbers." });
                return;
            }
            newRoomId = result.data;

            if (status.setup_event.active) {
                socket.emit("error_message", { error_code: "still_being_set_up", error: "Your session is still being set up by the server." });
                return;
            }

            status.setup_event.active = true;

            roomId = newRoomId;
            socket.join(roomId);

            const room = new RoomContext(roomId);
    
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
    
            const objIndex = users.findIndex((obj) => obj.id === userCodenamesId);
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
                    id: userCodenamesId,
                    roomId: roomId,
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
    
            settedUp = true;

            const endTurnSelectors = await room.getEndTurnSelectors();
            const clues = await room.getClues();
            let gameWinStatus = await room.getGameWinStatus();
            let chatMessages = await room.getChatMessages();
            
            socket.to(roomId).emit("update_users", teams, users);
            socket.emit("update_client_setup", teams, users, user, gameRules, gameProcess, endTurnSelectors, clues, gameWinStatus, chatMessages);
            socket.emit("set_initialized");
            socket.emit("request_new_gameboard");

            status.setup_event.active = false;
        });
    
        socket.on("edit_user", async (newUser) => {
            let result = playerZodSchema.safeParse(newUser);
            if (!result.success) {
                console.log("Zod error:", result.error);
                return;
            }
            newUser = result.data;

            const room = new RoomContext(roomId);

            let users = await room.getUsers();
    
            const objIndex = users.findIndex((obj) => obj.id === newUser.id);
            users[objIndex].name = newUser.name;
            await updateUser(room, users[objIndex]);
    
            users = await room.getUsers();
            let teams = await room.getTeams();
    
            io.to(roomId).emit("update_users", teams, users);
        });

        socket.on("edit_name", async (newName) => {
            let result = usernameZodSchema.safeParse(newName);
            if (!result.success) {
                console.log("Zod error:", result.error);
                return;
            }
            newName = result.data;

            const room = new RoomContext(roomId);

            let users = await room.getUsers();
    
            const objIndex = users.findIndex((obj) => obj.id === userCodenamesId);
            users[objIndex].name = newName;
            await updateUser(room, users[objIndex]);
            await updateGlobalUser(userId, { name: newName });
    
            users = await room.getUsers();
            let teams = await room.getTeams();
    
            io.to(roomId).emit("update_users", teams, users);
        });

        socket.on("change_color", async () => {
            const room = new RoomContext(roomId);

            let users = await room.getUsers();
            const newColor = makeColor();
    
            const objIndex = users.findIndex((obj) => obj.id === userCodenamesId);
            users[objIndex].color = newColor;
            await updateUser(room, users[objIndex]);
            await updateGlobalUser(userId, { color: newColor });
    
            users = await room.getUsers();
            let teams = await room.getTeams();
    
            io.to(roomId).emit("update_users", teams, users);
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

            const room = new RoomContext(roomId);
            
            let users = await room.getUsers();
            let teams = await room.getTeams();

            const objIndex = users.findIndex((obj) => obj.id === newUser.id);
            if (objIndex === -1) {
                return;
            }
            if (newUser.host && !users[objIndex].host) {
                console.log("Privilege escalation attempt was blocked.");
                return;
            }

            let updateEveryone = false;
            if (newUser.state.selecting !== "" && newUser.state.selecting === users[objIndex].state.selecting) {
                console.log(newUser.state.selecting, users[objIndex].state.selecting);
                updateEveryone = true;
                await toggleWord(room, newUser.state.selecting, objIndex, countdownInterval);
                console.log(newUser.state.selecting, users[objIndex].state.selecting);
                users = await room.getUsers();
                newUser.state.selection = "";
            }
            users[objIndex].state = newUser.state;
            users[objIndex].state.selecting = "";
            console.log(newUser.state.selecting, users[objIndex].state.selecting);

            if (previousColor !== "spectator") {
                const objIndex = teams[previousColor].team.findIndex((player) => player.id === newUser.id);
                if (teams[previousColor].master?.id === newUser.id) {
                    teams[previousColor].master = null;
                } else if (objIndex !== -1) {
                    teams[previousColor].team.splice(objIndex, 1);
                }
            }
            if (newUser.state.teamColor !== "spectator") {
                if (newUser.state.master) {
                    teams[newUser.state.teamColor].master = newUser;
                } else {
                    teams[newUser.state.teamColor].team.push(newUser);
                }
            }

            await room.setUsers(users);
            await room.setTeams(teams);
    
            io.to(roomId).emit("update_users", teams, users);
            if (updateEveryone) {
                io.to(roomId).emit("request_new_gameboard");
            } else {
                const words = await getGameboard(room, userCodenamesId);
                socket.emit("send_new_gameboard", words);
            }
        });
    
        socket.on("notify_server_about_change", () => {
            socket.emit("notify_client_about_change");
        });
    
        socket.on("get_gameboard", async () => {
            const room = new RoomContext(roomId);

            const words = await getGameboard(room, userCodenamesId);

            const gameRules = await room.getGameRules();
    
            socket.emit("send_new_gameboard", words);
            socket.emit("update_game_rules", gameRules);
        });
    
        socket.on("refresh_gameboard", async () => {
            try {
                await refreshGameboardRateLimiter.consume(userId);
            }
            catch (rejRes) {
                socket.emit("error_message", { 
                    error_code: "action_rate_limit", 
                    error: `You are being rate limited. Retry after ${rejRes.msBeforeNext}ms.`,
                    retry_ms: rejRes.msBeforeNext
                });
                return;
            }

            const room = new RoomContext(roomId);

            if (!checkPermissions(room, userCodenamesId, Permissions.HOST)) {
                return;
            }

            let gameRules = await room.getGameRules();
    
            const newCardsAmount = totalCards(gameRules);
            if (newCardsAmount > gameRules.maxCards) {
                socket.emit("error_message", { error_code: "card_amount_overflow", error: "Distributed card amount is larger that max cards amount." });
                return;
            } 
            await getNewWords(room);
    
            io.to(roomId).emit("request_new_gameboard");
        });
    
        socket.on("randomize_team_order", async () => {
            const room = new RoomContext(roomId);

            if (!checkPermissions(room, userCodenamesId, Permissions.HOST)) {
                return;
            }
    
            await updateTeamOrder(room);
            
            let gameRules = await room.getGameRules();
            
            io.to(roomId).emit("update_game_rules", gameRules);
        });
    
        socket.on("get_all_word_packs", async () => {
            const result = await CodenamesDB.getAllWordPacks();
            if (!result.success) {
                return;
            }
            socket.emit("word_packs", result.value);
        });
    
        socket.on("get_word_pack_no_words", async (packId) => {
            let resultPackId = packIdZodSchema.safeParse(packId);
            if (!resultPackId.success) {
                console.log("Zod error:", resultPackId.error);
                return;
            }
            packId = resultPackId.data;

            const result = await CodenamesDB.getWordPackNoWords(packId);
            if (!result.success) {
                return;
            }
            socket.emit("word_pack_no_words", result.value);
        });
    
        socket.on("get_words_from_word_pack", async (packId) => {
            let result = packIdZodSchema.safeParse(packId);
            if (!result.success) {
                console.log("Zod error:", result.error);
                return;
            }
            packId = result.data;
            
            socket.emit("words_from_word_pack", await getWordsFromPack(packId));
        });
    
        socket.on("set_new_game_rules", async (newGameRules) => {
            let result = gameRulesZodSchemaNonStrict.safeParse(newGameRules);
            if (!result.success) {
                console.log("Zod error:", result.error);
                return;
            }
            newGameRules = result.data;

            const room = new RoomContext(roomId);
            
            if (!checkPermissions(room, userCodenamesId, Permissions.HOST)) {
                return;
            }

            await safeRoomDataAccess(room, async (room) => {
                let gameRules = await room.getGameRules();
    
                const oldTeamAmount = gameRules.teamAmount;
                if (oldTeamAmount < newGameRules.teamAmount) {
                    if (oldTeamAmount === 2) {
                        if (newGameRules.teamAmount >= 3) {
                            newGameRules.teamOrder.push("blue");
                        }
                        if (newGameRules.teamAmount >= 4) {
                            newGameRules.teamOrder.push("yellow");
                        }
                    } else if (oldTeamAmount === 3) {
                        if (newGameRules.teamAmount >= 4) {
                            newGameRules.teamOrder.push("yellow");
                        }
                    }
                } else if (oldTeamAmount > newGameRules.teamAmount) {
                    if (oldTeamAmount === 4) {
                        if (newGameRules.teamAmount <= 3) {
                            newGameRules.teamOrder = newGameRules.teamOrder.filter((color) => color !== "yellow");
                        }
                        if (newGameRules.teamAmount <= 2) {
                            newGameRules.teamOrder = newGameRules.teamOrder.filter((color) => color !== "blue");
                        }
                    } else if (oldTeamAmount === 3) {
                        if (newGameRules.teamAmount <= 2) {
                            newGameRules.teamOrder = newGameRules.teamOrder.filter((color) => color !== "blue");
                        }
                    }
                }
                
                gameRules = newGameRules;
                switch(gameRules.fieldSize) {
                    case "5x5":
                        gameRules.maxCards = 25;
                        break;
                    case "5x6":
                        gameRules.maxCards = 30;
                        break;
                    case "6x6":
                        gameRules.maxCards = 36;
                        break;
                    case "6x7":
                        gameRules.maxCards = 42;
                        break;
                    case "7x7":
                        gameRules.maxCards = 49;
                        break;
                }

                await room.setGameRules(gameRules);
    
                io.to(room.roomId).emit("update_game_rules", gameRules);
            });
        });
    
        socket.on("start_new_game", async (randomizeTeamOrder, getNewGameboard) => {
            try {
                await startNewGameRateLimiter.consume(userId);
            }
            catch (rejRes) {
                socket.emit("error_message", { 
                    error_code: "action_rate_limit", 
                    error: `You are being rate limited. Retry after ${rejRes.msBeforeNext}ms.`,
                    retry_ms: rejRes.msBeforeNext
                });
                return;
            }

            let result = z.boolean().safeParse(randomizeTeamOrder);
            if (!result.success) {
                console.log("Zod error:", result.error);
                return;
            }
            randomizeTeamOrder = result.data;
            result = z.boolean().safeParse(getNewGameboard);
            if (!result.success) {
                console.log("Zod error:", result.error);
                return;
            }
            getNewGameboard = result.data;
            
            const room = new RoomContext(roomId);
            
            if (!checkPermissions(room, userCodenamesId, Permissions.HOST)) {
                return;
            }

            let gameRules = await room.getGameRules();
            let resultGameRules = gameRulesZodSchemaStrict.safeParse(gameRules);
            if (!resultGameRules.success) {
                console.log("Zod error:", result.error);
                socket.emit("error_message", { error_code: "invalid_game_rules", error: "Game rules object is invalid." });
                return;
            }

            await safeRoomDataAccess(room, async (room) => {
                let gameRules = await room.getGameRules();
                let gameProcess = await room.getGameProcess();
    
                if (gameProcess.isGoing) {
                    clearInterval(timerInterval);
                    await processWin(room, "tie");
                } else {
                    const newCardsAmount = totalCards(gameRules);
                    if (newCardsAmount > gameRules.maxCards) {
                        socket.emit("error_message", { error_code: "card_amount_overflow", error: "Distributed card amount is larger that max cards amount." });
                        return;
                    } 
    
                    await startNewGame(room, randomizeTeamOrder, getNewGameboard);

                    gameRules = await room.getGameRules();

                    io.to(room.roomId).emit("update_game_rules", gameRules);
    
                    let gameWinStatus = await room.getGameWinStatus();
                    io.to(room.roomId).emit("start_game", gameWinStatus);
                    io.to(room.roomId).emit("setup_new_game");
                    
                    if (timerInterval) {
                        clearInterval(timerInterval);
                    }
                    timerInterval = setInterval(async () => {
                        const stopTimer = await updateGameTimer(room, 0.5);
                        if (stopTimer) {
                            let users = await room.getUsers();
                            let teams = await room.getTeams();
        
                            const selectedSomething = await wordAutoselect(room);
                            const gp = await room.getGameProcess();
                            io.to(room.roomId).emit("update_game_process", gp);
                            io.to(room.roomId).emit("request_new_gameboard");
                            io.to(room.roomId).emit("update_users", teams, users);
                            if (!selectedSomething) {
                                await passTurn(room);
                            }
                        }
                        const gameProcess = await room.getGameProcess();
                        if (!gameProcess.isGoing) {
                            clearInterval(timerInterval);
                        }
                        io.to(room.roomId).emit("update_game_process", gameProcess);
                    }, 500);
                }

                gameProcess = await room.getGameProcess();
    
                io.to(room.roomId).emit("update_game_process", gameProcess);

                const clues = await room.getClues();
        
                io.to(roomId).emit("update_clues", clues);

                io.to(room.roomId).emit("request_new_gameboard");
            });
        });
    
        socket.on("get_traitors", async () => {
            const room = new RoomContext(roomId);

            let users = await room.getUsers();
            let traitors = await room.getTraitors();
    
            const objIndex = users.findIndex((obj) => obj.id === userCodenamesId);
            if (objIndex !== -1 && users[objIndex].state.master === true) {
                traitors = traitors.filter((traitor) => traitor.state.teamColor !== users[objIndex].state.teamColor);
            } else if (traitors.some((traitor) => traitor.id === userCodenamesId)) {
                traitors = traitors.filter((traitor) => traitor.id === userCodenamesId);
            } else {
                traitors = [];
            }
            
            socket.emit("update_traitors", traitors);
        });
    
        socket.on("send_clue", async (clueText, teamColor) => {
            let result = clueTextZodSchema.safeParse(clueText);
            if (!result.success) {
                console.log("Zod error:", result.error);
                return;
            }
            clueText = result.data;
            result = validTeamColorZodSchema.safeParse(teamColor);
            if (!result.success) {
                console.log("Zod error:", result.error);
                return;
            }
            teamColor = result.data;
            
            const room = new RoomContext(roomId);

            if (!checkPermissions(room, userCodenamesId, Permissions.MASTER)) {
                return;
            }
            
            let clueIDCounter = await room.getClueIDCounter();
            let gameRules = await room.getGameRules();
            let gameProcess = await room.getGameProcess();

            const newClue = {
                id: clueIDCounter++,
                text: clueText
            };

            await room.addNewClue(teamColor, newClue);

            gameProcess.masterTurn = false;
            if (!gameProcess.teamTimeStarted) {
                gameProcess.teamTimeStarted = true;
                gameProcess.timeLeft = gameRules.teamTurnTime;
                if (gameProcess.timeLeft === 0) {
                    gameProcess.infiniteTime = true;
                } else {
                    gameProcess.infiniteTime = false;
                }
            }
            
            await room.setClueIDCounter(clueIDCounter);
            await room.setGameProcess(gameProcess);
            
            io.to(roomId).emit("update_game_process", gameProcess);

            const clues = await room.getClues();
    
            io.to(roomId).emit("update_clues", clues);
        });
    
        socket.on("edit_clue", async (newClue) => {
            let result = clueZodSchema.safeParse(newClue);
            if (!result.success) {
                console.log("Zod error:", result.error);
                return;
            }
            newClue = result.data;
            
            const room = new RoomContext(roomId);
            
            if (!checkPermissions(room, userCodenamesId, Permissions.HOST)) {
                return;
            }

            await room.updateClueByID(newClue.id, newClue);

            const clues = await room.getClues();
    
            io.to(roomId).emit("update_clues", clues);
        });
    
        socket.on("get_clues", async () => {
            const room = new RoomContext(roomId);

            const clues = await room.getClues();
    
            socket.emit("update_clues", clues);
        });
    
        socket.on("select_word", async (selectedWord) => {
            let result = z.string().min(1).safeParse(selectedWord);
            if (!result.success) {
                console.log("Zod error:", result.error);
                return;
            }
            selectedWord = result.data;
            
            const room = new RoomContext(roomId);
            
            let words = await room.getWords();
            if (!words.some((word) => word.text === selectedWord) && selectedWord !== "endTurn") {
                console.log("Invalid word was selected:", selectedWord);
                return;
            }
            
            let users = await room.getUsers();
    
            const selecterIndex = users.findIndex((obj) => obj.id === userCodenamesId);
            await toggleWord(room, selectedWord, selecterIndex, countdownInterval);
    
            let gameRules = await room.getGameRules();
            words = await room.getWords();

            async function shouldRevealWord() {
                const teams = await room.getTeams();
                const words = await room.getWords();
                const gameProcess = await room.getGameProcess();
    
                const wordObjectIndex = words.findIndex((word) => word.text === selectedWord);
                let selectors = null;
                if (wordObjectIndex === -1) {
                    selectors = await room.getEndTurnSelectors();
                } else {
                    selectors = words[wordObjectIndex].selectedBy;
                }

                return selectors.length === teams[gameProcess.currentTurn].team.length && selectors.length !== 0;
            }

            async function notifyClient() {
                const teams = await room.getTeams();
                const users = await room.getUsers();
                const endTurnSelectors = await room.getEndTurnSelectors();
                const gameRules = await room.getGameRules();
                const gameProcess = await room.getGameProcess();
                const selecterIndex = users.findIndex((obj) => obj.id === userCodenamesId);
                io.to(roomId).emit("request_new_gameboard");
                io.to(roomId).emit("update_game_process", gameProcess);
                io.to(roomId).emit("update_users", teams, users);
                socket.emit("update_client", teams, users, users[selecterIndex], endTurnSelectors, gameRules, gameProcess);
            }
    
            if (await shouldRevealWord()) {
                io.to(roomId).emit("start_countdown", selectedWord);
                if (countdownInterval) {
                    clearInterval(countdownInterval);
                }
                let timer = gameRules.countdownTime;
                let freezed = false;
                countdownInterval = setInterval(async () => {
                    timer -= 0.01;
    
                    if (timer <= 0 && !freezed) {
                        freezed = true;
                        timer = 0;
                        io.to(roomId).emit("stop_countdown");
                        if (await shouldRevealWord()) {
                            await revealWord(room, selectedWord);
                            await notifyClient();
                        }
                        clearInterval(countdownInterval);
                    }
    
                    io.to(roomId).emit("update_countdown", 1 - timer / gameRules.countdownTime);
                }, 10);
            } else {
                clearInterval(countdownInterval);
                io.to(roomId).emit("stop_countdown");
            }
    
            await notifyClient();
        });
    
        socket.on("proceed_click", (clickedWordText) => {
            let result = z.string().min(1).safeParse(clickedWordText);
            if (!result.success) {
                console.log("Zod error:", result.error);
                return;
            }
            clickedWordText = result.data;

            // Master shouldn't click!
            
            io.to(roomId).emit("click_word", clickedWordText, userCodenamesId);
        });
    
        socket.on("get_game_process", async () => {
            const room = new RoomContext(roomId);

            let gameProcess = await room.getGameProcess();
    
            socket.emit("update_game_process", gameProcess);
        });
    
        socket.on("pass_turn", async () => {
            const room = new RoomContext(roomId);

            if (!checkPermissions(room, userCodenamesId, Permissions.HOST)) {
                return;
            }
            
            let users = await room.getUsers();
            let teams = await room.getTeams();
    
            await clearAllSelections(room);
            await passTurn(room);

            let gameProcess = await room.getGameProcess();
    
            io.to(roomId).emit("update_game_process", gameProcess);
            io.to(roomId).emit("request_new_gameboard");
            io.to(roomId).emit("update_users", teams, users);
        });
    
        socket.on("remove_all_players", async (withMasters) => {
            let result = z.boolean().safeParse(withMasters);
            if (!result.success) {
                console.log("Zod error:", result.error);
                return;
            }
            withMasters = result.data;
            
            const room = new RoomContext(roomId);

            if (!checkPermissions(room, userCodenamesId, Permissions.HOST)) {
                return;
            }
    
            await removeAllPlayers(room, withMasters);
    
            let users = await room.getUsers();
            let teams = await room.getTeams();
    
            io.to(roomId).emit("update_users", teams, users);
        });
    
        socket.on("remove_player", async (playerId) => {
            let result = playerIdZodSchema.safeParse(playerId);
            if (!result.success) {
                console.log("Zod error:", result.error);
                return;
            }
            playerId = result.data;
            
            const room = new RoomContext(roomId);
            
            if (!checkPermissions(room, userCodenamesId, Permissions.HOST)) {
                return;
            }
    
            await removePlayer(room, playerId);
    
            let users = await room.getUsers();
            let teams = await room.getTeams();
    
            io.to(roomId).emit("update_users", teams, users);
        });
    
        socket.on("randomize_players", async (withMasters) => {
            let result = z.boolean().safeParse(withMasters);
            if (!result.success) {
                console.log("Zod error:", result.error);
                return;
            }
            withMasters = result.data;
            
            const room = new RoomContext(roomId);
            
            if (!checkPermissions(room, userCodenamesId, Permissions.HOST)) {
                return;
            }
    
            await randomizePlayers(room, withMasters);
    
            let users = await room.getUsers();
            let teams = await room.getTeams();
    
            io.to(roomId).emit("update_users", teams, users);
        });
        
        socket.on("transfer_host", async (playerId) => {
            let result = playerIdZodSchema.safeParse(playerId);
            if (!result.success) {
                console.log("Zod error:", result.error);
                return;
            }
            playerId = result.data;
            
            const room = new RoomContext(roomId);
            
            if (!checkPermissions(room, userCodenamesId, Permissions.HOST)) {
                return;
            }
    
            await transferHost(room, userCodenamesId, playerId);
    
            let users = await room.getUsers();
            let teams = await room.getTeams();
    
            io.to(roomId).emit("update_users", teams, users);
        });

        socket.on("send_new_chat_message", async (messageText) => {
            const resultChatMessages = chatMessageZodSchema.safeParse(messageText);
            if (!resultChatMessages.success) {
                console.log("Zod error:", resultChatMessages.error);
                return;
            }
            messageText = resultChatMessages.data;
            
            const room = new RoomContext(roomId);

            let users = await room.getUsers();

            const objIndex = users.findIndex((obj) => obj.id === userCodenamesId);
            let sender = users[objIndex];

            let result = await CodenamesDB.addChatMessageToRoomData(roomId, sender.name, userCodenamesId, messageText);

            await room.getChatMessages();

            const message = {
                senderName: sender.name,
                senderID: userCodenamesId,
                messageText: messageText
            };

            io.to(roomId).emit("add_chat_message", message);
        });
    
        socket.on('disconnect', async () => {
            const room = new RoomContext(roomId);

            if (!settedUp) {
                console.log("Some shit is going on... user was not setted up");
                return;
            }
            if (!(await validateUser(room, userCodenamesId))) {
                console.log("Some shit is going on... user was not validated");
                return;
            }

            let users = await room.getUsers();
    
            console.log('User disconnected:', socket.handshake.address);

            const objIndex = users.findIndex((obj) => obj.id === userCodenamesId);
            console.log(objIndex);
            let newUser = users[objIndex];
            newUser.online = false;
            await updateUser(room, newUser);

            let teams = await room.getTeams();
            users = await room.getUsers();
            if (users.every((user) => !user.online)) {
                console.log("Room is AFK now!");
            }
            io.to(roomId).emit("update_users", teams, users);
        });
    });
}

module.exports = {
    setupCodenames
}