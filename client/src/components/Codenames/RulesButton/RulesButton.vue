<template>
    <a href="/codenames/rules" target="_blank" id="open-rules-button">
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 512 512"
        >
            <path d="M248 64C146.39 64 64 146.39 64 248s82.39 184 184 184 184-82.39 184-184S349.61 64 248 64z" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="32"/>
            <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M220 220h32v116"/>
            <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-miterlimit="10" stroke-width="32" d="M208 340h88"/>
            <path d="M248 130a26 26 0 1026 26 26 26 0 00-26-26z"/>
        </svg>
    </a>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
    computed: {
        
    },
    setup(props) {
        
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

<style lang="css" scoped>
#open-rules-button {
    height: 100%;
    aspect-ratio: 1 / 1;
    background-color: var(--panel-button-background-color-1);
    color: var(--panel-button-text-color-1);
    font-weight: 400;
    border: 3px var(--panel-button-border-color-1) solid;
    display: flex;
    align-items: center;
    justify-content: center;
}

#open-rules-button svg {
    margin-left: 1px;
}

#open-rules-button:disabled {
    opacity: 0.6;
}

#open-rules-button:hover:not(:disabled) {
    background-color: var(--panel-button-hover-background-color-1);
}
</style>