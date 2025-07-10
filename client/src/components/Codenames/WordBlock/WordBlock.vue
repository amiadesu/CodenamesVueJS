<template>
    <div :card_value="word.text" 
        class="word-block" 
        :class="[word.color, {glow : gameData.userData.teamColor === word.color, revealed : word.revealed}]"
        @click="selectWord($event)"
        ref="container"
    >
        <div class="animated" v-for="i in activeAnimations" :key="i"></div>
        <p 
            class="word-text"
            :class="`size-${gameData.gameRules.fieldSize}`"
        >
            {{ word.text.toUpperCase() }}
        </p>
        <div class="word-selected-by">
            <template v-for="player in word.selectedBy">
                <div class="selecter-color-circle" :style="{'background-color' : player.color}"></div>
            </template>
        </div>
        <div 
            v-if="gameData.selectProgress.selectedObject === word.text" 
            class="word-block-progress-bar"
            :class="gameData.gameProcess.currentTurn"
            :style="{width: `${100 * gameData.selectProgress.percentage}%`}"
        >
        </div>
    </div>
</template>

<script>
import { defineComponent } from 'vue';
import { gameStore } from '@/stores/gameData';
import { globalStore } from '@/stores/globalData';
import { socket } from "@/sockets/codenames";

export default defineComponent({
    computed: {
        gameData: () => gameStore(),
        globalData: () => globalStore()
    },
    props: {
        wordObj: {
            type: Object,
            default: {
                text: "Placeholder",
                color: "unknown",
                selectedBy: []
            }
        }
    },
    setup(props) {
        
    },
    data() {
        return {
            word: this.wordObj,
            progress: this.progressVal,
            activeAnimations: [],
            counter: 0
        }
    },
    methods: {
        selectWord(event) {
            if (this.gameData.gameProcess.isGoing &&
                !this.gameData.userData.isMaster && 
                !this.gameData.gameProcess.masterTurn &&
                this.gameData.userData.teamColor === this.gameData.gameProcess.currentTurn &&
                this.word.color === "unknown" &&
                this.word.selectable
            ) {
                const wordText = this.word.text;
                socket.emit("select_word", wordText);
            } else if (!this.gameData.userData.isMaster && 
                (this.gameData.gameProcess.masterTurn || this.gameData.userData.teamColor !== this.gameData.gameProcess.currentTurn)) {
                socket.emit("process_click", this.word.text);
            }
        },
        setClickAnimation(index) {
            if (this.activeAnimations.length >= 3) {
                return;
            }
            this.activeAnimations.push(index);
            setTimeout(() => {
                this.activeAnimations = this.activeAnimations.filter(i => i !== index);
            }, 500);
        },
        listenForUpdates() {
            socket.on("click_word", (clickedWordText, userId) => {
                if (this.word.text === clickedWordText) {
                    this.counter++;
                    if (this.counter > 100) {
                        this.counter = 0;
                    }
                    this.setClickAnimation(this.counter);
                }
            });
        }
    },
    mounted() {
        this.listenForUpdates();
    },
    beforeUnmount() {
        
    },
});
</script>

<style lang="css" scoped>
.word-block {
    position: relative;

    background-color: rgb(255, 186, 163);
    border: 3px solid rgb(136, 61, 7);
    width: 100%;
    height: 100%;
    border-radius: 5px;

    display: flex;
    align-items: center;
    justify-content: center;

    user-select: none;
    overflow-wrap: break-word;
    word-wrap: break-word;
}

.word-block:hover {
    cursor: pointer;
}

.word-block.revealed {
    opacity: 0.5;
}

.word-block.revealed.glow {
    box-shadow: none !important;
}

.word-block.unknown {
    background-color: var(--word-block-color-unknown);
    border-color: var(--word-block-color-border-unknown);
    color: var(--word-block-color-text-unknown);
}

.word-block.red {
    background-color: var(--word-block-color-red);
    border-color: var(--word-block-color-border-red);
    color: var(--word-block-color-text-red);
}

.word-block.red.glow {
    box-shadow: 0 0 12px 7px var(--word-block-color-glow-red);
}

.word-block.yellow {
    background-color: var(--word-block-color-yellow);
    border-color: var(--word-block-color-border-yellow);
    color: var(--word-block-color-text-yellow);
}

.word-block.yellow.glow {
    box-shadow: 0 0 12px 7px var(--word-block-color-glow-yellow);
}

.word-block.blue {
    background-color: var(--word-block-color-blue);
    border-color: var(--word-block-color-border-blue);
    color: var(--word-block-color-text-blue);
}

.word-block.blue.glow {
    box-shadow: 0 0 12px 7px var(--word-block-color-glow-blue);
}

.word-block.green {
    background-color: var(--word-block-color-green);
    border-color: var(--word-block-color-border-green);
    color: var(--word-block-color-text-green);
}

.word-block.green.glow {
    box-shadow: 0 0 12px 7px var(--word-block-color-glow-green);
}

.word-block.white {
    background-color: var(--word-block-color-white);
    border-color: var(--word-block-color-border-white);
    color: var(--word-block-color-text-white);
}

.word-block.black {
    background-color: var(--word-block-color-black);
    border-color: var(--word-block-color-border-black);
    color: var(--word-block-color-text-black);
}

.word-block > * {
    pointer-events: none;
}

.word-block > .animated {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: inherit;
    border-radius: inherit;
    opacity: 0;
    transform: scale(1);
    z-index: -1;
    pointer-events: none;
    animation: clickEffect 0.5s ease-in-out;
}

@keyframes clickEffect {
    0% {
        transform: scale(1);
        opacity: 1;
    }
    100% {
        transform: scale(1.5);
        opacity: 0;
    }
}

.word-text {
    max-width: 100%;
    max-height: 100%;
    text-align: center;
    word-wrap: break-word;
    overflow-wrap: break-word;
    overflow-y: hidden;
    padding: 0 2px;
    font-weight: 500;
}

.word-block-progress-bar {
    width: 100%;
    height: 4px;
    position: absolute;
    bottom: 0;
    left: 0;
    z-index: 0;
}

.word-block-progress-bar.red {
    background-color: var(--team-selection-color-red);
}

.word-block-progress-bar.yellow {
    background-color: var(--team-selection-color-yellow);
}

.word-block-progress-bar.blue {
    background-color: var(--team-selection-color-blue);
}

.word-block-progress-bar.green {
    background-color: var(--team-selection-color-green);
}

.word-selected-by {
    position: absolute;
    bottom: 2%;
    right: 0;

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

@media screen and (max-width: 1000px) {
    .word-block {
        border-width: 1px;
    }
}

@media screen and (max-width: 650px) {
    .word-text {
        font-weight: normal;
    }

    .word-text:not(.size-7x7) {
        font-size: 0.9rem;
    }

    .word-text.size-7x7 {
        font-size: 0.7rem;
    }
}
</style>