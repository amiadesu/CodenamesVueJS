<template>
    <div class="chat-panel" :class="{ opens: opened, closes: !opened }">
        <h1>
            {{ $t("codenames.chat.title") }}
        </h1>
        <div class="chat-messages-list-wrapper">
            <div class="scrollable-container" ref="scrollContainer">
                <div class="scrollable-content">
                    <div 
                        class="chat-message-wrapper"
                        v-for="message in gameData.chatMessages"
                        :key="message"
                    >
                        <b>{{ `[${message.senderName}]: ` }}</b>
                        <p>{{ message.messageText }}</p>
                    </div>
                </div>
            </div>
        </div>
        <button id="chat-panel-open-button" type="button" @click="togglePanel">
            <svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512">
                <circle v-if="notificationActive" id="notification-circle" cx="120" cy="80" r="80"/>  
                <path v-if="!opened" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="M328 112L184 256l144 144"/>
                <path v-else fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="M184 112l144 144-144 144"/>
            </svg>
        </button>
        <div class="chat-panel-message-input-wrapper">
            <input type="text" id="chat-panel-message-text-input" :placeholder="$t(`codenames.chat.send_message_placeholder`)" 
               v-model="messageText" maxlength="160" autocomplete="off" v-on:keyup.enter="sendMessage">
            <svg 
                id="chat-panel-message-send-button"
                xmlns="http://www.w3.org/2000/svg" 
                class="ionicon" 
                viewBox="0 0 512 512"
                @click="sendMessage"
            >
                <path d="M476.59 227.05l-.16-.07L49.35 49.84A23.56 23.56 0 0027.14 52 24.65 24.65 0 0016 72.59v113.29a24 24 0 0019.52 23.57l232.93 43.07a4 4 0 010 7.86L35.53 303.45A24 24 0 0016 327v113.31A23.57 23.57 0 0026.59 460a23.94 23.94 0 0013.22 4 24.55 24.55 0 009.52-1.93L476.4 285.94l.19-.09a32 32 0 000-58.8z"/>
            </svg>
        </div>
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
    setup(props) {
        // setup() receives props as the first argument.
        // console.log(props.teamColor)
    },
    data() {
        return {
            opened: false,
            messageText: "",
            notificationActive: false
        }
    },
    methods: {
        sendMessage() {
            if (this.messageText === "") {
                return;
            }
            socket.emit("send_new_chat_message", this.messageText);
            this.messageText = "";
            this.scrollToBottom();
        },
        togglePanel() {
            this.opened = !this.opened;
            this.notificationActive = false;
            if (this.opened) {
                this.scrollToBottom();
            }
        },
        scrollToBottom() {
            this.$nextTick(() => {
                const container = this.$refs.scrollContainer;
                container.scrollTop = container.scrollHeight;
            });
        },
        listenForUpdates() {
            this.$watch(
                () => [...this.gameData.chatMessages],
                (newValue, oldValue) => {
                    if (newValue?.length == 0) {
                        return;
                    }
                    if (newValue[newValue.length - 1].senderID === this.gameData.userData.id) {
                        this.scrollToBottom();
                    }
                    if (!this.opened) {
                        this.notificationActive = true;
                    }
                }
            );
            this.$watch(
                () => this.gameData.toggles.chatPanel,
                (newValue, oldValue) => {
                    if (newValue) {
                        this.togglePanel();
                        this.gameData.toggles.chatPanel = false;
                    }
                }
            );
        }
    },
    mounted() {
        // Connect to the WebSocket server
        // this.socket = io('http://localhost:3000');
        this.listenForUpdates();
    },
    beforeUnmount() {
        // Clean up the WebSocket connection
        // this.socket.disconnect();
    },
});
</script>

<style lang="css" scoped>
.chat-panel {
    width: 30%;
    height: 90%;
    max-height: 90%;

    background-color: var(--panel-background-color-1);
    backdrop-filter: blur(3px) saturate(1);
    -webkit-backdrop-filter: blur(3px) saturate(1);
    
    color: var(--panel-text-color-1);

    transition: 0.5s ease;
    
    display: flex;
    flex-direction: column;
    position: relative;

    pointer-events: all;

    z-index: 5;
    /* overflow-x: scroll; */
}

.chat-panel.opens {
    transform: translateX(0);
}

.chat-panel.closes {
    transform: translateX(100%);
}

