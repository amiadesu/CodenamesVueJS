<template>
    <div class="team-content-wrapper" :id="`${teamColorValue}team`" :class="{blacklisted: gameData.gameProcess.blacklisted[teamColorValue]}">
        <svg 
            v-if="teamColorValue === gameData.gameWinStatus.winner" 
            xmlns="http://www.w3.org/2000/svg" 
            xmlns:xlink="http://www.w3.org/1999/xlink" 
            version="1.1" 
            class="team-winner-icon" 
            viewBox="0 0 512 512" 
            xml:space="preserve"
        >
            <path class="st0" d="M512,152.469c0-21.469-17.422-38.875-38.891-38.875c-21.484,0-38.906,17.406-38.906,38.875   c0,10.5,4.172,20.016,10.938,27c-26.453,54.781-77.016,73.906-116.203,56.594c-34.906-15.438-47.781-59.563-52.141-93.75   c14.234-7.484,23.938-22.391,23.938-39.594C300.734,78.016,280.719,58,256,58c-24.703,0-44.734,20.016-44.734,44.719   c0,17.203,9.703,32.109,23.938,39.594c-4.359,34.188-17.234,78.313-52.141,93.75c-39.188,17.313-89.75-1.813-116.203-56.594   c6.766-6.984,10.938-16.5,10.938-27c0-21.469-17.422-38.875-38.891-38.875C17.422,113.594,0,131,0,152.469   c0,19.781,14.781,36.078,33.875,38.547l44.828,164.078h354.594l44.828-164.078C497.234,188.547,512,172.25,512,152.469z"/>
            <path class="st0" d="M455.016,425.063c0,15.984-12.953,28.938-28.953,28.938H85.938C69.953,454,57,441.047,57,425.063v-2.406   c0-16,12.953-28.953,28.938-28.953h340.125c16,0,28.953,12.953,28.953,28.953V425.063z"/>
        </svg>
        <div class="team-wrapper">
            <div class="master-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" class="ionicon turn-icon-wrapper" viewBox="0 0 512 512" 
                     v-if="gameData.gameProcess.isGoing && gameData.gameProcess.currentTurn === teamColorValue">
                    <path v-if="gameData.gameProcess.masterTurn" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="M268 112l144 144-144 144M392 256H100"/>
                    <path v-else fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="M112 268l144 144 144-144M256 392V100"/>
                </svg>
                <template v-if="master" :key="master">
                    <Player :player="master"></Player>
                </template>
                <a v-else-if="!gameData.gameRules.locked" :team="`${teamColorValue}`" 
                    class="join-button"
                    @click="becameMaster">
                    <u><p>{{ $t("codenames.teams.become_master") }}</p></u>
                </a>
            </div>
            <hr class="team-divider">
            <div class="players-list-wrapper scrollable-container">
                <div class="scrollable-content">
                    <Player v-for="player in team" :key="player" :player="player"></Player>
                </div>
            </div>
            <div v-if="team.length < gameData.gameRules.maximumPlayers && !isInTeam && !gameData.gameRules.locked">
                    <a  :team="`${teamColorValue}`" 
                        class="join-button"
                        @click="joinTeam">
                        <u><p>{{ $t("codenames.teams.join_team") }}</p></u>
                    </a>
                </div>
        </div>
        <div v-if="gameData.gameProcess.isGoing" class="bottom-content-wrapper">
            <div 
                class="team-logs space-between"
                :class="{warning: gameData.gameProcess.masterTurn && gameData.gameProcess.teamTimeStarted && 
                                  gameData.gameProcess.currentTurn === teamColorValue
                }"
            >
                <p>{{ $t("codenames.teams.logs") }}</p>
                <p>{{ displayTime() }}</p>
            </div>
            <hr class="team-divider">
            <div class="clues-wrapper scrollable-container" ref="cluesContainer">
                <div class="scrollable-content">
                    <div class="clue-wrapper" v-for="clue in gameData.clues[teamColorValue]">
                        <p>{{ clue.text }}</p>
                        <svg xmlns="http://www.w3.org/2000/svg" class="ionicon clue-edit-button" viewBox="0 0 512 512" 
                             v-if="gameData.userData.isHost" @click="editCluePanelOpen(clue)">
                            <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="44" d="M358.62 129.28L86.49 402.08 70 442l39.92-16.49 272.8-272.13-24.1-24.1zM413.07 74.84l-11.79 11.78 24.1 24.1 11.79-11.79a16.51 16.51 0 000-23.34l-.75-.75a16.51 16.51 0 00-23.35 0z"/>
                        </svg>
                    </div>
                </div>
            </div>
            <div v-if="gameData.gameProcess.currentTurn === teamColorValue" class="end-turn-block" 
                 :class="{'own-end-turn-block' : gameData.userData.teamColor === teamColorValue}">
                <div class="space-between">
                    <a v-if="!gameData.userData.isMaster && 
                             gameData.userData.teamColor === teamColorValue && 
                             !gameData.gameProcess.masterTurn" @click="selectEndTurn">
                        <u>{{ $t("codenames.teams.end_turn") }}</u>
                    </a>
                    <a v-else>{{ $t("codenames.teams.end_turn") }}</a>
                    <div class="end-turn-selected-by">
                        <template v-for="player in gameData.endTurnSelectors">
                            <div class="selecter-color-circle" :style="{'background-color' : player.color}"></div>
                        </template>
                    </div>
                </div>
                <div 
                    v-if="gameData.selectProgress.selectedObject === 'endTurn'" 
                    class="end-turn-block-progress-bar" 
                    :class="gameData.gameProcess.currentTurn"
                    :style="{width: `${100 * gameData.selectProgress.percentage}%`}"
                >
                </div>
            </div>
        </div>
        <div v-else class="bottom-content-wrapper">
            <div 
                class="team-logs space-between"
                :class="{warning: gameData.gameProcess.masterTurn && gameData.gameProcess.teamTimeStarted && 
                                  gameData.gameProcess.currentTurn === teamColorValue
                }"
            >
                <p>{{ $t("codenames.teams.logs") }}</p>
                <p>{{ displayTime() }}</p>
            </div>
            <hr class="team-divider">
            <div class="clues-wrapper scrollable-container">
                <div class="scrollable-content">
                    <div class="clue-wrapper" v-for="clue in gameData.clues[teamColorValue]">
                        <p>{{ clue.text }}</p>
                        <svg xmlns="http://www.w3.org/2000/svg" class="ionicon clue-edit-button" viewBox="0 0 512 512" 
                             v-if="gameData.userData.isHost" @click="editCluePanelOpen(clue)">
                            <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="44" d="M358.62 129.28L86.49 402.08 70 442l39.92-16.49 272.8-272.13-24.1-24.1zM413.07 74.84l-11.79 11.78 24.1 24.1 11.79-11.79a16.51 16.51 0 000-23.34l-.75-.75a16.51 16.51 0 00-23.35 0z"/>
                        </svg>
                    </div>
                </div>
            </div>
        </div>
        <div class="words-left-text-wrapper">
            <p class="words-left-text">
                {{ gameData.gameProcess.wordsCount[teamColorValue] }}
            </p>
        </div>
    </div>
