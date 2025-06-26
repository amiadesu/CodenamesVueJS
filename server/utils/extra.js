function isObject(variable) {
    return variable !== null && typeof variable === 'object' && !Array.isArray(variable);
}

function makeID(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}

function makeColor() {
    return '#' + (Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0');
}

function randChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function shuffle(array) {
    if (array.length === 1) {
        return;
    }

    let currentIndex = array.length;

    while (currentIndex != 0) {
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
    
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
}

module.exports = {
    isObject,
    makeID,
    makeColor,
    randChoice,
    shuffle
};