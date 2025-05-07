// js/pages/tournaments.js

// Importa as funções da API e utilitários
import { TournamentAPI } from '../api.js'; // Importa as funções da API de Torneio
import { showNotification } from '../utils.js'; // Importa função de notificação

document.addEventListener('DOMContentLoaded', () => {
    // Elementos do DOM
    const tournamentsContainer = document.getElementById('tournaments-container');
    const tournamentCardTemplate = document.getElementById('tournament-card-template');
    const tabButtons = document.querySelectorAll('.tournament-status-tabs .tab-btn');

    // Estado da aplicação
    let allTournaments = []; // Armazenará todos os torneios carregados

    // Carrega e exibe torneios
    async function loadTournaments() {
        // Mostra indicador de carregamento
        if (tournamentsContainer) {
            tournamentsContainer.innerHTML = `
                <div class="loading">
                    <i class="fas fa-spinner fa-spin"></i> Carregando torneios...
                </div>
            `;
        }


        try {
            // Busca todos os torneios usando a API
            console.log("Buscando todos os torneios...");
            const tournaments = await TournamentAPI.getAll();
            console.log("Torneios recebidos:", tournaments);

            allTournaments = tournaments; // Armazena todos os torneios

            // Exibe os torneios com base no filtro ativo (inicialmente 'active')
            displayTournaments(getActiveStatusFilter());

        } catch (error) {
            console.error('Erro ao carregar torneios:', error);
            // Mostra mensagem de erro na interface
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

    // Exibe torneios com base em um filtro de status
    function displayTournaments(statusFilter) {
        if (!tournamentsContainer || !tournamentCardTemplate) {
             console.error("Elementos DOM necessários para exibir torneios não encontrados.");
             return;
        }

        tournamentsContainer.innerHTML = ''; // Limpa o contêiner

        // Filtra os torneios
        const filteredTournaments = allTournaments.filter(tournament => {
            if (statusFilter === 'all') {
                return true; // Exibe todos
            }
            if (statusFilter === 'active') {
                 // Considera 'CREATED' e 'IN_PROGRESS' como ativos
                 return tournament.status === 'CREATED' || tournament.status === 'IN_PROGRESS';
            }
            // Para outros status (ex: 'FINISHED'), compara diretamente
            return tournament.status === statusFilter.toUpperCase();
        });

        // Verifica se há torneios para exibir após a filtragem
        if (filteredTournaments.length === 0) {
            tournamentsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chess-board"></i>
                    <p>Nenhum torneio encontrado ${statusFilter === 'active' ? 'ativo' : statusFilter === 'finished' ? 'finalizado' : ''}.</p>
                </div>
            `;
            return;
        }

        // Renderiza os torneios filtrados
        filteredTournaments.forEach(tournament => {
            const cardClone = document.importNode(tournamentCardTemplate.content, true);

            // Preenche os dados do template
            const nameElement = cardClone.querySelector('.tournament-name');
            if(nameElement) nameElement.textContent = tournament.name || 'Torneio sem nome';

            const statusElement = cardClone.querySelector('.tournament-status');
            if(statusElement) {
                 statusElement.textContent = getStatusText(tournament.status); // Usa função auxiliar para texto amigável
                 statusElement.className += ` status-${(tournament.status || '').toLowerCase()}`; // Adiciona classe para estilizar status
            }

            // Assumindo que o DTO do torneio retorna playerCount e roundCount
            const playerCountElement = cardClone.querySelector('.player-count');
             if(playerCountElement) playerCountElement.textContent = tournament.playerCount || 0;

            const roundCountElement = cardClone.querySelector('.round-count');
             if(roundCountElement) roundCountElement.textContent = tournament.roundCount || 0;


            // Configura o link "Ver Detalhes"
            const viewDetailsLink = cardClone.querySelector('.view-tournament');
            if(viewDetailsLink) {
                 // Passa o ID do torneio na URL para a página de detalhes
                 viewDetailsLink.href = `tournament-detail.html?id=${tournament.id}`;
            }


            // Configura o botão "Excluir"
            const deleteButton = cardClone.querySelector('.delete-tournament');
            if(deleteButton) {
                 // Adiciona um listener de evento em vez de onclick no HTML
                 deleteButton.addEventListener('click', () => {
                     deleteTournament(tournament.id); // Chama a função de exclusão com o ID do torneio
                 });
                 // Desabilita o botão de exclusão se o torneio não estiver no status CREATED
                 if (tournament.status !== 'CREATED') {
                     deleteButton.style.display = 'none'; // Ou deleteButton.disabled = true; e estilizar
                 }
            }


            // Adiciona o card ao contêiner
            tournamentsContainer.appendChild(cardClone);
        });
    }

    // Lida com a exclusão de torneio
    async function deleteTournament(tournamentId) {
        // Exibe uma caixa de confirmação antes de excluir
        if (!confirm('Tem certeza que deseja excluir este torneio? Esta ação é irreversível e excluirá todas as rodadas, partidas e eventos associados.')) {
            return; // Cancela a exclusão se o usuário não confirmar
        }

        try {
            console.log(`Excluindo torneio com ID: ${tournamentId}`);
            // Chama o método delete da TournamentAPI
            await TournamentAPI.delete(tournamentId);

            showNotification('Torneio excluído com sucesso!', 'success');
            // Recarrega a lista após a exclusão para remover o torneio excluído
            loadTournaments();

        } catch (error) {
            console.error('Erro ao excluir torneio:', error);
             const errorMessage = error.message || 'Ocorreu um erro ao excluir o torneio.';
            showNotification(`Erro ao excluir torneio: ${errorMessage}`, 'error');
        }
    }


    // Adiciona listeners para os botões de status
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove a classe 'active' de todos os botões
            tabButtons.forEach(btn => btn.classList.remove('active'));
            // Adiciona a classe 'active' ao botão clicado
            button.classList.add('active');

            const statusFilter = button.dataset.status; // Obtém o filtro do atributo data-status
            displayTournaments(statusFilter); // Exibe os torneios com o novo filtro
        });
    });

    // Função auxiliar para obter o filtro de status ativo no momento
    function getActiveStatusFilter() {
        const activeTab = document.querySelector('.tournament-status-tabs .tab-btn.active');
        // Retorna o valor do data-status do botão ativo, ou 'all' como padrão
        return activeTab ? activeTab.dataset.status : 'all';
    }

    // Função auxiliar para converter status do torneio para texto amigável
    function getStatusText(status) {
      switch (status) {
        case "CREATED": return "Criado";
        case "IN_PROGRESS": return "Em Andamento";
        case "FINISHED": return "Finalizado";
        default: return status || 'Desconhecido';
      }
    }


    // Carrega os torneios ao carregar a página
    loadTournaments();
});
