<template>
    <div id="edit-clue-panel">
        <h2>
            {{ $t("codenames.panels.edit_clue_panel.edit_clue") }}
        </h2>
        <div id="edit-clue-input-wrapper">
            <input type="text" id="edit-clue-text-input" :placeholder="$t(`codenames.clues.${cluePlaceholder}`)" 
               v-model="clueObject.text" maxlength="30" autocomplete="off" v-on:keyup.enter="sendClue">
            <select id="edit-clue-number-input" size="1" v-model="clueObject.number" >
                <option value="10">10</option>
                <option value="9">9</option>
                <option value="8">8</option>
                <option value="7">7</option>
                <option value="6">6</option>
                <option value="5">5</option>
                <option value="4">4</option>
                <option value="3">3</option>
                <option value="2">2</option>
                <option value="1">1</option>
                <option value="0" selected>0</option>
            </select>
            <svg 
                id="edit-clue-send-button"
                xmlns="http://www.w3.org/2000/svg" 
                class="ionicon" 
                viewBox="0 0 512 512"
                @click="editClue"
            >
                <path d="M476.59 227.05l-.16-.07L49.35 49.84A23.56 23.56 0 0027.14 52 24.65 24.65 0 0016 72.59v113.29a24 24 0 0019.52 23.57l232.93 43.07a4 4 0 010 7.86L35.53 303.45A24 24 0 0016 327v113.31A23.57 23.57 0 0026.59 460a23.94 23.94 0 0013.22 4 24.55 24.55 0 009.52-1.93L476.4 285.94l.19-.09a32 32 0 000-58.8z"/>
            </svg>
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
    setup(props) {
        
    },
    data() {
        return {
            clueValue: "",
            cluePlaceholder: 0,
            clueObject: {
                text: "",
                number: "",
                id: 0
            }
        }
    },
    methods: {
        randomizeCluePlaceholder() {
            this.cluePlaceholder = Math.floor(Math.random() * 10);
        },
        editClue() {
            const clue = {
                text: this.clueObject.text + " - " + this.clueObject.number,
                id: this.clueObject.id
            };
            socket.emit("edit_clue", clue);
            this.gameData.openedPanels.editCluePanel = false;
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
            
        }
    },
    mounted() {
        this.clueObject = this.gameData.openedPanels.passedObject;
        this.gameData.openedPanels.passedObject = null;
        this.randomizeCluePlaceholder();
    },
    beforeUnmount() {
        
    },
});
</script>

<style lang="css" scoped>
#edit-clue-panel {
    width: 100%;
    height: 100%;
    border-radius: 15px;

    background-color:var(--panel-background-color-2);
    backdrop-filter: blur(3px) saturate(1);
    -webkit-backdrop-filter: blur(3px) saturate(1);

    color: var(--panel-text-color-1);

    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    row-gap: 1rem;
}

#edit-clue-panel > h2 {
    font-size: 1.2rem;
    color: var(--panel-header-2-color-1);
}

#edit-clue-input-wrapper {
    width: 90%;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: row;
}

#edit-clue-text-input {
    height: 100%;
    width: 87%;
    padding: 0.1rem;
    background-color: var(--panel-input-background-color-1);
    border: 1px solid var(--panel-input-border-color-1);
    color: var(--panel-input-text-color-1);
    font-size: 0.875rem;
    line-height: 1.25rem;
    border-radius: 0.25rem;
    display: block;
}

#edit-clue-number-input {
    height: 100%;
    width: 8%;
    padding: 0.1rem;
    background-color: var(--panel-input-background-color-1);
    border: 1px solid var(--panel-input-border-color-1);
    color: var(--panel-input-text-color-1);
    font-size: 0.875rem;
    line-height: 1.25rem;
    border-radius: 0.25rem;
    display: block;
}

#edit-clue-text-input.inline, #edit-clue-number-input.inline {
    display: inline-block;
}

#edit-clue-text-input:focus, #edit-clue-number-input:focus {
    border-color: var(--panel-input-focus-border-color-1);
    box-shadow: 0 0 0 3px var(--panel-input-focus-box-shadow-color-1);
}

#edit-clue-send-button {
    aspect-ratio: 1 / 1;
    height: 100%;
    width: auto;
    scale: 1.2;

    padding: 4px;

    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

@media screen and (max-width: 1300px) {
    #edit-clue-panel {
        width: 60%;
    }
}

@media screen and (max-width: 1000px) {
    #edit-clue-panel {
        width: 90%;
        height: 25%;
    }
}

@media screen and (max-width: 650px) {
    #edit-clue-input-wrapper {
        width: 95%;
    }

    #edit-clue-text-input {
        width: 80%;
    }

    #edit-clue-number-input {
        width: 12%;
    }
}
</style>