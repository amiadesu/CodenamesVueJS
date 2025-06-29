<template>
    <div class="admin-panel" :class="{ opens: opened, closes: !opened }">
        <div class="admin-panel-scrollable-content">
            <div class="admin-panel-content-wrapper">
                <span class="admin-panel-content-row single-line-row">
                    <button 
                        id="refresh-button" 
                        :disabled="isDisabled || gameData.gameProcess.isGoing || gameData.totalCardAmount > gameData.gameRules.maxCards" 
                        @click="refreshBoard"
                        class="admin-panel-button"
                    >
                        {{ $t("codenames.admin.get_new_gameboard") }}
                    </button>
                    <p v-if="cooldown !== 0">{{ Math.round(cooldown * 10) / 10 }}</p>
                </span>
                <span class="admin-panel-content-row single-line-row">
                    <label for="team-amount-input">{{ $t("codenames.admin.amount_of_teams") }}</label>
                    <input 
                        type="number" 
                        min="2" 
                        max="4" 
                        step="1" 
                        :disabled="gameData.gameProcess.isGoing" 
                        v-model="gameData.gameRules.teamAmount" 
                        @change="updateGameRules" 
                        id="team-amount-input"
                        class="admin-panel-input"
                    >
                </span>
                <p>
                    {{ $t("codenames.admin.team.order") }}
                </p>
                <li v-for="team in gameData.gameRules.teamOrder">
                    {{ $t(`codenames.admin.team.${team}`) }}
                </li>
                <span class="admin-panel-content-row single-line-row">
                    <button 
                        id="refresh-button" 
                        :disabled="gameData.gameProcess.isGoing" 
                        @click="randomizeTeamOrder"
                        class="admin-panel-button"
                    >
                        {{ $t("codenames.admin.randomize_team_order") }}
                    </button>
                </span>
                <span class="admin-panel-content-row single-line-row">
                    <label for="players-amount-input">
                        {{ $t("codenames.admin.maximum_amount_of_players_per_team") }}
                    </label>
                    <input 
                        type="number" 
                        min="1" 
                        max="10" 
                        step="1" 
                        v-model="gameData.gameRules.maximumPlayers" 
                        @change="updateGameRules" 
                        id="players-amount-input"
                        class="admin-panel-input"
                    >
                </span>
                <hr class="admin-panel-section-divider">
                <span class="admin-panel-content-row single-line-row">
                    <label for="players-amount-input">
                        {{ $t("codenames.admin.first_master_turn_time") }}
                    </label>
                    <input 
                        type="number" 
                        min="0" 
                        max="3599" 
                        step="1" 
                        v-model="gameData.gameRules.firstMasterTurnTime" 
                        @change="updateGameRules" 
                        id="players-amount-input"
                        class="admin-panel-input"
                    >
                </span>
                <span class="admin-panel-content-row single-line-row">
                    <label for="players-amount-input">
                        {{ $t("codenames.admin.master_turn_time") }}
                    </label>
                    <input 
                        type="number" 
                        min="0" 
                        max="3599" 
                        step="1" 
                        v-model="gameData.gameRules.masterTurnTime" 
                        @change="updateGameRules" 
                        id="players-amount-input"
                        class="admin-panel-input"
                    >
                </span>
                <span class="admin-panel-content-row single-line-row">
                    <label for="players-amount-input">
                        {{ $t("codenames.admin.team_turn_time") }}
                    </label>
                    <input 
                        type="number" 
                        min="0" 
                        max="3599" 
                        step="1" 
                        v-model="gameData.gameRules.teamTurnTime" 
                        @change="updateGameRules" 
                        id="players-amount-input"
                        class="admin-panel-input"
                    >
                </span>
                <span class="admin-panel-content-row single-line-row">
                    <label for="players-amount-input">
                        {{ $t("codenames.admin.extra_time") }}
                    </label>
                    <input 
                        type="number" 
                        min="0" 
                        max="3599" 
                        step="1" 
                        v-model="gameData.gameRules.extraTime" 
                        @change="updateGameRules" 
                        id="players-amount-input"
                        class="admin-panel-input"
                    >
                </span>
                <span class="admin-panel-content-row single-line-row">
                    <label for="word-guesses-input">
                        {{ $t("codenames.admin.word_guesses_limit") }}
                    </label>
                    <input 
                        type="number" 
                        min="0" 
                        max="99" 
                        step="1" 
                        v-model="gameData.gameRules.guessesLimit" 
                        @change="updateGameRules" 
                        id="word-guesses-input"
                        class="admin-panel-input"
                    >
                </span>
                <hr class="admin-panel-section-divider">
                <span class="admin-panel-content-row single-line-row space-around">
                    <button 
                        v-if="!gameData.gameRules.locked" 
                        id="refresh-button" 
                        @click="lockRoom"
                        class="admin-panel-button"
                    >
                        {{ $t("codenames.admin.lock_room") }}
                    </button>
                    <button 
                        v-else id="refresh-button" 
                        @click="lockRoom"
                        class="admin-panel-button"
                    >
                        {{ $t("codenames.admin.unlock_room") }}
                    </button>
                    <button 
                        v-if="!gameData.gameProcess.isGoing" 
                        id="refresh-button" 
                        @click="startNewGame" 
                        :disabled="gameData.totalCardAmount > gameData.gameRules.maxCards"
                        class="admin-panel-button"
                    >
                        {{ $t("codenames.admin.start_game") }}
                    </button>
                    <button 
                        v-else id="refresh-button" 
                        @click="startNewGame" 
                        :disabled="gameData.totalCardAmount > gameData.gameRules.maxCards"
                        class="admin-panel-button"
                    >
                        {{ $t("codenames.admin.end_game") }}
                    </button>
                    <button 
                        v-if="!gameData.gameRules.freezeTime" 
                        :disabled="!gameData.gameProcess.isGoing" 
                        id="refresh-button" 
                        @click="freezeTime"
                        class="admin-panel-button"
                    >
                        {{ $t("codenames.admin.freeze_time") }}
                    </button>
                    <button 
                        v-else id="refresh-button" 
                        :disabled="!gameData.gameProcess.isGoing" 
                        @click="freezeTime"
                        class="admin-panel-button"
                    >
                        {{ $t("codenames.admin.unfreeze_time") }}
                    </button>
                    <button 
                        id="refresh-button" 
                        :disabled="!gameData.gameProcess.isGoing" 
                        @click="passTurn"
                        class="admin-panel-button"
                    >
                        {{ $t("codenames.admin.pass_turn") }}
                    </button>
                </span>
                <span class="admin-panel-content-row single-line-row" v-if="!gameData.gameProcess.isGoing">
                    <label for="randomize-team-order-checkbox">
                        {{ $t("codenames.admin.randomize_team_order") }}
                    </label>
                    <input type="checkbox" id="randomize-team-order-checkbox" 
                        :disabled="gameData.gameProcess.isGoing" v-model="gameData.adminOptions.randomizeTeamOrder" />
                </span>
                <span class="admin-panel-content-row single-line-row" v-if="!gameData.gameProcess.isGoing">
                    <label for="get_new_gameboard-checkbox">
                        {{ $t("codenames.admin.get_new_gameboard") }}
                    </label>
                    <input type="checkbox" id="get_new_gameboard-checkbox" 
                        :disabled="gameData.gameProcess.isGoing" v-model="gameData.adminOptions.getNewGameboard" />
                </span>
                <span class="admin-panel-content-row single-line-row">
                    <button
                        class="admin-panel-button"
                        :disabled="gameData.gameProcess.isGoing" @click="removeAllPlayers"
                    >
                        {{ $t("codenames.admin.remove_all_players") }}
                    </button>
                    <span>
                        <input type="checkbox" id="remove-with-masters-checkbox" 
                            :disabled="gameData.gameProcess.isGoing" v-model="gameData.adminOptions.moveMasters" />
                        <label for="remove-with-masters-checkbox">
                            {{ $t("codenames.admin.with_masters") }}
                        </label>
                    </span>
                </span>
                <span class="admin-panel-content-row single-line-row">
                    <button
                        class="admin-panel-button"
                        :disabled="gameData.gameProcess.isGoing" @click="randomizeAllPlayers"
                    >
                        {{ $t("codenames.admin.randomize_all_players") }}
                    </button>
                    <span>
                        <input type="checkbox" id="randomize-with-masters-checkbox" 
                            :disabled="gameData.gameProcess.isGoing" v-model="gameData.adminOptions.randomizeMasters" />
                        <label for="randomize-with-masters-checkbox">
                            {{ $t("codenames.admin.with_masters") }}
                        </label>
                    </span>
                </span>
                <hr class="admin-panel-section-divider">
                <span class="admin-panel-content-row single-line-row">
                    <label for="field-size-input">
                        {{ $t("codenames.admin.field_size") }}
                    </label>
                    <select 
                        size="1" 
                        :disabled="gameData.gameProcess.isGoing" 
                        v-model="gameData.gameRules.fieldSize" 
                        @change="updateGameRules"
                        id="field-size-input" 
                        class="admin-panel-input"
                    >
                        <option value="7x7">7x7</option>
                        <option value="6x7">6x7</option>
                        <option value="6x6" selected>6x6</option>
                        <option value="5x6">5x6</option>
                        <option value="5x5">5x5</option>
                    </select>
                </span>
                <span class="admin-panel-content-row single-line-row">
                    <label for="players-amount-input">
                        {{ $t("codenames.admin.base_amount_of_cards") }}
                    </label>
                    <input 
                        type="number" 
                        min="1" 
                        :max="gameData.gameRules.maxCards" 
                        step="1" 
                        :disabled="gameData.gameProcess.isGoing" 
                        v-model="gameData.gameRules.baseCards" 
                        @change="updateGameRules" 
                        id="players-amount-input"
                        class="admin-panel-input"
                    >
                </span>
                <template v-for="(card, index) in gameData.gameRules.extraCards" :key="index">
                    <span class="admin-panel-content-row" v-if="index === 0 || gameData.gameRules.teamAmount > index + 1">
                        <span class="single-line-row">
                            <label :for="'players-amount-input-' + index">
                                {{ $t("codenames.admin.extra_amount_of_cards", {num: index + 1}) }}
                            </label>
                            <input 
                                type="number" 
                                :min="1 - gameData.gameRules.baseCards" 
                                :max="gameData.gameRules.maxCards" 
                                step="1" 
                                :disabled="gameData.gameProcess.isGoing" 
                                v-model="gameData.gameRules.extraCards[index]" 
                                @change="updateGameRules" 
                                :id="'players-amount-input-' + index"
                                class="admin-panel-input"
                            >
                        </span>
                        <span class="align-right">
                            <p>
                                {{ $t("codenames.admin.calculated_cards_amount", {amount: gameData.gameRules.baseCards + card}) }}
                            </p>
                        </span>
                    </span>
                </template>
                <span class="admin-panel-content-row single-line-row">
                    <label for="players-amount-input">
                        {{ $t("codenames.admin.black_cards_amount") }}
                    </label>
                    <input 
                        type="number" 
                        min="0" 
                        :max="gameData.gameRules.maxCards - gameData.gameRules.teamAmount" 
                        step="1" 
                        :disabled="gameData.gameProcess.isGoing" 
                        v-model="gameData.gameRules.blackCards" 
                        @change="updateGameRules" 
                        id="players-amount-input"
                        class="admin-panel-input"
                    >
                </span>
                <p class="admin-panel-content-row single-line-row">
                    {{ $t("codenames.admin.assigned_cards", {assigned: gameData.totalCardAmount, total: gameData.gameRules.maxCards}) }}
                </p>
                <p class="admin-panel-content-row single-line-row" v-if="gameData.totalCardAmount <= gameData.gameRules.maxCards">
                    {{ $t("codenames.admin.white_cards", {amount: gameData.gameRules.maxCards - gameData.totalCardAmount}) }}
                </p>
                <p class="admin-panel-content-row single-line-row" v-else>
                    {{ $t("codenames.admin.cards_amount_overflow") }}
                </p>
                <hr class="admin-panel-section-divider">
                <span class="admin-panel-content-row single-line-row">
                    <label for="game-mode-input">
                        {{ $t("codenames.admin.game_mode.select") }}
                    </label>
                    <select 
                        id="game-mode-input" 
                        size="1" 
                        :disabled="gameData.gameProcess.isGoing" 
                        v-model="gameData.gameRules.game_mode" 
                        @change="updateGameRules"
                        class="admin-panel-input"
                    >
                        <option value="default" selected>
                            {{ $t("codenames.admin.game_mode.default") }}
                        </option>
                        <option value="traitor">
                            {{ $t("codenames.admin.game_mode.traitor") }}
                        </option>
                    </select>
                </span>
                <span class="admin-panel-content-row single-line-row">
                    <p>
                        {{ $t("codenames.admin.word_pack.message") }}
                    </p>
                    <p>
                        {{ gameData.gameRules.wordPack.name }}
                    </p>
                </span>
                <span class="admin-panel-content-row single-line-row">
                    <button 
                        id="word-pack-selection-button" 
                        :disabled="gameData.gameProcess.isGoing" 
                        @click="openWordPackSelectionPanel"
                        class="admin-panel-button"
                    >
                        {{ $t("codenames.admin.word_pack.select") }}
                    </button>
                </span>
            </div>
        </div>
        <button 
            id="admin-panel-open-button" 
            type="button" 
            @click="togglePanel"
            @keydown="handleKeyTogglePanel"
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512">
                <path v-if="opened" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="M328 112L184 256l144 144"/>
                <path v-else fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="M184 112l144 144-144 144"/>
            </svg>
        </button>
        <div class="admin-panel-bottom">
            <button 
                @click="openEditNamePanel"
                class="admin-panel-button"
            >
                {{ $t("codenames.admin.edit_user_name") }}
            </button>
        </div>
    </div>
