<template>
    <div class="settings-panel" :class="{ opens: opened, closes: !opened }">
        <div class="settings-panel-scrollable-content">
            <div class="settings-panel-content-wrapper">
                <span class="settings-panel-content-row single-line-row">
                    <p>
                        {{ $t("codenames.settings.amount_of_teams") }}
                    </p>
                    <p>{{ gameData.gameRules.teamAmount }}</p>
                </span>
                <p>
                    {{ $t("codenames.settings.team.order") }}
                </p>
                <li v-for="team in gameData.gameRules.teamOrder">
                    {{ $t(`codenames.settings.team.${team}`) }}
                </li>
                <span  class="settings-panel-content-row single-line-row">
                    <p>
                        {{ $t("codenames.settings.maximum_amount_of_players_per_team") }}
                    </p>
                    <p>{{ gameData.gameRules.maximumPlayers }}</p>
                </span>
                <hr class="settings-panel-section-divider">
                <span class="settings-panel-content-row single-line-row">
                    <p>
                        {{ $t("codenames.settings.first_master_turn_time") }}
                    </p>
                    <p>{{ gameData.gameRules.firstMasterTurnTime }}</p>
                </span>
                <span class="settings-panel-content-row single-line-row">
                    <p>
                        {{ $t("codenames.settings.master_turn_time") }}
                    </p>
                    <p>{{ gameData.gameRules.masterTurnTime }}</p>
                </span>
                <span class="settings-panel-content-row single-line-row">
                    <p>
                        {{ $t("codenames.settings.team_turn_time") }}
                    </p>
                    <p>{{ gameData.gameRules.teamTurnTime }}</p>
                </span>
                <span class="settings-panel-content-row single-line-row">
                    <p>
                        {{ $t("codenames.settings.extra_time") }}
                    </p>
                    <p>{{ gameData.gameRules.extraTime }}</p>
                </span>
                <span class="settings-panel-content-row single-line-row">
                    <p>
                        {{ $t("codenames.settings.word_guesses_limit") }}
                    </p>
                    <p>{{ gameData.gameRules.guessesLimit }}</p>
                </span>
                <hr class="settings-panel-section-divider">
                <span class="settings-panel-content-row single-line-row">
                    <p v-if="!gameData.gameProcess.isGoing">
                        {{ $t("codenames.settings.start_game") }}
                    </p>
                    <p v-else>
                        {{ $t("codenames.settings.end_game") }}
                    </p>
                </span>
                <span class="settings-panel-content-row single-line-row">
                    <p v-if="!gameData.gameProcess.freezeTime">
                        {{ $t("codenames.settings.freeze_time") }}
                    </p>
                    <p v-else>
                        {{ $t("codenames.settings.unfreeze_time") }}
                    </p>
                </span>
                <hr class="settings-panel-section-divider">
                <span class="settings-panel-content-row single-line-row">
                    <p>
                        {{ $t("codenames.settings.field_size") }}
                    </p>
                    <p>{{ gameData.gameRules.fieldSize }}</p>
                </span>
                <span class="settings-panel-content-row single-line-row">
                    <p>
                        {{ $t("codenames.settings.base_amount_of_cards") }}
                    </p>
                    <p>{{ gameData.gameRules.baseCards }}</p>
                </span>
                <template v-for="(card, index) in gameData.gameRules.extraCards" :key="index">
                    <span class="settings-panel-content-row" v-if="index === 0 || gameData.gameRules.teamAmount > index + 1">
                        <span class="single-line-row">
                            <p>
                                {{ $t("codenames.settings.extra_amount_of_cards", {num: index + 1}) }}
                            </p>
                            <p>{{ gameData.gameRules.extraCards[index] }}</p>
                        </span>
                        <span class="align-right">
                            <p>
                                {{ $t("codenames.settings.calculated_cards_amount", {amount: gameData.gameRules.baseCards + card}) }}
                            </p>
                        </span>
                    </span>
                </template>
                <span class="settings-panel-content-row single-line-row">
                    <p>
                        {{ $t("codenames.settings.black_cards_amount") }}
                    </p>
                    <p>{{ gameData.gameRules.blackCards }}</p>
                </span>
                <p>
                    {{ $t("codenames.settings.assigned_cards", {assigned: gameData.totalCardAmount, total: gameData.gameRules.maxCards}) }}
                </p>
                <p v-if="gameData.totalCardAmount <= gameData.gameRules.maxCards">
                    {{ $t("codenames.settings.white_cards", {amount: gameData.gameRules.maxCards - gameData.totalCardAmount}) }}
                </p>
                <p v-else>
                    {{ $t("codenames.settings.card_amount_overflow") }}
                </p>
                <hr class="settings-panel-section-divider">
                <span class="settings-panel-content-row single-line-row">
                    <p>
                        {{ $t("codenames.settings.game_mode.message") }}
                    </p>
                    <p>
                        {{ $t(`codenames.settings.game_mode.${gameData.gameRules.game_mode}`) }}
                    </p>
                </span>
                <span class="settings-panel-content-row single-line-row">
                    <p>
                        {{ $t("codenames.settings.word_pack.message") }}
                    </p>
                    <p>
                        {{ gameData.gameRules.wordPack.name }}
                    </p>
                </span>
                <button class="settings-panel-button" @click="openWordPackInfoPanel">
                    {{ $t("codenames.settings.word_pack.view") }}
                </button>
            </div>
        </div>
        <button id="settings-panel-open-button" type="button" @click="togglePanel">
            <svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512">
                <path v-if="opened" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="M328 112L184 256l144 144"/>
                <path v-else fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="M184 112l144 144-144 144"/>
            </svg>
        </button>
        <div class="settings-panel-bottom">
            <button class="settings-panel-button" @click="openEditNamePanel">
                {{ $t("codenames.settings.edit_user_name") }}
            </button>
        </div>
    </div>
