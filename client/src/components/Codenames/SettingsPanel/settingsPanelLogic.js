import { gameStore } from '@/stores/gameData';
import { socket } from "@/sockets/codenames";

export const settingsPanelMixin = {
    computed: {
        gameData: () => gameStore()
    },
    setup(props) {
        
    },
    data() {
        return {
            opened: false
        }
    },
    methods: {
        togglePanel() {
            this.opened = !this.opened;
        },
        openWordPackInfoPanel() {
            this.gameData.openedPanels.anything = true;
            this.gameData.openedPanels.wordPackInfoPanel = true;
        },
        openEditNamePanel() {
            this.gameData.openedPanels.anything = true;
            this.gameData.openedPanels.editNamePanel = true;
        },
        listenForUpdates() {
            
        }
    },
    mounted() {
        
    },
    beforeUnmount() {
        
    },
};