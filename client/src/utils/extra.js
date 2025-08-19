export function clamp(currentValue, minValue, maxValue) {
    if (currentValue < minValue) {
        return minValue;
    }
    else if (currentValue > maxValue) {
        return maxValue;
    }
    return currentValue;
}