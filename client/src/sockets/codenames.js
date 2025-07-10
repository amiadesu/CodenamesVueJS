import { reactive } from "vue";
import { io } from "socket.io-client";
import { gameStore } from '@/stores/gameData';
import { getConfig } from "@/utils/config";

const config = getConfig();

let gameData = null;

export function setupSocketStore() {
    gameData = gameStore();
}

export const state = reactive({
    connected: false,
    initialized: false
});

// "undefined" means the URL will be computed from the `window.location` object
const URL = config.serverIPs.codenames;

export const socket = io(URL, {
    path: "/ios/",
    autoConnect: false,
    auth: {
        userID: localStorage.userID || "",
    }
});

socket.on("connect", () => {
    console.log("Connected");
    state.connected = true;
});

socket.on("disconnect", () => {
    console.log("Disconnected");
    gameData.serverState.online = false;
    state.connected = false;
    state.initialized = false;
});

socket.on("stop_session", () => {
    console.log("Session was stopped");
    gameData.serverState.disconnected = true;
});

socket.on("update_local_storage_data", (newData) => {
    localStorage.setItem("userID", newData.userID);
});

socket.on("set_initialized", () => {
    state.initialized = true;
});