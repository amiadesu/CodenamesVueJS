<template>
    <div id="gamefield">
        <div v-if="words.length <= count" id="word-blocks-wrapper" :class="`size-${interfaceData.gameRules.fieldSize}`">
            <template v-for="word in displayedWords" :key="word">
                <WordBlockExample :word-obj="word"></WordBlockExample>
            </template>
        </div>
        <div v-else id="word-board-message-wrapper">
            {{ $t("codenames.gameboard.request_new_board", {total: count, amount: words.length}) }}
        </div>
    </div>
</template>

<script>
import { defineComponent } from 'vue';
import { preferencesStore } from '@/stores/preferences';
import WordBlockExample from '../WordBlockExample/WordBlockExample.vue';

export default defineComponent({
    computed: {
        preferences: () => preferencesStore()
    },
    components: {
        WordBlockExample
    },
    setup(props) {
        
    },
    data() {
        return {
            count: 0,
            words: [],
            realWords: [],
            displayedWords: []
        }
    },
    inject: ['interfaceData'],
    provide() {
        return {
            revealWord: this.revealWord,
            getBoard: this.getBoard
        }
    },
    methods: {
        revealWord(wordText) {
            const wordIndex = this.realWords.findIndex((word) => word.text === wordText);
            this.realWords[wordIndex].selectable = false;
            this.realWords[wordIndex].revealed = true;
            this.words[wordIndex] = this.realWords[wordIndex];
            this.interfaceData.gameProcess.wordsCount[this.words[wordIndex].color]--;
            if (this.words[wordIndex].color === "black") {
                this.interfaceData.winner = "green";
                this.interfaceData.gameProcess.blacklisted["red"] = true;
                this.words.forEach((word, index) => {
                    word.color = this.realWords[index].color;
                    word.selectable = false;
                });
                this.interfaceData.gameProcess.isGoing = false;
            }
            else if (this.words[wordIndex].color !== "white" && this.interfaceData.gameProcess.wordsCount[this.words[wordIndex].color] === 0) {
                this.interfaceData.winner = this.words[wordIndex].color;
                this.words.forEach((word, index) => {
                    word.color = this.realWords[index].color;
                    word.selectable = false;
                });
                this.interfaceData.gameProcess.isGoing = false;
            }
            this.getBoard(false);
        },
        updateBoard() {
            this.count = 9;
            if (this.interfaceData.gameRules.fieldSize === "3x4") {
                this.count = 12;
            }
            else if (this.interfaceData.gameRules.fieldSize === "4x4") {
                this.count = 16;
            }
            this.interfaceData.gameRules.maxCards = this.count;
            
            const wordsArray = this.$tm("codenames.rules.game_interface.words");
            
            const shuffled = [...wordsArray].sort(() => 0.5 - Math.random()).slice(0, this.count);

            this.realWords = shuffled.map((word, index) => {
                let color = 'white';
                if (index < this.interfaceData.gameRules.baseCards + this.interfaceData.gameRules.extraCards[0]) {
                    color = 'red';
                }
                else if (index - this.interfaceData.gameRules.baseCards - this.interfaceData.gameRules.extraCards[0] <
                        this.interfaceData.gameRules.baseCards) {
                    color = 'green';
                }
                else if (index - 2*this.interfaceData.gameRules.baseCards - this.interfaceData.gameRules.extraCards[0] <
                        this.interfaceData.gameRules.blackCards) {
                    color = 'black';
                }
                return {
                    text: word,
                    color: color,
                    selectable: true,
                    revealed: false
                };
            });

            this.realWords.sort(() => 0.5 - Math.random());
            this.words = [...this.realWords].map((word) => {
                return {
                    text: word.text,
                    color: "unknown",
                    selectable: true,
                    revealed: false
                };
            });

            this.interfaceData.gameProcess.wordsCount = {
                "red": this.interfaceData.gameRules.baseCards + this.interfaceData.gameRules.extraCards[0],
                "green": this.interfaceData.gameRules.baseCards,
                "white": this.count - 2 * this.interfaceData.gameRules.baseCards - this.interfaceData.gameRules.extraCards[0] - this.interfaceData.gameRules.blackCards,
                "black": this.interfaceData.gameRules.blackCards
            };
        },
        getBoard(updateWords) {
            if (updateWords) {
                this.updateBoard();
            }
            
            if (this.interfaceData.player.state.master) {
                this.displayedWords = this.realWords;
            }
            else {
                this.displayedWords = this.words;
            }
        },
        listenForUpdates() {
            this.$watch(
                () => this.interfaceData.player.state.master,
                (newValue, oldValue) => {
                    this.getBoard(false);
                }
            );
            this.$watch(
                () => this.interfaceData.shouldGetNewGameboard,
                (newValue, oldValue) => {
                    this.getBoard(true);
                    this.interfaceData.shouldGetNewGameboard = false;
                }
            );
            this.$watch(
                () => this.interfaceData.gameRules.fieldSize,
                (newValue, oldValue) => {
                    this.getBoard(true);
                    this.interfaceData.shouldGetNewGameboard = false;
                }
            );
        }
    },
    mounted() {
        this.getBoard(true);
        this.interfaceData.shouldGetNewGameboard = false;
        this.listenForUpdates();
    },
    beforeUnmount() {
        
    },
});
</script>

<style lang="css" scoped>
#gamefield {
    width: 100%;
    min-height: 240px;

    display: flex;
    align-items: center;
    justify-content: center;
}

#word-blocks-wrapper {
    width: 90%;
    height: 90%;
    display: grid;
    grid-template-rows: repeat(6, minmax(0, 1fr));
    grid-template-columns: repeat(6, minmax(0, 1fr));
    column-gap: 0.7em;
    row-gap: 0.7em;
}

#word-blocks-wrapper.size-3x3 {
    grid-template-rows: repeat(3, minmax(0, 1fr));
    grid-template-columns: repeat(3, minmax(0, 1fr));
}

#word-blocks-wrapper.size-3x4 {
    grid-template-rows: repeat(3, minmax(0, 1fr));
    grid-template-columns: repeat(4, minmax(0, 1fr));
}

#word-blocks-wrapper.size-4x4 {
    grid-template-rows: repeat(4, minmax(0, 1fr));
    grid-template-columns: repeat(4, minmax(0, 1fr));
}

#word-board-message-wrapper {
    text-align: center;
    display: flex;
    justify-content: center;
    align-items: center;
}

@media screen and (max-width: 1200px) {
    #word-blocks-wrapper {
        width: 95%;
        height: 95%;
        column-gap: 0.4em;
        row-gap: 0.4em;
    }
}

@media screen and (max-width: 1000px) {
    #gamefield {
        min-height: 200px;
    }

    #word-blocks-wrapper {
        width: 98%;
        height: 100%;
        column-gap: 0.3em;
        row-gap: 0.3em;
    }
}

@media screen and (max-width: 650px) {
    #word-blocks-wrapper {
        width: 98%;
        column-gap: 0.2em;
        row-gap: 0.2em;
    }

    #word-blocks-wrapper.size-7x7 .word-text {
        font-size: 0.2rem !important;
    }
}
</style>