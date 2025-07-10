<template>
    <div id="edit-name-panel">
        <h2>
            {{ $t("codenames.panels.edit_name_panel.edit_name") }}
        </h2>
        <div id="edit-name-input-wrapper">
            <input type="text" id="edit-name-input" placeholder="John Doe" 
               v-model="nameValue" maxlength="30" autocomplete="off" v-on:keyup.enter="editName">
            <svg 
                id="edit-name-send-button"
                xmlns="http://www.w3.org/2000/svg" 
                class="ionicon" 
                viewBox="0 0 512 512"
                @click="editName"
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
    props: {
        oldName: {
            type: String,
            default: ""
        }
    },
    setup(props) {
        console.log(props);
    },
    data() {
        return {
            nameValue: this.oldName
        }
    },
    methods: {
        editName() {
            this.gameData.openedPanels.editNamePanel = false;
            let anyOpened = false;
            for (let key in this.gameData.openedPanels) {
                if (this.gameData.openedPanels[key] === true && key !== "anything") {
                    anyOpened = true;
                    break;
                }
            }
            this.gameData.openedPanels.anything = anyOpened;
            if (this.nameValue === "") {
                return;
            }
            socket.emit("edit_user_name", this.nameValue);
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
#edit-name-panel {
    width: 30%;
    height: 20%;
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

#edit-name-panel > h2 {
    font-size: 1.2rem;
    color: var(--panel-header-2-color-1);
}

#edit-name-input-wrapper {
    width: 100%;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: row;
}

#edit-name-input {
    height: 100%;
    width: 80%;
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

#edit-name-input.inline {
    display: inline-block;
}

#edit-name-input:focus {
    border-color: var(--panel-input-focus-border-color-1);
    box-shadow: 0 0 0 3px var(--panel-input-focus-box-shadow-color-1);
}

#edit-name-send-button {
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

@media screen and (max-width: 1000px) {
    #edit-name-panel {
        width: 80%;
        height: 30%;
    }
}
</style>