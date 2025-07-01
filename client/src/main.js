import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n';

import { languages } from './i18n/index.js'
const messages = Object.assign(languages)

import { setupSocketStore } from './sockets/codenames'
import { preferencesStore } from './stores/preferences';

import { config } from "@/utils/config";

import App from './App.vue'
import router from './router'


const app = createApp(App)

app.use(createPinia())

const preferencesData = preferencesStore();

const i18n = createI18n({
    legacy: false,
    locale: preferencesData.language,
    fallbackLocale: config.fallbackLocale,
    messages: messages
});

app.use(i18n);
app.use(router);

setupSocketStore();

app.mount('#app');