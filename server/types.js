/**
 * @typedef {Object} Room
 * @property {function(bool?): Promise<GameRules>} getGameRules
 * @property {function(GameRules, bool?): Promise<void>} setGameRules
 * @property {function(bool?): Promise<GameProcess>} getGameProcess
 * @property {function(GameProcess, bool?): Promise<void>} setGameProcess
 * @property {function(bool?): Promise<User[]>} getUsers
 * @property {function(User[], bool?): Promise<void>} setUsers
 * @property {function(bool?): Promise<Team[]>} getTeams
 * @property {function(Team[], bool?): Promise<void>} setTeams
 * @property {function(bool?): Promise<Word[]>} getWords
 * @property {function(Word[], bool?): Promise<void>} setWords
 * @property {function(bool?): Promise<Traitor[]>} getTraitors
 * @property {function(Traitor[], bool?): Promise<void>} setTraitors
 * @property {function(bool?): Promise<GameWinStatus>} getGameWinStatus
 * @property {function(GameWinStatus, bool?): Promise<void>} setGameWinStatus
 * @property {function(bool?): Promise<number>} getClueIDCounter
 * @property {function(number, bool?): Promise<void>} setClueIDCounter
 * @property {function(bool?): Promise<Clue[]>} getClues
 * @property {function(Clue[], bool?): Promise<void>} setClues
 * @property {function(string, Clue): Promise<void>} addNewClue
 * @property {function(number, Clue): Promise<void>} updateClueByID
 * @property {function(bool?): Promise<void>} save
 * @property {string} roomId
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} color
 * @property {boolean} host
 * @property {boolean} online
 * @property {UserState} state
 */

/**
 * @typedef {Object} UserState
 * @property {string} teamColor
 * @property {boolean} master
 * @property {string} selecting
 */

/**
 * @typedef {Object} Team
 * @property {User[]} team
 * @property {User|null} master
 */

/**
 * @typedef {Object} Clue
 * @property {number} id
 * @property {string} text
 */

/**
 * @typedef {Object} Word
 * @property {string} text
 * @property {string} color
 * @property {Selector[]} selectedBy
 * @property {boolean} selectable
 * @property {boolean} revealed
 */

/**
 * @typedef {Object} Selector
 * @property {string} id
 * @property {string} color
 */

/**
 * @typedef {Object} GameRules
 * @property {boolean} locked
 * @property {number} teamAmount
 * @property {string[]} teamOrder
 * @property {number} maxCards
 * @property {number} baseCards
 * @property {number[]} extraCards
 * @property {number} blackCards
 * @property {boolean} limitedGuesses
 * @property {number} guessesLimit
 * @property {number} firstMasterTurnTime
 * @property {number} masterTurnTime
 * @property {number} teamTurnTime
 * @property {number} extraTime
 * @property {boolean} freezeTime
 * @property {Object} wordPack
 * @property {string} wordPack.packId
 * @property {string} game_mode
 */

/**
 * @typedef {Object} GameProcess
 * @property {boolean} isFirstTurn
 * @property {boolean} isGoing
 * @property {string} currentTurn
 * @property {number} guessesCount
 * @property {Object} wordsCount
 * @property {number} timeLeft
 * @property {boolean} infiniteTime
 * @property {boolean} masterTurn
 * @property {boolean} teamTimeStarted
 * @property {Object} clues
 * @property {Object} blacklisted
 * @property {Selector[]} endTurnSelected
 */

/**
 * @typedef {Object} GameWinStatus
 * @property {boolean} gameIsEnded
 * @property {string} winner
 */

/**
 * @typedef {Object} Traitor
 * @property {string} id
 */

/**
 * @typedef {Object} DIContainer
 * @property {SocketIO.Server|null} io
 * @property {Object} modules
 * @property {GameboardModule} modules.gameboard
 * @property {GameManagerModule} modules.gameManager
 * @property {GameSetupModule} modules.gameSetup
 * @property {PermissionsValidationModule} modules.permissionsValidation
 * @property {WordsModule} modules.words
 * @property {function(SocketIO.Server): void} init
 */

/**
 * @typedef {Object} GameboardModule
 * @property {function(string): Promise<Word[]>} getWordsFromPack
 * @property {function(Room): Promise<Word[]>} getWordsForRoom
 * @property {function(Room): Promise<Word[]>} getNewWords
 * @property {function(Room, string): Promise<Word[]>} getGameboard
 */

/**
 * @typedef {Object} GameManagerModule
 * @property {function(DIContainer): void} init
 * @property {function(Room): Promise<void>} updateTeamOrder
 * @property {function(Room, User): Promise<void>} updateUser
 * @property {function(Room): Promise<void>} passTurn
 * @property {function(Room, string): Promise<void>} processWin
 * @property {function(Room): Promise<void>} clearTimer
 * @property {function(Room, number): Promise<boolean>} updateGameTimer
 * @property {function(Room, boolean): Promise<void>} removeAllPlayers
 * @property {function(Room, string): Promise<void>} removePlayer
 * @property {function(Room, boolean): Promise<void>} randomizePlayers
 * @property {function(Room, string, string): Promise<void>} transferHost
 */

/**
 * @typedef {Object} GameSetupModule
 * @property {function(Room): Promise<void>} clearRoles
 * @property {function(Room): Promise<void>} setupGamemode
 * @property {function(Room, boolean, boolean): Promise<void>} startNewGame
 */

/**
 * @typedef {Object} PermissionsValidationModule
 * @property {function(Room, string): Promise<boolean>} validateUser
 * @property {function(Room, string): Promise<number>} getUserTeamPermissions
 * @property {function(Room, string): Promise<number>} getUserPermissions
 * @property {function(Room, string, number): Promise<boolean>} checkPermissions
 */

/**
 * @typedef {Object} WordsModule
 * @property {function(Room, string): Promise<void>} revealWord
 * @property {function(Room): Promise<boolean>} wordAutoselect
 */

/**
 * @typedef {Object} WordHelpersModule
 * @property {function(Room, string, number, any): Promise<void>} toggleWord
 * @property {function(Room, string, number, any): Promise<void>} toggleWordNoSave
 * @property {function(Room, string): Promise<void>} clearWord
 * @property {function(Room, string): Promise<void>} clearWordNoSave
 * @property {function(Room): Promise<void>} clearAllSelections
 */