import { getConfig } from '@/utils/config';

export const adminPanelExampleMixin = {
    computed: {
        
    },
    setup(props) {
        
    },
    data() {
        return {
            restrictions: getConfig().defaultGameRules,
            opened: false,
            oldAmount: 2,
            isDisabled: false,
            cooldown: 0,
            sufficientAmount: true,
            getNewGameboard: true,
            totalCardAmount: 0
        }
    },
    inject: ['interfaceData'],
    methods: {
        clampGameRules() {
            if (this.interfaceData.gameRules.baseCards < 1) {
                this.interfaceData.gameRules.baseCards = 1;
            }
            if (this.interfaceData.gameRules.baseCards > this.interfaceData.gameRules.maxCards) {
                this.interfaceData.gameRules.baseCards = this.interfaceData.gameRules.maxCards;
            }

            for (let i = 0; i < this.interfaceData.gameRules.teamAmount - 1; i++) {
                if (this.interfaceData.gameRules.extraCards[i] < 1 - this.interfaceData.gameRules.baseCards) {
                    this.interfaceData.gameRules.extraCards[i] = 1 - this.interfaceData.gameRules.baseCards;
                }
                if (this.interfaceData.gameRules.extraCards[i] > this.interfaceData.gameRules.maxCards) {
                    this.interfaceData.gameRules.extraCards[i] = this.interfaceData.gameRules.maxCards;
                }
            }

            if (this.interfaceData.gameRules.blackCards < 1) {
                this.interfaceData.gameRules.blackCards = 1;
            }
            if (this.interfaceData.gameRules.blackCards > this.interfaceData.gameRules.maxCards - 2) {
                this.interfaceData.gameRules.blackCards = this.interfaceData.gameRules.maxCards - 2;
            }
        },
        totalCards() {
            let extraSum = 0;
            for (let i = 0; i < this.interfaceData.gameRules.teamAmount - 1; i++) {
                extraSum += this.interfaceData.gameRules.extraCards[i];
            }
            this.totalCardAmount = this.interfaceData.gameRules.teamAmount * this.interfaceData.gameRules.baseCards + 
                                    extraSum + this.interfaceData.gameRules.blackCards;
            return this.totalCardAmount;
        },
        updateGameRules() {
            this.clampGameRules();

            this.totalCards();
        },
        refreshBoard() {
            this.interfaceData.shouldGetNewGameboard = true;
        },
        startNewGame() {
            if (this.interfaceData.gameProcess.isGoing) {
                this.interfaceData.gameProcess.isGoing = false;
                return;
            }
            this.interfaceData.gameProcess.isGoing = true;
            this.interfaceData.winner = "";
            this.interfaceData.gameRules.locked = true;
            if (this.getNewGameboard) {
                this.refreshBoard();
            }
        },
        lockRoom() {
            this.interfaceData.gameRules.locked = !this.interfaceData.gameRules.locked;
        }
    },
    mounted() {
        this.totalCards();
    },
    beforeUnmount() {
        
    },
};