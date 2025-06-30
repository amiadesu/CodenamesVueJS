<script setup>
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { gameStore } from '@/stores/gameData';
import { globalStore } from '@/stores/globalData';
import { useDocumentVisibility } from '@vueuse/core';

import { config } from '../../utils/config';
import Background from '../../components/Home/Background.vue';
import GamePreview from '../../components/Home/GamePreview.vue';
import LanguageSelector from '../../components/Global/LanguageSelector.vue';
import ThemeToggler from '../../components/Global/ThemeToggler.vue';

const availableGames = config["availableGames"];

const visibility = 'visible';
let globalData = globalStore();
const currentPanelIndex = ref(0);

globalData.remInPixels = parseFloat(getComputedStyle(document.documentElement).fontSize);

const route = useRoute();

function togglePanel(newPanelIndex) {
    if (newPanelIndex === currentPanelIndex.value) {
        return;
    }
    currentPanelIndex.value = newPanelIndex;
};

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
            <div id="rules-switchers-wrapper">
                <button 
                    @click="togglePanel(0)"
                    class="switcher-button"
                    :class="{active: currentPanelIndex === 0}"
                >
                    Game rules
                </button>
                <button 
                    @click="togglePanel(1)"
                    class="switcher-button"
                    :class="{active: currentPanelIndex === 1}"
                >
                    Game interface
                </button>
                <button 
                    @click="togglePanel(2)"
                    class="switcher-button"
                    :class="{active: currentPanelIndex === 2}"
                >
                    Host settings
                </button>
            </div>
            <div id="game-previews-list-glass-panel">
                <div v-if="currentPanelIndex === 0">
                    {{ currentPanelIndex }}
                </div>
                <div v-else-if="currentPanelIndex === 1">
                    See
                </div>
                <div v-else-if="currentPanelIndex === 2">
                    !!!
                </div>
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
    overflow-y: auto;
}

#game-previews-list-wrapper {
    width: 100%;
    height: max-content;
    min-height: 90%;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex-direction: column;
    /* row-gap: 1rem; */
}

#game-previews-list-glass-panel {
    width: 80%;
    height: max-content;
    min-height: 100%;
    padding: 2rem;
    /* margin-top: 4%; */
    margin-bottom: 2rem;

    border-bottom-right-radius: 1rem;
    border-bottom-left-radius: 1rem;

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

#rules-switchers-wrapper {
    width: 80%;
    height: 2rem;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    column-gap: 0;
}

.switcher-button {
    width: 100%;
    height: 100%;
    background-color: rgb(73, 73, 73);
    text-align: center;
}

.switcher-button.active {
    background-color: gray;
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