import { TournamentAPI } from '../api.js'; 
import { showNotification, getStatusText } from '../utils.js'; 

document.addEventListener('DOMContentLoaded', () => {
    // Elementos do DOM
    const tournamentsContainer = document.getElementById('tournaments-container');
    const tournamentCardTemplate = document.getElementById('tournament-card-template');
    const tabButtons = document.querySelectorAll('.tournament-status-tabs .tab-btn');

    // Elementos do Modal
    const tournamentModal = document.getElementById('tournament-modal');
    const modalCloseBtn = tournamentModal ? tournamentModal.querySelector('.modal-close') : null;
    const modalTournamentName = document.getElementById('modal-tournament-name');
    const modalChampion = document.getElementById('modal-champion');
    const modalRankingBody = document.getElementById('modal-ranking');


    let allTournaments = []; // torneios carregados

    async function loadTournaments() {
        if (tournamentsContainer) {
            tournamentsContainer.innerHTML = `
                <div class="loading">
                    <i class="fas fa-spinner fa-spin"></i> Carregando histórico de torneios...
                </div>
            `;
        }

        try {
            console.log("Buscando torneios finalizados...");
            const tournaments = await TournamentAPI.getTournamentsByStatus('FINISHED'); 
            console.log("Torneios finalizados recebidos:", tournaments);

            allTournaments = tournaments; 

            displayTournaments(allTournaments);
            

        } catch (error) {
            console.error('Erro ao carregar histórico de torneios:', error);
            if (tournamentsContainer) {
                 tournamentsContainer.innerHTML = `
                    <div class="error-message">
                        <p><i class="fas fa-exclamation-triangle"></i> Erro ao carregar histórico de torneios.</p>
                        <p>${error.message}</p>
                    </div>
                 `;
            }
            showNotification(`Erro ao carregar histórico de torneios: ${error.message}`, 'error');
        }
    }

    function displayTournaments(tournamentsToDisplay) {
        if (!tournamentsContainer || !tournamentCardTemplate) {
             console.error("Elementos DOM necessários para exibir torneios não encontrados.");
             return;
        }

        tournamentsContainer.innerHTML = ''; 
        if (!tournamentsToDisplay || tournamentsToDisplay.length === 0) {
            tournamentsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chess-board"></i>
                    <p>Nenhum torneio finalizado encontrado.</p>
                </div>
            `;
            return;
        }

        tournamentsToDisplay.forEach(tournament => {
            const cardClone = document.importNode(tournamentCardTemplate.content, true);

            const nameElement = cardClone.querySelector('.tournament-name');
            if(nameElement) nameElement.textContent = tournament.name || 'Torneio sem nome';

            const playerCountElement = cardClone.querySelector('.player-count');
             if(playerCountElement) playerCountElement.textContent = tournament.playerCount || 0;

            const roundCountElement = cardClone.querySelector('.round-count');
             if(roundCountElement) roundCountElement.textContent = tournament.roundCount || 0;

            const championNameElement = cardClone.querySelector('.champion-name');
            if(championNameElement) {
                championNameElement.textContent = tournament.championNickname || tournament.championName || 'Ainda não definido';
            }


            const viewDetailsButton = cardClone.querySelector('.view-details');
            if(viewDetailsButton) {
                 viewDetailsButton.addEventListener('click', () => {
                     openTournamentModal(tournament.id); 
                 });
            }


            tournamentsContainer.appendChild(cardClone);
        });
    }

    async function openTournamentModal(tournamentId) {
        if (!tournamentModal || !modalRankingBody || !modalTournamentName || !modalChampion) {
             console.error("Elementos do modal não encontrados.");
             return;
        }

        modalTournamentName.textContent = 'Carregando...';
        modalChampion.textContent = 'Carregando...';
        modalRankingBody.innerHTML = ''; 

        tournamentModal.style.display = 'block';


        try {
            console.log(`Buscando detalhes para o modal do torneio com ID: ${tournamentId}`);

            const tournamentDetails = await TournamentAPI.getById(tournamentId);
            console.log("Detalhes do torneio para modal recebidos:", tournamentDetails);

            const rankingData = await TournamentAPI.getRanking(tournamentId);
            console.log("Dados do ranking para modal recebidos:", rankingData);


            modalTournamentName.textContent = tournamentDetails.name || 'Torneio sem nome';


            if (tournamentDetails.championNickname || tournamentDetails.championName) {
                 modalChampion.textContent = tournamentDetails.championNickname || tournamentDetails.championName;
            } else {
                 modalChampion.textContent = 'Ainda não definido'; 
            }


            if (rankingData && rankingData.length > 0) {
                rankingData.sort((a, b) => (b.tournamentPoints || 0) - (a.tournamentPoints || 0));

                rankingData.forEach((player, index) => {
                    const row = document.createElement('tr');
                     const positionText = (tournamentDetails.status === 'FINISHED' && rankingData.length === 1) ? 'Campeão' : (index + 1);

                    row.innerHTML = `
                        <td>${positionText}</td>
                        <td>${player.nickname || 'Sem Nickname'}</td>
                        <td>${player.name || 'Sem Nome'}</td>
                        <td class="text-center"> Campeão </td>
                    `;
                    modalRankingBody.appendChild(row);
                });
            } else {
                modalRankingBody.innerHTML = '<tr><td colspan="4" class="text-center">Ranking final não disponível.</td></tr>';
            }


        } catch (error) {
            console.error('Erro ao carregar detalhes do torneio para o modal:', error);
             modalTournamentName.textContent = 'Erro';
             modalChampion.textContent = 'Erro';
             modalRankingBody.innerHTML = `<tr><td colspan="4" class="text-center error-message">${error.message || 'Erro ao carregar detalhes.'}</td></tr>`;
            showNotification(`Erro ao carregar detalhes do torneio: ${error.message}`, 'error');
        }
    }

    function closeTournamentModal() {
        if (tournamentModal) {
            tournamentModal.style.display = 'none';
        }
    }


    //Event Listeners
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeTournamentModal);
    }

    window.addEventListener('click', (event) => {
        if (tournamentModal && event.target === tournamentModal) {
            closeTournamentModal();
        }
    });

    loadTournaments();
});
