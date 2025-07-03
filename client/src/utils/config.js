let config = null;

async function loadConfig() {
    const response = await fetch('/config.json');
    config = await response.json();
}

console.log("Loading config");
await loadConfig();

export function getConfig() {
    return config;
}

export const useDarkOptions = {
    valueDark: "dark-theme",
    valueLight: "light-theme",
    storageKey: "selectedTheme"
};