.chat-messages-list-wrapper {
    width: 95%;
    height: 89%;
    max-height: 89%;
    margin: 0 auto;
    padding: 5px;
    background-color: var(--panel-background-color-dark-2);
    color: var(--panel-text-color-3);
    margin-bottom: 0.5rem;
}

.scrollable-container {
    height: 100%;
    display: block;
    width: 100%;
    overflow-y: scroll;
    visibility: hidden;
}

.scrollable-content, 
.scrollable-container:hover,
.scrollable-container:focus {
    visibility: visible;
}

.scrollable-content {
    width: 100%;
}

.chat-message-wrapper {
    width: 100%;
    height: auto;
    display: block;
    text-align: left;
}

.chat-message-wrapper > * {
    word-wrap: break-word;
    display: inline;
}

.chat-panel-content-row.single-line-row {
    width: 95%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
}

.chat-panel-content-row.space-around {
    justify-content: space-around;
}

.chat-panel-content-row .align-right {
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: right;
    align-items: center;
}

.chat-panel-bottom-row.single-line-row {
    width: 60%;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    column-gap: 1rem;
}

.chat-panel-button {
    padding: 1px 3px;
    background-color: var(--panel-button-background-color-1);
    color: var(--panel-button-text-color-1);
    font-weight: 400;
    border: 3px var(--panel-button-border-color-1) solid;
    border-radius: 0.35rem;
    display: inline-flex;
    align-items: center;
    margin: 0 auto;
}

.chat-panel-button:disabled {
    opacity: 0.6;
}

.chat-panel-button:hover:not(:disabled) {
    background-color: var(--panel-button-hover-background-color-1);
}

.chat-panel-input {
    /* width: 100%; */
    padding: 0.1rem;
    margin: 0.15rem 0;
    background-color: var(--panel-input-background-color-1);
    border: 1px solid var(--panel-input-border-color-1);
    color: var(--panel-input-text-color-1);
    font-size: 0.875rem;
    line-height: 1.25rem;
    border-radius: 0.25rem;
    display: block;
}

.chat-panel-input.inline {
    display: inline-block;
}

.chat-panel-input:focus {
    border-color: var(--panel-input-focus-border-color-1);
    box-shadow: 0 0 0 3px var(--panel-input-focus-box-shadow-color-1);
}

/* .chat-panel-open-button-wrapper {
    position: relative;
    top: 50%;
    right: -20px;
    width: 20px;
    height: 20px;

    display: flex;
    align-items: center;
    justify-content: center;
} */

#chat-panel-open-button {
    position: fixed;
    top: 50%;
    left: -20px;

    width: 20px;
    height: 20px;

    color: var(--panel-text-color-2);

    padding: 0;
    
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 6;
}

#notification-circle {
    fill: var(--notification-color);
}

.space-around {
    display: flex;
    column-gap: 1rem;
    align-items: center;
    justify-content: center;
}

.chat-panel-message-input-wrapper {
    width: 95%;
    height: 2rem;

    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: row;
    margin: 0 auto;
    margin-bottom: 0.5rem;
}

#chat-panel-message-text-input {
    height: 100%;
    width: 95%;
    padding: 0.1rem;
    background-color: var(--panel-input-background-color-1);
    border: 1px solid var(--panel-input-border-color-1);
    color: var(--panel-input-text-color-1);
    font-size: 0.875rem;
    line-height: 1.25rem;
    border-radius: 0.25rem;
    display: block;
}

#chat-panel-message-text-input.inline {
    display: inline-block;
}

#chat-panel-message-text-input:focus {
    border-color: var(--panel-input-focus-border-color-1);
    box-shadow: 0 0 0 3px var(--panel-input-focus-box-shadow-color-1);
}

#chat-panel-message-send-button {
    aspect-ratio: 1 / 1;
    height: 100%;
    width: auto;
    scale: 1.2;

    padding: 4px;

    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.chat-panel-section-divider {
    width: 90%;
    height: 3px;
    border-top: 3px solid var(--panel-horizontal-divider-color-1);
    line-height: 80%;
    margin: 3px 0;
}

b {
    font-weight: 600;
}

@media screen and (max-width: 1200px) {
    .chat-panel {
        width: 40%;
    }
}

@media screen and (max-width: 1000px) {
    .chat-panel {
        width: 60%;
    }
}

@media screen and (max-width: 600px) {
    .chat-panel {
        width: 80%;
    }
}
</style>