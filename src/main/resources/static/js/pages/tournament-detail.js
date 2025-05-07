import { TournamentAPI, RoundAPI, MatchAPI } from '../api.js';
import { showNotification, getUrlParams, getStatusText, getMatchStatusText, getRoundStatusText } from '../utils.js';

document.addEventListener('DOMContentLoaded', () => {
    // Elementos do DOM
    const tournamentNameElement = document.getElementById('tournament-name'); 
    const tournamentStatusElement = document.getElementById('tournament-status'); 
    const tournamentLoading = document.getElementById('tournament-loading');
    const tournamentContent = document.getElementById('tournament-content');
    const rankingTableBody = document.getElementById('ranking-table-body');
    const roundsContainer = document.getElementById('rounds-container');
    const startTournamentBtn = document.getElementById('start-tournament-btn');
    const backBtn = document.getElementById('back-btn'); 

    // Templates
    const roundTemplate = document.getElementById('round-template');
    const matchTemplate = document.getElementById('match-template');

    let tournamentId = null;
    let currentTournamentData = null; 
    
    const params = getUrlParams();
    tournamentId = params.id;

    if (!tournamentId) {
        showNotification('ID do torneio não especificado na URL.', 'error');
        setTimeout(() => {
            window.location.href = 'tournaments.html';
        }, 2000);
        return; 
    }

    loadTournamentData(tournamentId);

    if (startTournamentBtn) {
        startTournamentBtn.addEventListener('click', startTournament);
    }

    async function loadTournamentData(id) {
        showLoading(true);

        try {
            console.log(`Buscando dados do torneio com ID: ${id}`);

            const tournament = await TournamentAPI.getById(id);
            console.log("Dados básicos do torneio recebidos:", tournament);
            currentTournamentData = tournament; 

            renderTournamentDetails(tournament);

            console.log(`Buscando ranking para o torneio com ID: ${id}`);
            const rankingData = await TournamentAPI.getRanking(id);
            console.log("Dados do ranking recebidos:", rankingData);
            renderRanking(rankingData);


            console.log(`Buscando rodadas para o torneio com ID: ${id}`);
            const roundsData = await RoundAPI.getByTournament(id);
            console.log("Dados das rodadas recebidos:", roundsData);
            renderRounds(roundsData);


            updateStartButtonState(tournament.status);

            showLoading(false);
            if(tournamentContent) tournamentContent.classList.remove('hidden');


        } catch (error) {
            console.error('Erro ao carregar dados do torneio:', error);
            if(tournamentContent) tournamentContent.innerHTML = `
                <div class="error-message">
                    <p><i class="fas fa-exclamation-triangle"></i> Erro ao carregar detalhes do torneio.</p>
                    <p>${error.message}</p>
                </div>
            `;
            showNotification(`Erro ao carregar torneio: ${error.message}`, 'error');
            showLoading(false);
            if(tournamentContent) tournamentContent.classList.remove('hidden');
        }
    }

    function renderTournamentDetails(tournament) {
        if (tournamentNameElement) {
            tournamentNameElement.textContent = tournament.name || 'Torneio sem nome';
        }
        if (tournamentStatusElement) {
            tournamentStatusElement.textContent = getStatusText(tournament.status);
            tournamentStatusElement.className = `status-tag status-${(tournament.status || '').toLowerCase()}`;
        }
    }

    function renderRanking(rankingData) {
        if (!rankingTableBody) {
             console.error("Elemento #ranking-table-body não encontrado para renderização.");
             return;
        }

        rankingTableBody.innerHTML = ''; 

        if (!rankingData || rankingData.length === 0) {
            rankingTableBody.innerHTML = '<tr><td colspan="4" class="text-center">Ranking não disponível ou vazio.</td></tr>';
            return;
        }

        if(rankingData.length == 1) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>1</td>
                <td>${rankingData[0].nickname || 'Sem Nickname'}</td>
                <td>${rankingData[0].name || 'Sem Nome'}</td>
                <td class="text-center"> Ganhou de Todos </td>
            `;
            rankingTableBody.appendChild(row);
            return;
        }
        rankingData.sort((a, b) => (b.tournamentPoints || 0) - (a.tournamentPoints || 0));

        rankingData.forEach((player, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${player.nickname || 'Sem Nickname'}</td>
                <td>${player.name || 'Sem Nome'}</td>
                <td class="text-center">${player.tournamentPoints || 0}</td>
            `;
            rankingTableBody.appendChild(row);
        });
    }

    function renderRounds(roundsData) {
        if (!roundsContainer || !roundTemplate || !matchTemplate) {
             console.error("Elementos/Templates necessários para renderizar rodadas não encontrados.");
             return;
        }

        roundsContainer.innerHTML = ''; 

        if (!roundsData || roundsData.length === 0) {
            roundsContainer.innerHTML = '<div class="empty-state"><p>Nenhuma rodada encontrada para este torneio.</p></div>';
            return;
        }

        roundsData.sort((a, b) => (a.roundNumber || 0) - (b.roundNumber || 0));


        roundsData.forEach(round => {
            const roundClone = document.importNode(roundTemplate.content, true);

            const roundNumberElement = roundClone.querySelector('.round-title .round-number'); 
            if(roundNumberElement) roundNumberElement.textContent = round.roundNumber || '?';

            const roundStatusElement = roundClone.querySelector('.round-status');
            if(roundStatusElement) {
                roundStatusElement.textContent = getRoundStatusText(round.status);
                roundStatusElement.className += ` status-${(round.status || '').toLowerCase()}`;
            }


            const matchesContainer = roundClone.querySelector('.matches-container');
            if (matchesContainer && round.matches && Array.isArray(round.matches)) {
                round.matches.forEach(match => {
                    const matchClone = document.importNode(matchTemplate.content, true);

                    const player1NicknameElement = matchClone.querySelector('.match-players .player1 .player-nickname');
                    if(player1NicknameElement) player1NicknameElement.textContent = match.player1Nickname || 'Jogador 1';

                    const player2NicknameElement = matchClone.querySelector('.match-players .player2 .player-nickname');
                    if(player2NicknameElement) player2NicknameElement.textContent = match.player2Nickname || 'Jogador 2';

                    const matchStatusElement = matchClone.querySelector('.match-status');
                    if(matchStatusElement) {
                         matchStatusElement.textContent = getMatchStatusText(match.status, match);
                         matchStatusElement.className += ` status-${(match.status || '').toLowerCase()}`;
                    }


                    const viewMatchLink = matchClone.querySelector('.view-match');
                    if(viewMatchLink) {
                         viewMatchLink.href = `match-detail.html?tournamentId=${tournamentId}&roundId=${round.id}&matchId=${match.id}`;

                         if (match.status === 'FINISHED') { 
                             viewMatchLink.classList.add('hidden');
                         } else {
                             viewMatchLink.classList.remove('hidden');
                         }
                    }


                    matchesContainer.appendChild(matchClone);
                });
            } else if (matchesContainer) {
                 matchesContainer.innerHTML = '<div class="empty-state-small"><p>Nenhuma partida nesta rodada.</p></div>';
            }


            roundsContainer.appendChild(roundClone);
        });
    }

    function updateStartButtonState(tournamentStatus) {
        console.log("updateStartButtonState chamado com status:", tournamentStatus); 
        if (startTournamentBtn) {
            console.log("Elemento startTournamentBtn encontrado."); 
            if (tournamentStatus === 'CREATED') {
                console.log("Status é CREATED. Mostrando botão Iniciar Torneio."); 
                startTournamentBtn.classList.remove('hidden'); 
                startTournamentBtn.disabled = false; 
            } else { 
                console.log("Status não é CREATED. Ocultando botão Iniciar Torneio.");
                startTournamentBtn.classList.add('hidden');
                startTournamentBtn.disabled = true; 
            }
             console.log("Estado final do botão Iniciar Torneio: hidden =", startTournamentBtn.classList.contains('hidden'), ", disabled =", startTournamentBtn.disabled); // Log de diagnóstico
        } else {
             console.error("Elemento #start-tournament-btn não encontrado!");
        }
    }

    async function startTournament() {
        if (!tournamentId) {
            showNotification('ID do torneio não disponível.', 'error');
            return;
        }

        if (startTournamentBtn) startTournamentBtn.disabled = true;


        try {
            console.log(`Iniciando torneio com ID: ${tournamentId}`);
            const startedTournament = await TournamentAPI.start(tournamentId);
            console.log("Torneio iniciado:", startedTournament);

            showNotification('Torneio iniciado com sucesso!', 'success');

            setTimeout(() => {
                 loadTournamentData(tournamentId);
            }, 1000);


        } catch (error) {
            console.error('Erro ao iniciar torneio:', error);
            const errorMessage = error.message || 'Ocorreu um erro ao iniciar o torneio.';
            showNotification(`Erro ao iniciar torneio: ${errorMessage}`, 'error');

        } finally {
             if (startTournamentBtn && currentTournamentData && currentTournamentData.status === 'CREATED') {
                 startTournamentBtn.disabled = false;
             }
        }
    }


    function showLoading(isLoading) {
        if (tournamentLoading && tournamentContent) {
            if (isLoading) {
                tournamentLoading.style.display = 'flex';
                tournamentContent.classList.add('hidden');
            } else {
                tournamentLoading.style.display = 'none';
            }
        }
    }



});
