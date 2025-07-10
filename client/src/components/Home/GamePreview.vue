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
        }
    },
    mounted() {
        this.randomizeCluePlaceholder();
    },
    beforeUnmount() {
        
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
    max-width: 60%;
    font-size: 1.2rem;
    font-weight: 500;
}

.game-preview-wrapper {
    width: 100%;
    background-color: var(--preview-element-block-background-color);
    display: flex;
    flex-direction: column;
    row-gap: 0.5rem;
    padding: 0.5rem;
    border-radius: 0.7rem;
    border: 2px solid black;
}

.open-game-rules-button {
    padding: 1px 3px;
    width: 5rem;
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

@media screen and (max-width: 650px) {
    .open-game-rules-button {
        height: 100%;
    }
}
</style>