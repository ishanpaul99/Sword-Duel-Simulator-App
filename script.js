const playerMaxHp = 100;
const totalLevels = 5;

const state = {
  playerHp: playerMaxHp,
  enemyHp: playerMaxHp,
  enemyMaxHp: playerMaxHp,
  currentLevel: 1,
  round: 1,
  gameOver: false,
  transitioning: false,
};

const playerHpBar = document.getElementById('playerHpBar');
const enemyHpBar = document.getElementById('enemyHpBar');
const playerHpText = document.getElementById('playerHpText');
const enemyHpText = document.getElementById('enemyHpText');
const combatLog = document.getElementById('combatLog');
const battleStatus = document.getElementById('battleStatus');
const resultOverlay = document.getElementById('battleResultOverlay');
const resultTitle = document.getElementById('resultTitle');
const resultText = document.getElementById('resultText');
const restartBtn = document.getElementById('restartBtn');
const arenaCard = document.getElementById('arenaCard');
const year = document.getElementById('year');
const roundAnnouncement = document.getElementById('roundAnnouncement');
const roundAnnouncementLabel = roundAnnouncement.querySelector('.round-announcement-label');
const roundAnnouncementCopy = roundAnnouncement.querySelector('.round-announcement-copy');

const actionButtons = document.querySelectorAll('.action-btn');
const enemyActionChoices = ['attack', 'defend', 'dodge'];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getLevelStats(level) {
  const hp = 100 + (level - 1) * 25;
  return {
    hp,
    attackMin: 10 + (level - 1) * 3,
    attackMax: 25 + (level - 1) * 5,
    blockChance: 0.22 + (level - 1) * 0.08,
    dodgeChance: 0.1 + (level - 1) * 0.03,
  };
}

function updateBars() {
  const playerWidth = Math.max(0, (state.playerHp / playerMaxHp) * 100);
  const enemyWidth = Math.max(0, (state.enemyHp / state.enemyMaxHp) * 100);

  playerHpBar.style.width = `${playerWidth}%`;
  enemyHpBar.style.width = `${enemyWidth}%`;

  playerHpText.textContent = `${state.playerHp} / ${playerMaxHp}`;
  enemyHpText.textContent = `${state.enemyHp} / ${state.enemyMaxHp}`;
}

function addLog(message, variant = '') {
  const entry = document.createElement('div');
  entry.className = `log-entry ${variant}`;
  entry.textContent = message;
  combatLog.prepend(entry);

  while (combatLog.children.length > 20) {
    combatLog.removeChild(combatLog.lastChild);
  }
}

function setBattleStatus(message) {
  battleStatus.textContent = message;
}

function triggerShake() {
  arenaCard.classList.remove('shake');
  void arenaCard.offsetWidth;
  arenaCard.classList.add('shake');
  window.setTimeout(() => arenaCard.classList.remove('shake'), 420);
}

function showRoundAnnouncement(level) {
  roundAnnouncement.classList.remove('show');
  arenaCard.classList.remove('round-announcement-active');
  void roundAnnouncement.offsetWidth;
  roundAnnouncementLabel.textContent = `Round ${level}`;
  roundAnnouncementCopy.textContent = '';
  arenaCard.classList.add('round-announcement-active');
  roundAnnouncement.classList.add('show');

  window.setTimeout(() => {
    roundAnnouncement.classList.remove('show');
    arenaCard.classList.remove('round-announcement-active');
  }, 3000);
}

function setResult(result, message) {
  state.gameOver = true;
  state.transitioning = false;
  resultTitle.textContent = result;
  resultText.textContent = message;
  resultOverlay.classList.add('show');

  if (result.includes('MEGA WINNER')) {
    arenaCard.classList.add('victory-glow');
    setBattleStatus('Mega Winner crowned!');
  } else if (result === 'VICTORY') {
    arenaCard.classList.add('victory-glow');
    setBattleStatus('Victory! The enemy has fallen.');
  } else {
    arenaCard.classList.add('defeat-darken');
    setBattleStatus('Defeat! The duel is over.');
  }

  actionButtons.forEach((button) => button.disabled = true);
}

function startRound(level) {
  state.currentLevel = level;
  state.round = level;
  state.playerHp = playerMaxHp;
  state.transitioning = true;

  const levelStats = getLevelStats(level);
  state.enemyMaxHp = levelStats.hp;
  state.enemyHp = levelStats.hp;

  combatLog.innerHTML = '';
  resultOverlay.classList.remove('show');
  arenaCard.classList.remove('victory-glow', 'defeat-darken', 'shake');

  actionButtons.forEach((button) => button.disabled = true);

  addLog(`ROUND ${level} begins!`, 'highlight');
  addLog(`Enemy armor grows tougher. Expect stronger strikes and better guarding.`, 'warning');
  setBattleStatus(`Round ${level} - prepare for battle.`);
  updateBars();
  showRoundAnnouncement(level);

  window.setTimeout(() => {
    state.transitioning = false;
    state.gameOver = false;
    actionButtons.forEach((button) => button.disabled = false);
    setBattleStatus(`Round ${level} underway.`);
  }, 3000);
}

function resetGame() {
  state.playerHp = playerMaxHp;
  state.enemyHp = playerMaxHp;
  state.enemyMaxHp = playerMaxHp;
  state.currentLevel = 1;
  state.round = 1;
  state.gameOver = false;
  state.transitioning = false;

  combatLog.innerHTML = '';
  resultOverlay.classList.remove('show');
  arenaCard.classList.remove('victory-glow', 'defeat-darken', 'shake');

  startRound(1);
}

