<script setup>
import { useRoute } from 'vue-router';
import { globalStore } from '@/stores/globalData';
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

</script>

<template>
    <div id="app-wrapper">
        <div class="row-wrapper top-row">
            <span id="website-name-title">
                {{ config.websiteTitle }}
            </span>
            <LanguageSelector></LanguageSelector>
            <ThemeToggler></ThemeToggler>
        </div>
        <div id="home-view-wrapper">
            <Background></Background>
            <div id="game-previews-list-wrapper">
                <div id="game-previews-list-glass-panel">
                    <template v-for="gameCodename in availableGames">
                        <GamePreview :game-codename="gameCodename"></GamePreview>
                    </template>
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
    justify-content: flex-end;
    flex-direction: column;
    z-index: 20;
}

#home-view-wrapper {
    height: 96%;
    width: 100%;

    background-color: var(--home-view-background-color);

    position: relative;

    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex-direction: column;
    z-index: 0;

    overflow-y: visible;
    overflow-x: hidden;
}

#home-view-background {
    position: fixed;
    bottom: 0;
    left: 0;
    height: 100vh;
}

#game-previews-list-wrapper {
    width: 100%;
    height: auto;
    min-height: 90%;
    flex-grow: 1;
    flex-shrink: 0;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;

    margin-bottom: 2rem;

    overflow-y: auto;

    z-index: 1;
}

#game-previews-list-glass-panel {
    width: 66.5%;
    height: max-content;
    padding: 2rem;
    margin-bottom: 2rem;

    border-radius: 1rem;

    background-color: var(--preview-glass-panel-color);
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
    z-index: 5;
    margin-bottom: auto;
    background-color: var(--preview-top-row-background-color);
    position: relative;
}

#website-name-title {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    margin: 0 auto;
    font-weight: bold;
    letter-spacing: 2px;
    font-size: 1.1rem;

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