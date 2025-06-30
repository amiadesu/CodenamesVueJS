<template>
    <div class="gameroom-code-input-wrapper">
        <input 
            type="text" 
            class="gameroom-code-input" 
            :placeholder="$t(`gamePreview.enter_room_code`)" 
            v-model="codeText"
            minlength="1"
            maxlength="16" 
            onkeydown="return /[a-zA-Z0-9]/i.test(event.key)"
            autocomplete="off" 
            v-on:keyup.enter="openGameroom"
        >
        <p class="gameroom-code-input-text-divider">
            {{ $t(`gamePreview.or`) }}
        </p>
        <button 
            class="create-new-gameroom-button"
            @click="$router.push(`/codenames/`)"
        >
        {{ $t(`gamePreview.create_new_room`) }}
        </button>
    </div>
</template>

<script>
import { defineComponent } from 'vue';
import { gameStore } from '@/stores/gameData';

export default defineComponent({
    computed: {
        gameData: () => gameStore()
    },
    props: {
        gameCodename : {
            type: String,
            default: "example"
        }
    },
    setup(props) {
        
    },
    data() {
        return {
            codeText: ""
        }
    },
    methods: {
        openGameroom() {
            if (this.codeText !== "") {
                this.$router.push(`/${this.gameCodename}/${this.codeText}`);
            }
        }
    },
    mounted() {
        
    },
    beforeUnmount() {
        
    },
});
</script>

<style lang="css" scoped>
.gameroom-code-input-wrapper {
    width: 80%;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: row;
    margin: 0 auto;
}

.gameroom-code-input {
    height: 100%;
    width: 30%;
    padding: 0.1rem;
    background-color: var(--panel-input-background-color-1);
    border: 1px solid var(--panel-input-border-color-1);
    color: var(--panel-input-text-color-1);
    font-size: 0.875rem;
    line-height: 1.25rem;
    border-radius: 0.25rem;
    display: block;
    text-align: center;
}

.gameroom-code-input.inline {
    display: inline-block;
}

.gameroom-code-input:focus {
    border-color: var(--panel-input-focus-border-color-1);
    box-shadow: 0 0 0 3px var(--panel-input-focus-box-shadow-color-1);
}

.gameroom-code-input-text-divider {
    margin: 0 1rem;
}

.create-new-gameroom-button {
    width: 30%;
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

.create-new-gameroom-button:disabled {
    opacity: 0.6;
}

.create-new-gameroom-button:hover:not(:disabled) {
    background-color: var(--panel-button-hover-background-color-1);
}

@media screen and (max-width: 1300px) {
    .gameroom-code-input-wrapper {
        width: 100%;
        height: 2.5rem;
    }
}

@media screen and (max-width: 800px) {
    .gameroom-code-input-wrapper {
        height: max-content;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        margin: 0 auto;
    }

    .gameroom-code-input {
        width: 70%;
        height: 2rem;
    }

    .create-new-gameroom-button {
        width: 70%;
        height: 2rem;
        padding: 0 2px;
        font-size: 0.9rem;
    }
}

@media screen and (max-width: 650px) {
    .gameroom-code-input {
        width: 90%;
        height: 2rem;
    }

    .create-new-gameroom-button {
        width: 90%;
        height: 2rem;
        padding: 0 2px;
        font-size: 0.9rem;
    }
}
</style>