</template>

<script>
import { defineComponent } from 'vue';
import { teamMixin } from './teamLogic';

import Player from '../Player/Player.vue';

export default defineComponent({
    components: {
        Player
    },
    mixins: [teamMixin]
});
</script>

<style lang="css" scoped>
.team-content-wrapper {
    padding: 5px;

    width: 50%;
    height: 100%;
    max-height: 100%;
    position: relative;

    display: flex;
    align-content: center;
    justify-content: flex-start;
    flex-direction: column;
}

.team-winner-icon {
    display: flex;
    align-content: center;
    width: 40px;
    aspect-ratio: 1/1;
    position: absolute;
    left: 50%;
    top: -35px;
    transform: translate(-50%, 0);
}

.team-wrapper {
    padding: 0 0.25rem;
    width: 100%;
    height: max-content;
    max-height: 47%;
    
    display: block;
}

#redteam {
    background-color: var(--team-color-red);
}

#redteam .team-winner-icon {
    fill: var(--crown-color-red);
}

#yellowteam {
    background-color: var(--team-color-yellow);
}

#yellowteam .team-winner-icon {
    fill: var(--crown-color-yellow);
}

#greenteam {
    background-color: var(--team-color-green);
}

#greenteam .team-winner-icon {
    fill: var(--crown-color-green);
}

