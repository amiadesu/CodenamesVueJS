<template>
    <div id="gamefield">
        <div v-if="!gameData.wordBoardData.wordBoardHidden" id="word-blocks-wrapper" :class="`size-${gameData.gameRules.fieldSize}`">
            <template v-for="word in gameData.wordBoardData.words" :key="word">
                <WordBlock :word-obj="word"></WordBlock>
            </template>
        </div>
        <div id="word-board-message-wrapper"v-else>
            {{ $t("codenames.gameboard.request_new_board", {total: gameData.gameRules.maxCards, amount: gameData.wordBoardData.words.length}) }}
        </div>
    </div>
</template>

<script>
import { defineComponent } from 'vue';
import { gameStore } from '@/stores/gameData';
import { socket } from "@/sockets/codenames";

import WordBlock from '../WordBlock/WordBlock.vue';

export default defineComponent({
    computed: {
        gameData: () => gameStore()
    },
    components: {
        WordBlock
    },
    setup(props) {
        
    },
    data() {
        return {
            words: []
        }
    },
    methods: {
        getBoard() {
            socket.emit("get_gameboard");
        },
        listenForUpdates() {
            
        }
    },
    mounted() {
        
    },
    beforeUnmount() {
        
    },
});
</script>

<style lang="css" scoped>
#gamefield {
    width: 100%;
    height: 80%;

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

#word-blocks-wrapper.size-5x5 {
    grid-template-rows: repeat(5, minmax(0, 1fr));
    grid-template-columns: repeat(5, minmax(0, 1fr));
}

#word-blocks-wrapper.size-5x6 {
    grid-template-rows: repeat(5, minmax(0, 1fr));
    grid-template-columns: repeat(6, minmax(0, 1fr));
}

#word-blocks-wrapper.size-6x6 {
    grid-template-rows: repeat(6, minmax(0, 1fr));
    grid-template-columns: repeat(6, minmax(0, 1fr));
}

#word-blocks-wrapper.size-6x7 {
    grid-template-rows: repeat(6, minmax(0, 1fr));
    grid-template-columns: repeat(7, minmax(0, 1fr));
}

#word-blocks-wrapper.size-7x7 {
    grid-template-rows: repeat(7, minmax(0, 1fr));
    grid-template-columns: repeat(7, minmax(0, 1fr));
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
    #word-blocks-wrapper {
        width: 95%;
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