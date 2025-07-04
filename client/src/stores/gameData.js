import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { getConfig } from '@/utils/config';

const defaults = getConfig().defaultGameRules;

export const gameStore = defineStore('gameData', () => {
    const players = ref([]);
    const userData = ref({
        name: "",
        color: "#000000",
        id: "",
        isHost: false,
        isMaster: false,
        isTraitor: false,
        teamColor: "spectator",
        selecting: ""
    });
    const traitors = ref([]);
    const gameRules = ref({
        teamAmount: defaults.teamAmount.default,
        maximumPlayers: defaults.maximumPlayers.default,
        teamOrder: defaults.teamOrder.default,
        countdownTime: defaults.countdownTime.default,
        firstMasterTurnTime: defaults.firstMasterTurnTime.default,
        masterTurnTime: defaults.masterTurnTime.default,
        teamTurnTime: defaults.teamTurnTime.default,
        extraTime: defaults.extraTime.default,
        freezeTime: defaults.freezeTime.default,
        limitedGuesses: defaults.limitedGuesses.default,
        guessesLimit: defaults.guessesLimit.default,
        baseCards: defaults.baseCards.default,
        extraCards: [
            defaults.extraCards[0].default, 
            defaults.extraCards[1].default, 
            defaults.extraCards[2].default, 
            defaults.extraCards[3].default
        ],
        blackCards: defaults.blackCards.default,
        maxCards: defaults.maxCards.default,
        fieldSize: defaults.fieldSize.default,
        wordPack: {
            packId: defaults.wordPack.packId.default,
            name: ""
        },
        gamemode: defaults.gamemode.default,
        locked: defaults.locked.default
    });
    const teams = ref({
        "red" : {
            master: null,
            team: []
        },
        "yellow" : {
            master: null,
            team: []
        },
        "blue" : {
            master: null,
            team: []
        },
        "green" : {
            master: null,
            team: []
        }
    });
    const gameProcess = ref({
        isGoing: false,
        wordsCount: {
            "red": 0,
            "yellow": 0,
            "blue": 0,
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
    });
    const endTurnSelectors = ref([]);
    const clues = ref({
        "red" : [],
        "yellow" : [],
        "blue" : [],
        "green" : []
    });
    const chatMessages = ref([]);
    const gameWinStatus = ref({
        gameIsEnded: false,
        winner: ""
    });
    const selectProgress = ref({
        percentage: 0,
        selectedObject: ""
    });
    const adminOptions = ref({
        randomizeTeamOrder: true,
        getNewGameboard: true,
        moveMasters: false,
        randomizeMasters: false
    });
    const openedPanels = ref({
        anything: false,
        editNamePanel: false,
        editCluePanel: false,
        giveHostConfirmationPanel: false,
        errorPanel: false,
        wordPackSelectionPanel: false,
        wordPackInfoPanel: false,
        passedObject: null
    });
    const wordBoardData = ref({
        wordBoardHidden: false,
        words: []
    });
    const totalCardAmount = computed(() => {
        let extraSum = 0;
        for (let i = 0; i < gameRules.value.teamAmount - 1; i++) {
            extraSum += gameRules.value.extraCards[i];
        }
        const totalCardAmountNumber = gameRules.value.teamAmount * gameRules.value.baseCards + 
                                extraSum + gameRules.value.blackCards;
        return totalCardAmountNumber;
    });
    const clickers = ref([]);
    const shouldScrollDownChat = ref(false);
    const serverState = ref({
        online: true,
        disconnected: false
    });

    return {
        players, 
        traitors, 
        userData, 
        gameRules, 
        teams, 
        gameProcess,
        endTurnSelectors,
        clues,
        chatMessages,
        gameWinStatus, 
        selectProgress, 
        adminOptions, 
        openedPanels, 
        wordBoardData, 
        totalCardAmount, 
        clickers,
        shouldScrollDownChat,
        serverState
    };
});