#blueteam {
    background-color: var(--team-color-blue);
}

#blueteam .team-winner-icon {
    fill: var(--crown-color-blue);
}

.blacklisted {
    background-color: var(--team-color-blacklisted) !important;
}

.master-wrapper {
    height: auto;
    width: 100%;

    display: block;
    justify-content: left;
    align-items: center;
    flex-direction: row;
}

.turn-icon-wrapper {
    min-width: 1.2rem;
    max-width: 1.2rem;
    min-height: 1.2rem;
    
    padding: 0;

    margin-right: 4px;
    margin-bottom: 1.5px;
    
    display: inline-block;
    vertical-align: middle;
    
    align-items: center;
    justify-content: center;
}

.players-list-wrapper {
    margin: 5px 0;

    width: 100%;
    height: auto;
    max-height: 100%;
    overflow-y: auto;
}

.players-list-wrapper > * {
    margin-bottom: 0.4rem;
}

.players-list-wrapper > *:last-of-type {
    margin-bottom: 0;
}

.team-divider {
    width: 80%;
    margin: 0 auto;
}

.join-button:hover {
    cursor: pointer;
}

.words-left-text-wrapper {
    width: 100%;
    height: 100%;

    position: absolute;
    top: 0;
    left: 0;

    display: flex;
    align-items: center;
    justify-content: center;

    z-index: -1;

    user-select: none;
}

.words-left-text {
    font-size: 6rem;
}

.bottom-content-wrapper {
    margin-top: auto;
    padding: 5px;
    width: 100%;
    max-height: 33%;
    height: auto;

    display: flex;
    flex-direction: column;
    justify-content: flex-end;
}

.clues-wrapper {
    width: 100%;
    height: 90%;
    
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-end;

   word-break: break-all;
}

.space-between {
    display: flex;
    justify-content: space-between;
}

.scrollable-container {
    display: block;
    width: 100%;
    overflow-y: scroll;
    visibility: hidden;
}

.scrollable-content, 
.scrollable-container:hover,
.scrollable-container:focus {
    visibility: visible;
}

.scrollable-content {
    width: 100%;
}

.clue-wrapper {
    width: 100%;
    height: max-content;
    display: block;
}

.clue-wrapper > p {
    display: inline;
    margin-right: 4px;
}

.clue-edit-button {
    min-width: 0.8rem;
    width: 0.8rem;
    min-height: 0.8rem;
    height: 0.8rem;
    display: inline-block;
    vertical-align: middle;
    margin-bottom: 3px;

    visibility: hidden;
}

.clue-wrapper:hover > .clue-edit-button, .clue-edit-button:hover {
    visibility: visible;
}

.clue-edit-button:hover {
    cursor: pointer;
}

.end-turn-block {
    width: 100%;
    height: 1.5rem;

    position: relative;
}

.end-turn-block.own-end-turn-block:hover {
    cursor: pointer;
}

.end-turn-block > .space-between {
    width: 100%;
    height: 100%;

    position: relative;
}

.end-turn-block-progress-bar {
    width: 100%;
    height: 3px;

    position: absolute;
    bottom: 0;
    left: 0;
    background-color: blue;
    z-index: 0;
    pointer-events: none;
}

.end-turn-block-progress-bar.red {
    background-color: var(--team-selection-color-red);
}

.end-turn-block-progress-bar.yellow {
    background-color: var(--team-selection-color-yellow);
}

.end-turn-block-progress-bar.blue {
    background-color: var(--team-selection-color-blue);
}

.end-turn-block-progress-bar.green {
    background-color: var(--team-selection-color-green);
}

.end-turn-selected-by {
    pointer-events: none;

    display: flex;
    align-items: center;
    justify-content: right;
    flex-direction: row;
}

.selecter-color-circle {
    display: inline-block;
    min-width: 0.7rem;
    margin-right: 0.15rem;
    width: 0.7rem !important;
    height: 0.7rem !important;
    border-radius: 50%;
}

.team-logs.warning > p {
    color: var(--team-text-color-warning);
    font-weight: 500;
}
</style>