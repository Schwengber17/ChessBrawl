// Elementos DOM
const tournamentsContainer = document.getElementById('tournaments-container');
const tournamentTemplate = document.getElementById('tournament-card-template');
const tournamentModal = document.getElementById('tournament-modal');
const modalTournamentName = document.getElementById('modal-tournament-name');
const modalStartDate = document.getElementById('modal-start-date');
const modalEndDate = document.getElementById('modal-end-date');
const modalChampion = document.getElementById('modal-champion');
const modalRanking = document.getElementById('modal-ranking');
const tournamentSearch = document.getElementById('tournament-search');
const sortBy = document.getElementById('sort-by');

// Estado da aplicação
let tournaments = [];

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Carregar torneios
    fetchTournaments();
    
    // Configurar eventos
    tournamentSearch.addEventListener('input', filterTournaments);
    sortBy.addEventListener('change', sortTournaments);
    
    // Configurar modal
    document.querySelector('.modal-close').addEventListener('click', closeModal);
    
    // Fechar modal ao clicar fora
    window.addEventListener('click', (e) => {
        if (e.target === tournamentModal) {
            closeModal();
        }
    });
});

// Buscar torneios da API
async function fetchTournaments() {
    try {
        showLoading(true);
        
        // Buscar histórico de torneios
        const response = await fetch('/api/tournaments/history');
        if (!response.ok) {
            throw new Error('Erro ao carregar histórico de torneios');
        }
        
        tournaments = await response.json();
        renderTournaments(tournaments);
    } catch (error) {
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

// Renderizar torneios na interface
function renderTournaments(tournamentsList) {
    // Limpar container
    tournamentsContainer.innerHTML = '';
    
    if (tournamentsList.length === 0) {
        tournamentsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-info-circle"></i>
                <p>Nenhum torneio encontrado no histórico.</p>
            </div>
        `;
        return;
    }
    
    // Criar card para cada torneio
    tournamentsList.forEach(tournament => {
        const tournamentCard = tournamentTemplate.content.cloneNode(true);
        
        // Preencher dados
        tournamentCard.querySelector('.tournament-name').textContent = tournament.name;
        tournamentCard.querySelector('.tournament-date').textContent = formatDate(tournament.endDate);
        
        const championName = tournament.champion ? tournament.champion.nickname : 'Não definido';
        tournamentCard.querySelector('.champion-name').textContent = championName;
        
        tournamentCard.querySelector('.player-count').textContent = tournament.players.length;
        tournamentCard.querySelector('.match-count').textContent = tournament.totalMatches;
        tournamentCard.querySelector('.round-count').textContent = tournament.totalRounds;
        
        // Configurar botão de detalhes
        const viewButton = tournamentCard.querySelector('.view-details');
        viewButton.addEventListener('click', () => showTournamentDetails(tournament));
        
        // Adicionar ao container
        tournamentsContainer.appendChild(tournamentCard);
    });
}

// Filtrar torneios
function filterTournaments() {
    const searchTerm = tournamentSearch.value.toLowerCase();
    
    if (!searchTerm) {
        renderTournaments(tournaments);
        return;
    }
    
    const filtered = tournaments.filter(tournament => 
        tournament.name.toLowerCase().includes(searchTerm) || 
        (tournament.champion && tournament.champion.nickname.toLowerCase().includes(searchTerm))
    );
    
    renderTournaments(filtered);
}

// Ordenar torneios
function sortTournaments() {
    const sortField = sortBy.value;
    
    const sorted = [...tournaments].sort((a, b) => {
        if (sortField === 'date') {
            return new Date(b.endDate) - new Date(a.endDate);
        } else if (sortField === 'name') {
            return a.name.localeCompare(b.name);
        } else if (sortField === 'players') {
            return b.players.length - a.players.length;
        }
        return 0;
    });
    
    renderTournaments(sorted);
}

// Mostrar detalhes do torneio
function showTournamentDetails(tournament) {
    // Preencher dados do modal
    modalTournamentName.textContent = tournament.name;
    modalStartDate.textContent = formatDate(tournament.startDate);
    modalEndDate.textContent = formatDate(tournament.endDate);
    modalChampion.textContent = tournament.champion ? tournament.champion.nickname : 'Não definido';
    
    // Limpar tabela de classificação
    modalRanking.innerHTML = '';
    
    // Adicionar jogadores à tabela
    tournament.players.forEach((player, index) => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${player.nickname}</td>
            <td>${player.name}</td>
            <td class="text-center">${player.tournamentPoints || 0}</td>
        `;
        
        modalRanking.appendChild(row);
    });
    
    // Abrir modal
    tournamentModal.classList.add('active');
}

// Fechar modal
function closeModal() {
    tournamentModal.classList.remove('active');
}

// Utilitários
function showLoading(isLoading) {
    if (isLoading) {
        tournamentsContainer.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i> Carregando histórico de torneios...
            </div>
        `;
    }
}

function showError(message) {
    tournamentsContainer.innerHTML = `
        <div class="alert alert-danger">
            <i class="fas fa-exclamation-triangle"></i> ${message}
        </div>
    `;
}