</template>

<script>
import { defineComponent } from 'vue';
import { adminControlMixin } from './adminControlLogic';

export default defineComponent({
    mixins: [adminControlMixin]
});
</script>

<style lang="css" scoped>
.admin-panel {
    width: 30%;
    height: 90%;

    background-color: var(--panel-background-color-1);
    backdrop-filter: blur(3px) saturate(1);
    -webkit-backdrop-filter: blur(3px) saturate(1);
    
    color: var(--panel-text-color-1);

    transition: 0.5s ease;
    
    display: flex;
    flex-direction: column;
    position: relative;

    pointer-events: all;

    z-index: 5;
    /* overflow-x: scroll; */
}

.admin-panel.opens {
    transform: translateX(0);
}

.admin-panel.closes {
    transform: translateX(-100%);
}

/* bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold rounded inline-flex items-center */
.admin-panel-button {
    padding: 1px 3px;
    background-color: var(--panel-button-background-color-1);
    color: var(--panel-button-text-color-1);
    font-weight: 400;
    border: 3px var(--panel-button-border-color-1) solid;
    border-radius: 0.35rem;
    display: inline-flex;
    align-items: center;
    margin: 0 auto;
    user-select: none;
}

.admin-panel-button:disabled {
    opacity: 0.6;
}

