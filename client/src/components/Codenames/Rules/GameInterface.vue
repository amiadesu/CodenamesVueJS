<template>
    <div id="game-interface-content">
        <h1 class="centered">
            {{ $t("codenames.rules.game_interface.title") }}
        </h1>
        <span
            v-for="(message, index) in $tm('codenames.rules.game_interface.messages.top')"
            :key="message"
        >
            <i18n-t :keypath="`codenames.rules.game_interface.messages.top[${index}].text`" tag="p" scope="global">
                <template v-for="(footnote, footnoteIndex) in message.footnotes" #[`footnote${footnoteIndex}`]>
                    <a class="footnote-link" @click="scrollToAnchor(footnote.link)"><sup>{{ footnote.text }}</sup></a>
                </template>
                <template v-for="(tab, tabIndex) in message.tabs" #[`tab${tabIndex}`]>
                    <a class="section-link" @click="togglePanel(tab.index, true)">{{ tab.text }}</a>
                </template>
            </i18n-t>
        </span>
        <hr class="section-divider">
        <TeamsWrapperExample></TeamsWrapperExample>
        <WordBoardExample></WordBoardExample>
        <ClueInputExample v-if="interfaceData.player.state.master 
            && interfaceData.player.state.teamColor === interfaceData.gameProcess.currentTurn 
            && interfaceData.gameProcess.masterTurn"
        ></ClueInputExample>
        <div v-else id="clue-input-wrapper">
            <p>
                {{ $t("codenames.guesses_no_limit") }}
            </p>
        </div>
        <hr class="section-divider">
        <span
            v-for="(message, index) in $tm('codenames.rules.game_interface.messages.center')"
            :key="message"
        >
            <i18n-t :keypath="`codenames.rules.game_interface.messages.center[${index}].text`" tag="p" scope="global">
                <template v-for="(footnote, footnoteIndex) in message.footnotes" #[`footnote${footnoteIndex}`]>
                    <a class="footnote-link" @click="scrollToAnchor(footnote.link)"><sup>{{ footnote.text }}</sup></a>
                </template>
                <template v-for="(tab, tabIndex) in message.tabs" #[`tab${tabIndex}`]>
                    <a class="section-link" @click="togglePanel(tab.index, true)">{{ tab.text }}</a>
                </template>
            </i18n-t>
        </span>
        <AdminPanelExample></AdminPanelExample>
        <hr class="section-divider">
        <span
            v-for="(message, index) in $tm('codenames.rules.game_interface.messages.bottom')"
            :key="message"
        >
            <i18n-t :keypath="`codenames.rules.game_interface.messages.bottom[${index}].text`" tag="p" scope="global">
                <template v-for="(footnote, footnoteIndex) in message.footnotes" #[`footnote${footnoteIndex}`]>
                    <a class="footnote-link" @click="scrollToAnchor(footnote.link)"><sup>{{ footnote.text }}</sup></a>
                </template>
                <template v-for="(tab, tabIndex) in message.tabs" #[`tab${tabIndex}`]>
                    <a class="section-link" @click="togglePanel(tab.index, true)">{{ tab.text }}</a>
                </template>
            </i18n-t>
        </span>
        <hr class="section-divider">
        <h2 id="footnotes">
            {{ $t('codenames.rules.game_interface.footnotes.title') }}
        </h2>
        <div class="footnote" v-for="(note, index) in $tm('codenames.rules.game_interface.footnotes.notes')" :key="index" :id="note.id">
            <p><sup>({{ index + 1 }}.)</sup> {{ note.text }}</p>
        </div>
    </div>
</template>

<script>
import { defineComponent, reactive } from 'vue';
import ClueInputExample from './Interface/ClueInputExample/ClueInputExample.vue';
import TeamsWrapperExample from './Interface/TeamExample/TeamsWrapperExample.vue';
import WordBoardExample from './Interface/WordBoardExample/WordBoardExample.vue';
import AdminPanelExample from './Interface/AdminPanelExample/AdminPanelExample.vue';

