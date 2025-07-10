/**
 * @type {DIContainer}
 */
class DIContainer {
    constructor() {
        this.io = null;
        /** @type {{
         *   gameboard: GameboardModule,
         *   gameManager: GameManagerModule,
         *   gameSetup: GameSetupModule,
         *   permissionsValidation: PermissionsValidationModule,
         *   words: WordsModule
         *   wordHelpers: WordHelpersModule
         * }} */
        this.modules = {
            gameboard: require("./gameboard"),
            gameManager: require("./gameManager"),
            gameSetup: require("./gameSetup"),
            permissionsValidation: require("./permissionsValidation"),
            words: require("./words"),
            wordHelpers: require("./wordHelpers")
        };
    }
  
    /**
     * @param {SocketIO.Server} io 
     */
    init(io) {
        this.io = io;
        Object.values(this.modules).forEach(module => {
            if (module.init) module.init(this);
        });
    }
}
  
module.exports = new DIContainer();