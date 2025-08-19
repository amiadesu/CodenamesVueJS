import { gameStore } from '@/stores/gameData';
import { socket } from "@/sockets/codenames";
import { getConfig } from '@/utils/config';
import { clamp } from '@/utils/extra';

export const adminControlMixin = {
    computed: {
        gameData: () => gameStore()
    },
    setup(props) {
        
    },
    data() {
        return {
            restrictions: getConfig().defaultGameRules,
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
        clamp(x, minx, maxx) {
            if (x < minx) {
                x = minx;
            }
            if (x > maxx) {
                x = maxx;
            }
            return x;
        },
        clampGameRules() {
            this.gameData.gameRules.teamAmount = clamp(
                this.gameData.gameRules.teamAmount, 
                this.restrictions.teamAmount.min, 
                this.restrictions.teamAmount.max
            );

            this.gameData.gameRules.maximumPlayers = clamp(
                this.gameData.gameRules.maximumPlayers, 
                this.restrictions.maximumPlayers.min, 
                this.restrictions.maximumPlayers.max
            );

            this.gameData.gameRules.firstMasterTurnTime = this.clamp(
                this.gameData.gameRules.firstMasterTurnTime,
                this.restrictions.firstMasterTurnTime.min,
                this.restrictions.firstMasterTurnTime.max
            );
        
            this.gameData.gameRules.masterTurnTime = this.clamp(
                this.gameData.gameRules.masterTurnTime,
                this.restrictions.masterTurnTime.min,
                this.restrictions.masterTurnTime.max
            );
        
            this.gameData.gameRules.teamTurnTime = this.clamp(
                this.gameData.gameRules.teamTurnTime,
                this.restrictions.teamTurnTime.min,
                this.restrictions.teamTurnTime.max
            );

            this.gameData.gameRules.extraTime = this.clamp(
                this.gameData.gameRules.extraTime,
                this.restrictions.extraTime.min,
                this.restrictions.extraTime.max
            );
        
            this.gameData.gameRules.guessesLimit = this.clamp(
                this.gameData.gameRules.guessesLimit,
                this.restrictions.guessesLimit.min,
                this.restrictions.guessesLimit.max
            );
        
            this.gameData.gameRules.baseCards = this.clamp(
                this.gameData.gameRules.baseCards,
                this.restrictions.baseCards.min,
                this.gameData.gameRules.maxCards
            );

            for (let i = 0; i < this.gameData.gameRules.teamAmount - 1; i++) {
                this.gameData.gameRules.extraCards[i] = this.clamp(
                    this.gameData.gameRules.extraCards[i],
                    this.restrictions.baseCards.min - this.gameData.gameRules.baseCards,
                    this.gameData.gameRules.maxCards
                );
            }

            this.gameData.gameRules.blackCards = this.clamp(
                this.gameData.gameRules.blackCards,
                this.restrictions.blackCards.min,
                this.gameData.gameRules.maxCards - this.gameData.gameRules.teamAmount
            );
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
            this.$watch(
                () => this.gameData.toggles.adminPanel,
                (newValue, oldValue) => {
                    if (newValue) {
                        this.togglePanel();
                        this.gameData.toggles.adminPanel = false;
                    }
                }
            );
        }
    },
    mounted() {
        this.listenForUpdates();
    },
    beforeUnmount() {
        
    },
};