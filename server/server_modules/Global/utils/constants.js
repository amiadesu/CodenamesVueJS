const userExample = {
    _id : "5dff03d3218b91425b9d6fab",
    name: "user_12345",
    color : "#FFFFFF",
    sockets : ["U5RXSbLe-x9SqKSHAAAD", "h-WMenNUzIBVyeD1AAAF"],
    gameIDs : {
        codenames : "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
    }
};

const validKeys = [
    "_id", "name", "color", "sockets", "gameIDs", "gameIDs.codenames"
];

const bannedRooms = new Set(["default", "rules"]);
const deleteAfterMNumber = 15;  // minutes (number)
const updateAfterMNumber = 5;   // minutes (number)
// Convert to strings for Redis operations
const deleteAfterS = String(deleteAfterMNumber * 60);       // '900' (15 minutes in seconds)
const updateAfterS = String(updateAfterMNumber * 60);       // '300' (5 minutes in seconds)

// Need some additional window to ensure that data updates properly
const expireAfterS = String((deleteAfterMNumber + updateAfterMNumber) * 60); // '1200' (20 minutes in seconds)

// Milliseconds versions (as strings)
const deleteAfterMs = String(Number(deleteAfterS) * 1000);  // '900000'
const updateAfterMs = String(Number(updateAfterS) * 1000);  // '300000'
const expireAfterMs = String(Number(expireAfterS) * 1000);  // '1200000'
const messagesLimitNumber = 100;
const cluesLimitNumber = 100;
const messagesLimit = String(messagesLimitNumber);
const cluesLimit = String(cluesLimitNumber);

const LOCK_TTL = 3000;

module.exports = {
    userExample,
    validKeys,
    bannedRooms,
    deleteAfterMNumber,
    updateAfterMNumber,
    deleteAfterS,
    updateAfterS,
    expireAfterS,
    deleteAfterMs,
    updateAfterMs,
    expireAfterMs,
    messagesLimitNumber,
    cluesLimitNumber,
    messagesLimit,
    cluesLimit,
    LOCK_TTL
};