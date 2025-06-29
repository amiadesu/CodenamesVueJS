import { gameStore } from '@/stores/gameData';
// import { io } from 'socket.io-client';
import { socket } from "@/sockets/codenames";

export const adminControlMixin = {
    computed: {
        gameData: () => gameStore()
    },
    setup(props) {
        // setup() receives props as the first argument.
        // console.log(props.teamColor)
    },
    data() {
        return {
            opened: false,
            oldAmount: 2,
            isDisabled: false,
            cooldown: 0,
            sufficientAmount: true
        }
    },
    methods: {
        togglePanel() {
            this.opened = !this.opened;
        },
        handleKeyTogglePanel(event) {
            console.log(event.key);
            if (event.key === 'o' || event.key === 'O') {
                this.togglePanel();
            }
        },
        clampGameRules() {
            if (this.gameData.gameRules.teamAmount < 2) {
                this.gameData.gameRules.teamAmount = 2;
            }
            if (this.gameData.gameRules.teamAmount > 4) {
                this.gameData.gameRules.teamAmount = 4;
            }

            if (this.gameData.gameRules.maximumPlayers < 1) {
                this.gameData.gameRules.maximumPlayers = 1;
            }
            if (this.gameData.gameRules.maximumPlayers > 10) {
                this.gameData.gameRules.maximumPlayers = 10;
            }

            if (this.gameData.gameRules.firstMasterTurnTime < 0) {
                this.gameData.gameRules.firstMasterTurnTime = 0;
            }
            if (this.gameData.gameRules.firstMasterTurnTime > 3599) {
                this.gameData.gameRules.firstMasterTurnTime = 3599;
            }

            if (this.gameData.gameRules.masterTurnTime < 0) {
                this.gameData.gameRules.masterTurnTime = 0;
            }
            if (this.gameData.gameRules.masterTurnTime > 3599) {
                this.gameData.gameRules.masterTurnTime = 3599;
            }

            if (this.gameData.gameRules.teamTurnTime < 0) {
                this.gameData.gameRules.teamTurnTime = 0;
            }
            if (this.gameData.gameRules.teamTurnTime > 3599) {
                this.gameData.gameRules.teamTurnTime = 3599;
            }

            if (this.gameData.gameRules.extraTime < 0) {
                this.gameData.gameRules.extraTime = 0;
            }
            if (this.gameData.gameRules.extraTime > 3599) {
                this.gameData.gameRules.extraTime = 3599;
            }

            if (this.gameData.gameRules.guessesLimit < 0) {
                this.gameData.gameRules.guessesLimit = 0;
            }
            if (this.gameData.gameRules.guessesLimit > 99) {
                this.gameData.gameRules.guessesLimit = 99;
            }

            if (this.gameData.gameRules.baseCards < 1) {
                this.gameData.gameRules.baseCards = 1;
            }
            if (this.gameData.gameRules.baseCards > this.gameData.gameRules.maxCards) {
                this.gameData.gameRules.baseCards = this.gameData.gameRules.maxCards;
            }

            for (let i = 0; i < this.gameData.gameRules.teamAmount - 1; i++) {
                if (this.gameData.gameRules.extraCards[i] < 1 - this.gameData.gameRules.baseCards) {
                    this.gameData.gameRules.extraCards[i] = 1 - this.gameData.gameRules.baseCards;
                }
                if (this.gameData.gameRules.extraCards[i] > this.gameData.gameRules.maxCards) {
                    this.gameData.gameRules.extraCards[i] = this.gameData.gameRules.maxCards;
                }
            }

            if (this.gameData.gameRules.blackCards < 0) {
                this.gameData.gameRules.blackCards = 0;
            }
            if (this.gameData.gameRules.blackCards > this.gameData.gameRules.maxCards - this.gameData.gameRules.teamAmount) {
                this.gameData.gameRules.blackCards = this.gameData.gameRules.maxCards - this.gameData.gameRules.teamAmount;
            }
        },
        totalCards() {
            let extraSum = 0;
            for (let i = 0; i < this.gameData.gameRules.teamAmount - 1; i++) {
                extraSum += this.gameData.gameRules.extraCards[i];
            }
            const totalCardAmount = this.gameData.gameRules.teamAmount * this.gameData.gameRules.baseCards + 
                                    extraSum + this.gameData.gameRules.blackCards;
            return totalCardAmount;
        },
        updateGameRules() {
            this.clampGameRules();

            if (this.gameData.gameRules.guessesLimit === 0) {
                this.gameData.gameRules.limitedGuesses = false;
            } else {
                this.gameData.gameRules.limitedGuesses = true;
            }

            if (this.oldAmount > this.gameData.gameRules.teamAmount) {
                console.log(this.oldAmount, this.gameData.gameRules.teamAmount)
                let removedPlayers = [];
                if (this.gameData.gameRules.teamAmount === 3) {
                    removedPlayers = this.gameData.players.filter((player) => player.state.teamColor === "yellow");
                } else {
                    removedPlayers = this.gameData.players.filter((player) => player.state.teamColor === "yellow" || 
                                                                                player.state.teamColor === "blue");
                }
                removedPlayers.forEach((player) => {
                    const previousColor = player.state.teamColor;
                    player.state.teamColor = "spectator";
                    player.state.master = false;
                    socket.emit("state_changed", previousColor, player);
                });
            }
            this.oldAmount = this.gameData.gameRules.teamAmount;
            console.log(this.gameData.gameRules);
            socket.emit("set_new_game_rules", this.gameData.gameRules);
        },
        refreshBoard() {
            socket.emit("refresh_gameboard");
            this.isDisabled = true;
            this.startCooldown(0.5);
        },
        randomizeTeamOrder() {
            socket.emit("randomize_team_order");
            // socket.emit("refresh_gameboard");
        },
        openWordPackSelectionPanel() {
            this.gameData.openedPanels.anything = true;
            this.gameData.openedPanels.wordPackSelectionPanel = true;
        },
        startNewGame() {
            socket.emit("start_new_game", this.gameData.adminOptions.randomizeTeamOrder, this.gameData.adminOptions.getNewGameboard);
        },
        freezeTime() {
            this.gameData.gameRules.freezeTime = !this.gameData.gameRules.freezeTime;
            socket.emit("set_new_game_rules", this.gameData.gameRules);
        },
        lockRoom() {
            this.gameData.gameRules.locked = !this.gameData.gameRules.locked;
            socket.emit("set_new_game_rules", this.gameData.gameRules);
        },
        passTurn() {
            socket.emit("pass_turn");
        },
        removeAllPlayers() {
            socket.emit("remove_all_players", this.gameData.adminOptions.moveMasters);
        },
        randomizeAllPlayers() {
            socket.emit("randomize_players", this.gameData.adminOptions.randomizeMasters);
        },
        openEditNamePanel() {
            this.gameData.openedPanels.anything = true;
            this.gameData.openedPanels.editNamePanel = true;
        },
        startCooldown(seconds) {
            this.isDisabled = true;
            this.cooldown = seconds;

            const interval = setInterval(() => {
                this.cooldown -= 0.1;

                // Stop the cooldown when it reaches zero
                if (this.cooldown <= 0) {
                    this.cooldown = 0;
                    clearInterval(interval);
                    this.isDisabled = false;
                }
            }, 100);
        },
        listenForUpdates() {
            // socket.on("notify_client_about_change", () => {
            //     this.updateData();
            // });

            // this.socket.on("user_connected", (users) => {
            //     this.users = users
            // });
        }
    },
    mounted() {
        // Connect to the WebSocket server
        // this.socket = io('http://localhost:3000');
        this.listenForUpdates();
    },
    beforeUnmount() {
        // Clean up the WebSocket connection
        // this.socket.disconnect();
    },
};