</template>

<script>
import { defineComponent } from 'vue';
import { settingsPanelMixin } from './settingsPanelLogic';

export default defineComponent({
    mixins: [settingsPanelMixin]
});
</script>

<style lang="css" scoped>
.settings-panel {
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
}

.settings-panel-scrollable-content {
    width: 100%;
    height: 100%;
    display: block;
    overflow-y: auto;
}

.settings-panel.opens {
    transform: translateX(0);
}

.settings-panel.closes {
    transform: translateX(-100%);
}

.settings-panel-content-wrapper {
    width: 100%;
    height: 100%;

    display: flex;
    align-items: center;
    flex-direction: column;
}

.settings-panel-content-wrapper > span {
    width: 95%;
}

.settings-panel-content-row {
    width: 95%;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: left;
}

.settings-panel-scrollable-content .single-line-row {
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
}

.settings-panel-content-row.single-line-row {
    width: 95%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
}

.settings-panel-content-row.space-around {
    justify-content: space-around;
}

.settings-panel-content-row .align-right {
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: right;
    align-items: center;
}

.settings-panel-bottom-row.single-line-row {
    width: 60%;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    column-gap: 1rem;
}

.settings-panel-button {
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

.settings-panel-button:disabled {
    opacity: 0.6;
}

.settings-panel-button:hover:not(:disabled) {
    background-color: var(--panel-button-hover-background-color-1);
}

.settings-panel-input {
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

.settings-panel-input.inline {
    display: inline-block;
}

.settings-panel-input:focus {
    border-color: var(--panel-input-focus-border-color-1);
    box-shadow: 0 0 0 3px var(--panel-input-focus-box-shadow-color-1);
}

#settings-panel-open-button {
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

.space-around {
    display: flex;
    column-gap: 1rem;
    align-items: center;
    justify-content: center;
}

.settings-panel-bottom {
    align-items: flex-end;
    width: 100%;
    height: 2rem;

    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: row
}

.settings-panel-section-divider {
    width: 90%;
    height: 3px;
    border-top: 3px solid var(--panel-horizontal-divider-color-1);
    line-height: 80%;
    margin: 3px 0;
}

@media screen and (max-width: 1200px) {
    .settings-panel {
        width: 40%;
    }
}

@media screen and (max-width: 1000px) {
    .settings-panel {
        width: 60%;
    }
}

@media screen and (max-width: 600px) {
    .settings-panel {
        width: 80%;
    }
}
</style>