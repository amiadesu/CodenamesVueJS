<template>    
    <div id="spectators-wrapper">
        <div id="spectators-bar">
            <div id="spectators-bar-wrapper">
                <p v-if="isSpectator">
                    <b>
                        {{ $t("codenames.spectators.count", {count: spectators?.length}) }}
                    </b>
                </p>
                <p v-else-if="!isSpectator || gameData.gameRules.locked">
                    <span>
                        {{ $t("codenames.spectators.count", {count: spectators?.length}) }}
                    </span>
                </p>
                <button 
                    v-if="listOpened" 
                    class="toggle-spectators-list-button"
                    @click="toggleList"
                >
                    {{ $t("codenames.spectators.close_list") }}
                </button>
                <button 
                    v-else 
                    class="toggle-spectators-list-button"
                    @click="toggleList"
                >
                    {{ $t("codenames.spectators.open_list") }}
                </button>
                <p v-if="!isSpectator && !gameData.gameRules.locked" class="join-button">
                    <a @click="becameSpectator">
                        <u>
                            {{ $t("codenames.spectators.join") }}
                        </u>
                    </a>
                </p>
                <p v-else-if="!isSpectator && gameData.gameRules.locked">
                    {{ $t("codenames.spectators.join") }}
                </p>
                <p v-else>
                    {{ $t("codenames.spectators.already_spectator") }}
                </p>
            </div>
        </div>
        <div 
            id="spectators-list-wrapper"
            :class="listOpened ? `opened` : `closed`"
        >
            <h2>{{ $t("codenames.spectators.list") }}</h2>
            <div id="spectators-list">
                <Player v-for="player in spectators" :key="player" :player="player"></Player>
            </div>
        </div>
    </div>
</template>

<script>
import { defineComponent } from 'vue';
import { gameStore } from '@/stores/gameData';
import { socket } from "@/sockets/codenames";

import Player from '../Player/Player.vue';

export default defineComponent({
    computed: {
        gameData: () => gameStore()
    },
    components: {
        Player
    },
    setup(props) {
        
    },
    data() {
        return {
            listOpened: false,
            spectators: [],
            isSpectator: false
        }
    },
    methods: {
        toggleList() {
            this.listOpened = !this.listOpened;
        },
        becameSpectator() {
            let user = this.gameData.players.find((player) => player.id === this.gameData.userData.id);
            console.log(this.gameData.players);
            console.log(socket.id);
            const previousColor = user.state.teamColor;
            user.state.teamColor = "spectator";
            user.state.master = false;
            this.updateData();
            socket.emit("state_changed", previousColor, user);
        },
        updateData() {
            this.spectators = this.gameData.players.filter((player) => player.state.teamColor === "spectator");
            this.isSpectator = this.spectators.findIndex((player) => player.id === this.gameData.userData.id) !== -1;
        },
        listenForUpdates() {
            this.$watch(
                () => this.gameData.players,
                (newValue, oldValue) => {
                    this.updateData();
                }
            )
        }
    },
    mounted() {
        this.listenForUpdates();
        this.updateData();
    },
    beforeUnmount() {
        
    },
});
</script>

<style lang="css" scoped>
#spectators-wrapper {
    height: 100%;
    width: 100%;
    position: relative;
}

#spectators-bar {
    height: 100%;
    width: 100%;
    min-width: 100%;
    background-color: var(--spectators-bar-background-color);
    color: var(--spectators-bar-text-color);

    display: flex;
    align-items: center;
    justify-content: center;
}

#spectators-bar .player-wrapper {
    color: var(--spectators-bar-text-color) !important;
}

#spectators-bar-wrapper {
    width: 95%;
    height: 100%;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
}

#spectators-bar-wrapper > * {
    margin: auto;
}

#spectators-list-wrapper.closed {
    display: none;
}

#spectators-list-wrapper.opened {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-inline: auto;
    background-color: var(--panel-background-color-dark-1);
    width: 80%;
    height: 60vh;
    display: flex;
    align-items: center;
    justify-content: left;
    flex-direction: column;
    
    z-index: 1;
    overflow: hidden;
}

#spectators-list {
    height: 90%;
    width: 90%;
    max-width: 90%;
    display: flex;
    align-items: center;
    justify-content: left;
    flex-direction: column;
    column-gap: 1rem;
    overflow-y: auto;
    margin: 20px;
}

.toggle-spectators-list-button {
    cursor: pointer;
}

.join-button {
    cursor: pointer;
}

@media screen and (max-width: 650px) {
    #spectators-wrapper {
        font-size: 0.8rem;
    }
}
</style>