// DOM Elements
const screens = document.querySelectorAll('.screen');
const startBtn = document.getElementById('start-btn');
const rollDiceBtn = document.getElementById('roll-dice-btn');
const diceResult = document.getElementById('dice-result');
const resultLogo = document.getElementById('result-logo');
const resultClub = document.getElementById('result-club');
const resultSeason = document.getElementById('result-season');
const playerSelection = document.getElementById('player-selection');
const playerList = document.getElementById('player-list');
const posHighlight = document.getElementById('pos-highlight');
const progressFill = document.getElementById('progress-fill');
const squadRatingSpan = document.getElementById('squad-rating');
const startSimBtn = document.getElementById('start-sim-btn');
const slots = document.querySelectorAll('.slot');

// Game State
const FORMATIONS = {
    "4-3-3": [
        { id: 'GK', group: 'GK', requiredPos: 'GK', name: 'Bramkarz' },
        { id: 'LB', group: 'DEF', requiredPos: 'LB', name: 'Lewy obrońca' },
        { id: 'CB1', group: 'DEF', requiredPos: 'CB', name: 'Środkowy obrońca' },
        { id: 'CB2', group: 'DEF', requiredPos: 'CB', name: 'Środkowy obrońca' },
        { id: 'RB', group: 'DEF', requiredPos: 'RB', name: 'Prawy obrońca' },
        { id: 'CM1', group: 'MID', requiredPos: 'CM', name: 'Środkowy pomocnik' },
        { id: 'CM2', group: 'MID', requiredPos: 'CM', name: 'Środkowy pomocnik' },
        { id: 'CM3', group: 'MID', requiredPos: 'CM', name: 'Środkowy pomocnik' },
        { id: 'LW', group: 'ATT', requiredPos: 'LW', name: 'Lewy skrzydłowy' },
        { id: 'ST', group: 'ATT', requiredPos: 'ST', name: 'Napastnik' },
        { id: 'RW', group: 'ATT', requiredPos: 'RW', name: 'Prawy skrzydłowy' }
    ],
    "4-4-2": [
        { id: 'GK', group: 'GK', requiredPos: 'GK', name: 'Bramkarz' },
        { id: 'LB', group: 'DEF', requiredPos: 'LB', name: 'Lewy obrońca' },
        { id: 'CB1', group: 'DEF', requiredPos: 'CB', name: 'Środkowy obrońca' },
        { id: 'CB2', group: 'DEF', requiredPos: 'CB', name: 'Środkowy obrońca' },
        { id: 'RB', group: 'DEF', requiredPos: 'RB', name: 'Prawy obrońca' },
        { id: 'LM', group: 'MID', requiredPos: 'LW', name: 'Lewy pomocnik' },
        { id: 'CM1', group: 'MID', requiredPos: 'CM', name: 'Środkowy pomocnik' },
        { id: 'CM2', group: 'MID', requiredPos: 'CM', name: 'Środkowy pomocnik' },
        { id: 'RM', group: 'MID', requiredPos: 'RW', name: 'Prawy pomocnik' },
        { id: 'ST1', group: 'ATT', requiredPos: 'ST', name: 'Napastnik' },
        { id: 'ST2', group: 'ATT', requiredPos: 'ST', name: 'Napastnik' }
    ],
    "3-5-2": [
        { id: 'GK', group: 'GK', requiredPos: 'GK', name: 'Bramkarz' },
        { id: 'CB1', group: 'DEF', requiredPos: 'CB', name: 'Lewy stoper' },
        { id: 'CB2', group: 'DEF', requiredPos: 'CB', name: 'Środkowy stoper' },
        { id: 'CB3', group: 'DEF', requiredPos: 'CB', name: 'Prawy stoper' },
        { id: 'LM', group: 'MID', requiredPos: 'LW', name: 'Lewy wahadłowy' },
        { id: 'CM1', group: 'MID', requiredPos: 'CM', name: 'Środkowy pomocnik' },
        { id: 'CM2', group: 'MID', requiredPos: 'CM', name: 'Środkowy pomocnik' },
        { id: 'CM3', group: 'MID', requiredPos: 'CM', name: 'Środkowy pomocnik' },
        { id: 'RM', group: 'MID', requiredPos: 'RW', name: 'Prawy wahadłowy' },
        { id: 'ST1', group: 'ATT', requiredPos: 'ST', name: 'Napastnik' },
        { id: 'ST2', group: 'ATT', requiredPos: 'ST', name: 'Napastnik' }
    ]
};

