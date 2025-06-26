<template>
    <div class="gameroom-code-input-wrapper">
        <input 
            type="text" 
            class="gameroom-code-input" 
            :placeholder="$t(`gamePreview.enter_room_code`)" 
            v-model="codeText"
            minlength="1"
            maxlength="16" 
            onkeydown="return /[a-zA-Z0-9]/i.test(event.key)"
            autocomplete="off" 
            v-on:keyup.enter="openGameroom"
        >
        <p class="gameroom-code-input-text-divider">
            {{ $t(`gamePreview.or`) }}
        </p>
        <button 
            class="create-new-gameroom-button"
            @click="$router.push(`/codenames/`)"
        >
        {{ $t(`gamePreview.create_new_room`) }}
        </button>
    </div>
</template>

<script>
import { defineComponent } from 'vue';
import { gameStore } from '@/stores/gameData';
// import { io } from 'socket.io-client';
import { socket } from "@/sockets/codenames";

export default defineComponent({
    computed: {
        gameData: () => gameStore()
    },
    props: {
        gameCodename : {
            type: String,
            default: "example"
        }
    },
    setup(props) {
        // setup() receives props as the first argument.
        // console.log(props.teamColor)
    },
    data() {
        return {
            codeText: ""
        }
    },
    methods: {
        openGameroom() {
            if (this.codeText !== "") {
                this.$router.push(`/${this.gameCodename}/${this.codeText}`);
            }
        },
        sendClue() {
            // if (this.textClue === "") {
            //     return;
            // }
            // socket.emit("send_clue", this.textClue + " - " + this.numberClue, this.gameData.userData.teamColor);
            // this.textClue = "";
            // this.numberClue = 0;
        },
        listenForUpdates() {
            // socket.on("request_new_gameboard", () => {
            //     socket.emit("get_gameboard");
            // });

            // socket.on("send_new_gameboard", (words) => {
            //     this.words = words;
            // });

            // this.socket.on("user_connected", (users) => {
            //     this.users = users
            // });
        }
    },
    mounted() {
        // Connect to the WebSocket server
        // this.socket = io('http://localhost:3000');
    },
    beforeUnmount() {
        // Clean up the WebSocket connection
        // this.socket.disconnect();
    },
});
</script>

<style lang="css" scoped>
.gameroom-code-input-wrapper {
    width: 80%;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: row;
    margin: 0 auto;
}

.gameroom-code-input {
    height: 100%;
    width: 30%;
    padding: 0.1rem;
    background-color: var(--panel-input-background-color-1);
    border: 1px solid var(--panel-input-border-color-1);
    color: var(--panel-input-text-color-1);
    font-size: 0.875rem;
    line-height: 1.25rem;
    border-radius: 0.25rem;
    display: block;
    text-align: center;
}

.gameroom-code-input.inline {
    display: inline-block;
}

.gameroom-code-input:focus {
    border-color: var(--panel-input-focus-border-color-1);
    box-shadow: 0 0 0 3px var(--panel-input-focus-box-shadow-color-1);
}

.gameroom-code-input-text-divider {
    margin: 0 1rem;
}

.create-new-gameroom-button {
    width: 30%;
    padding: 1px 3px;
    background-color: var(--panel-button-background-color-1);
    color: var(--panel-button-text-color-1);
    font-weight: 400;
    border: 3px var(--panel-button-border-color-1) solid;
    border-radius: 0.35rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-align: center;
}

.create-new-gameroom-button:disabled {
    opacity: 0.6;
}

.create-new-gameroom-button:hover:not(:disabled) {
    background-color: var(--panel-button-hover-background-color-1);
}

@media screen and (max-width: 1000px) {
    #clue-input-wrapper {
        width: 95%;
    }
}

@media screen and (max-width: 650px) {
    #clue-text-input {
        width: 80%;
    }

    #clue-number-input {
        width: 12%;
    }
}
</style>