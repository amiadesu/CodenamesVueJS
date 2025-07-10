import { defineStore } from 'pinia';
import { getConfig } from '@/utils/config';

const config = getConfig();

export const preferencesStore = defineStore('preferences', {
    state: () => ({
        language: localStorage.getItem('language') || config.defaultLocale,
        theme: localStorage.getItem('theme') || config.defaultTheme,
    }),
    actions: {
        setLanguage(lang) {
            console.log(lang);
            this.language = lang;
            localStorage.setItem('language', lang);
        },
        setTheme(theme) {
            this.theme = theme;
            localStorage.setItem('theme', theme);
        },
    },
});