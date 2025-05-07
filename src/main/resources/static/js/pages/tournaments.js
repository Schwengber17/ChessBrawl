import { TournamentAPI } from '../api.js';
import { showNotification } from '../utils.js';

document.addEventListener('DOMContentLoaded', () => {
    // Elementos do DOM
    const tournamentsContainer = document.getElementById('tournaments-container');
    const tournamentCardTemplate = document.getElementById('tournament-card-template');
    const tabButtons = document.querySelectorAll('.tournament-status-tabs .tab-btn');

    let allTournaments = []; 

    async function loadTournaments() {
        if (tournamentsContainer) {
            tournamentsContainer.innerHTML = `
                <div class="loading">
                    <i class="fas fa-spinner fa-spin"></i> Carregando torneios...
                </div>
            `;
        }

        try {
            console.log("Buscando todos os torneios...");
            const tournaments = await TournamentAPI.getAll();
            console.log("Torneios recebidos:", tournaments);

            allTournaments = tournaments;

            displayTournaments(getActiveStatusFilter());

        } catch (error) {
            console.error('Erro ao carregar torneios:', error);
            if (tournamentsContainer) {
                 tournamentsContainer.innerHTML = `
                    <div class="error-message">
                        <p><i class="fas fa-exclamation-triangle"></i> Erro ao carregar torneios.</p>
                        <p>${error.message}</p>
                    </div>
                 `;
            }
            showNotification(`Erro ao carregar torneios: ${error.message}`, 'error');
        }
    }

    function displayTournaments(statusFilter) {
        if (!tournamentsContainer || !tournamentCardTemplate) {
             console.error("Elementos DOM necessários para exibir torneios não encontrados.");
             return;
        }

        tournamentsContainer.innerHTML = ''; 

        const filteredTournaments = allTournaments.filter(tournament => {
            if (statusFilter === 'all') {
                return true; 
            }
            if (statusFilter === 'active') {
                 return tournament.status === 'CREATED' || tournament.status === 'IN_PROGRESS';
            }
            return tournament.status === statusFilter.toUpperCase();
        });

        if (filteredTournaments.length === 0) {
            tournamentsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chess-board"></i>
                    <p>Nenhum torneio encontrado ${statusFilter === 'active' ? 'ativo' : statusFilter === 'finished' ? 'finalizado' : ''}.</p>
                </div>
            `;
            return;
        }

        filteredTournaments.forEach(tournament => {
            const cardClone = document.importNode(tournamentCardTemplate.content, true);

            const nameElement = cardClone.querySelector('.tournament-name');
            if(nameElement) nameElement.textContent = tournament.name || 'Torneio sem nome';

            const statusElement = cardClone.querySelector('.tournament-status');
            if(statusElement) {
                 statusElement.textContent = getStatusText(tournament.status); 
                 statusElement.className += ` status-${(tournament.status || '').toLowerCase()}`; 
            }

            const playerCountElement = cardClone.querySelector('.player-count');
             if(playerCountElement) playerCountElement.textContent = tournament.playerCount || 0;

            const roundCountElement = cardClone.querySelector('.round-count');
             if(roundCountElement) roundCountElement.textContent = tournament.roundCount || 0;


            const viewDetailsLink = cardClone.querySelector('.view-tournament');
            if(viewDetailsLink) {
                 viewDetailsLink.href = `tournament-detail.html?id=${tournament.id}`;
            }


            const deleteButton = cardClone.querySelector('.delete-tournament');
            if(deleteButton) {
                 deleteButton.addEventListener('click', () => {
                     deleteTournament(tournament.id); 
                 });
                
            }

            tournamentsContainer.appendChild(cardClone);
        });
    }

    async function deleteTournament(tournamentId) {
        if (!confirm('Tem certeza que deseja excluir este torneio?')) {
            return; 
        }

        try {
            console.log(`Excluindo torneio com ID: ${tournamentId}`);
            await TournamentAPI.delete(tournamentId);

            showNotification('Torneio excluído com sucesso!', 'success');
            loadTournaments();

        } catch (error) {
            console.error('Erro ao excluir torneio:', error);
             const errorMessage = error.message || 'Ocorreu um erro ao excluir o torneio.';
            showNotification(`Erro ao excluir torneio: ${errorMessage}`, 'error');
        }
    }


    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const statusFilter = button.dataset.status;
            displayTournaments(statusFilter);
        });
    });

    function getActiveStatusFilter() {
        const activeTab = document.querySelector('.tournament-status-tabs .tab-btn.active');
        return activeTab ? activeTab.dataset.status : 'all';
    }

    function getStatusText(status) {
      switch (status) {
        case "CREATED": return "Criado";
        case "IN_PROGRESS": return "Em Andamento";
        case "FINISHED": return "Finalizado";
        default: return status || 'Desconhecido';
      }
    }


    loadTournaments();
});
