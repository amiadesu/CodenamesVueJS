<script setup>
import { useRoute } from 'vue-router';
import { gameStore } from '@/stores/gameData';
import { globalStore } from '@/stores/globalData';
import { useDocumentVisibility } from '@vueuse/core';
import { getConfig } from '@/utils/config';

import Background from '../../components/Home/Background.vue';
import GamePreview from '../../components/Home/GamePreview.vue';
import LanguageSelector from '../../components/Global/LanguageSelector.vue';
import ThemeToggler from '../../components/Global/ThemeToggler.vue';

const config = getConfig();

const availableGames = config["availableGames"];

const visibility = 'visible';
let globalData = globalStore();

globalData.remInPixels = parseFloat(getComputedStyle(document.documentElement).fontSize);

const route = useRoute();

// if (route.params.roomId && route.params.roomId !== 'rules') {
//     if (!socket.connected) {
//         socket.connect();
//     }
//     socket.emit("setup_client", route.params.roomId);
// }

</script>

<template>
    <div id="app-wrapper">
        <Background></Background>
        <div class="row-wrapper top-row">
            <LanguageSelector></LanguageSelector>
            <ThemeToggler></ThemeToggler>
        </div>
        <div id="game-previews-list-wrapper">
            <div id="game-previews-list-glass-panel">
                <template v-for="gameCodename in availableGames">
                    <GamePreview :game-codename="gameCodename"></GamePreview>
                </template>
            </div>
        </div>
    </div>
</template>

<style scoped>
#app-wrapper {
    height: 100%;
    width: 100%;

    background-color: var(--home-view-background-color);

    position: relative;

    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex-direction: column;
    z-index: 1;

    overflow-y: visible;
    overflow-x: hidden;
}

#game-previews-list-wrapper {
    width: 100%;
    height: max-content;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex-direction: column;
    row-gap: 1rem;

    overflow-y: auto;
}

#game-previews-list-glass-panel {
    width: 66.5%;
    height: max-content;
    padding: 2rem;
    margin-top: 4%;
    margin-bottom: 2rem;

    border-radius: 1rem;

    background-color: --alpha(var(--color-cornflower-blue-100) / 60%);
    backdrop-filter: blur(2px) saturate(1);
    -webkit-backdrop-filter: blur(2px) saturate(1);

    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    flex-direction: column;
    row-gap: 1rem;
}

.row-wrapper {
    display: flex;
    align-items: center;
    justify-content: right;
    flex-direction: row;
}

.row-wrapper.top-row {
    height: 4%;
    width: 100%;
    align-items: start;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 5;
    padding-right: 15px;
}

@media screen and (max-width: 1300px) {
    #game-previews-list-glass-panel {
        width: 80%;
    }
}

@media screen and (max-width: 650px) {
    #game-previews-list-glass-panel {
        width: 90%;
    }
}
</style>