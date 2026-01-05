// Game State
const state = {
  playerWord: '',
  computerWord: '',
  playerGuesses: [],
  computerGuesses: [],
  possibleWords: [],
  isPlayerTurn: true,
  gameOver: false
};

// DOM Elements
const elements = {
  // Screens
  setupScreen: document.getElementById('setup-screen'),
  gameScreen: document.getElementById('game-screen'),
  gameoverScreen: document.getElementById('gameover-screen'),

  // Setup
  secretWordInput: document.getElementById('secret-word-input'),
  startGameBtn: document.getElementById('start-game-btn'),
  setupError: document.getElementById('setup-error'),

  // Game
  turnIndicator: document.getElementById('turn-indicator'),
  playerGuesses: document.getElementById('player-guesses'),
  computerGuesses: document.getElementById('computer-guesses'),
  guessInput: document.getElementById('guess-input'),
  submitGuessBtn: document.getElementById('submit-guess-btn'),
  guessError: document.getElementById('guess-error'),
  playerSecretDisplay: document.getElementById('player-secret-display'),

  // Game Over
  gameoverTitle: document.getElementById('gameover-title'),
  gameoverMessage: document.getElementById('gameover-message'),
  revealPlayerWord: document.getElementById('reveal-player-word'),
  revealComputerWord: document.getElementById('reveal-computer-word'),
  playAgainBtn: document.getElementById('play-again-btn')
};

// Utility Functions
function hasRepeatedLetters(word) {
  const letters = new Set(word.toLowerCase());
  return letters.size !== word.length;
}

function isValidWord(word) {
  return WORDS.includes(word.toLowerCase());
}

function countMatches(guess, secret) {
  const guessLetters = new Set(guess.toLowerCase());
  const secretLetters = new Set(secret.toLowerCase());
  let matches = 0;
  for (const letter of guessLetters) {
    if (secretLetters.has(letter)) {
      matches++;
    }
  }
  return matches;
}

function showScreen(screen) {
  elements.setupScreen.classList.add('hidden');
  elements.gameScreen.classList.add('hidden');
  elements.gameoverScreen.classList.add('hidden');
  screen.classList.remove('hidden');
}

// Rendering Functions
function renderGuess(container, word, matches, isCorrect = false) {
  const item = document.createElement('div');
  item.className = 'guess-item' + (isCorrect ? ' correct' : '');
  item.innerHTML = `
    <span class="guess-word">${word.toUpperCase()}</span>
    <span class="guess-matches">${matches}</span>
  `;
  container.appendChild(item);
  container.scrollTop = container.scrollHeight;
}

function renderEmptyState(container, message) {
  container.innerHTML = `<div class="empty-state">${message}</div>`;
}

function updateTurnIndicator() {
  if (state.isPlayerTurn) {
    elements.turnIndicator.textContent = 'Your turn to guess';
    elements.guessInput.disabled = false;
    elements.submitGuessBtn.disabled = false;
    elements.guessInput.focus();
  } else {
    elements.turnIndicator.textContent = "Computer is thinking...";
    elements.guessInput.disabled = true;
    elements.submitGuessBtn.disabled = true;
  }
}

// Computer AI
function initComputerAI() {
  // Start with all valid words as possibilities
  state.possibleWords = [...WORDS];
}

function filterPossibleWords(guess, matchCount) {
  // Keep only words that would give the same match count for this guess
  state.possibleWords = state.possibleWords.filter(word => {
    return countMatches(guess, word) === matchCount;
  });
}

function computerMakeGuess() {
  if (state.possibleWords.length === 0) {
    // Fallback: shouldn't happen, but pick a random word
    return WORDS[Math.floor(Math.random() * WORDS.length)];
  }

  // Strategy: Pick a word that will eliminate roughly half the remaining possibilities
  // This is a heuristic approach - not perfectly optimal but challenging

  if (state.possibleWords.length <= 2) {
    // If only 1-2 possibilities, just guess one
    return state.possibleWords[0];
  }

  // Score each possible guess by how well it splits the remaining possibilities
  let bestGuess = state.possibleWords[0];
  let bestScore = Infinity;

  // Sample words to evaluate (for performance, don't check all words)
  const candidates = state.possibleWords.length > 20
    ? sampleArray(state.possibleWords, 20)
    : state.possibleWords;

  for (const candidate of candidates) {
    // Simulate this guess against all possible secret words
    const matchDistribution = {};

    for (const possibleSecret of state.possibleWords) {
      const matches = countMatches(candidate, possibleSecret);
      matchDistribution[matches] = (matchDistribution[matches] || 0) + 1;
    }

    // Score: we want the maximum group size to be as small as possible
    // This means no matter what the result, we eliminate a good chunk
    const maxGroupSize = Math.max(...Object.values(matchDistribution));

    // Add small random factor to avoid always picking the same word
    const score = maxGroupSize + Math.random() * 0.5;

    if (score < bestScore) {
      bestScore = score;
      bestGuess = candidate;
    }
  }

  return bestGuess;
}

