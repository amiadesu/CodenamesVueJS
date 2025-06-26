<template>
    <select 
        id="select-language-input" 
        v-model="$i18n.locale"
        @change="updatePreferredLanguage"
    >
        <template v-for="(lang, i) in $i18n.availableLocales" :key="`Lang${i}`">
            <option :value="lang">
                {{ $t(`select_language.flags.${lang}`) }}
            </option>
        </template>
    </select>
</template>

<script>
import { defineComponent } from 'vue';
import { preferencesStore } from '../../stores/preferences';

export default defineComponent({
    computed: {
        preferencesData: () => preferencesStore()
    },
    setup(props) {
        
    },
    data() {
        return {
            
        }
    },
    methods: {
        updatePreferredLanguage() {
            console.log(this.$i18n.locale);
            console.log(localStorage.language);
            this.preferencesData.setLanguage(this.$i18n.locale);
            console.log(localStorage.language);
        }
    },
    mounted() {
        
    },
    beforeUnmount() {
        
    },
});
</script>

<style>
#select-language-input {
    height: 100%;
    aspect-ratio: 1 / 1;
    padding: 0.1rem;
    background-color: var(--panel-input-background-color-1);
    border: 1px solid var(--panel-input-border-color-1);
    color: var(--panel-input-text-color-1);
    font-size: 0.875rem;
    line-height: 1.25rem;
    display: block;

    user-select: none;
}

#select-language-input.inline {
    display: inline-block;
}

#select-language-input:focus {
    border-color: var(--panel-input-focus-border-color-1);
    box-shadow: 0 0 0 3px var(--panel-input-focus-box-shadow-color-1);
}
</style>