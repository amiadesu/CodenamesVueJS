<script setup>
import { ref, onMounted, nextTick, provide } from 'vue';
import { useRoute } from 'vue-router';
import { globalStore } from '@/stores/globalData';
import { getConfig } from '@/utils/config';

import Background from '../../components/Home/Background.vue';
import GameRules from '@/components/Codenames/Rules/GameRules.vue';
import GameInterface from '@/components/Codenames/Rules/GameInterface.vue';
import HostRules from '@/components/Codenames/Rules/HostRules.vue';
import GameroomCodeInput from '@/components/Home/GameroomCodeInput.vue';

const config = getConfig();
const availableGames = config["availableGames"];
const visibility = 'visible';
let globalData = globalStore();
const currentPanelIndex = ref(0);

globalData.remInPixels = parseFloat(getComputedStyle(document.documentElement).fontSize);
const route = useRoute();

// Provide this function to child components
function togglePanel(newPanelIndex, scrollToTop = false) {
    if (scrollToTop) {
        const element = document.getElementById("rules-switchers-wrapper");
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }
    if (newPanelIndex === currentPanelIndex.value) {
        return;
    }
    currentPanelIndex.value = newPanelIndex;
};

// Provide this function to handle anchor links
function scrollToAnchor(anchorId) {
    nextTick(() => {
        anchorId = anchorId.startsWith('#') ? anchorId.slice(1) : anchorId;
        const element = document.getElementById(anchorId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    });
};

// Provide these to child components
provide('togglePanel', togglePanel);
provide('scrollToAnchor', scrollToAnchor);

// Handle route hash on component mount
onMounted(() => {
    if (route.hash) {
        const anchor = route.hash.substring(1);
        scrollToAnchor(anchor);
    }
});
</script>

<template>
    <div id="game-rules-wrapper">
        <Background></Background>
        <div id="game-previews-list-wrapper">
            <div id="rules-switchers-wrapper">
                <button 
                    @click="togglePanel(0)"
                    class="switcher-button"
                    :class="{active: currentPanelIndex === 0}"
                >
                    {{ $t("codenames.rules.game_rules.name") }}
                </button>
                <button 
                    @click="togglePanel(1)"
                    class="switcher-button"
                    :class="{active: currentPanelIndex === 1}"
                >
                {{ $t("codenames.rules.game_interface.name") }}
                </button>
                <button 
                    @click="togglePanel(2)"
                    class="switcher-button"
                    :class="{active: currentPanelIndex === 2}"
                >
                {{ $t("codenames.rules.host_rules.name") }}
                </button>
            </div>
            <div id="game-rules-glass-panel-content-wrapper">
                <GameRules v-if="currentPanelIndex === 0"></GameRules>
                <GameInterface v-else-if="currentPanelIndex === 1"></GameInterface>
                <HostRules v-else="currentPanelIndex === 2"></HostRules>
                <div id="game-rules-glass-panel-content-bottom-wrapper">
                    <div class="separator">
                        {{ $t("codenames.rules.done_reading") }}
                    </div>
                    <GameroomCodeInput></GameroomCodeInput>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
#game-rules-wrapper {
    height: 100vh;
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

#game-rules-glass-panel-content-wrapper {
    width: 80%;
    min-height: 90%;

    background-color: var(--preview-glass-panel-color);
    backdrop-filter: blur(2px) saturate(1);
    -webkit-backdrop-filter: blur(2px) saturate(1);

    border-bottom-right-radius: 1rem;
    border-bottom-left-radius: 1rem;

    padding: 0.5rem 1.5rem;
    
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex-direction: column;
    row-gap: 1rem;
}

#game-rules-glass-panel-content-bottom-wrapper {
    width: 100%;
    height: auto;
    margin-top: auto;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    
    row-gap: 0.5rem;
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
    height: 2rem;
    background-color: var(--switcher-button-non-active-color);
    text-align: center;
}

.switcher-button.active {
    background-color: var(--switcher-button-active-color);
}

.separator {
    width: 100%;
    display: flex;
    align-items: center;
    text-align: center;
}

.separator::before,
.separator::after {
    content: '';
    flex: 1;
    display: block;
    border-bottom: 2px solid var(--preview-divider-color);
}

.separator:not(:empty)::before {
    margin-right: .5rem;
}

.separator:not(:empty)::after {
    margin-left: .5rem;
}

@media screen and (max-width: 1300px) {
    #game-rules-glass-panel-content-wrapper {
        width: 85%;
        padding: 0.5rem 0.5rem;
    }

    #rules-switchers-wrapper {
        width: 85%;
    }
}

@media screen and (max-width: 650px) {
    #game-rules-glass-panel-content-wrapper {
        width: 90%;
        padding: 0.5rem 0;
    }

    #rules-switchers-wrapper {
        width: 90%;
        height: 3rem;
    }

    .switcher-button {
        height: 3rem;
    }
}
</style>