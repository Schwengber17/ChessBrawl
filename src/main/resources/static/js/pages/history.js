// js/pages/history.js

// Importa as funções da API e utilitários
import { TournamentAPI } from '../api.js'; // Importa TournamentAPI
// REMOVIDO formatDate da importação
import { showNotification } from '../utils.js'; // Importa utilitários

// Elementos DOM
const tournamentsContainer = document.getElementById('tournaments-container');
const tournamentTemplate = document.getElementById('tournament-card-template');
const tournamentModal = document.getElementById('tournament-modal');
const modalTournamentName = document.getElementById('modal-tournament-name');
const modalStartDate = document.getElementById('modal-start-date');
const modalEndDate = document.getElementById('modal-end-date');
const modalChampion = document.getElementById('modal-champion');
const modalRanking = document.getElementById('modal-ranking');
const tournamentSearchInput = document.getElementById('tournament-search'); // Renomeado
const sortBySelect = document.getElementById('sort-by'); // Renomeado

// Estado da aplicação
let allFinishedTournaments = []; // Armazenará todos os torneios finalizados carregados
let displayedTournaments = []; // Torneios atualmente exibidos (após filtro/ordenação)


// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Carregar torneios finalizados
    fetchFinishedTournaments();

    // Configurar eventos
    if (tournamentSearchInput) tournamentSearchInput.addEventListener('input', filterAndSortTournaments); // Chama filtro/ordenação ao digitar
    if (sortBySelect) sortBySelect.addEventListener('change', filterAndSortTournaments); // Chama filtro/ordenação ao mudar ordenação

    // Configurar modal
    const modalCloseButton = document.querySelector('.modal-close');
    if (modalCloseButton) {
        modalCloseButton.addEventListener('click', closeModal);
    }


    // Fechar modal ao clicar fora
    if (tournamentModal) {
        window.addEventListener('click', (e) => {
            if (e.target === tournamentModal) {
                closeModal();
            }
        });
    }
});

