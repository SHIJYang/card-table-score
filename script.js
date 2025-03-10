function updateScore(playerId, change) {
    const playerInput = document.getElementById(playerId);
    let currentScore = parseInt(playerInput.value, 10);
    currentScore += change;
    playerInput.value = currentScore;
}