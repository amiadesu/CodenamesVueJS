async function loadConfig() {
    const response = await fetch('/config.json');
    return response.json();
}

export const config = await loadConfig();

export const useDarkOptions = {
    valueDark: "dark-theme",
    valueLight: "light-theme",
    storageKey: "selectedTheme"
};