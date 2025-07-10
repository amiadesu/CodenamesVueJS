<template>
    <div id="word-pack-info-panel">
        <div id="word-pack-info-wrapper">
            <template v-if="selectedPack && !wordsToDisplay">
                <div id="word-pack-info-top">
                    <span id="word-pack-main-info-wrapper">
                        <span id="word-pack-name-wrapper">
                            <h2>{{ selectedPack.name }}</h2>
                            <p v-if="selectedPack.packId === gameData.gameRules.wordPack.packId">
                                {{ `(${$t("codenames.panels.word_pack_info_panel.selected")})` }}
                            </p>
                        </span>
                        <p>{{ selectedPack.language }}</p>
                    </span>
                    <h3><em>{{ selectedPack.version }}</em></h3>
                </div>
                <hr class="word-pack-info-panel-divider">
                <div id="word-pack-description">
                    {{ selectedPack.description }}
                </div>
                <hr class="word-pack-info-panel-divider">
                <div id="word-pack-footer">
                    <button class="word-pack-info-panel-button" @click="showWords(selectedPack.packId)">
                        {{ $t("codenames.panels.word_pack_info_panel.view_words") }}
                    </button>
                    <button class="word-pack-info-panel-button" @click="closePanel">
                        {{ $t("codenames.panels.word_pack_info_panel.close_panel") }}
                    </button>
                </div>
            </template>
            <template v-else-if="wordsToDisplay">
                <div id="word-pack-words-list-top">
                    <h2>
                        {{ $t("codenames.panels.word_pack_info_panel.all_words_message", {packName: selectedPack.name}) }}
                    </h2>
                </div>
                <hr class="word-pack-info-panel-divider">
                <div id="word-pack-words-list-wrapper">
                    <div id="word-pack-words-list-content">
                        <template v-for="word in wordsToDisplay">
                            <div class="word-pack-word-item">
                                <p>{{ word }}</p>
                            </div>
                        </template>
                    </div>
                </div>
                <hr class="word-pack-info-panel-divider">
                <div id="word-pack-words-list-footer">
                    <button class="word-pack-info-panel-button" @click="returnToWordPackInfo">
                        {{ $t("codenames.panels.word_pack_info_panel.return") }}
                    </button>
                    <button class="word-pack-info-panel-button" @click="closePanel">
                        {{ $t("codenames.panels.word_pack_info_panel.close_panel") }}
                    </button>
                </div>
            </template>
            <template v-else>
                <div id="word-pack-info-top">
                    <span id="word-pack-main-info-wrapper">
                        <h2>
                            {{ $t("codenames.panels.word_pack_info_panel.no_word_pack_selected") }}
                        </h2>
                    </span>
                </div>
                <hr class="word-pack-info-panel-divider">
                <div id="word-pack-description">
                    <p>
                        {{ $t("codenames.panels.word_pack_info_panel.select_message") }}
                    </p>
                </div>
                <hr class="word-pack-info-panel-divider">
                <div id="word-pack-footer">
                    <button class="word-pack-info-panel-button" @click="closePanel">
                        {{ $t("codenames.panels.word_pack_info_panel.close_panel") }}
                    </button>
                </div>
            </template>
        </div>
    </div>
</template>

<script>
import { defineComponent } from 'vue';
import { gameStore } from '@/stores/gameData';
import { socket } from "@/sockets/codenames";

export default defineComponent({
    computed: {
        gameData: () => gameStore()
    },
    data() {
        return {
            selectedPack: null,
            wordsToDisplay: null
        }
    },
    methods: {
        getWordPack() {
            console.log("Aboba");
            socket.emit("get_word_pack_no_words", this.gameData.gameRules.wordPack.packId);
        },
        showWords(packId) {
            socket.emit("get_words_from_word_pack", packId);
        },
        returnToWordPackInfo() {
            this.wordsToDisplay = null;
        },
        closePanel() {
            this.gameData.openedPanels.wordPackInfoPanel = false;
            let anyOpened = false;
            for (let key in this.gameData.openedPanels) {
                if (this.gameData.openedPanels[key] === true && key !== "anything") {
                    anyOpened = true;
                    break;
                }
            }
            this.gameData.openedPanels.anything = anyOpened;
        },
        listenForUpdates() {
            socket.on("word_pack_no_words", (wordPack) => {
                console.log(this.gameData.gameRules.wordPack.packId, wordPack);
                this.selectedPack = wordPack;
            });

            socket.on("words_from_word_pack", (words) => {
                this.wordsToDisplay = words;
            });
        }
    },
    mounted() {
        this.listenForUpdates();
        this.getWordPack();
    },
    beforeUnmount() {
        
    },
});
</script>

<style lang="css" scoped>
#word-pack-info-panel {
    width: 70%;
    height: 70%;
    border-radius: 15px;

    background-color: var(--panel-background-color-1);
    backdrop-filter: blur(3px) saturate(1);
    -webkit-backdrop-filter: blur(3px) saturate(1);
    
    color: var(--panel-text-color-1);

    display: flex;
    align-items: center;
    justify-content: center;

    padding: 10px;
}

#word-pack-info-wrapper {
    height: 100%;
    width: 100%;
    overflow-y: hidden;
    display: block;
    padding: 10px;
}

#word-pack-info-top {
    height: 15%;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

#word-pack-main-info-wrapper {
    height: 100%;
    width: max-content;
    display: flex;
    justify-content: left;
    align-items: flex-start;
    flex-direction: column;
}

#word-pack-name-wrapper {
    width: max-content;
    height: max-content;
    display: flex;
    align-items: center;
    justify-content: left;
    flex-direction: row;
    column-gap: 0.5rem;
}

#word-pack-description {
    height: 75%;
    width: 100%;
    display: block;
    margin-top: 5px;
}

#word-pack-footer {
    height: 10%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: right;
    column-gap: 0.5rem;
}

#word-pack-words-list-top {
    height: 15%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

#word-pack-words-list-wrapper {
    height: calc(75% + 5px);
    width: 100%;
    overflow-y: auto;
    display: block;
}

#word-pack-words-list-content {
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex-direction: column;
    row-gap: 0.25rem;
}

.word-pack-word-item {
    width: 100%;
    height: 20px;
}

#word-pack-words-list-footer {
    height: 10%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: right;
    column-gap: 0.5rem;
}

.word-pack-info-panel-button {
    padding: 1px 3px;
    background-color: var(--panel-button-background-color-1);
    color: var(--panel-button-text-color-1);
    font-weight: 400;
    border: 3px var(--panel-button-border-color-1) solid;
    border-radius: 0.35rem;
    display: inline-flex;
    align-items: center;
    margin: 0 auto;
    cursor: pointer;

    user-select: none;
}

.word-pack-info-panel-button:disabled {
    opacity: 0.6;
}

.word-pack-info-panel-button:hover:not(:disabled) {
    background-color: var(--panel-button-hover-background-color-1);
}

.word-pack-info-panel-divider {
    width: 90%;
    height: 3px;
    border-top: 3px solid var(--panel-horizontal-divider-color-1);
    line-height: 80%;
}

@media screen and (max-width: 1000px) {
    #word-pack-info-panel {
        width: 95%;
    }
}

@media screen and (max-width: 650px) {
    #word-pack-description {
        height: 72%;
    }
    
    #word-pack-footer, #word-pack-words-list-footer {
        margin-top: 3px;
        width: 90%;
        column-gap: 0.2rem;
    }

    .word-pack-selection-panel-button {
        height: 100%;
        font-size: 0.8rem;
    }
}
</style>