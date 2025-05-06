// Elementos DOM
const matchLoading = document.getElementById('match-loading');
const matchContent = document.getElementById('match-content');
const player1Nickname = document.getElementById('player1-nickname');
const player1Name = document.getElementById('player1-name');
const player2Nickname = document.getElementById('player2-nickname');
const player2Name = document.getElementById('player2-name');
const matchStatus = document.getElementById('match-status');
//const matchDate = document.getElementById('match-date');
const matchRound = document.getElementById('match-round');
const startMatchBtn = document.getElementById('start-match-btn');
const finishMatchBtn = document.getElementById('finish-match-btn');
const eventsSection = document.getElementById('events-section');
const eventsContainer = document.getElementById('events-container');
const registerEventSection = document.getElementById('register-event-section');
const eventForm = document.getElementById('event-form');
const eventPlayer = document.getElementById('event-player');
const finishMatchSection = document.getElementById('finish-match-section');
const finishForm = document.getElementById('finish-form');
const matchResult = document.getElementById('match-result');
const winnerContainer = document.getElementById('winner-container');
const matchWinner = document.getElementById('match-winner');
const backBtn = document.getElementById('back-btn');

const eventTemplate = document.getElementById('event-template');

let match = null;
let events = [];
let round = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('window.location.search:', window.location.search);
    const params = new URLSearchParams(window.location.search);
    const matchId = params.get('id'); // ID da partida
    

    if (!matchId || !tournamentId || !roundId) {
        showNotification('Parâmetros da URL estão incompletos ou ausentes', 'error');
        return;
    }

    loadMatchData(tournamentId, roundId, matchId);

    startMatchBtn.addEventListener('click', () => startMatch(tournamentId, roundId, matchId));
    finishMatchBtn.addEventListener('click', () => showFinishSection());
    eventForm.addEventListener('submit', (e) => registerEvent(e, tournamentId, roundId, matchId));
    finishForm.addEventListener('submit', (e) => finishMatch(e, tournamentId, roundId, matchId));
    matchResult.addEventListener('change', toggleWinnerSelect);
    backBtn.addEventListener('click', goBack);
});
async function loadMatchData(tournamentId, roundId, matchId) {
    try {
        showLoading(true);
        console.log('Carregando dados da partida...');

        const match = await fetchAPI(`/tournaments/${tournamentId}/rounds/${roundId}/matches/${matchId}`);
        console.log('Dados da partida:', match);

        const tournamentId = match.tournamentId;
        const roundId = match.roundId;

        renderMatchData(match);
    } catch (error) {
        console.error('Erro ao carregar dados da partida:', error);
        showNotification(error.message, 'error');
    } finally {
        showLoading(false);
    }
}


function renderMatchData() {
    player1Nickname.textContent = match.player1Nickname;
    player1Name.textContent = match.player1Name;
    player2Nickname.textContent = match.player2Nickname;
    player2Name.textContent = match.player2Name;
    
    matchStatus.textContent = getStatusText(match.status);
    matchStatus.className = `status-badge status-${match.status.toLowerCase()}`;
    
    if (round) {
        matchRound.textContent = `Rodada ${round.length || '?'}`;
    }else {
        matchRound.textContent = 'Rodada não encontrada';
    }
    
    if (match.winnerId) {
        const winnerNickname = match.winnerId === match.player1Id ? match.player1Nickname : match.player2Nickname;
        matchWinner.textContent = `Vencedor: ${winnerNickname}`;
    } else {
        matchWinner.textContent = 'Vencedor: Não definido';
    }

    if (match.status === 'PENDING') {
        startMatchBtn.style.display = 'block';
    } else if (match.status === 'IN_PROGRESS') {
        finishMatchBtn.style.display = 'block';
        registerEventSection.style.display = 'block';
        
        // Preencher select de jogadores
        eventPlayer.innerHTML = `
            <option value="">Selecione um jogador</option>
            <option value="${match.player1Id}">${match.player1Nickname}</option>
            <option value="${match.player2Id}">${match.player2Nickname}</option>
        `;
    }
    
    // Mostrar eventos se houver
    if (events.length > 0) {
        eventsSection.style.display = 'block';
        renderEvents();
    } else if (match.status === 'IN_PROGRESS') {
        eventsSection.style.display = 'block';
    }
}

// Renderizar eventos
function renderEvents() {
    eventsContainer.innerHTML = '';
    if (events.length === 0) {
        eventsContainer.innerHTML = `
            <div class="empty-state">
                <p>Nenhum evento registrado para esta partida.</p>
            </div>
        `;
        return;
    }
    
    events.forEach(event => {
        const eventElement = eventTemplate.content.cloneNode(true);
        
        const eventIcon = eventElement.querySelector('.event-icon');
        eventIcon.innerHTML = getEventIcon(event.eventType);
        eventIcon.className = `event-icon ${getEventClass(event.eventType)}`;
        
        eventElement.querySelector('.event-type').textContent = getEventTypeText(event.eventType);
        
        const pointsElement = eventElement.querySelector('.event-points');
        pointsElement.textContent = event.pointsChange > 0 ? `+${event.pointsChange}` : event.pointsChange;
        pointsElement.className = `event-points ${event.pointsChange > 0 ? 'positive' : 'negative'}`;
        
        eventElement.querySelector('.event-player').textContent = event.playerId;
        
        eventsContainer.appendChild(eventElement);
    });
}

