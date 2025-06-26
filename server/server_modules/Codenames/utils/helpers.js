function totalCards(gameRules) {
    let extraSum = 0;
    for (let i = 0; i < gameRules.teamAmount - 1; i++) {
        extraSum += gameRules.extraCards[i];
    }
    const totalCardAmount = gameRules.teamAmount * gameRules.baseCards + 
                            extraSum + gameRules.blackCards;
    return totalCardAmount;
}

module.exports = {
    totalCards
}