export default defineComponent({
    components: {
        TeamsWrapperExample,
        WordBoardExample,
        ClueInputExample,
        AdminPanelExample
    },
    computed: {
        
    },
    setup(props) {
        
    },
    data() {
        return {
            interfaceData: reactive({
                clues: {
                    red: [],
                    green: []
                },
                player: {
                    name: "You",
                    color: "#ff00ff",
                    id: "example-id",
                    roomId: "rules",
                    state: {
                        teamColor: "red",
                        master: false,
                        selecting: ""
                    },
                    online: true,
                    host: true,
                    traitor: false,
                    clicker: false
                },
                examplePlayer: {
                    name: "Example player",
                    color: "#00ffff",
                    id: "example-2-id",
                    roomId: "rules",
                    state: {
                        teamColor: "green",
                        master: false,
                        selecting: ""
                    },
                    online: true,
                    host: false,
                    traitor: true,
                    clicker: false
                },
                gameRules : {
                    teamAmount: 2,
                    maximumPlayers: 2,
                    teamOrder: ["red", "green"],
                    countdownTime: 0.5,
                    firstMasterTurnTime: 120,
                    masterTurnTime: 60,
                    teamTurnTime: 60,
                    extraTime: 15,
                    freezeTime: false,
                    limitedGuesses: false,
                    guessesLimit: 0,
                    baseCards: 2,
                    extraCards: [0, 0, 0, 0],
                    blackCards: 1,
                    maxCards: 9,
                    fieldSize: "3x3",
                    wordPack: {
                        packId: "english",
                        name: ""
                    },
                    gamemode: "standard",
                    locked: false
                },
                gameProcess : {
                    isGoing: true,
                    wordsCount: {
                        "red": 0,
                        "green": 0,
                        "white": 0,
                        "black": 0
                    },
                    currentTurn: "red",
                    guessesCount: 0,
                    isFirstTurn: true,
                    masterTurn: true,
                    timeLeft: 3599,
                    teamTimeStarted: false,
                    infiniteTime: false,
                    blacklisted: {
                        "red" : false,
                        "yellow" : false,
                        "blue" : false,
                        "green" : false
                    }
                },
                winner: "",
                selecting: "",
                shouldGetNewGameboard: true
            })
        }
    },
    inject: ['togglePanel', 'scrollToAnchor'],
    provide() {
        return {
            interfaceData: this.interfaceData
        }
    },
    methods: {
        
    },
    mounted() {
        
    },
    beforeUnmount() {
        
    },
});
</script>

<style lang="css" scoped>
#game-interface-content {
    width: 100%;
    height: max-content;

    /* color: var(--panel-text-color-3); */

    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    flex-direction: column;
    row-gap: 0.2rem;
}

#game-interface-content .centered {
    text-indent: 0;
    display: block;
    margin: 0 auto;
}

#game-interface-content .external-link, .section-link, .footnote-link {
    color: rgb(135, 218, 253);
    cursor: pointer;
}

#game-interface-content .word-example {
    display: inline;
    color: plum;
}

#game-interface-content .attention-takeover {
    color:aquamarine;
}

#game-interface-content h1 {
    font-size: 1.5rem;
    font-weight: bold;
    color: var(--panel-text-color-3);
}

#game-interface-content h2 {
    text-indent: 2rem;
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--panel-text-color-3);
}

#game-interface-content h3 {
    font-size: 1.1rem;
    font-weight: 500;
    color: var(--panel-text-color-3);
}

#game-interface-content span.block {
    display: block;
    text-indent: 0;
}

#game-interface-content ul {
    display: block;
    margin-block-start: 0.3rem;
    margin-block-end: 0.3rem;
    padding-inline-start: 2.5rem;
    text-indent: 0.5rem;
}

#game-interface-content ul.sublist {
    padding-inline-start: 1.5rem;
    text-indent: 0;
}

#game-interface-content ul.bullet-list {
    list-style-type: disc;
}

#game-interface-content ul.enumerated-list {
    list-style-type: decimal;
}

#game-interface-content table {
    table-layout: fixed;
    width: 90%;
    margin: auto;
    border-collapse: collapse;
}

#game-interface-content table, th, td {
    border: 1px solid black;
}

#game-interface-content th, td {
    padding: 0.6em;
}

#game-interface-content tr :nth-child(1) {
  text-align: left;
  width: 35%;
}

#game-interface-content tr :nth-child(2), tr .clue-example {
  text-align: center;
  width: 25%;
}

#game-interface-content tr :nth-child(3), tr .clue-comment {
    text-align: right;
    width: 40%;
}

.footnote {
    text-indent: 2rem;
}

.section-divider {
    height: 2px;
    width: 98%;
    margin: 0.25rem auto;
}

@media screen and (max-width: 1000px) {
    #game-interface-content {
        width: 90%;
        height: 25%;
    }
}

@media screen and (max-width: 650px) {
    /* #edit-clue-input-wrapper {
        width: 95%;
    }

    #edit-clue-text-input {
        width: 80%;
    }

    #edit-clue-number-input {
        width: 12%;
    } */
}
</style>