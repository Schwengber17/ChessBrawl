// Elementos DOM
const playerLoading = document.getElementById('player-loading');
const playerContent = document.getElementById('player-content');
const playerNickname = document.getElementById('player-nickname');
const playerName = document.getElementById('player-name');
const playerRatingValue = document.getElementById('player-rating-value');
const originalMoves = document.getElementById('original-moves');
const advantagousPositions = document.getElementById('advantagous-positions');
const blunders = document.getElementById('blunders');
const disrespectfulBehavior = document.getElementById('disrespectful-behavior');
const rageAttacks = document.getElementById('rage-attacks');
const eventsContainer = document.getElementById('events-container');

// Templates
const eventTemplate = document.getElementById('event-template');

// Estado da aplicação
let player = null;
let events = [];

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Obter ID do jogador da URL
    const params = getUrlParams();
    const playerId = params.id;
    
    if (!playerId) {
        showNotification('ID do jogador não especificado', 'error');
        setTimeout(() => {
            window.location.href = 'players.html';
        }, 2000);
        return;
    }
    
    // Carregar dados do jogador
    loadPlayerData(playerId);
});

// Carregar dados do jogador
async function loadPlayerData(playerId) {
    try {
        showLoading(true);
        
        // Carregar jogador
        player = await PlayerAPI.getById(playerId);
        
        // Carregar eventos
        events = await fetch(`/api/matches/events/player/${playerId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao carregar eventos do jogador');
                }
                return response.json();
            })
            .catch(() => []);
        
        // Renderizar dados
        renderPlayerData();
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Renderizar dados do jogador
function renderPlayerData() {
    // Atualizar informações básicas
    playerNickname.textContent = player.nickname;
    playerName.textContent = player.name;
    playerRatingValue.textContent = player.rankingPoints;
    
    // Atualizar estatísticas
    originalMoves.textContent = player.originalMoves || 0;
    advantagousPositions.textContent = player.advantagousPositions || 0;
    blunders.textContent = player.blunders || 0;
    disrespectfulBehavior.textContent = player.disrespectfulBehavior || 0;
    rageAttacks.textContent = player.rageAttacks || 0;
    
    // Renderizar eventos
    renderEvents();
}

// Renderizar eventos
function renderEvents() {
    // Limpar container
    eventsContainer.innerHTML = '';
    
    if (events.length === 0) {
        eventsContainer.innerHTML = `
            <div class="empty-state">
                <p>Nenhum evento registrado para este jogador.</p>
            </div>
        `;
        return;
    }
    
    // Ordenar eventos por data (mais recentes primeiro)
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Criar elemento para cada evento
    events.forEach(event => {
        const eventElement = eventTemplate.content.cloneNode(true);
        
        // Preencher dados
        const eventIcon = eventElement.querySelector('.event-icon');
        eventIcon.innerHTML = getEventIcon(event.eventType);
        eventIcon.className = `event-icon ${getEventClass(event.eventType)}`;
        
        eventElement.querySelector('.event-type').textContent = getEventTypeText(event.eventType);
        
        const pointsElement = eventElement.querySelector('.event-points');
        pointsElement.textContent = event.pointsChange > 0 ? `+${event.pointsChange}` : event.pointsChange;
        pointsElement.className = `event-points ${event.pointsChange > 0 ? 'positive' : 'negative'}`;
        
        eventElement.querySelector('.event-description').textContent = event.description;
        eventElement.querySelector('.event-match').textContent = `Partida #${event.matchId}`;
        eventElement.querySelector('.event-time').textContent = formatDate(event.timestamp);
        
        // Adicionar ao container
        eventsContainer.appendChild(eventElement);
    });
}

// Utilitários
function showLoading(isLoading) {
    if (isLoading) {
        playerLoading.style.display = 'flex';
        playerContent.style.display = 'none';
    } else {
        playerLoading.style.display = 'none';
        playerContent.style.display = 'block';
    }
}

function getEventTypeText(type) {
    switch (type) {
        case 'ORIGINAL_MOVE': return 'Movimento Original';
        case 'ADVANTAGOUS_POSITION': return 'Posição Vantajosa';
        case 'BLUNDER': return 'Blunder (Erro Grave)';
        case 'DISRESPECTFUL_BEHAVIOR': return 'Comportamento Desrespeitoso';
        case 'RAGE_ATTACK': return 'Ataque de Raiva';
        default: return type;
    }
}

function getEventIcon(type) {
    switch (type) {
        case 'ORIGINAL_MOVE': return '<i class="fas fa-lightbulb"></i>';
        case 'ADVANTAGOUS_POSITION': return '<i class="fas fa-chess-queen"></i>';
        case 'BLUNDER': return '<i class="fas fa-times-circle"></i>';
        case 'DISRESPECTFUL_BEHAVIOR': return '<i class="fas fa-angry"></i>';
        case 'RAGE_ATTACK': return '<i class="fas fa-fire"></i>';
        default: return '<i class="fas fa-question"></i>';
    }
}

function getEventClass(type) {
    switch (type) {
        case 'ORIGINAL_MOVE': return 'original-move';
        case 'ADVANTAGOUS_POSITION': return 'advantagous-position';
        case 'BLUNDER': return 'blunder';
        case 'DISRESPECTFUL_BEHAVIOR': return 'disrespectful-behavior';
        case 'RAGE_ATTACK': return 'rage-attack';
        default: return '';
    }
}