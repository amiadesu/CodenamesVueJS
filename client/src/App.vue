<script setup>
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
const { t, availableLocales, locale, fallbackLocale } = useI18n();
import { RouterLink, RouterView } from 'vue-router'
import { preferencesStore } from './stores/preferences';

const preferencesData = preferencesStore();

onMounted(() => {
    if (preferencesData.language) {
        return;
    }
    const usersLanguage = window.navigator.language;
    if (availableLocales.includes(usersLanguage)) {
        preferencesData.setLanguage(usersLanguage);
        locale.value = usersLanguage;
    } else {
        preferencesData.setLanguage(fallbackLocale.value);
        locale.value = fallbackLocale.value;
    }
});
</script>

<template>
    <RouterView :key="$route.fullPath"/>
</template>