import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const globalStore = defineStore('globalData', () => {
    const remInPixels = ref(0);
    return {
        remInPixels
    };
});