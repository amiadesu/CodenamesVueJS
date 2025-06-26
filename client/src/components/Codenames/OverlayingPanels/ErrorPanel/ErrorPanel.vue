<template>
    <div id="error-panel">
        <div id="error-wrapper">
            <h2 id="error-title">
                {{ $t("codenames.errors.error_title") }}
            </h2>
            <p>{{ $t(`codenames.errors.${errorObject.error_code}`, {rateLimitDelay: errorObject?.retry_ms}) }}</p>
            <button 
                id="error-panel-close-button" 
                @click="closePanel"
            >
            {{ $t("codenames.errors.close") }}
            </button>
        </div>
    </div>
</template>

<script>
import { defineComponent } from 'vue';
import { gameStore } from '@/stores/gameData';
// import { io } from 'socket.io-client';
import { socket } from "@/sockets/codenames";

export default defineComponent({
    computed: {
        gameData: () => gameStore()
    },
    data() {
        return {
            errorObject: {
                error: ""
            }
        }
    },
    methods: {
        closePanel() {
            this.gameData.openedPanels.errorPanel = false;
            let anyOpened = false;
            for (let key in this.gameData.openedPanels) {
                if (this.gameData.openedPanels[key] === true && key !== "anything") {
                    anyOpened = true;
                    break;
                }
            }
            this.gameData.openedPanels.anything = anyOpened;
        },
    },
    mounted() {
        this.errorObject = this.gameData.openedPanels.passedObject;
        this.gameData.openedPanels.passedObject = null;
    },
    beforeUnmount() {
        
    },
});
</script>

<style lang="css" scoped>
#error-title {
    font-size: 1.2rem;
    font-weight: bold;
    color: var(--error-color);
}

#error-panel {
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

#error-wrapper {
    width: 95%;
    height: 95%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    row-gap: 1rem;
}

#error-panel-close-button {
    width: 15%;
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

#error-panel-close-button:disabled {
    opacity: 0.6;
}

#error-panel-close-button:hover:not(:disabled) {
    background-color: var(--panel-button-hover-background-color-1);
}

@media screen and (max-width: 1300px) {
    #error-panel {
        width: 60%;
    }
}

@media screen and (max-width: 1000px) {
    #error-panel {
        width: 90%;
        height: 25%;
    }
}
</style>