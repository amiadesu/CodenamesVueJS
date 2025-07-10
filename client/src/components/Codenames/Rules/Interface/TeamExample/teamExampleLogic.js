export const teamMixin = {
    computed: {
        gameData: () => gameStore()
    },
    props: {
        teamColor: {
            type: String,
            default: "red"
        }
    },
    setup(props) {
        
    },
    data() {
        return {
            teamColorValue: this.teamColor,
            endTurnProgress: 0,
            endTurnSelectionIsGoing: false,
            endTurnInterval: null
        }
    },
    inject: ['interfaceData'],
    methods: {
        becameMaster() {
            this.interfaceData.player.state.teamColor = this.teamColorValue;
            this.interfaceData.player.state.master = true;
        },
        joinTeam() {
            this.interfaceData.player.state.teamColor = this.teamColorValue;
            this.interfaceData.player.state.master = false;
        },
        displayTime() {
            return "--:--";
        },
        selectEndTurn() {
            if (this.endTurnSelectionIsGoing) {
                clearInterval(this.endTurnInterval);
                this.interfaceData.selecting = "";
                this.endTurnProgress = 0;
                this.endTurnSelectionIsGoing = false;
            }
            else if (!this.interfaceData.player.state.master && 
                !this.interfaceData.gameProcess.masterTurn &&
                this.interfaceData.player.state.teamColor === this.interfaceData.gameProcess.currentTurn) {
                this.endTurnSelectionIsGoing = true;
                this.interfaceData.selecting = "endTurn";

                this.endTurnInterval = setInterval(() => {
                    if (this.interfaceData.selecting !== "endTurn") {
                        clearInterval(this.endTurnInterval);
                        this.endTurnProgress = 0;
                        this.endTurnSelectionIsGoing = false;
                        return;
                    }

                    this.endTurnProgress += 0.02
                    
                    if (this.endTurnProgress >= 1) {
                        clearInterval(this.endTurnInterval);
                        this.endTurnProgress = 0;
                        this.endTurnSelectionIsGoing = false;
                        this.interfaceData.selecting = "";
                        this.interfaceData.gameProcess.masterTurn = true;
                    }
                }, 10);
            }
        },
        editCluePanelOpen(clue) {
            alert(this.$t("codenames.rules.game_interface.alerts.edit_clue"));
        },
        scrollToBottom() {
            this.$nextTick(() => {
                const container = this.$refs.cluesContainer;
                container.scrollTop = container.scrollHeight;
            });
        },
        listenForUpdates() {
            this.$watch(
                () => [...this.interfaceData.clues[this.teamColorValue]],
                (newValue, oldValue) => {
                    console.log(oldValue, newValue);
                    if (oldValue.length < newValue.length) {
                        this.scrollToBottom();
                    }
                }
            )
        }
    },
    mounted() {
        this.listenForUpdates();
    },
    beforeUnmount() {
        
    },
};