function enemyTurn(playerAction) {
  if (state.gameOver || state.transitioning) return;

  const levelStats = getLevelStats(state.currentLevel);
  const enemyAction = enemyActionChoices[randomInt(0, enemyActionChoices.length - 1)];
  let enemyDamage = 0;

  if (enemyAction === 'attack') {
    enemyDamage = randomInt(levelStats.attackMin, levelStats.attackMax);
    const critical = Math.random() < 0.2;
    if (critical) {
      enemyDamage += randomInt(4, 10);
      addLog('Enemy lands a CRITICAL hit!', 'error');
    }

    const enemyBlockChance = Math.random() < levelStats.blockChance;
    if (playerAction === 'defend') {
      enemyDamage = Math.floor(enemyDamage * 0.35);
      addLog('Your defense blocks most of the enemy attack!', 'warning');
    } else if (playerAction === 'dodge') {
      const dodged = Math.random() < 0.48;
      if (dodged) {
        enemyDamage = 0;
        addLog('You dodged successfully! The enemy strikes air.', 'success');
      } else {
        addLog('The enemy breaks through your dodge!');
      }
    }

    if (enemyBlockChance && playerAction !== 'defend') {
      enemyDamage = Math.floor(enemyDamage * 0.55);
      addLog('The enemy hardens its guard and reduces the blow!', 'warning');
    }

    if (enemyDamage > 0) {
      state.playerHp = clamp(state.playerHp - enemyDamage, 0, playerMaxHp);
      addLog(`Enemy deals ${enemyDamage} damage!`, 'error');
      if (critical || enemyDamage >= 20) {
        triggerShake();
      }
    }
  } else if (enemyAction === 'defend') {
    addLog('Enemy raises a stout shield and braces.', 'warning');
  } else if (enemyAction === 'dodge') {
    addLog('Enemy slips away in a blur!', 'success');
  }

  updateBars();

  if (state.playerHp <= 0) {
    setResult('DEFEAT', 'The enemy knight claims victory in the arena.');
    return;
  }

  setBattleStatus(`Round ${state.currentLevel} - keep your guard up.`);
}

function handlePlayerAction(action) {
  if (state.gameOver || state.transitioning) return;

  actionButtons.forEach((button) => button.disabled = true);
  setBattleStatus(`Round ${state.currentLevel} - ${action} selected...`);

  let damage = 0;
  let critical = false;

  if (action === 'attack') {
    damage = randomInt(10, 25);
    critical = Math.random() < 0.2;
    if (critical) {
      damage += randomInt(6, 12);
      addLog('Critical hit! The blow cuts deep.', 'highlight');
    }

    const levelStats = getLevelStats(state.currentLevel);
    const enemyDefense = Math.random() < levelStats.blockChance;
    if (enemyDefense) {
      damage = Math.floor(damage * 0.5);
      addLog('Enemy blocks the attack!', 'warning');
    }

    state.enemyHp = clamp(state.enemyHp - damage, 0, state.enemyMaxHp);
    addLog(`You dealt ${damage} damage!`, 'highlight');
    if (critical || damage >= 20) {
      triggerShake();
    }
    updateBars();

    if (state.enemyHp <= 0) {
      if (state.currentLevel === totalLevels) {
        setResult('👑 MEGA WINNER', 'You conquered every round and are crowned the Mega Winner!');
      } else {
        const nextLevel = state.currentLevel + 1;
        addLog(`You cleared Round ${state.currentLevel}!`, 'success');
        setBattleStatus(`Round ${state.currentLevel} cleared. Next challenge inbound.`);
        state.transitioning = true;
        actionButtons.forEach((button) => button.disabled = true);
        window.setTimeout(() => {
          startRound(nextLevel);
        }, 1600);
      }
      return;
    }
  } else if (action === 'defend') {
    addLog('You raise your shield and steady your stance.', 'warning');
  } else if (action === 'dodge') {
    addLog('You evade the next blow.', 'success');
  }

  window.setTimeout(() => {
    enemyTurn(action);
    actionButtons.forEach((button) => button.disabled = false);
  }, 700);
}

function populateParticles() {
  const particleCount = 22;
  const arenaAmbient = document.createElement('div');
  arenaAmbient.className = 'particle-layer';
  document.body.appendChild(arenaAmbient);

  for (let i = 0; i < particleCount; i += 1) {
    const ember = document.createElement('span');
    ember.className = 'ember';
    ember.style.left = `${Math.random() * 100}%`;
    ember.style.top = `${Math.random() * 100}%`;
    ember.style.animationDelay = `${Math.random() * 5}s`;
    ember.style.animationDuration = `${4 + Math.random() * 4}s`;
    arenaAmbient.appendChild(ember);
  }
}

function init() {
  year.textContent = new Date().getFullYear();
  populateParticles();

  actionButtons.forEach((button) => {
    button.addEventListener('click', () => handlePlayerAction(button.dataset.action));
  });

  const startDuelBtn = document.getElementById('startDuelBtn');
  const fightAgainBtn = document.getElementById('fightAgainBtn');

  startDuelBtn.addEventListener('click', (event) => {
    event.preventDefault();
    document.getElementById('arena').scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => {
      resetGame();
    }, 250);
  });

  fightAgainBtn.addEventListener('click', () => {
    resetGame();
  });

  restartBtn.addEventListener('click', resetGame);

  state.playerHp = playerMaxHp;
  state.enemyHp = playerMaxHp;
  state.enemyMaxHp = playerMaxHp;
  state.currentLevel = 1;
  state.round = 1;
  state.gameOver = false;
  state.transitioning = false;

  combatLog.innerHTML = '';
  resultOverlay.classList.remove('show');
  arenaCard.classList.remove('victory-glow', 'defeat-darken', 'shake');
  actionButtons.forEach((button) => button.disabled = true);
  setBattleStatus('Ready for battle. Click Start Duel to begin.');
  updateBars();
}

init();