// Buscar torneios finalizados da API
async function fetchFinishedTournaments() {
    try {
        showLoading(true);

        // Buscar TODOS os torneios e filtrar os FINALIZADOS no frontend
        // Alternativamente, o backend poderia ter um endpoint específico para torneios finalizados.
        const allTournaments = await TournamentAPI.getAll();
        allFinishedTournaments = allTournaments.filter(t => t.status === 'FINISHED');

        // Renderiza os torneios finalizados (inicialmente sem filtro/ordenação)
        filterAndSortTournaments(); // Chama para exibir e ordenar inicialmente

    } catch (error) {
        console.error('Erro ao carregar histórico de torneios:', error);
        showError(`Erro ao carregar histórico de torneios: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

// Filtra e ordena os torneios atualmente carregados
function filterAndSortTournaments() {
    let filtered = [...allFinishedTournaments]; // Começa com todos os torneios finalizados

    // 1. Filtrar por termo de busca
    const searchTerm = tournamentSearchInput ? tournamentSearchInput.value.toLowerCase().trim() : '';
    if (searchTerm) {
        filtered = filtered.filter(tournament =>
            (tournament.name && tournament.name.toLowerCase().includes(searchTerm)) ||
            (tournament.champion && tournament.champion.nickname && tournament.champion.nickname.toLowerCase().includes(searchTerm))
        );
    }

    // 2. Ordenar
    const sortField = sortBySelect ? sortBySelect.value : 'name'; // Padrão por nome se select não existir
    filtered.sort((a, b) => {
        if (sortField === 'date') {
            // Ordena pela data de término (assumindo campo endDate no DTO do torneio)
            // Se não houver endDate, ajuste para outra data relevante (ex: data de criação)
            // REMOVIDO: Lógica de ordenação por data
            // Manter ordenação por nome como fallback se data não for usada
             const nameA = a.name || '';
             const nameB = b.name || '';
             return nameA.localeCompare(nameB);

        } else if (sortField === 'name') {
            // Ordena por nome
            const nameA = a.name || '';
            const nameB = b.name || '';
            return nameA.localeCompare(nameB);
        } else if (sortField === 'players') {
            // Ordena por número de jogadores (assumindo players é uma lista no DTO)
            const countA = a.playerCount || (a.players ? a.players.length : 0); // Usa playerCount ou players.length
            const countB = b.playerCount || (b.players ? b.players.length : 0); // Usa playerCount ou players.length
            return countB - countA; // Mais jogadores primeiro
        }
        return 0; // Sem ordenação padrão se o campo for desconhecido
    });

    displayedTournaments = filtered; // Atualiza a lista exibida
    renderTournaments(displayedTournaments); // Renderiza a lista filtrada e ordenada
}


// Renderizar torneios na interface
function renderTournaments(tournamentsList) {
    // Limpar container
    if (!tournamentsContainer) return;
    tournamentsContainer.innerHTML = '';

    if (!tournamentsList || tournamentsList.length === 0) {
        tournamentsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-info-circle"></i>
                <p>Nenhum torneio encontrado no histórico com os filtros aplicados.</p>
            </div>
        `;
        return;
    }

    // Criar card para cada torneio
    tournamentsList.forEach(tournament => {
        if (!tournamentTemplate) return; // Verifica se o template existe
        const tournamentCard = tournamentTemplate.content.cloneNode(true);

        // Preencher dados do template
        const tournamentNameElement = tournamentCard.querySelector('.tournament-name');
        if(tournamentNameElement) tournamentNameElement.textContent = tournament.name || 'Torneio sem nome';

        // REMOVIDO: Exibição da data de término formatada
        const tournamentDateElement = tournamentCard.querySelector('.tournament-date');
        if(tournamentDateElement) tournamentDateElement.textContent = 'Data não exibida'; // Ou remova o elemento do HTML

        // Assumindo campo champion no DTO do torneio (pode ser um PlayerDTO ou apenas ID/Nickname)
        const championName = (tournament.champion && tournament.champion.nickname) ? tournament.champion.nickname : 'Não definido';
        const championNameElement = tournamentCard.querySelector('.champion-name');
        if(championNameElement) championNameElement.textContent = championName;


        // Assumindo que o DTO inclui playerCount, totalMatches e totalRounds
        // Se não, você precisará ajustar o backend ou buscar esses dados separadamente (menos eficiente)
        const playerCountElement = tournamentCard.querySelector('.player-count');
        if(playerCountElement) playerCountElement.textContent = tournament.playerCount || (tournament.players ? tournament.players.length : 0); // Tenta usar playerCount ou players.length

        const matchCountElement = tournamentCard.querySelector('.match-count');
        if(matchCountElement) matchCountElement.textContent = tournament.totalMatches || (tournament.matches ? tournament.matches.length : 0); // Tenta usar totalMatches ou matches.length

        const roundCountElement = tournamentCard.querySelector('.round-count');
        if(roundCountElement) roundCountElement.textContent = tournament.roundCount || (tournament.rounds ? tournament.rounds.length : 0); // Tenta usar roundCount ou rounds.length


        // Configurar botão de detalhes
        const viewButton = tournamentCard.querySelector('.view-details');
        if (viewButton) {
             // Adiciona um listener de evento em vez de onclick no HTML
             viewButton.addEventListener('click', () => {
                  // Ao clicar, abre o modal com os detalhes do torneio
                  showTournamentDetails(tournament);
             });
        }


        // Adicionar ao container
        tournamentsContainer.appendChild(tournamentCard);
    });
}

// Mostrar detalhes do torneio no modal
function showTournamentDetails(tournament) {
    if (!tournamentModal) return; // Verifica se o modal existe

    // Preencher dados do modal
    if (modalTournamentName) modalTournamentName.textContent = tournament.name || 'Detalhes do Torneio';
    // REMOVIDO: Exibição de datas formatadas no modal
    if (modalStartDate) modalStartDate.textContent = 'Data de início não exibida'; // Ou remova o elemento do HTML
    if (modalEndDate) modalEndDate.textContent = 'Data de término não exibida'; // Ou remova o elemento do HTML


    // Assumindo campo champion no DTO do torneio (pode ser um PlayerDTO ou apenas ID/Nickname)
    const championName = (tournament.champion && tournament.champion.nickname) ? tournament.champion.nickname : 'Não definido';
    if (modalChampion) modalChampion.textContent = championName;

    // Limpar tabela de classificação
    if (modalRanking) modalRanking.innerHTML = '';

    // Adicionar jogadores à tabela de classificação no modal
    // Assumindo que o DTO do torneio no histórico inclui a lista de jogadores (players)
    // e que cada jogador tem tournamentPoints
    if (modalRanking) {
        if (!tournament.players || tournament.players.length === 0) {
             modalRanking.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">Nenhuma classificação disponível.</td>
                </tr>
             `;
        } else {
             // Ordenar jogadores por tournamentPoints (maior primeiro) para o ranking
             const sortedPlayers = [...tournament.players].sort((a, b) => (b.tournamentPoints || 0) - (a.tournamentPoints || 0));

             sortedPlayers.forEach((player, index) => {
                 const row = document.createElement('tr');

                 row.innerHTML = `
                     <td>${index + 1}</td>
                     <td>${player.nickname || 'Desconhecido'}</td>
                     <td>${player.name || ''}</td>
                     <td class="text-center">${player.tournamentPoints || 0}</td>
                 `;

                 modalRanking.appendChild(row);
             });
        }
    }


    // Abrir modal
    tournamentModal.classList.add('active'); // Assumindo classe 'active' para exibir
    tournamentModal.style.display = 'block'; // Garante que está visível
     // O listener windowClickHandler já está adicionado ao carregar a página
}

// Fechar modal
function closeModal() {
    if (tournamentModal) {
        tournamentModal.classList.remove('active');
        tournamentModal.style.display = 'none';
         // O listener windowClickHandler já está adicionado ao carregar a página
    }
}

// Lida com o clique fora do modal para fechar
function windowClickHandler(event) {
    if (event.target === tournamentModal) {
        closeModal();
    }
}


// Utilitários (funções auxiliares)

// Mostra indicador de carregamento
function showLoading(isLoading) {
    if (!tournamentsContainer) return; // Verifica se o container existe
    if (isLoading) {
        tournamentsContainer.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i> Carregando histórico de torneios...
            </div>
        `;
    } else {
         // Limpa o indicador de carregamento (será preenchido por renderTournaments)
         const loadingElement = tournamentsContainer.querySelector('.loading');
         if (loadingElement) {
             loadingElement.remove(); // Remove o elemento de carregamento
         }
    }
}

// Mostra mensagem de erro
function showError(message) {
     if (!tournamentsContainer) return; // Verifica se o container existe
    tournamentsContainer.innerHTML = `
        <div class="alert alert-danger">
            <i class="fas fa-exclamation-triangle"></i> ${message}
        </div>
    `;
}

// REMOVIDO: Função para formatar data não é mais necessária
// function formatDate(dateString) { ... }

// Função para obter parâmetros da URL (assumindo que existe no utils.js)
// Não necessário nesta página, mas importado em outras.
// function getUrlParams() { ... }

// Função para mostrar notificação (assumindo que existe no utils.js)
// Já importado do utils.js
// function showNotification(message, type = 'success', duration = 3000) { ... }
