// @ts-check
const fs = require("node:fs");
const path = require('path');
const chokidar = require('chokidar');
const CodenamesDB = require("./codenamesDB");

let packsFolderPath = null;
let packsFilePath = null;

function setupWordPackWatcher(pathToWordPackFolder) {
    packsFolderPath = pathToWordPackFolder;
    packsFilePath = path.join(pathToWordPackFolder, "packs.json");
    updateMongoDB();
    chokidar.watch(packsFilePath).on('change', () => {
        console.log(`${packsFilePath} has been updated. Checking for changes...`);
        updateMongoDB();
    });
}

const updateMongoDB = async () => {
    try {
        const data = fs.readFileSync(packsFilePath, 'utf8');
        const currentPacksState = JSON.parse(data);

        for (const [packId, packInfo] of Object.entries(currentPacksState)) {
            const result = await CodenamesDB.getWordPack(packId);
            if (!result.success) {
                continue;
            }
            const existingPack = result.value;

            if (!existingPack || existingPack.version !== packInfo.version) {
                const wordsFilePath = path.join(packsFolderPath, 'Packs', packInfo.file_name);
                const words = fs.readFileSync(wordsFilePath, 'utf8').split('\r\n').filter(word => word.trim() !== '');

                const packData = {
                    packId,
                    ...packInfo,
                    words
                };
                await CodenamesDB.setWordPack(packData);

                console.log(`Updated or created pack: ${packId}`);
            } else {
                console.log(`No changes detected for pack: ${packId}`);
            }
        }
    } catch (err) {
        console.error('Error updating MongoDB:', err);
    }
};

module.exports = {
    setupWordPackWatcher
};