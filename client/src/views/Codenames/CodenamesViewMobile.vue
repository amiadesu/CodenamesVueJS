<script setup>
import { useRoute } from 'vue-router';
import { gameStore } from '@/stores/gameData';
import { globalStore } from '@/stores/globalData';
import { state } from "@/sockets/codenames";

import TeamsWrapperMobile from '../../components/Codenames/Team/TeamsWrapperMobile.vue';
import EventListener from '../../components/Codenames/EventListener/EventListener.vue';
import WordsBoard from '../../components/Codenames/WordsBoard/WordsBoard.vue';
import AdminControlDesktop from '../../components/Codenames/AdminControl/AdminControlDesktop.vue';
import SettingsPanelDesktop from '../../components/Codenames/SettingsPanel/SettingsPanelDesktop.vue';
import ChatPanel from '../../components/Codenames/ChatPanel/ChatPanel.vue';
import Spectators from '../../components/Codenames/Spectators/Spectators.vue';
import ClueInput from '../../components/Codenames/ClueInput/ClueInput.vue';

import EditNamePanel from '../../components/Codenames/OverlayingPanels/EditNamePanel/EditNamePanel.vue';
import EditCluePanel from '../../components/Codenames/OverlayingPanels/EditCluePanel/EditCluePanel.vue';
import ErrorPanel from '../../components/Codenames/OverlayingPanels/ErrorPanel/ErrorPanel.vue';
import WordPackSelectionPanel from '../../components/Codenames/OverlayingPanels/WordPackSelectionPanel/WordPackSelectionPanel.vue';
import WordPackInfoPanel from '../../components/Codenames/OverlayingPanels/WordPackInfoPanel/WordPackInfoPanel.vue';
import ThemeToggler from '../../components/Global/ThemeToggler.vue';
import RulesButton from '../../components/Codenames/RulesButton/RulesButton.vue';
import LanguageSelector from '../../components/Global/LanguageSelector.vue';
import CodenamesRulesView from './CodenamesRulesView.vue';

const visibility = 'visible';
let gameData = gameStore();
let globalData = globalStore();

globalData.remInPixels = parseFloat(getComputedStyle(document.documentElement).fontSize);

const route = useRoute();
</script>

<template>
    <div id="app-wrapper">
        <template v-if="$route.params.roomId && $route.params.roomId !== 'rules'">
            <template v-if="!gameData.serverState.disconnected">
                <EventListener></EventListener>
                <div 
                    v-if="gameData.openedPanels.errorPanel"
                    id="error-panel-wrapper"
                >
                    <ErrorPanel></ErrorPanel>
                </div>
                <template v-if="state.connected && state.initialized">
                    <div class="row-wrapper top-row">
                        <RulesButton></RulesButton>
                        <Spectators></Spectators>
                        <LanguageSelector></LanguageSelector>
                        <ThemeToggler></ThemeToggler>
                    </div>
                    <div id="game">
                        <TeamsWrapperMobile></TeamsWrapperMobile>
                        <div class="center-wrapper">
                            <WordsBoard></WordsBoard>
                            <ClueInput v-if="gameData.userData.isMaster && 
                            gameData.gameProcess.isGoing && gameData.gameProcess.masterTurn &&
                            gameData.gameProcess.currentTurn === gameData.userData.teamColor"></ClueInput>
                            <div v-else id="clue-input-wrapper">
                                <p v-if="!gameData.gameRules.limitedGuesses">
                                    {{ $t("codenames.guesses_no_limit") }}
                                </p>
                                <p v-else>
                                    {{ $t("codenames.guesses_with_limit", {used: gameData.gameProcess.guessesCount, total: gameData.gameRules.guessesLimit}) }}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div id="admin-control-wrapper">
                        <AdminControlDesktop v-if="gameData.userData.isHost"></AdminControlDesktop>
                        <SettingsPanelDesktop v-else></SettingsPanelDesktop>
                    </div>
                    <div id="chat-panel-wrapper">
                        <ChatPanel></ChatPanel>
                    </div>
                    <div v-if="gameData.openedPanels.anything" id="overlaying-panels-wrapper">
                        <EditNamePanel v-if="gameData.openedPanels.editNamePanel" :oldName="gameData.userData.name"></EditNamePanel>
                        <EditCluePanel v-else-if="gameData.openedPanels.editCluePanel"></EditCluePanel>
                        <WordPackSelectionPanel v-else-if="gameData.openedPanels.wordPackSelectionPanel"></WordPackSelectionPanel>
                        <WordPackInfoPanel v-else-if="gameData.openedPanels.wordPackInfoPanel"></WordPackInfoPanel>
                    </div>
                </template>
                <div v-else>
                    <p>{{ $t("codenames.loading") }}</p>
                </div>
            </template>
            <template v-else>
                <p>{{ $t("codenames.disconnected") }}</p>
            </template>
        </template>
        <template v-else-if="$route.params.roomId === 'rules'">
            <div class="row-wrapper top-row">
                <LanguageSelector></LanguageSelector>
                <ThemeToggler></ThemeToggler>
            </div>
            <CodenamesRulesView></CodenamesRulesView>
        </template>
        <template v-else>

        </template>
    </div>
</template>

<style scoped>
#app-wrapper {
    height: 100%;
    width: 100%;

    background-color: var(--main-background-color);

    display: flex;
    align-items: center;
    justify-content: start;
    flex-direction: column;
    z-index: 1;
}

#game {
    height: 96%;
    width: 96%;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

#error-panel-wrapper {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 5;
}


.center-wrapper {
    width: 100%;
    height: 50%;

    margin-top: 10px;

    display: flex;
    align-items: center;
    justify-content: start;
    flex-direction: column;
    row-gap: 1rem;
}

.row-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: row;
}

.row-wrapper.top-row {
    height: 4%;
    width: 100%;
    justify-content: right;
}

.row-wrapper.teams {
    height: 85%;
    width: 20%;
}

.column-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
}

#admin-control-wrapper {
    display: flex;
    align-items: center;
    justify-content: left;
    position: fixed;
    top: 0;
    left: 0;

    width: 100vw;
    height: 100vh;

    text-align: center;
    
    pointer-events: none;
}

#chat-panel-wrapper {
    display: flex;
    align-items: center;
    justify-content: right;
    position: fixed;
    top: 0;
    right: 0;

    width: 100vw;
    height: 100vh;

    text-align: center;
    
    pointer-events: none;
}

#overlaying-panels-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 100vw;
    background-color: rgba(0, 0, 0, 0.5);

    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
