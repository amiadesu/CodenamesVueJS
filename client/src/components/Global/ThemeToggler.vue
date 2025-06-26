<template>
    <button id="toggle-theme-button" @click="toggleDark()">
        {{ isDark ? '☀️' : '🌑' }}
    </button>
</template>

<script>
import { defineComponent } from 'vue';
import { useDark, useToggle } from '@vueuse/core';
import { useDarkOptions } from '../../utils/config';

export default defineComponent({
    computed: {
        
    },
    setup(props) {
        const isDark = useDark(useDarkOptions);
        const toggleDark = useToggle(isDark);

        return {
            isDark,
            toggleDark
        };
    },
    data() {
        return {
            
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

<style>
#toggle-theme-button {
    height: 100%;
    aspect-ratio: 1 / 1;
    background-color: var(--panel-button-background-color-1);
    color: var(--panel-button-text-color-1);
    font-weight: 400;
    border: 3px var(--panel-button-border-color-1) solid;
    display: flex;
    align-items: center;
    justify-content: center;

    user-select: none;
}

#toggle-theme-button:disabled {
    opacity: 0.6;
}

#toggle-theme-button:hover:not(:disabled) {
    background-color: var(--panel-button-hover-background-color-1);
}
</style>