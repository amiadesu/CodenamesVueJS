<template>
    <div class="admin-panel opened">
        <div class="admin-panel-scrollable-content">
            <div class="admin-panel-content-wrapper">
                <span class="admin-panel-content-row single-line-row">
                    <button 
                        id="refresh-button" 
                        @click="refreshBoard"
                        class="admin-panel-button"
                    >
                        {{ $t("codenames.admin.get_new_gameboard") }}
                    </button>
                </span>
                <hr class="admin-panel-section-divider">
                <span class="admin-panel-content-row single-line-row space-around">
                    <button 
                        v-if="!interfaceData.gameRules.locked" 
                        id="unlock-button" 
                        @click="lockRoom"
                        class="admin-panel-button"
                    >
                        {{ $t("codenames.admin.lock_room") }}
                    </button>
                    <button 
                        v-else 
                        id="unlock-button" 
                        @click="lockRoom"
                        class="admin-panel-button"
                    >
                        {{ $t("codenames.admin.unlock_room") }}
                    </button>
                    <button 
                        v-if="!interfaceData.gameProcess.isGoing" 
                        id="start-new-game-button" 
                        @click="startNewGame" 
                        :disabled="totalCardAmount > interfaceData.gameRules.maxCards"
                        class="admin-panel-button"
                    >
                        {{ $t("codenames.admin.start_game") }}
                    </button>
                    <button 
                        v-else 
                        id="start-new-game-button" 
                        @click="startNewGame" 
                        :disabled="totalCardAmount > interfaceData.gameRules.maxCards"
                        class="admin-panel-button"
                    >
                        {{ $t("codenames.admin.end_game") }}
                    </button>
                </span>
                <span class="admin-panel-content-row single-line-row" v-if="!interfaceData.gameProcess.isGoing">
                    <label for="get-new-gameboard-checkbox">
                        {{ $t("codenames.admin.get_new_gameboard") }}
                    </label>
                    <input type="checkbox" id="get-new-gameboard-checkbox" 
                        :disabled="interfaceData.gameProcess.isGoing" v-model="getNewGameboard" />
                </span>
                <hr class="admin-panel-section-divider">
                <span class="admin-panel-content-row single-line-row">
                    <label for="field-size-input">
                        {{ $t("codenames.admin.field_size") }}
                    </label>
                    <select 
                        size="1"
                        v-model="interfaceData.gameRules.fieldSize"
                        :disabled="interfaceData.gameProcess.isGoing"
                        @change="updateGameRules"
                        id="field-size-input" 
                        class="admin-panel-input"
                    >
                        <option value="4x4">4x4</option>
                        <option value="3x4">3x4</option>
                        <option value="3x3" selected>3x3</option>
                    </select>
                </span>
                <span class="admin-panel-content-row single-line-row">
                    <label for="players-amount-input">
                        {{ $t("codenames.admin.base_amount_of_cards") }}
                    </label>
                    <input 
                        type="number" 
                        :min="restrictions.baseCards.min" 
                        :max="interfaceData.gameRules.maxCards" 
                        step="1" 
                        :disabled="interfaceData.gameProcess.isGoing" 
                        v-model="interfaceData.gameRules.baseCards" 
                        @change="updateGameRules" 
                        id="base-cards-amount-input"
                        class="admin-panel-input"
                    >
                </span>
                <template v-for="(card, index) in interfaceData.gameRules.extraCards" :key="index">
                    <span class="admin-panel-content-row" v-if="index === 0 || interfaceData.gameRules.teamAmount > index + 1">
                        <span class="single-line-row">
                            <label :for="'players-amount-input-' + index">
                                {{ $t("codenames.admin.extra_amount_of_cards", {num: index + 1}) }}
                            </label>
                            <input 
                                type="number" 
                                :min="1 - interfaceData.gameRules.baseCards" 
                                :max="interfaceData.gameRules.maxCards" 
                                step="1" 
                                :disabled="interfaceData.gameProcess.isGoing" 
                                v-model="interfaceData.gameRules.extraCards[index]" 
                                @change="updateGameRules" 
                                :id="`extra-cards-amount-input-${index}`"
                                class="admin-panel-input"
                            >
                        </span>
                        <span class="align-right">
                            <p>
                                {{ $t("codenames.admin.calculated_cards_amount", {amount: interfaceData.gameRules.baseCards + card}) }}
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
                        :min="1" 
                        :max="interfaceData.gameRules.maxCards - interfaceData.gameRules.teamAmount" 
                        step="1" 
                        :disabled="interfaceData.gameProcess.isGoing" 
                        v-model="interfaceData.gameRules.blackCards" 
                        @change="updateGameRules" 
                        id="black-cards-amount-input"
                        class="admin-panel-input"
                    >
                </span>
                <p class="admin-panel-content-row single-line-row">
                    {{ $t("codenames.admin.assigned_cards", {assigned: totalCardAmount, total: interfaceData.gameRules.maxCards}) }}
                </p>
                <p class="admin-panel-content-row single-line-row" v-if="totalCardAmount <= interfaceData.gameRules.maxCards">
                    {{ $t("codenames.admin.white_cards", {amount: interfaceData.gameRules.maxCards - totalCardAmount}) }}
                </p>
                <p class="admin-panel-content-row single-line-row" v-else>
                    {{ $t("codenames.admin.card_amount_overflow") }}
                </p>
                <hr class="admin-panel-section-divider">
                <span class="admin-panel-content-row single-line-row">
                    <label for="game-mode-input">
                        {{ $t("codenames.admin.game_mode.select") }}
                    </label>
                    <select 
                        id="game-mode-input" 
                        size="1" 
                        :disabled="interfaceData.gameProcess.isGoing" 
                        v-model="interfaceData.gameRules.gamemode" 
                        @change="updateGameRules"
                        class="admin-panel-input"
                    >
                        <option value="standard" selected>
                            {{ $t("codenames.admin.game_mode.standard") }}
                        </option>
                        <option value="traitor">
                            {{ $t("codenames.admin.game_mode.traitor") }}
                        </option>
                    </select>
                </span>
            </div>
        </div>
    </div>
</template>

<script>
import { defineComponent } from 'vue';
import { adminPanelExampleMixin } from './adminPanelExampleLogic';

export default defineComponent({
    mixins: [adminPanelExampleMixin]
});
</script>

<style lang="css" scoped>
.admin-panel {
    width: 100%;
    height: 100%;

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
}

.admin-panel.opens {
    transform: translateX(0);
}

.admin-panel.closes {
    transform: translateX(-100%);
}

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

.admin-panel-input {
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

.admin-panel-input:disabled {
    opacity: 0.6;
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
</style>