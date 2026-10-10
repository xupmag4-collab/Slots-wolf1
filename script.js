const SYMBOLS = ['🍒', '🍋', '🍊', '💎', '7️⃣', '⭐'];
const BET = 10;

let balance = 100;
let wins = 0;
let spins = 0;
let spinning = false;

// === ЗВУК через Web Audio API ===
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playTone(freq, duration, type = 'sine', volume = 0.1) {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function soundSpin() {
    playTone(400 + Math.random() * 200, 0.05, 'square', 0.05);
}

function soundWin() {
    playTone(523, 0.15, 'sine', 0.15);
    setTimeout(() => playTone(659, 0.15, 'sine', 0.15), 150);
    setTimeout(() => playTone(784, 0.3, 'sine', 0.15), 300);
}

function soundJackpot() {
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((f, i) => {
        setTimeout(() => playTone(f, 0.2, 'sine', 0.2), i * 120);
    });
}

function soundLose() {
    playTone(200, 0.3, 'sawtooth', 0.08);
}

function soundClick() {
    playTone(800, 0.05, 'square', 0.08);
}

// === ЛОГИКА ИГРЫ ===
function randomSymbol() {
    return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

function getReels() {
    return [
        document.getElementById('reel1'),
        document.getElementById('reel2'),
        document.getElementById('reel3')
    ];
}

function updateUI() {
    document.getElementById('balance').textContent = balance;
    document.getElementById('wins').textContent = wins;
    document.getElementById('spins').textContent = spins;
}

function checkWin(reels) {
    const [a, b, c] = reels;
    
    if (a === b && b === c) {
        if (a === '7️⃣') {
            return { win: BET * 20, text: '🎉 ДЖЕКПОТ! Три семёрки!', type: 'jackpot' };
        }
        return { win: BET * 10, text: '🔥 Три одинаковых!', type: 'win' };
    }
    
    if (a === b || b === c || a === c) {
        return { win: BET * 2, text: '✨ Два одинаковых!', type: 'win' };
    }
    
    return { win: 0, text: '😢 Не повезло...', type: 'lose' };
}

function spin() {
    if (spinning) return;
    if (balance < BET) {
        document.getElementById('result').textContent = '❌ Недостаточно монет!';
        document.getElementById('result').className = 'result lose';
        return;
    }

    spinning = true;
    balance -= BET;
    spins++;
    updateUI();

    const btn = document.getElementById('spinBtn');
    btn.disabled = true;
    btn.textContent = '🎰 Крутим...';

    const reelEls = getReels();
    const resultEl = document.getElementById('result');
    resultEl.textContent = 'Крутим...';
    resultEl.className = 'result';

    // Убираем старые выигрыши
    reelEls.forEach(r => r.classList.remove('win'));
    
    // Запускаем анимацию
    reelEls.forEach(r => r.classList.add('spinning'));

    // Звук кручения
    const spinSoundInterval = setInterval(soundSpin, 100);

    // Результат игры (заранее определён)
    const finalReels = [randomSymbol(), randomSymbol(), randomSymbol()];

    // Останавливаем барабаны по очереди
    const stopTimes = [1200, 1600, 2000];
    
    stopTimes.forEach((time, i) => {
        setTimeout(() => {
            reelEls[i].classList.remove('spinning');
            reelEls[i].textContent = finalReels[i];
            playTone(600 + i * 100, 0.1, 'sine', 0.1);
        }, time);
    });

    // Финальный результат
    setTimeout(() => {
        clearInterval(spinSoundInterval);
        
        const result = checkWin(finalReels);
        balance += result.win;
        if (result.win > 0) wins++;

        resultEl.className = 'result ' + (result.type === 'lose' ? 'lose' : 'win');
        
        let text = result.text;
        if (result.win > 0) {
            text += `\n💵 +${result.win} монет`;
        } else {
            text += `\n💸 -${BET} монет`;
        }
        resultEl.textContent = text;

        // Звук результата
        if (result.type === 'jackpot') {
            soundJackpot();
            reelEls.forEach(r => r.classList.add('win'));
        } else if (result.win > 0) {
            soundWin();
            reelEls.forEach(r => r.classList.add('win'));
        } else {
            soundLose();
        }

        updateUI();

        spinning = false;
        btn.disabled = false;
        btn.textContent = `🎰 Крутить (${BET} монет)`;
    }, 2300);
}

updateUI();
