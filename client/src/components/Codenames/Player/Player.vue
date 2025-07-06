<template>
    <div v-if="player" class="player-wrapper">
        <div v-if="player.id === gameData.userData.id" class="color-circle clickable" :style="{'background-color' : player.color}" @click="changeColor"></div>
        <div v-else class="color-circle" :style="{'background-color' : player.color}"></div>
        <span class="player-object-wrapper" 
                :class="{ offline : !player.online }"
                :player-name-wrapper="player.name">
            <span class="player-name-wrapper" :class="{clicker : gameData.clickers.includes(player.id)}">
                {{ player.name }}
            </span>
        </span>
        <div class="player-statuses-wrapper">
            <svg 
                class="traitor-icon visible-always" 
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 512 512"
                v-if="gameData.traitors.some((traitor) => traitor.id === player.id)"
            >
                <circle cx="256" cy="256" r="64"/>
                <path d="M490.84 238.6c-26.46-40.92-60.79-75.68-99.27-100.53C349 110.55 302 96 255.66 96c-42.52 0-84.33 12.15-124.27 36.11-40.73 24.43-77.63 60.12-109.68 106.07a31.92 31.92 0 00-.64 35.54c26.41 41.33 60.4 76.14 98.28 100.65C162 402 207.9 416 255.66 416c46.71 0 93.81-14.43 136.2-41.72 38.46-24.77 72.72-59.66 99.08-100.92a32.2 32.2 0 00-.1-34.76zM256 352a96 96 0 1196-96 96.11 96.11 0 01-96 96z"/>
            </svg>
            <svg 
                class="host-icon visible-on-hover" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 512 512"
                v-if="player.host" 
            >
                <path d="M218.1 167.17c0 13 0 25.6 4.1 37.4-43.1 50.6-156.9 184.3-167.5 194.5a20.17 20.17 0 00-6.7 15c0 8.5 5.2 16.7 9.6 21.3 6.6 6.9 34.8 33 40 28 15.4-15 18.5-19 24.8-25.2 9.5-9.3-1-28.3 2.3-36s6.8-9.2 12.5-10.4 15.8 2.9 23.7 3c8.3.1 12.8-3.4 19-9.2 5-4.6 8.6-8.9 8.7-15.6.2-9-12.8-20.9-3.1-30.4s23.7 6.2 34 5 22.8-15.5 24.1-21.6-11.7-21.8-9.7-30.7c.7-3 6.8-10 11.4-11s25 6.9 29.6 5.9c5.6-1.2 12.1-7.1 17.4-10.4 15.5 6.7 29.6 9.4 47.7 9.4 68.5 0 124-53.4 124-119.2S408.5 48 340 48s-121.9 53.37-121.9 119.17zM400 144a32 32 0 11-32-32 32 32 0 0132 32z"/>
            </svg>
            <svg 
                class="remove-player-button visible-on-hover clickable" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 512 512"
                    @click="removePlayer"
                    @mouseenter="" 
                    v-if="gameData.userData.isHost && player.id !== gameData.userData.id && player.state.teamColor !== 'spectator'"
            >
                <path d="M289.94 256l95-95A24 24 0 00351 127l-95 95-95-95a24 24 0 00-34 34l95 95-95 95a24 24 0 1034 34l95-95 95 95a24 24 0 0034-34z"/>
            </svg>
            <svg 
                class="transfer-host-button visible-on-hover clickable" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 512 512"
                @click="openHostTransferPanel"
                v-if="gameData.userData.isHost && player.id !== gameData.userData.id">
            >
                <path d="M394 480a16 16 0 01-9.39-3L256 383.76 127.39 477a16 16 0 01-24.55-18.08L153 310.35 23 221.2a16 16 0 019-29.2h160.38l48.4-148.95a16 16 0 0130.44 0l48.4 149H480a16 16 0 019.05 29.2L359 310.35l50.13 148.53A16 16 0 01394 480z"/>
            </svg>
        </div>
    </div>
</template>

<script>
import { defineComponent } from 'vue';
import { gameStore } from '@/stores/gameData';
import { socket } from "@/sockets/codenames";

export default defineComponent({
    computed: {
        gameData: () => gameStore()
    },
    props: {
        player: {
            type: Object,
            default: {
                name: "user_xxxxx",
                color: "#000000",
                id: "000000",
                roomId: "000000",
                state: {
                    teamColor: "spectator",
                    master: false,
                    selecting: ""
                },
                online: true,
                host: false
            }
        }
    },
    setup(props) {
        
    },
    data() {
        return {
            
        }
    },
    methods: {
        changeColor() {
            // let user = this.gameData.players.find((player) => player.id === this.gameData.userData.id);
            // user.name = this.nameValue;
            // this.gameData.userData.name = this.nameValue;
            // this.gameData.openedPanels.editNamePanel = false;
            // let anyOpened = false;
            // for (let key in this.gameData.openedPanels) {
            //     if (this.gameData.openedPanels[key] === true && key !== "anything") {
            //         anyOpened = true;
            //         break;
            //     }
            // }
            // this.gameData.openedPanels.anything = anyOpened;
            socket.emit("change_user_color");
        },
        removePlayer() {
            socket.emit("remove_player", this.player.id);
        },
        openHostTransferPanel() {
            socket.emit("transfer_host", this.player.id);
        },
        listenForUpdates() {
            
        }
    },
    mounted() {
        
    },
    beforeUnmount() {
        
    },
});
</script>

<style lang="css" scoped>
.player-wrapper {
    max-width: 100%;
    width: auto;
    min-height: 1.2rem;
    height: max-content;
    max-height: 5rem;

    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex-direction: row;
    flex-wrap: nowrap;
    
    column-gap: 0.15rem;

    overflow: hidden;

    position: relative;
}

.player-statuses-wrapper {
    height: 100%;
    width: max-content;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.player-statuses-wrapper .traitor-icon {
    width: 1.4rem;
    scale: 0.75;
}

.player-statuses-wrapper .host-icon {
    width: 1.4rem;
    scale: 0.75;
}

.player-statuses-wrapper .remove-player-button {
    width: 1.4rem;
    scale: 1;
}

.player-statuses-wrapper .transfer-host-button {
    width: 1.4rem;
    scale: 0.75;
}

.player-wrapper > * {
    vertical-align: middle;
}

.color-circle {
    display: inline-block;
    min-width: 0.8rem;
    margin-right: 0.25rem;
    width: 0.8rem !important;
    height: 0.8rem !important;
    border-radius: 50%;
}

.player-object-wrapper {
    max-width: 100%;
    width: auto;
    height: max-content;
    display: inline-flex;
    align-items: center;
    
    
    position: relative;
    overflow: hidden;
    word-wrap: break-word;
}

.player-object-wrapper > * {
    display: inline-flex;
}

.player-wrapper .visible-on-hover {
    display: none;
}

.player-wrapper .visible-always, .player-wrapper:hover .visible-on-hover {
    margin-right: 0;
    display: inline-flex;
}

.player-name-wrapper {
    max-width: 100%;
    width: max-content;
    height: max-content;
    display: inline-block;
    
    word-break: normal;
    position: relative;
    font-weight: normal;
    margin-right: 0.2rem;
}

.offline {
    color: red;
}

.clickable {
    cursor: pointer;
}

.player-name-wrapper.clicker {
    text-shadow: 
            0 0 2px #fff, 
            0 0 4px #fff, 
            0 0 6px #fff;
}

@media screen and (max-width: 1000px) {
    .player-wrapper .visible-always, .player-wrapper .visible-on-hover {
        margin-right: 0;
        display: inline-block;
    }
}
</style>