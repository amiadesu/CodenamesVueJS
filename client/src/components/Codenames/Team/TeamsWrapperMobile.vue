<template>
    <div id="teams-wrapper">
        <TeamMobile :teamColor="`red`"></TeamMobile>
        <TeamMobile v-if="gameData.gameRules.teamAmount >= 4" :teamColor="`yellow`"></TeamMobile>
        <TeamMobile v-if="gameData.gameRules.teamAmount >= 3" :teamColor="`blue`"></TeamMobile>
        <TeamMobile :teamColor="`green`"></TeamMobile>
    </div>
</template>

<script>
import { defineComponent } from 'vue';
import { gameStore } from '@/stores/gameData';
import { socket } from "@/sockets/codenames";

import TeamMobile from './TeamMobile.vue';

export default defineComponent({
    computed: {
        gameData: () => gameStore()
    },
    components: {
        TeamMobile
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
            colors: ["red", "yellow", "blue", "green"],
            master: null,
            team: [],
            isInTeam: false
        }
    },
    methods: {
        becameMaster() {
            let user = this.gameData.players.find((player) => player.id === this.gameData.userData.id);
            const previousColor = user.state.teamColor;
            user.state.teamColor = this.teamColorValue;
            user.state.master = true;
            this.updateData();
            socket.emit("state_changed", previousColor, user);
        },
        joinTeam() {
            let user = this.gameData.players.find((player) => player.id === this.gameData.userData.id);
            const previousColor = user.state.teamColor;
            user.state.teamColor = this.teamColorValue;
            user.state.master = false;
            this.updateData();
            socket.emit("state_changed", previousColor, user);
        },
        updateData() {
            this.team = this.gameData.teams[this.teamColorValue].team;
            this.isInTeam = this.team.findIndex((player) => player.id === this.gameData.userData.id) !== -1;
            this.master = this.gameData.teams[this.teamColorValue].master;
        },
        displayTime() {
            if (this.gameData.gameProcess.currentTurn !== this.teamColorValue) {
                return "00:00";
            }
            if (this.gameData.gameProcess.infiniteTime) {
                return "--:--";
            }
            const secs = this.gameData.gameProcess.timeLeft;
            let sec_num = Math.ceil(secs);
            let hours   = Math.floor(sec_num / 3600);
            let minutes = Math.floor(sec_num / 60) % 60;
            let seconds = sec_num % 60;

            return [hours,minutes,seconds]
                .map(v => v < 10 ? "0" + v : v)
                .filter((v,i) => v !== "00" || i > 0)
                .join(":");
        },
        selectEndTurn() {
            if (this.gameData.gameProcess.isGoing &&
                !this.gameData.userData.isMaster && 
                !this.gameData.gameProcess.masterTurn &&
                this.gameData.userData.teamColor === this.gameData.gameProcess.currentTurn) {
                socket.emit("select_word", "endTurn");
            }
        },
        editCluePanelOpen(clue) {
            const clueData = clue.text.split(" - ");
            const clueNumber = clueData[clueData.length - 1];
            clueData.splice(clueData.length - 1, 1);
            const clueText = clueData.join(" - ");
            const preprocessedClue = {
                text: clueText,
                number: clueNumber,
                id: clue.id
            };
            this.gameData.openedPanels.anything = true;
            this.gameData.openedPanels.editCluePanel = true;
            this.gameData.openedPanels.passedObject = preprocessedClue;
        },
        listenForUpdates() {
            this.$watch(
                () => this.gameData.teams,
                (newValue, oldValue) => {
                    // console.log(this.teamColorValue, newValue, oldValue);
                    this.updateData();
                }
            );
        }
    },
    mounted() {
        this.updateData();
        this.listenForUpdates();
    },
    beforeUnmount() {
        
    },
});
</script>

<style lang="css" scoped>
#teams-wrapper {
    height: 45%;
    min-height: 45%;
    max-height: 45%;
    width: 95%;
    max-width: 95%;
    display: flex;
    align-items: start;
    justify-content: space-evenly;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scroll-snap-align: start;
}

#teams-wrapper .team-content-wrapper {
    width: 50%;
    min-width: 50%;
    max-width: 50%;
}

@media screen and (max-width: 650px) {
    #teams-wrapper {
        width: 98%;
        max-width: 98%;
    }
}

@media screen and (max-width: 550px) {
    #teams-wrapper .team-content-wrapper {
        width: 50%;
        min-width: 50%;
        max-width: 50%;
    }
}

@media screen and (max-width: 440px) {
    #teams-wrapper .team-content-wrapper {
        width: 50%;
        min-width: 50%;
        max-width: 50%;
    }
}
</style>