/* =====================================================
   MEMORIA — Memory Matching Game
   jQuery game logic
   
   Architecture:
   - Game state lives in a plain `state` object
   - All DOM ops go through jQuery helpers
   - Timer managed with setInterval
   - Score formula: base points - move penalty - time penalty
===================================================== */

$(document).ready(function () {

  /* -----------------------------------------------
     1. EMOJI SYMBOL POOLS
     Each difficulty pulls from a sized slice.
     We need (gridSize²/2) unique symbols.
  ----------------------------------------------- */
  const SYMBOLS = [
    '🦊','🐉','🌵','🎸','🔮','🍄','🦋','🌙',
    '🎯','🚀','🌊','🎪','🦄','⚡','🍕','🎭',
    '🌺','🎲','🏆','🦁','🐙','🎨','🌈','🔥',
    '🍦','🦚','🎠','🌍','🧩','🎻','🐬','🌟'
  ];

  /* -----------------------------------------------
     2. GAME STATE
     Single source of truth — reset on every new game.
  ----------------------------------------------- */
  let state = {
    gridSize:      4,       // cards per row/column
    cards:         [],      // array of { id, symbol, matched }
    flipped:       [],      // indices of currently face-up unmatched cards (max 2)
    matchedCount:  0,       // how many pairs found
    moves:         0,       // number of attempts (each pair = 1 move)
    locked:        false,   // prevent clicks during mismatch delay
    timerID:       null,    // setInterval reference
    seconds:       0,       // elapsed seconds
    started:       false    // has the player clicked the first card?
  };

  /* -----------------------------------------------
     3. UTILITY — Fisher-Yates shuffle
  ----------------------------------------------- */
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* -----------------------------------------------
     4. SCORE FORMULA
     Base score depends on grid size.
     Deduct 3 pts per extra move, 1 pt per second.
  ----------------------------------------------- */
  function calcScore() {
    const pairs       = (state.gridSize * state.gridSize) / 2;
    const baseScore   = pairs * 100;
    const movePenalty = Math.max(0, state.moves - pairs) * 3;
    const timePenalty = state.seconds;
    return Math.max(0, baseScore - movePenalty - timePenalty);
  }

  /* -----------------------------------------------
     5. TIMER HELPERS
  ----------------------------------------------- */
  function startTimer() {
    state.timerID = setInterval(function () {
      state.seconds++;
      const m = Math.floor(state.seconds / 60);
      const s = state.seconds % 60;
      $('#timer').text(m + ':' + String(s).padStart(2, '0'));
    }, 1000);
  }

  function stopTimer() {
    clearInterval(state.timerID);
    state.timerID = null;
  }

  /* -----------------------------------------------
     6. BUMP ANIMATION — briefly scale up a stat
  ----------------------------------------------- */
  function bump(selector) {
    $(selector).addClass('bump');
    setTimeout(() => $(selector).removeClass('bump'), 200);
  }

  /* -----------------------------------------------
     7. BUILD CARD DECK
     Creates pairs, shuffles, stores in state.cards
  ----------------------------------------------- */
  function buildDeck() {
    const pairCount = (state.gridSize * state.gridSize) / 2;
    const symbols   = shuffle(SYMBOLS).slice(0, pairCount);

    // Duplicate each symbol to form a pair, then shuffle the full deck
    state.cards = shuffle([...symbols, ...symbols]).map((sym, idx) => ({
      id:      idx,
      symbol:  sym,
      matched: false
    }));
  }

  /* -----------------------------------------------
     8. RENDER BOARD
     Clears and recreates all card elements in jQuery.
  ----------------------------------------------- */
  function renderBoard() {
    const $board = $('#game-board');
    $board.empty();

    // Set CSS grid columns
    $board.css('grid-template-columns', `repeat(${state.gridSize}, auto)`);

    // Create one .card element per card in state
    state.cards.forEach(function (card) {
      const $card = $(`
        <div class="card" data-id="${card.id}">
          <div class="card-inner">
            <div class="card-face card-back"></div>
            <div class="card-face card-front">${card.symbol}</div>
          </div>
        </div>
      `);
      $board.append($card);
    });
  }

  /* -----------------------------------------------
     9. INIT GAME
     Full reset: state, board, UI counters.
  ----------------------------------------------- */
  function initGame() {
    // Stop any running timer
    stopTimer();

    // Reset state fields (keep gridSize as chosen)
    state.flipped      = [];
    state.matchedCount = 0;
    state.moves        = 0;
    state.locked       = false;
    state.seconds      = 0;
    state.started      = false;

    // Reset UI counters
    $('#move-count').text('0');
    $('#timer').text('0:00');
    $('#score').text('0');

    // Build + render
    buildDeck();
    renderBoard();

    // Hide modal if visible
    $('#win-modal').fadeOut(150);
  }

  /* -----------------------------------------------
     10. CARD CLICK HANDLER
     Core game loop: flip → compare → match or reset.
  ----------------------------------------------- */
  $(document).on('click', '.card', function () {
    const $card   = $(this);
    const cardId  = parseInt($card.data('id'));
    const card    = state.cards[cardId];

    // Guard: ignore if locked, already matched, or already flipped
    if (state.locked)          return;
    if (card.matched)          return;
    if (state.flipped.includes(cardId)) return;

    // -- Start timer on first click
    if (!state.started) {
      state.started = true;
      startTimer();
    }

    // -- Flip this card face-up
    sfxFlip();
    $card.addClass('flipped');
    state.flipped.push(cardId);

    // -- Only evaluate when 2 cards are flipped
    if (state.flipped.length < 2) return;

    // Increment move counter
    state.moves++;
    $('#move-count').text(state.moves);
    bump('#move-count');

    // Lock board while we evaluate
    state.locked = true;

    const [idA, idB]   = state.flipped;
    const cardA        = state.cards[idA];
    const cardB        = state.cards[idB];
    const $cardA       = $(`.card[data-id="${idA}"]`);
    const $cardB       = $(`.card[data-id="${idB}"]`);

    if (cardA.symbol === cardB.symbol) {
      /* ---- MATCH ---- */
      cardA.matched = true;
      cardB.matched = true;
      state.matchedCount++;

      // Add matched class (keeps them face-up, adds glow)
      setTimeout(function () {
        $cardA.addClass('matched');
        $cardB.addClass('matched');
        sfxMatch();

        // Update score live
        $('#score').text(calcScore());
        bump('#score');

        state.flipped = [];
        state.locked  = false;

        // Check for win condition
        const totalPairs = (state.gridSize * state.gridSize) / 2;
        if (state.matchedCount === totalPairs) {
          stopTimer();
          setTimeout(sfxWin, 100); // slight delay so match chime finishes first
          showWinModal();
        }
      }, 400);

    } else {
      /* ---- MISMATCH ---- */
      // Flash red on both cards before flipping back
      sfxWrong();
      $cardA.addClass('wrong');
      $cardB.addClass('wrong');

      setTimeout(function () {
        $cardA.removeClass('flipped wrong');
        $cardB.removeClass('flipped wrong');
        state.flipped = [];
        state.locked  = false;
      }, 900); // slight delay so player sees both cards
    }
  });

  /* -----------------------------------------------
     11. WIN MODAL
  ----------------------------------------------- */
  function showWinModal() {
    const m = Math.floor(state.seconds / 60);
    const s = state.seconds % 60;

    $('#modal-moves').text(state.moves);
    $('#modal-time').text(m + ':' + String(s).padStart(2, '0'));
    $('#modal-score').text(calcScore());

    $('#win-modal').fadeIn(300);
  }

  /* -----------------------------------------------
     12. DIFFICULTY BUTTONS
  ----------------------------------------------- */
  $('.diff-btn').on('click', function () {
    $('.diff-btn').removeClass('active');
    $(this).addClass('active');
    state.gridSize = parseInt($(this).data('size'));
    initGame();
  });

  /* -----------------------------------------------
     13. RESTART BUTTON
  ----------------------------------------------- */
  $('#restart-btn').on('click', function () {
    initGame();
  });

  /* -----------------------------------------------
     14. MODAL PLAY-AGAIN BUTTON
  ----------------------------------------------- */
  $('#modal-play-again').on('click', function () {
    initGame();
  });

  /* -----------------------------------------------
     15. KICK-OFF — start with default 4×4 Easy game
  ----------------------------------------------- */
  initGame();

  /* -----------------------------------------------
     SOUND ENGINE  (Web Audio API — no external files)
     
     All sounds are synthesized on-the-fly:
       • flip   : short soft click (sine blip)
       • match  : ascending two-note chime (sine + triangle)
       • wrong  : descending dissonant buzz (sawtooth)
       • win    : celebratory 5-note arpeggio (sine)
     
     AudioContext is created lazily on first interaction
     to satisfy browser autoplay policies.
  ----------------------------------------------- */

  let audioCtx = null;
  let soundMuted = false;

  // Lazily create AudioContext on first user gesture
  function getCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  /**
   * playTone(config)
   * Low-level helper — plays one oscillator burst.
   * @param {object} cfg
   *   freq      {number}  - frequency in Hz
   *   type      {string}  - oscillator type (sine/square/sawtooth/triangle)
   *   startTime {number}  - AudioContext time to begin (ctx.currentTime + offset)
   *   duration  {number}  - seconds the note plays
   *   gainPeak  {number}  - peak volume 0–1
   *   fadeIn    {number}  - attack seconds
   *   fadeOut   {number}  - release seconds
   */
  function playTone({ freq, type = 'sine', startTime, duration = 0.15, gainPeak = 0.35, fadeIn = 0.005, fadeOut = 0.08 }) {
    if (soundMuted) return;
    const ctx = getCtx();

    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type      = type;
    osc.frequency.setValueAtTime(freq, startTime);

    // Envelope: ramp up then ramp down
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(gainPeak, startTime + fadeIn);
    gain.gain.setValueAtTime(gainPeak, startTime + duration - fadeOut);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }

  /* -- Individual sound events -- */

  // Card flip: a soft high tick
  function sfxFlip() {
    const ctx  = getCtx();
    const now  = ctx.currentTime;
    playTone({ freq: 900,  type: 'sine',     startTime: now, duration: 0.07, gainPeak: 0.18, fadeIn: 0.002, fadeOut: 0.05 });
    playTone({ freq: 1200, type: 'triangle', startTime: now, duration: 0.05, gainPeak: 0.08, fadeIn: 0.002, fadeOut: 0.04 });
  }

  // Match: ascending major-third chime (C5 → E5)
  function sfxMatch() {
    const ctx  = getCtx();
    const now  = ctx.currentTime;
    playTone({ freq: 523.25, type: 'sine',     startTime: now,        duration: 0.18, gainPeak: 0.4, fadeOut: 0.12 });
    playTone({ freq: 659.25, type: 'triangle', startTime: now + 0.12, duration: 0.25, gainPeak: 0.3, fadeOut: 0.18 });
  }

  // Wrong: two descending dissonant notes
  function sfxWrong() {
    const ctx  = getCtx();
    const now  = ctx.currentTime;
    playTone({ freq: 260, type: 'sawtooth', startTime: now,        duration: 0.12, gainPeak: 0.25, fadeOut: 0.08 });
    playTone({ freq: 220, type: 'sawtooth', startTime: now + 0.10, duration: 0.18, gainPeak: 0.2,  fadeOut: 0.12 });
  }

  // Win: celebratory 5-note ascending arpeggio (C5 D E G A)
  function sfxWin() {
    const ctx    = getCtx();
    const now    = ctx.currentTime;
    const notes  = [523.25, 587.33, 659.25, 783.99, 880.00];
    const gap    = 0.13;
    notes.forEach(function (freq, i) {
      playTone({ freq, type: 'sine', startTime: now + i * gap, duration: 0.3, gainPeak: 0.35, fadeOut: 0.2 });
    });
    // Sparkle layer on top
    notes.forEach(function (freq, i) {
      playTone({ freq: freq * 2, type: 'triangle', startTime: now + i * gap + 0.02, duration: 0.15, gainPeak: 0.12, fadeOut: 0.1 });
    });
  }

  /* -----------------------------------------------
     MUTE TOGGLE BUTTON
  ----------------------------------------------- */
  $('#mute-btn').on('click', function () {
    soundMuted = !soundMuted;
    if (soundMuted) {
      $(this).text('🔇 Muted').addClass('muted');
    } else {
      $(this).text('🔊 Sound').removeClass('muted');
      // Play a tiny test beep so user confirms sound is back
      const ctx = getCtx();
      playTone({ freq: 660, type: 'sine', startTime: ctx.currentTime, duration: 0.08, gainPeak: 0.2 });
    }
  });

}); // end document.ready