.admin-panel-button:hover:not(:disabled) {
    background-color: var(--panel-button-hover-background-color-1);
}

/* bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 */
.admin-panel-input {
    /* width: 100%; */
    padding: 0.1rem;
    margin: 0.15rem 0;
    background-color: var(--panel-input-background-color-1);
    border: 1px solid var(--panel-input-border-color-1);
    color: var(--panel-input-text-color-1);
    font-size: 0.875rem;
    line-height: 1.25rem;
    border-radius: 0.25rem;
    display: block;
}

.admin-panel-input.inline {
    display: inline-block;
}

.admin-panel-input:focus {
    border-color: var(--panel-input-focus-border-color-1);
    box-shadow: 0 0 0 3px var(--panel-input-focus-box-shadow-color-1);
}

.admin-panel-scrollable-content {
    width: 100%;
    padding-top: 5px;
    padding-bottom: 5px;
    display: block;
    position: relative;
    overflow-y: auto;
}

.admin-panel-scrollable-content .opens {
    transform: translateX(0);
}

.admin-panel-scrollable-content .closes {
    transform: translateX(-100%);
}

.admin-panel-content-wrapper {
    width: 100%;
    min-height: min-content;

    display: flex;
    align-items: center;
    flex-direction: column;
}

.admin-panel-content-row {
    width: 95%;
    display: flex;
    flex-direction: column;
    /* justify-content: space-between; */
    align-items: center;
    text-align: left;
}

