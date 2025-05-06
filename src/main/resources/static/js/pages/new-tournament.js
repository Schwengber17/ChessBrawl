// Elementos DOM
const tournamentForm = document.getElementById('tournament-form');
const tournamentNameInput = document.getElementById('tournament-name');
const playerSearchInput = document.getElementById('player-search');
const searchPlayerBtn = document.getElementById('search-player-btn');
const playerSearchResults = document.getElementById('player-search-results');
const selectedPlayersContainer = document.getElementById('selected-players');
const selectedCountElement = document.getElementById('selected-count');
const createTournamentBtn = document.getElementById('create-tournament-btn');
const activeTournamentWarning = document.getElementById('active-tournament-warning');
const viewActiveTournamentBtn = document.getElementById('view-active-tournament');

// Templates
const playerResultTemplate = document.getElementById('player-result-template');
const selectedPlayerTemplate = document.getElementById('selected-player-template');

// Estado da aplicação
let selectedPlayers = [];
let activeTournament = null;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se já existe um torneio ativo
    checkActiveTournament();
    
    // Configurar eventos
    searchPlayerBtn.addEventListener('click', searchPlayer);
    playerSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchPlayer();
        }
    });
    
    tournamentForm.addEventListener('submit', createTournament);
});

// Verificar se existe um torneio ativo
async function checkActiveTournament() {
    try {
        const tournaments = await TournamentAPI.getAll();
        activeTournament = tournaments.find(t => t.status === 'IN_PROGRESS');
        
        if (activeTournament) {
            // Mostrar aviso e desabilitar formulário
            activeTournamentWarning.style.display = 'flex';
            tournamentForm.style.display = 'none';
            
            // Configurar botão para ver torneio ativo
            viewActiveTournamentBtn.href = `tournament-detail.html?id=${activeTournament.id}`;
        }
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Buscar jogador por nickname
async function searchPlayer() {
    const nickname = playerSearchInput.value.trim();
    
    if (!nickname) {
        showNotification('Digite um nickname para buscar', 'warning');
        return;
    }
    
    try {
        // Limpar resultados anteriores
        playerSearchResults.innerHTML = '';
        
        // Buscar jogador na API
        const player = await PlayerAPI.getByNickname(nickname).catch(() => null);
        
        if (!player) {
            playerSearchResults.innerHTML = `
                <div class="empty-search">
                    <p>Nenhum jogador encontrado com o nickname "${nickname}"</p>
                </div>
            `;
            return;
        }
        
        // Verificar se o jogador já está selecionado
        if (selectedPlayers.some(p => p.id === player.id)) {
            playerSearchResults.innerHTML = `
                <div class="empty-search">
                    <p>O jogador "${nickname}" já está selecionado</p>
                </div>
            `;
            return;
        }
        
        // Criar elemento de resultado
        const resultElement = playerResultTemplate.content.cloneNode(true);
        
        // Preencher dados
        resultElement.querySelector('.player-nickname').textContent = player.nickname;
        resultElement.querySelector('.player-name').textContent = player.name;
        resultElement.querySelector('.rating-value').textContent = player.rankingPoints;
        
        // Configurar botão de adicionar
        const addButton = resultElement.querySelector('.add-player');
        addButton.addEventListener('click', () => addPlayer(player));
        
        // Adicionar ao container
        playerSearchResults.appendChild(resultElement);
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Adicionar jogador à seleção
function addPlayer(player) {
    // Adicionar ao array
    selectedPlayers.push(player);
    
    // Atualizar contador
    updateSelectedCount();
    
    // Limpar resultados da busca
    playerSearchResults.innerHTML = '';
    playerSearchInput.value = '';
    
    // Renderizar jogadores selecionados
    renderSelectedPlayers();
}

// Remover jogador da seleção
function removePlayer(playerId) {
    // Remover do array
    selectedPlayers = selectedPlayers.filter(p => p.id !== playerId);
    
    // Atualizar contador
    updateSelectedCount();
    
    // Renderizar jogadores selecionados
    renderSelectedPlayers();
}

// Renderizar jogadores selecionados
function renderSelectedPlayers() {
    // Limpar container
    selectedPlayersContainer.innerHTML = '';
    
    if (selectedPlayers.length === 0) {
        selectedPlayersContainer.innerHTML = `
            <div class="empty-selection">
                <i class="fas fa-users"></i>
                <p>Nenhum jogador selecionado</p>
            </div>
        `;
        return;
    }
    
    // Criar elemento para cada jogador
    selectedPlayers.forEach(player => {
        const playerElement = selectedPlayerTemplate.content.cloneNode(true);
        
        // Preencher dados
        playerElement.querySelector('.player-nickname').textContent = player.nickname;
        playerElement.querySelector('.player-name').textContent = player.name;
        playerElement.querySelector('.rating-value').textContent = player.rankingPoints;
        
        // Configurar botão de remover
        const removeButton = playerElement.querySelector('.remove-player');
        removeButton.addEventListener('click', () => removePlayer(player.id));
        
        // Adicionar ao container
        selectedPlayersContainer.appendChild(playerElement);
    });
}

// Atualizar contador de jogadores selecionados
function updateSelectedCount() {
    selectedCountElement.textContent = selectedPlayers.length;
    
    // Habilitar/desabilitar botão de criar torneio
    const isValidCount = selectedPlayers.length >= 4 && 
                         selectedPlayers.length <= 8 && 
                         selectedPlayers.length % 2 === 0;
    
    createTournamentBtn.disabled = !isValidCount;
}

// Criar torneio
async function createTournament(e) {
    e.preventDefault();
    
    // Validar formulário
    const tournamentName = tournamentNameInput.value.trim();
    
    if (!tournamentName) {
        showNotification('Digite um nome para o torneio', 'error');
        return;
    }
    
    if (selectedPlayers.length < 4 || selectedPlayers.length > 8 || selectedPlayers.length % 2 !== 0) {
        showNotification('Selecione entre 4 e 8 jogadores (número par)', 'error');
        return;
    }
    
    try {
        // Preparar dados
        const tournamentData = {
            name: tournamentName,
            playerIds: selectedPlayers.map(p => p.id)
        };
        
        // Enviar para API
        const tournament = await TournamentAPI.create(tournamentData);
        
        // Mostrar notificação de sucesso
        showNotification('Torneio criado com sucesso!', 'success');
        
        // Redirecionar para página de detalhes
        setTimeout(() => {
            window.location.href = `tournament-detail.html?id=${tournament.id}`;
        }, 1500);
    } catch (error) {
        showNotification(error.message, 'error');
    }
}