async function startMatch(tournamentId, roundId, matchId) {
    try {
        if (!confirm('Tem certeza que deseja iniciar a partida?')) {
            return;
        }

        await MatchAPI.start(tournamentId, roundId, matchId);
        showNotification('Partida iniciada com sucesso!', 'success');
        loadMatchData(tournamentId, roundId, matchId);
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

function showFinishSection() {
    finishMatchSection.style.display = 'block';
    
    matchWinner.innerHTML = `
        <option value="">Selecione o vencedor</option>
        <option value="${match.player1Id}">${match.player1Nickname}</option>
        <option value="${match.player2Id}">${match.player2Nickname}</option>
    `;
    
    finishMatchSection.scrollIntoView({ behavior: 'smooth' });
}

function toggleWinnerSelect() {
    const result = matchResult.value;
    
    if (result === 'WIN') {
        winnerContainer.style.display = 'block';
        matchWinner.required = true;
    } else {
        winnerContainer.style.display = 'none';
        matchWinner.required = false;
    }
}

async function registerEvent(e, matchId) {
    e.preventDefault();
    
    const eventType = document.getElementById('event-type').value;
    const playerId = document.getElementById('event-player').value;
    
    if (!eventType || !playerId) {
        showNotification('Preencha todos os campos', 'error');
        return;
    }
    
    try {
        const eventData = {
            matchId: matchId,
            playerId: parseInt(playerId),
            eventType: eventType,
        };
        
        await MatchAPI.registerEvent(matchId, eventData);
        
        eventForm.reset();
        
        showNotification('Evento registrado com sucesso!', 'success');
        loadMatchData(matchId);
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function finishMatch(e, matchId) {
    e.preventDefault();
    
    // Obter dados do formulário
    const result = matchResult.value;
    const winnerId = result === 'WIN' ? parseInt(matchWinner.value) : null;
    
    if (!result || (result === 'WIN' && !winnerId)) {
        showNotification('Preencha todos os campos', 'error');
        return;
    }
    
    try {
        if (!confirm('Tem certeza que deseja finalizar a partida?')) {
            return;
        }
        
        const resultData = {
            result: result,
            winnerId: winnerId
        };
        
        await MatchAPI.finish(matchId, resultData);
        
        showNotification('Partida finalizada com sucesso!', 'success');
        loadMatchData(matchId);
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Voltar para a página anterior
function goBack() {
    if (document.referrer.includes('tournament-detail.html')) {
        window.history.back();
    } else {
        window.location.href = 'tournaments.html';
    }
}

// Utilitários
function showLoading(isLoading) {
    if (isLoading) {
        matchLoading.style.display = 'flex';
        matchContent.style.display = 'none';
    } else {
        matchLoading.style.display = 'none';
        matchContent.style.display = 'block';
    }
}

function getStatusText(status) {
    switch (status) {
        case 'PENDING': return 'Pendente';
        case 'IN_PROGRESS': return 'Em Andamento';
        case 'FINISHED': return 'Finalizada';
        default: return status;
    }
}

function getEventTypeText(type) {
    switch (type) {
        case 'ORIGINAL_MOVE': return 'Movimento Original';
        case 'ADVANTAGOUS_POSITION': return 'Posição Vantajosa';
        case 'BLUNDER': return 'Blunder (Erro Grave)';
        case 'DISRESPECT': return 'Comportamento Desrespeitoso';
        case 'RAGE_ATTACK': return 'Ataque de Raiva';
        default: return type;
    }
}

function getEventIcon(type) {
    switch (type) {
        case 'ORIGINAL_MOVE': return '<i class="fas fa-lightbulb"></i>';
        case 'ADVANTAGOUS_POSITION': return '<i class="fas fa-chess-queen"></i>';
        case 'BLUNDER': return '<i class="fas fa-times-circle"></i>';
        case 'DISRESPECT': return '<i class="fas fa-angry"></i>';
        case 'RAGE_ATTACK': return '<i class="fas fa-fire"></i>';
        default: return '<i class="fas fa-question"></i>';
    }
}

function getEventClass(type) {
    switch (type) {
        case 'ORIGINAL_MOVE': return 'original-move';
        case 'ADVANTAGOUS_POSITION': return 'advantagous-position';
        case 'BLUNDER': return 'blunder';
        case 'DISRESPECT': return 'disrepect';
        case 'RAGE_ATTACK': return 'rage-attack';
        default: return '';
    }
}