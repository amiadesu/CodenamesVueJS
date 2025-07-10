<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import CodenamesViewDesktop from './CodenamesViewDesktop.vue';
import CodenamesViewMobile from './CodenamesViewMobile.vue';

const isMobile = ref(false);
const isReady = ref(false);

function checkMobile() {
  isMobile.value = window.innerWidth <= 1000;
}

// Set initial value and add event listener
onMounted(() => {
  checkMobile();
  isReady.value = true;
  window.addEventListener('resize', checkMobile);
});

// Clean up event listener
onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});

</script>

<template>
  <template v-if="isReady">
    <CodenamesViewDesktop v-if="!isMobile"></CodenamesViewDesktop>
    <CodenamesViewMobile v-else></CodenamesViewMobile>
  </template>
</template>
