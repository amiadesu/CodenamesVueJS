import { defineStore } from 'pinia';
import { config } from '../utils/config';

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