.admin-panel-scrollable-content .single-line-row {
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
}

.admin-panel-content-row.single-line-row {
    width: 95%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
}

.admin-panel-content-row.space-around {
    justify-content: space-around;
}

.admin-panel-content-row .align-right {
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: right;
    align-items: center;
}

.admin-panel-bottom-row.single-line-row {
    width: 60%;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    column-gap: 1rem;
}

.admin-panel-scrollable-content label {
    width: 80%;
}

.admin-panel-scrollable-content .admin-panel-input {
    width: 18%;
}

/* .admin-panel-open-button-wrapper {
    position: relative;
    top: 50%;
    right: -20px;
    width: 20px;
    height: 20px;

    display: flex;
    align-items: center;
    justify-content: center;
} */

#admin-panel-open-button {
    position: fixed;
    top: 50%;
    right: -20px;

    width: 20px;
    height: 20px;

    color: var(--panel-text-color-2);

    padding: 0;
    
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 6;
}

.admin-panel-bottom {
    align-items: flex-end;
    width: 100%;
    height: 2rem;

    display: flex;
    align-items: center;
    justify-content: space-evenly;
    flex-direction: row
}

.admin-panel-section-divider {
    width: 90%;
    height: 3px;
    border-top: 3px solid var(--panel-horizontal-divider-color-1);
    line-height: 80%;
    margin: 3px 0;
}

@media screen and (max-width: 1200px) {
    .admin-panel {
        width: 40%;
    }
}

@media screen and (max-width: 1000px) {
    .admin-panel {
        width: 60%;
    }
}

@media screen and (max-width: 600px) {
    .admin-panel {
        width: 80%;
    }
}
</style>