<template>
    <div class="game-preview-wrapper">
        <div class="game-name-wrapper">
            <h2 class="game-name">
                {{ $t(`gamePreview.${gameCodename}.name`) }}
            </h2>
            <button class="open-game-rules-button" @click="$router.push(`/${gameCodename}/rules`)">
                {{ $t(`gamePreview.read_rules`) }}
            </button>
        </div>
        <hr>
        <div class="game-description-wrapper">
            <p class="game-description">
                {{ $t(`gamePreview.${gameCodename}.description`) }}
            </p>
        </div>
        <hr>
        <GameroomCodeInput :game-codename="gameCodename"></GameroomCodeInput>
    </div>
</template>

<script>
import { defineComponent } from 'vue';
import { gameStore } from '@/stores/gameData';
// import { io } from 'socket.io-client';
import { socket } from "@/sockets/codenames";
import GameroomCodeInput from './GameroomCodeInput.vue';

export default defineComponent({
    computed: {
        gameData: () => gameStore()
    },
    components: {
        GameroomCodeInput
    },
    props: {
        gameCodename : {
            type: String,
            default: "example"
        }
    },
    setup(props) {
        // setup() receives props as the first argument.
        // console.log(props.teamColor)
    },
    data() {
        return {
            clueValue: "",
            cluePlaceholder: 0
        }
    },
    methods: {
        randomizeCluePlaceholder() {
            this.cluePlaceholder = Math.floor(Math.random() * 10);
        },
        editClue() {
            const clue = {
                text: this.gameData.openedPanels.passedObject.text + " - " + this.gameData.openedPanels.passedObject.number,
                id: this.gameData.openedPanels.passedObject.id
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
            this.gameData.openedPanels.passingObject = null;
        },
        listenForUpdates() {
            // socket.on("notify_client_about_change", () => {
            //     this.updateData();
            // });

            // this.socket.on("user_connected", (users) => {
            //     this.users = users
            // });
        }
    },
    mounted() {
        // Connect to the WebSocket server
        // this.socket = io('http://localhost:3000');
        this.randomizeCluePlaceholder();
    },
    beforeUnmount() {
        // Clean up the WebSocket connection
        // this.socket.disconnect();
    },
});
</script>

<style lang="css" scoped>
.game-name-wrapper {
    width: 100%;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.game-name {
    font-size: 1.2rem;
    font-weight: 500;
}

.game-preview-wrapper {
    width: 100%;
    background-color: gray;
    display: flex;
    flex-direction: column;
    row-gap: 0.5rem;
    padding: 0.5rem;
    border-radius: 0.7rem;
    border: 2px solid pink;
}

#edit-clue-panel {
    width: 40%;
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

.open-game-rules-button {
    padding: 1px 3px;
    background-color: var(--panel-button-background-color-1);
    color: var(--panel-button-text-color-1);
    font-weight: 400;
    border: 3px var(--panel-button-border-color-1) solid;
    border-radius: 0.35rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-align: center;
}

.open-game-rules-button:disabled {
    opacity: 0.6;
}

.open-game-rules-button:hover:not(:disabled) {
    background-color: var(--panel-button-hover-background-color-1);
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