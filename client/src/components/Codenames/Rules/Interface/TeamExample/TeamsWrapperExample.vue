<template>
    <div id="teams-wrapper">
        <div id="teams-type-switchers-wrapper">
            <button 
                @click="togglePanel(0)"
                class="switcher-button"
                :class="{active: type === 0}"
            >
                {{ $t("codenames.rules.game_interface.team_design.desktop") }}
            </button>
            <button 
                @click="togglePanel(1)"
                class="switcher-button"
                :class="{active: type === 1}"
            >
            {{ $t("codenames.rules.game_interface.team_design.mobile") }}
            </button>
        </div>
        <div id="team-examples-wrapper">
            <template v-if="type === 0">
                <TeamDesktopExample teamColor="red"></TeamDesktopExample>
                <TeamDesktopExample teamColor="green"></TeamDesktopExample>
            </template>
            <template v-else-if="type === 1">
                <TeamMobileExample teamColor="red"></TeamMobileExample>
                <TeamMobileExample teamColor="green"></TeamMobileExample>
            </template>
        </div>
    </div>
</template>

<script>
import { defineComponent } from 'vue';

import TeamMobileExample from './TeamMobileExample.vue';
import TeamDesktopExample from './TeamDesktopExample.vue';

export default defineComponent({
    computed: {
        
    },
    components: {
        TeamMobileExample,
        TeamDesktopExample
    },
    props: {
        
    },
    setup(props) {
        
    },
    data() {
        return {
            type: 0
        }
    },
    methods: {
        togglePanel(index) {
            this.type = index;
        }
    },
    mounted() {
        
    },
    beforeUnmount() {
        
    },
});
</script>

<style lang="css" scoped>
#teams-wrapper {
    width: 100%;
    height: max-content;
    min-height: 400px;
    max-height: 700px;

    display: flex;
    flex-direction: column;
}

#team-examples-wrapper {
    height: 810px;
    width: 100%;
    max-width: 100%;
    display: flex;
    align-items: start;
    justify-content: space-evenly;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scroll-snap-align: start;
    overflow-y: visible;
}

#team-examples-wrapper .team-content-wrapper {
    width: 50%;
    min-width: 50%;
    max-width: 50%;
}

#teams-type-switchers-wrapper {
    width: 100%;
    height: 2rem;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    column-gap: 0;
}

.switcher-button {
    width: 100%;
    height: 2rem;
    background-color: rgb(73, 73, 73);
    text-align: center;
}

.switcher-button.active {
    background-color: gray;
}

@media screen and (max-width: 650px) {
    #teams-wrapper {
        width: 98%;
        max-width: 98%;
    }
}

@media screen and (max-width: 550px) {
    #teams-wrapper .team-content-wrapper {
        width: 50%;
        min-width: 50%;
        max-width: 50%;
    }
}

@media screen and (max-width: 440px) {
    #teams-wrapper .team-content-wrapper {
        width: 50%;
        min-width: 50%;
        max-width: 50%;
    }
}
</style>