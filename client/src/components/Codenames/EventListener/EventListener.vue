<template>

</template>

<script>
import { defineComponent } from 'vue';
import { gameStore } from '@/stores/gameData';
import { socket, state } from "@/sockets/codenames";

export default defineComponent({
    computed: {
        gameData: () => gameStore()
    },
    setup(props) {
        // setup() receives props as the first argument.
        // console.log(props.teamColor)
    },
    data() {
        return {
            
        }
    },
    methods: {
        setupClient() {
            if (!state.connected) {
                socket.connect();
            }
            socket.emit("setup_client", this.$route.params.roomId);
        },
        handleKeydownPanelToggle(event) {
            // console.log(event);
            if (['INPUT', 'TEXTAREA'].includes(event.target.tagName) || event.target.isContentEditable) {
                return;
            }
            if (event.key === 'o') {
                this.gameData.toggles.adminPanel = true;
            }
            else if (event.key === 'p') {
                this.gameData.toggles.chatPanel = true;
            }
        },
        processClicker(clickerId) {
            if (this.gameData.clickers.includes(clickerId)) {
                this.gameData.clickers = this.gameData.clickers.filter(id => id !== clickerId);
            }
            this.gameData.clickers.push(clickerId);
            setTimeout(() => {
                this.gameData.clickers = this.gameData.clickers.filter(id => id !== clickerId);
            }, 500);
        },
        listenForUpdates() {
            socket.on("answer", () => {
                console.log("Hearing something...");
            });

            socket.on("request_clues", () => {
                socket.emit("get_clues");
            });

            socket.on("request_game_process", () => {
                socket.emit("get_game_process");
            });

            socket.on("update_client_setup", (teams, users, client, gameRules, gameProcess, endTurnSelectors, clues, gameWinStatus, chatMessages) => {
                // console.log("Updating:", teams, users, client, gameRules, gameProcess, gameWinStatus, chatMessages);
                this.gameData.players = users;

                this.gameData.teams = teams;

                this.gameData.userData.name = client.name;
                this.gameData.userData.color = client.color;
                this.gameData.userData.id = client.id;
                this.gameData.userData.isHost = client.host;
                this.gameData.userData.isMaster = client.state.master;
                this.gameData.userData.isTraitor = client.state.traitor;
                this.gameData.userData.teamColor = client.state.teamColor;

                this.gameData.gameRules = gameRules;
                this.gameData.gameProcess = gameProcess;
                this.gameData.endTurnSelectors = endTurnSelectors;
                this.gameData.clues = clues;
                this.gameData.gameWinStatus = gameWinStatus;
                this.gameData.chatMessages = chatMessages;
            });

            socket.on("update_client", (teams, users, client, endTurnSelectors, gameRules, gameProcess) => {
                // console.log("Updating:", teams, users, client, gameRules, gameProcess);
                this.gameData.players = users;

                this.gameData.teams = teams;

                this.gameData.userData.name = client.name;
                this.gameData.userData.color = client.color;
                this.gameData.userData.id = client.id;
                this.gameData.userData.isHost = client.host;
                this.gameData.userData.isMaster = client.state.master;
                this.gameData.userData.isTraitor = client.state.traitor;
                this.gameData.userData.teamColor = client.state.teamColor;

                this.gameData.gameRules = gameRules;
                this.gameData.gameProcess = gameProcess;
                this.gameData.endTurnSelectors = endTurnSelectors;
            });

            socket.on('update_users', (teams, users) => {
                // console.log("Updating:", teams, users);
                this.gameData.players = users;

                this.gameData.teams = teams;

                const me = this.gameData.players.find((player) => player.id === this.gameData.userData.id);
                this.gameData.userData.name = me.name;
                this.gameData.userData.id = me.id;
                this.gameData.userData.color = me.color;
                this.gameData.userData.isMaster = me.state.master;
                this.gameData.userData.isHost = me.host;
                this.gameData.userData.teamColor = me.state.teamColor;
            });

            socket.on("update_game_rules", (gameRules) => {
                // console.log(gameRules);
                this.gameData.gameRules = gameRules;
                if (this.gameData.gameRules.maxCards !== this.gameData.wordBoardData.words.length) {
                    this.gameData.wordBoardData.wordBoardHidden = true;
                }
                else {
                    this.gameData.wordBoardData.wordBoardHidden = false;
                }
            });

            socket.on("update_clues", (clues) => {
                this.gameData.clues = clues;
            });

            socket.on("update_game_process", (gameProcess) => {
                this.gameData.gameProcess = gameProcess;
            });

            socket.on("start_game", (gameWinStatus) => {
                this.gameData.gameWinStatus = gameWinStatus;
                this.gameData.traitors = [];
            });

            socket.on("setup_new_game", () => {
                if (this.gameData.gameRules.game_mode === "traitor") {
                    socket.emit("get_traitors");
                }
            });

            socket.on("update_traitors", (traitors) => {
                console.log(traitors);
                this.gameData.traitors = traitors;
            });

            socket.on("end_game", (gameWinStatus, traitors) => {
                this.gameData.gameWinStatus = gameWinStatus;
                this.gameData.traitors = traitors;
            });

            socket.on("request_new_gameboard", () => {
                socket.emit("get_gameboard");
            });

            socket.on("send_new_gameboard", (words) => {
                this.gameData.wordBoardData.words = words;
            });

            socket.on("start_countdown", (word) => {
                this.gameData.selectProgress.selectedObject = word;
                this.gameData.selectProgress.percentage = 0;
            });

            socket.on("update_countdown", (newProgress) => {
                // console.log(newProgress);
                this.gameData.selectProgress.percentage = newProgress;
            });

            socket.on("stop_countdown", () => {
                this.gameData.selectProgress.selectedObject = "";
                this.gameData.selectProgress.percentage = 0;
            });

            socket.on("click_word", (clickedWordText, userId) => {
                this.processClicker(userId);
            });

            socket.on("add_chat_message", (message) => {
                this.gameData.chatMessages.push(message);
                if (this.gameData.chatMessages.length > 100) {
                    this.gameData.chatMessages.shift();
                }
            });

            socket.on("error_message", (errorObject) => {
                console.log(errorObject);
                console.error(errorObject.error);
                this.gameData.openedPanels.anything = true;
                this.gameData.openedPanels.errorPanel = true;
                this.gameData.openedPanels.passedObject = errorObject;
            });
        }
    },
    mounted() {
        this.listenForUpdates();
        this.setupClient();
        window.addEventListener('keydown', this.handleKeydownPanelToggle);
    },
    beforeUnmount() {
        window.removeEventListener('keydown', this.handleKeydownPanelToggle);
    },
});
</script>