function sampleArray(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// Game Logic
function startGame() {
  const word = elements.secretWordInput.value.trim().toLowerCase();

  // Validation
  if (word.length !== 5) {
    elements.setupError.textContent = 'Word must be exactly 5 letters';
    return;
  }

  if (!/^[a-zA-Z]+$/.test(word)) {
    elements.setupError.textContent = 'Word must contain only letters';
    return;
  }

  if (hasRepeatedLetters(word)) {
    elements.setupError.textContent = 'Word cannot have repeated letters';
    return;
  }

  // Clear error
  elements.setupError.textContent = '';

  // Initialize game state
  state.playerWord = word;
  state.computerWord = WORDS[Math.floor(Math.random() * WORDS.length)];
  state.playerGuesses = [];
  state.computerGuesses = [];
  state.isPlayerTurn = true;
  state.gameOver = false;

  // Initialize AI
  initComputerAI();

  // Setup UI
  elements.playerGuesses.innerHTML = '';
  elements.computerGuesses.innerHTML = '';
  renderEmptyState(elements.playerGuesses, 'No guesses yet');
  renderEmptyState(elements.computerGuesses, 'Waiting...');

  elements.playerSecretDisplay.textContent = word.toUpperCase();
  elements.guessInput.value = '';
  elements.guessError.textContent = '';

  // Show game screen
  showScreen(elements.gameScreen);
  updateTurnIndicator();
}

function playerGuess() {
  if (!state.isPlayerTurn || state.gameOver) return;

  const guess = elements.guessInput.value.trim().toLowerCase();

  // Validation
  if (guess.length !== 5) {
    elements.guessError.textContent = 'Guess must be exactly 5 letters';
    return;
  }

  if (!/^[a-zA-Z]+$/.test(guess)) {
    elements.guessError.textContent = 'Guess must contain only letters';
    return;
  }

  if (hasRepeatedLetters(guess)) {
    elements.guessError.textContent = 'Guess cannot have repeated letters';
    return;
  }

  if (!isValidWord(guess)) {
    elements.guessError.textContent = 'Word not in dictionary';
    return;
  }

  // Clear error and input
  elements.guessError.textContent = '';
  elements.guessInput.value = '';

  // Calculate matches
  const matches = countMatches(guess, state.computerWord);
  const isCorrect = guess === state.computerWord;

  // Record guess
  state.playerGuesses.push({ word: guess, matches });

  // Clear empty state on first guess
  if (state.playerGuesses.length === 1) {
    elements.playerGuesses.innerHTML = '';
  }

  // Render guess
  renderGuess(elements.playerGuesses, guess, matches, isCorrect);

  // Check for win
  if (isCorrect) {
    endGame(true);
    return;
  }

  // Switch to computer's turn
  state.isPlayerTurn = false;
  updateTurnIndicator();

  // Computer takes its turn after a short delay
  setTimeout(computerTurn, 1000);
}

function computerTurn() {
  if (state.gameOver) return;

  // Clear empty state on first guess
  if (state.computerGuesses.length === 0) {
    elements.computerGuesses.innerHTML = '';
  }

  // Make guess
  const guess = computerMakeGuess();
  const matches = countMatches(guess, state.playerWord);
  const isCorrect = guess === state.playerWord;

  // Record guess and update AI state
  state.computerGuesses.push({ word: guess, matches });
  filterPossibleWords(guess, matches);

  // Render guess
  renderGuess(elements.computerGuesses, guess, matches, isCorrect);

  // Check for computer win
  if (isCorrect) {
    endGame(false);
    return;
  }

  // Switch back to player's turn
  state.isPlayerTurn = true;
  updateTurnIndicator();
}

function endGame(playerWon) {
  state.gameOver = true;

  // Set game over content
  if (playerWon) {
    elements.gameoverTitle.textContent = 'You Win!';
    elements.gameoverTitle.className = 'win';
    elements.gameoverMessage.textContent = `You guessed the computer's word in ${state.playerGuesses.length} tries!`;
  } else {
    elements.gameoverTitle.textContent = 'Computer Wins';
    elements.gameoverTitle.className = 'lose';
    elements.gameoverMessage.textContent = `The computer guessed your word in ${state.computerGuesses.length} tries.`;
  }

  elements.revealPlayerWord.textContent = state.playerWord;
  elements.revealComputerWord.textContent = state.computerWord;

  // Show game over screen after a short delay
  setTimeout(() => {
    showScreen(elements.gameoverScreen);
  }, 1500);
}

function resetGame() {
  elements.secretWordInput.value = '';
  elements.setupError.textContent = '';
  showScreen(elements.setupScreen);
  elements.secretWordInput.focus();
}

// Event Listeners
elements.startGameBtn.addEventListener('click', startGame);
elements.submitGuessBtn.addEventListener('click', playerGuess);
elements.playAgainBtn.addEventListener('click', resetGame);

// Enter key support
elements.secretWordInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    startGame();
  }
});

elements.guessInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    playerGuess();
  }
});

// Initial focus
elements.secretWordInput.focus();