let currentFormation = "4-3-3";
let SQUAD_POSITIONS = FORMATIONS[currentFormation];

let currentPosIndex = 0;
let userSquad = [];
let leagueTeams = [];
let matchday = 0;
let schedule = [];
let gameMode = "normal";
let rerollsLeft = 3;
let strictPositions = true;

// Init
startBtn.addEventListener('click', () => {
    currentFormation = document.querySelector('input[name="formation-select"]:checked').value;
    SQUAD_POSITIONS = FORMATIONS[currentFormation];
    gameMode = document.querySelector('input[name="mode-select"]:checked').value;
    rerollsLeft = (gameMode === "normal" || gameMode === "free") ? 3 : 0;
    strictPositions = (gameMode === "normal" || gameMode === "hard");
    
    renderPitch();
    switchScreen('build-screen');
    updateBuildUI();
});

document.getElementById('reroll-btn').addEventListener('click', () => {
    if (rerollsLeft > 0) {
        rerollsLeft--;
        const rerollBtn = document.getElementById('reroll-btn');
        const rerollContainer = document.getElementById('reroll-container');
        rerollBtn.innerText = `REROLL (Pozostało: ${rerollsLeft})`;
        if (rerollsLeft === 0) {
            rerollContainer.classList.add('hidden');
        }
        rollDice();
    }
});

rollDiceBtn.addEventListener('click', rollDice);
startSimBtn.addEventListener('click', initSimulation);
document.getElementById('next-matchday-btn').addEventListener('click', playMatchday);
document.getElementById('sim-rest-btn').addEventListener('click', simRest);
document.getElementById('restart-btn').addEventListener('click', () => location.reload());

