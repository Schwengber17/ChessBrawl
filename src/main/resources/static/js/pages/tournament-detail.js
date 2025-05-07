// js/pages/tournament-detail.js

// Importa as funções da API e utilitários
// Importa APIs necessárias
import { TournamentAPI, RoundAPI, MatchAPI } from '../api.js';
// Importa utilitários, incluindo getRoundStatusText
import { showNotification, getUrlParams, getStatusText, getMatchStatusText, getRoundStatusText } from '../utils.js';

document.addEventListener('DOMContentLoaded', () => {
    // Elementos do DOM
    const tournamentNameElement = document.getElementById('tournament-name'); // Renomeado para evitar conflito
    const tournamentStatusElement = document.getElementById('tournament-status'); // Renomeado para evitar conflito
    const tournamentLoading = document.getElementById('tournament-loading');
    const tournamentContent = document.getElementById('tournament-content');
    const rankingTableBody = document.getElementById('ranking-table-body');
    const roundsContainer = document.getElementById('rounds-container');
    const startTournamentBtn = document.getElementById('start-tournament-btn');
    const backBtn = document.getElementById('back-btn'); // Botão voltar

    // Templates
    const roundTemplate = document.getElementById('round-template');
    const matchTemplate = document.getElementById('match-template');

    // Estado da aplicação
    let tournamentId = null; // Armazenará o ID do torneio da URL
    let currentTournamentData = null; // Armazenará os dados completos do torneio (detalhes básicos)


    // Inicialização
    // Obter ID do torneio da URL
    const params = getUrlParams();
    tournamentId = params.id;

    if (!tournamentId) {
        showNotification('ID do torneio não especificado na URL.', 'error');
        // Redirecionar de volta para a lista de torneios após um tempo
        setTimeout(() => {
            window.location.href = 'tournaments.html';
        }, 2000);
        return; // Interrompe a execução se o ID não estiver presente
    }

    // Carregar dados do torneio (detalhes, ranking, rodadas)
    loadTournamentData(tournamentId);

    // Configurar eventos
    if (startTournamentBtn) {
        startTournamentBtn.addEventListener('click', startTournament);
    }

    // Evento para o botão voltar (já configurado no HTML, mas pode adicionar JS se necessário)
    // if (backBtn) {
    //     backBtn.addEventListener('click', () => {
    //         window.history.back(); // Volta para a página anterior
    //     });
    // }


    // --- Funções ---

    // Carrega todos os dados do torneio (detalhes, ranking, rodadas)
    async function loadTournamentData(id) {
        // Mostra indicador de carregamento
        showLoading(true);

        try {
            console.log(`Buscando dados do torneio com ID: ${id}`);

            // 1. Busca os detalhes básicos do torneio
            const tournament = await TournamentAPI.getById(id);
            console.log("Dados básicos do torneio recebidos:", tournament);
            currentTournamentData = tournament; // Armazena os dados básicos

            // Renderiza os detalhes básicos do torneio
            renderTournamentDetails(tournament);

            // 2. Busca o ranking separadamente
            console.log(`Buscando ranking para o torneio com ID: ${id}`);
            // Chama o método getRanking da TournamentAPI (assumindo que existe e retorna List<PlayerDTO>)
            const rankingData = await TournamentAPI.getRanking(id);
            console.log("Dados do ranking recebidos:", rankingData);
            // Renderiza o ranking com os dados recebidos
            renderRanking(rankingData);


            // 3. Busca as rodadas separadamente
            console.log(`Buscando rodadas para o torneio com ID: ${id}`);
            // Chama o método getByTournament da RoundAPI (assumindo que existe e retorna List<RoundDTO>)
            // E que cada RoundDTO retornado INCLUI a lista de MatchDTOs
            const roundsData = await RoundAPI.getByTournament(id);
            console.log("Dados das rodadas recebidos:", roundsData);
            // Renderiza as rodadas com os dados recebidos
            renderRounds(roundsData);


            // Controla a visibilidade do botão Iniciar Torneio com base no status do torneio básico
            updateStartButtonState(tournament.status);

            // Oculta indicador de carregamento e mostra conteúdo
            showLoading(false);
            if(tournamentContent) tournamentContent.classList.remove('hidden');


        } catch (error) {
            console.error('Erro ao carregar dados do torneio:', error);
            // Mostra mensagem de erro na interface
            if(tournamentContent) tournamentContent.innerHTML = `
                <div class="error-message">
                    <p><i class="fas fa-exclamation-triangle"></i> Erro ao carregar detalhes do torneio.</p>
                    <p>${error.message}</p>
                </div>
            `;
            showNotification(`Erro ao carregar torneio: ${error.message}`, 'error');
            // Oculta indicador de carregamento
            showLoading(false);
            if(tournamentContent) tournamentContent.classList.remove('hidden'); // Mostra a área de conteúdo mesmo com erro
        }
    }

    // Renderiza os detalhes básicos do torneio (nome, status)
    function renderTournamentDetails(tournament) {
        if (tournamentNameElement) {
            tournamentNameElement.textContent = tournament.name || 'Torneio sem nome';
        }
        if (tournamentStatusElement) {
            // Usa getStatusText do utils.js
            tournamentStatusElement.textContent = getStatusText(tournament.status);
            // Adiciona classe para estilizar o status (ex: status-created, status-in_progress)
            tournamentStatusElement.className = `status-tag status-${(tournament.status || '').toLowerCase()}`;
        }
    }

    // Renderiza a tabela de classificação
    function renderRanking(rankingData) {
        if (!rankingTableBody) {
             console.error("Elemento #ranking-table-body não encontrado para renderização.");
             return;
        }

        rankingTableBody.innerHTML = ''; // Limpa o corpo da tabela

        if (!rankingData || rankingData.length === 0) {
            rankingTableBody.innerHTML = '<tr><td colspan="4" class="text-center">Ranking não disponível ou vazio.</td></tr>';
            return;
        }

        // Ordena o ranking por pontos de torneio (descendente)
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

    // Renderiza as rodadas e suas partidas
    function renderRounds(roundsData) {
        if (!roundsContainer || !roundTemplate || !matchTemplate) {
             console.error("Elementos/Templates necessários para renderizar rodadas não encontrados.");
             return;
        }

        roundsContainer.innerHTML = ''; // Limpa o contêiner de rodadas

        if (!roundsData || roundsData.length === 0) {
            roundsContainer.innerHTML = '<div class="empty-state"><p>Nenhuma rodada encontrada para este torneio.</p></div>';
            return;
        }

        // Ordena as rodadas por número (ascendente)
        roundsData.sort((a, b) => (a.roundNumber || 0) - (b.roundNumber || 0));


        roundsData.forEach(round => {
            const roundClone = document.importNode(roundTemplate.content, true);

            // Preenche os dados da rodada
            const roundNumberElement = roundClone.querySelector('.round-title .round-number'); // Seletor corrigido
            if(roundNumberElement) roundNumberElement.textContent = round.roundNumber || '?';

            const roundStatusElement = roundClone.querySelector('.round-status');
            if(roundStatusElement) {
                // Usa getRoundStatusText do utils.js
                // VERIFICAR SE round.status É O STATUS CORRETO DA RODADA
                roundStatusElement.textContent = getRoundStatusText(round.status);
                 // Adiciona classe para estilizar o status da rodada
                roundStatusElement.className += ` status-${(round.status || '').toLowerCase()}`;
            }


            const matchesContainer = roundClone.querySelector('.matches-container');
            if (matchesContainer && round.matches && Array.isArray(round.matches)) {
                // Renderiza as partidas desta rodada
                round.matches.forEach(match => {
                    const matchClone = document.importNode(matchTemplate.content, true);

                    // Preenche os dados da partida
                    const player1NicknameElement = matchClone.querySelector('.match-players .player1 .player-nickname');
                    if(player1NicknameElement) player1NicknameElement.textContent = match.player1Nickname || 'Jogador 1';

                    const player2NicknameElement = matchClone.querySelector('.match-players .player2 .player-nickname');
                    if(player2NicknameElement) player2NicknameElement.textContent = match.player2Nickname || 'Jogador 2';

                    const matchStatusElement = matchClone.querySelector('.match-status');
                    if(matchStatusElement) {
                         // Usa getMatchStatusText do utils.js
                         // VERIFICAR SE match.status É O STATUS CORRETO DA PARTIDA
                         matchStatusElement.textContent = getMatchStatusText(match.status, match); // Passa o objeto match para lógica de exibição
                         // Adiciona classe para estilizar o status da partida
                         matchStatusElement.className += ` status-${(match.status || '').toLowerCase()}`;
                    }


                    // Configura o link "Ver Partida"
                    const viewMatchLink = matchClone.querySelector('.view-match');
                    if(viewMatchLink) {
                         // *** CRUCIAL: Passa tournamentId, roundId e matchId na URL ***
                         // Usa o tournamentId armazenado no estado da página
                         viewMatchLink.href = `match-detail.html?tournamentId=${tournamentId}&roundId=${round.id}&matchId=${match.id}`;

                         // CORREÇÃO: Ocultar o link SOMENTE se o status NÃO for PENDING ou IN_PROGRESS
                         // Ou seja, ocultar apenas se for FINISHED ou outro status que não permite visualização
                         // Se o status for PENDING ou IN_PROGRESS, o link deve ser visível
                         if (match.status === 'FINISHED') { // Oculta apenas se a partida terminou
                             viewMatchLink.classList.add('hidden'); // Adiciona classe hidden para ocultar via CSS
                         } else { // Se for PENDING, IN_PROGRESS ou outro status, mostra o link
                             viewMatchLink.classList.remove('hidden'); // Remove a classe hidden
                         }
                    }


                    matchesContainer.appendChild(matchClone); // Adiciona a partida ao contêiner de partidas da rodada
                });
            } else if (matchesContainer) {
                 matchesContainer.innerHTML = '<div class="empty-state-small"><p>Nenhuma partida nesta rodada.</p></div>';
            }


            roundsContainer.appendChild(roundClone); // Adiciona a rodada ao contêiner principal de rodadas
        });
    }

    // Controla a visibilidade e estado do botão "Iniciar Torneio"
    function updateStartButtonState(tournamentStatus) {
        console.log("updateStartButtonState chamado com status:", tournamentStatus); // Log de diagnóstico
        if (startTournamentBtn) {
            console.log("Elemento startTournamentBtn encontrado."); // Log de diagnóstico
            // O botão só é visível e habilitado se o status for CREATED
            if (tournamentStatus === 'CREATED') {
                console.log("Status é CREATED. Mostrando botão Iniciar Torneio."); // Log de diagnóstico
                startTournamentBtn.classList.remove('hidden'); // Remove a classe hidden (mostra o botão)
                startTournamentBtn.disabled = false; // Habilita o botão
            } else { // Se o status não for 'CREATED' (ou seja, IN_PROGRESS ou FINISHED)
                console.log("Status não é CREATED. Ocultando botão Iniciar Torneio."); // Log de diagnóstico
                startTournamentBtn.classList.add('hidden'); // Adiciona a classe hidden (oculta o botão)
                startTournamentBtn.disabled = true; // Desabilita o botão
            }
             console.log("Estado final do botão Iniciar Torneio: hidden =", startTournamentBtn.classList.contains('hidden'), ", disabled =", startTournamentBtn.disabled); // Log de diagnóstico
        } else {
             console.error("Elemento #start-tournament-btn não encontrado!"); // Log de diagnóstico
        }
    }

    // Lida com o clique no botão "Iniciar Torneio"
    async function startTournament() {
        if (!tournamentId) {
            showNotification('ID do torneio não disponível.', 'error');
            return;
        }

        // Opcional: Desabilitar o botão para evitar cliques múltiplos
        if (startTournamentBtn) startTournamentBtn.disabled = true;


        try {
            console.log(`Iniciando torneio com ID: ${tournamentId}`);
            // Chama a API para iniciar o torneio
            const startedTournament = await TournamentAPI.start(tournamentId);
            console.log("Torneio iniciado:", startedTournament);

            showNotification('Torneio iniciado com sucesso!', 'success');

            // Recarrega os dados da página após iniciar o torneio
            // Pequeno delay para a notificação ser visível
            setTimeout(() => {
                 loadTournamentData(tournamentId);
            }, 1000);


        } catch (error) {
            console.error('Erro ao iniciar torneio:', error);
            const errorMessage = error.message || 'Ocorreu um erro ao iniciar o torneio.';
            showNotification(`Erro ao iniciar torneio: ${errorMessage}`, 'error');

        } finally {
            // A função loadTournamentData já cuidará do estado do botão com base no novo status
            // Se o erro ocorrer, o botão pode precisar ser reabilitado
             if (startTournamentBtn && currentTournamentData && currentTournamentData.status === 'CREATED') {
                 startTournamentBtn.disabled = false;
             }
        }
    }


    // Utilitário para mostrar/ocultar indicador de carregamento
    function showLoading(isLoading) {
        if (tournamentLoading && tournamentContent) {
            if (isLoading) {
                tournamentLoading.style.display = 'flex'; // Ou 'block', dependendo do seu CSS
                tournamentContent.classList.add('hidden'); // Oculta o conteúdo
            } else {
                tournamentLoading.style.display = 'none';
                // tournamentContent.classList.remove('hidden'); // Será mostrado após o carregamento bem-sucedido
            }
        }
    }

    // TODO: Adicionar a função getStatusText, getMatchStatusText, getRoundStatusText no utils.js se ainda não estiverem lá
    // Elas convertem os enums de status do backend para texto amigável no frontend.
    // Exemplo simples em utils.js:
    /*
    export function getStatusText(status) {
      switch (status) {
        case "CREATED": return "Criado";
        case "IN_PROGRESS": return "Em Andamento";
        case "FINISHED": return "Finalizado";
        default: return status || 'Desconhecido';
      }
    }
    // Adapte para status de Rodada e Partida se forem diferentes
    */

});