function switchScreen(screenId) {
    screens.forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function renderPitch() {
    const pitch = document.getElementById('pitch-formation');
    pitch.innerHTML = '';
    
    // Split positions by group to render rows (ATT top, then MID, then DEF, then GK)
    const atts = SQUAD_POSITIONS.filter(p => p.group === 'ATT');
    const mids = SQUAD_POSITIONS.filter(p => p.group === 'MID');
    const defs = SQUAD_POSITIONS.filter(p => p.group === 'DEF');
    const gks = SQUAD_POSITIONS.filter(p => p.group === 'GK');
    
    const rows = [
        { class: 'att', players: atts },
        { class: 'mid', players: mids },
        { class: 'def', players: defs },
        { class: 'gk', players: gks }
    ];
    
    rows.forEach(r => {
        const rowDiv = document.createElement('div');
        rowDiv.className = `row ${r.class}`;
        r.players.forEach(p => {
            rowDiv.innerHTML += `
                <div class="slot" data-pos="${p.id}">
                    <span class="pos-lbl">${p.id}</span>
                    <div class="card-content"></div>
                </div>
            `;
        });
        pitch.appendChild(rowDiv);
    });
}

function updateBuildUI() {
    if (userSquad.length >= SQUAD_POSITIONS.length) {
        // Squad complete
        rollDiceBtn.classList.add('hidden');
        diceResult.classList.add('hidden');
        playerSelection.classList.add('hidden');
        document.getElementById('current-position-text').innerText = "Skład skompletowany!";
        progressFill.style.width = '100%';
        const rerollContainer = document.getElementById('reroll-container');
        if(rerollContainer) rerollContainer.classList.add('hidden');
        startSimBtn.classList.remove('hidden');
        return;
    }

    if (strictPositions) {
        const currentPos = SQUAD_POSITIONS[currentPosIndex];
        posHighlight.innerText = `${currentPos.name} (${currentPos.id})`;
    } else {
        posHighlight.innerText = `Dowolna pusta pozycja`;
    }
    
    progressFill.style.width = `${(userSquad.length / SQUAD_POSITIONS.length) * 100}%`;
    
    rollDiceBtn.disabled = false;
    diceResult.classList.add('hidden');
    playerSelection.classList.add('hidden');
    
    const rerollBtn = document.getElementById('reroll-btn');
    const rerollContainer = document.getElementById('reroll-container');
    if (rerollsLeft > 0) {
        rerollContainer.classList.remove('hidden');
        rerollBtn.innerText = `REROLL (Pozostało: ${rerollsLeft})`;
    } else {
        rerollContainer.classList.add('hidden');
    }
}

function rollDice() {
    rollDiceBtn.disabled = true;
    rollDiceBtn.innerText = "🎲 LOSOWANIE...";
    
    // Hide old results during reroll
    playerSelection.classList.add('hidden');
    diceResult.classList.add('hidden');
    
    // Simulate dice animation
    setTimeout(() => {
        rollDiceBtn.innerText = "🎲 RZUĆ KOSTKĄ";
        generateOptions();
    }, 800);
}

function generateOptions() {
    let club, season, availablePlayers;
    let attempts = 0;
    
    const emptySlots = SQUAD_POSITIONS.filter(pos => !userSquad.find(s => s.slotId === pos.id));
    const neededPosIds = emptySlots.map(s => s.requiredPos);

    do {
        club = CLUBS[Math.floor(Math.random() * CLUBS.length)];
        const availableSeasons = CLUB_SEASONS[club.id];
        season = availableSeasons[Math.floor(Math.random() * availableSeasons.length)];
        
        if (strictPositions) {
            const currentPos = SQUAD_POSITIONS[currentPosIndex];
            availablePlayers = PLAYERS.filter(p => p.club === club.id && p.season === season && p.pos === currentPos.requiredPos);
        } else {
            availablePlayers = PLAYERS.filter(p => p.club === club.id && p.season === season);
            const fittingPlayers = availablePlayers.filter(p => neededPosIds.includes(p.pos));
            if (fittingPlayers.length === 0) {
                availablePlayers = []; // force loop if no players fit our empty slots
            }
        }
        
        attempts++;
        
        if (strictPositions) {
            const currentPos = SQUAD_POSITIONS[currentPosIndex];
            if(attempts > 10 && availablePlayers.length === 0) {
               availablePlayers = PLAYERS.filter(p => p.club === club.id && p.pos === currentPos.requiredPos);
               if(availablePlayers.length > 0) season = availablePlayers[0].season;
            }
            if(attempts > 20 && availablePlayers.length === 0) {
                availablePlayers = PLAYERS.filter(p => p.pos === currentPos.requiredPos);
                if(availablePlayers.length > 0) {
                    const fp = availablePlayers[0];
                    club = CLUBS.find(c => c.id === fp.club);
                    season = fp.season;
                }
            }
        } else {
            if (attempts > 10 && availablePlayers.length === 0) {
                availablePlayers = PLAYERS.filter(p => neededPosIds.includes(p.pos));
                if (availablePlayers.length > 0) {
                    const fp = availablePlayers[0];
                    club = CLUBS.find(c => c.id === fp.club);
                    season = fp.season;
                    availablePlayers = PLAYERS.filter(p => p.club === club.id && p.season === season);
                }
            }
        }
        
    } while (availablePlayers.length === 0 && attempts <= 20);

    resultLogo.innerText = club.logo;
    resultClub.innerText = club.name;
    resultSeason.innerText = `Sezon ${season}`;
    diceResult.classList.remove('hidden');

    playerList.innerHTML = '';
    
    let uniquePlayers = [];
    availablePlayers.forEach(p => {
        if(!uniquePlayers.find(up => up.name === p.name)) uniquePlayers.push(p);
    });
    
    if (strictPositions) {
        uniquePlayers = uniquePlayers.slice(0, 5);
    } else {
        uniquePlayers.sort((a, b) => b.rating - a.rating);
    }
    
    uniquePlayers.forEach(player => {
        const div = document.createElement('div');
        div.className = 'player-card';
        
        const fits = neededPosIds.includes(player.pos);
        if (!fits && !strictPositions) {
            div.style.opacity = '0.5';
            div.style.cursor = 'not-allowed';
        }
        
        div.innerHTML = `
            <div class="p-info">
                <span class="p-name">${player.name}</span>
                <span class="p-pos">${player.pos}</span>
            </div>
            <span class="p-rating">${player.rating}</span>
        `;
        div.onclick = () => {
            if (strictPositions || fits) {
                selectPlayer(player);
            } else {
                alert("Nie masz już miejsca na pozycję " + player.pos + " w formacji!");
            }
        };
        playerList.appendChild(div);
    });

    playerSelection.classList.remove('hidden');
}

function selectPlayer(player) {
    let targetSlotId = null;

    if (strictPositions) {
        targetSlotId = SQUAD_POSITIONS[currentPosIndex].id;
        currentPosIndex++;
    } else {
        const emptySlot = SQUAD_POSITIONS.find(pos => 
            pos.requiredPos === player.pos && !userSquad.find(s => s.slotId === pos.id)
        );
        if (!emptySlot) return; // safety
        targetSlotId = emptySlot.id;
    }

    userSquad.push({ ...player, slotId: targetSlotId });
    
    // Update UI slot
    const slot = document.querySelector(`.slot[data-pos="${targetSlotId}"]`);
    slot.classList.add('filled');
    slot.querySelector('.card-content').innerHTML = `
        <div class="c-name">${player.name}</div>
        <div class="c-rating">${player.rating}</div>
    `;
    
    updateSquadRating();
    
    playerSelection.classList.add('hidden');
    diceResult.classList.add('hidden');
    
    updateBuildUI();
}

function updateSquadRating() {
    if (userSquad.length === 0) return;
    const sum = userSquad.reduce((acc, p) => acc + p.rating, 0);
    const avg = Math.round(sum / userSquad.length);
    squadRatingSpan.innerText = avg;
}

// SIMULATION LOGIC
function initSimulation() {
    switchScreen('sim-screen');
    
    // Create player team
    const playerTeam = {
        id: 'player_team',
        name: 'Twoja Drużyna',
        isPlayer: true,
        rating: Math.round(userSquad.reduce((a,b)=>a+b.rating,0)/11) || 75,
        pts: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0
    };
    
    leagueTeams.push(playerTeam);
    
    // Generate 17 CPU teams based on real Ekstraklasa 25/26 clubs (excluding one randomly if needed, but we have 18 total)
    // We pick historical versions for CPU
    const cpuClubs = CLUBS.slice(); // Copy
    
    for (let i = 0; i < 17; i++) {
        const club = cpuClubs[i % cpuClubs.length];
        const seasons = CLUB_SEASONS[club.id];
        const s = seasons[Math.floor(Math.random() * seasons.length)];
        
        // Base rating ~65-80
        const rating = Math.floor(Math.random() * 15) + 65;
        
        leagueTeams.push({
            id: `cpu_${i}`,
            name: `${club.name} ${s}`,
            isPlayer: false,
            rating: rating,
            pts: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0
        });
    }
    
    generateSchedule();
    renderTable();
}

function generateSchedule() {
    // Round robin for 18 teams = 34 matchdays
    const n = leagueTeams.length;
    let teams = leagueTeams.map(t => t.id);
    schedule = [];
    
    for (let round = 0; round < n - 1; round++) {
        let matchdayFixtures = [];
        for (let i = 0; i < n / 2; i++) {
            let home = teams[i];
            let away = teams[n - 1 - i];
            
            // Alternate home/away based on round
            if (round % 2 === 1 && i === 0) {
                matchdayFixtures.push({ home: away, away: home });
            } else {
                matchdayFixtures.push({ home: home, away: away });
            }
        }
        schedule.push(matchdayFixtures);
        // Rotate array
        teams.splice(1, 0, teams.pop());
    }
    
    // Second half of season (reverse fixtures)
    let secondHalf = schedule.map(md => md.map(f => ({ home: f.away, away: f.home })));
    schedule = schedule.concat(secondHalf);
}

function playMatchday() {
    if (matchday >= 34) return;
    
    const fixtures = schedule[matchday];
    const resultsDiv = document.getElementById('match-results');
    resultsDiv.innerHTML = '';
    
    fixtures.forEach(fix => {
        const t1 = leagueTeams.find(t => t.id === fix.home);
        const t2 = leagueTeams.find(t => t.id === fix.away);
        
        // Simulate match
        const result = simMatch(t1, t2);
        
        // Update stats
        updateStats(t1, t2, result.g1, result.g2);
        
        // Render result
        const div = document.createElement('div');
        div.className = `match-result ${t1.isPlayer || t2.isPlayer ? 'player-match' : ''}`;
        div.innerHTML = `
            <span>${t1.name}</span>
            <span class="score">${result.g1} : ${result.g2}</span>
            <span>${t2.name}</span>
        `;
        resultsDiv.appendChild(div);
    });
    
    matchday++;
    document.getElementById('matchday').innerText = matchday;
    renderTable();
    
    if (matchday >= 34) {
        document.getElementById('next-matchday-btn').disabled = true;
        document.getElementById('sim-rest-btn').innerText = "PODSUMOWANIE";
        document.getElementById('sim-rest-btn').onclick = showEndScreen;
    }
}

function simRest() {
    while(matchday < 34) {
        playMatchday();
    }
}

function simMatch(t1, t2) {
    const diff = t1.rating - t2.rating;
    
    // Simple poisson approx
    const lambda1 = Math.max(0.2, 1.2 + (diff * 0.05));
    const lambda2 = Math.max(0.2, 1.0 - (diff * 0.05));
    
    const g1 = getPoisson(lambda1);
    const g2 = getPoisson(lambda2);
    
    return { g1, g2 };
}

function getPoisson(lambda) {
    let L = Math.exp(-lambda);
    let p = 1.0;
    let k = 0;
    do {
        k++;
        p *= Math.random();
    } while (p > L);
    return k - 1;
}

function updateStats(t1, t2, g1, g2) {
    t1.gf += g1; t1.ga += g2;
    t2.gf += g2; t2.ga += g1;
    
    if (g1 > g2) {
        t1.pts += 3; t1.w++; t2.l++;
    } else if (g1 < g2) {
        t2.pts += 3; t2.w++; t1.l++;
    } else {
        t1.pts += 1; t2.pts += 1;
        t1.d++; t2.d++;
    }
}

function renderTable() {
    const tbody = document.querySelector('#league-table tbody');
    tbody.innerHTML = '';
    
    // Sort table
    leagueTeams.sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        const diffA = a.gf - a.ga;
        const diffB = b.gf - b.ga;
        if (diffB !== diffA) return diffB - diffA;
        return b.gf - a.gf;
    });
    
    leagueTeams.forEach((t, i) => {
        const tr = document.createElement('tr');
        if (t.isPlayer) tr.className = 'player-team';
        
        tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${t.name}</td>
            <td>${matchday}</td>
            <td><strong>${t.pts}</strong></td>
            <td>${t.w}</td>
            <td>${t.d}</td>
            <td>${t.l}</td>
            <td>${t.gf}</td>
            <td>${t.ga}</td>
        `;
        tbody.appendChild(tr);
    });
}

function showEndScreen() {
    const playerTeamPos = leagueTeams.findIndex(t => t.isPlayer) + 1;
    document.getElementById('final-position').innerText = `Zająłeś ${playerTeamPos}. miejsce!`;
    switchScreen('end-screen');
}
