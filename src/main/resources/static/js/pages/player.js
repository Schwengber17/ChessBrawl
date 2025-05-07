// js/pages/player.js

// Importa as funções da API e utilitários
import { PlayerAPI } from '../api.js';
// REMOVIDO formatDate da importação
import { showNotification } from '../utils.js'; // Importa a função de notificação do utils.js
// Importe outras funções de utils.js se necessário (ex: getUrlParams, validateForm, etc.)
// import { getUrlParams, showNotification, validateForm } from '../utils.js';


document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const playerForm = document.getElementById('player-form');
    const playersList = document.getElementById('players-list');
    const playerModal = document.getElementById('player-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const playerFormTitle = document.getElementById('player-form-title');
    const newPlayerBtn = document.getElementById('new-player-btn'); // Botão "Novo Jogador"
    const searchPlayerInput = document.getElementById('search-player-input'); // Input de busca
    const searchPlayerButton = document.getElementById('search-player-button'); // Botão de busca
    // const notificationArea = document.getElementById('notification-area'); // Área de notificação (se existir, utils.js pode gerenciar globalmente)


    let currentPlayerId = null; // Armazena o ID do jogador sendo editado

    // Carregar jogadores ao iniciar a página
    fetchPlayers();

    // Event listeners
    if (playerForm) {
        playerForm.addEventListener('submit', handlePlayerSubmit);
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    // Adicionar evento para abrir modal de criação
    if (newPlayerBtn) {
        newPlayerBtn.addEventListener('click', openCreateModal);
    }

    // Adicionar evento para o botão de busca
    if (searchPlayerButton) {
        searchPlayerButton.addEventListener('click', handlePlayerSearch);
    }

    // Adicionar evento para buscar ao pressionar Enter no input de busca
    if (searchPlayerInput) {
        searchPlayerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Previne o comportamento padrão do Enter (submit)
                handlePlayerSearch(); // Chama a função de busca
            }
        });
    }

    // Adicionar listener para fechar modal clicando fora dele
    if (playerModal) {
         window.addEventListener('click', windowClickHandler);
    }


    // Funções

    // Busca todos os jogadores ou filtra por termo de busca
    async function fetchPlayers(searchTerm = '') {
        try {
            console.log('Iniciando busca de jogadores com termo:', searchTerm);

            // Mostrar indicador de carregamento na tabela
            if (playersList) {
                playersList.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center py-4">
                            <i class="fas fa-spinner fa-spin"></i> Carregando jogadores...
                        </td>
                    </tr>
                `;
            }

            let players = [];
            if (searchTerm) {
                 // Se houver termo de busca, tenta buscar por nickname exato primeiro
                 // Se a API do backend tiver um endpoint de busca por termo (ex: /api/players/search?q=...), use-o aqui.
                 // Por enquanto, usamos getByNickname que busca um jogador exato.
                 try {
                     const player = await PlayerAPI.getByNickname(searchTerm);
                     if (player) {
                         players = [player]; // Se encontrou um jogador, coloca em uma lista
                         showNotification(`Jogador encontrado com nickname "${searchTerm}".`, 'info');
                     } else {
                         players = []; // Se não encontrou, lista vazia
                         showNotification(`Nenhum jogador encontrado com o nickname "${searchTerm}".`, 'warning');
                     }
                 } catch (error) {
                      // Se getByNickname falhar (ex: 404 Not Found), trata como nenhum jogador encontrado
                     console.warn(`Erro ao buscar jogador por nickname "${searchTerm}":`, error);
                     players = [];
                     showNotification(`Erro ao buscar jogador por nickname "${searchTerm}".`, 'error');
                 }

            } else {
                // Se não houver termo de busca, busca todos os jogadores
                players = await PlayerAPI.getAll();
                console.log('Todos os jogadores recebidos:', players);
            }

            renderPlayers(players); // Renderiza a lista de jogadores recebida

        } catch (error) {
            console.error('Erro ao buscar jogadores:', error);
            // Mostrar mensagem de erro na interface
            if (playersList) {
                playersList.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center py-4 text-red-500">
                            <i class="fas fa-exclamation-triangle"></i> Erro ao carregar jogadores: ${error.message}
                        </td>
                    </tr>
                `;
            }
            showNotification(`Erro ao carregar jogadores: ${error.message}`, 'error'); // Usando showNotification do utils.js
        }
    }

    // Lida com a ação de busca de jogador (chamada pelo botão ou Enter)
    function handlePlayerSearch() {
        const searchTerm = searchPlayerInput.value.trim();
        fetchPlayers(searchTerm); // Chama fetchPlayers com o termo de busca
    }


    // Renderiza a lista de jogadores na tabela HTML
    function renderPlayers(players) {
        if (!playersList) return; // Verifica se o elemento da tabela existe

        playersList.innerHTML = ''; // Limpa o corpo da tabela

        if (!players || players.length === 0) {
            playersList.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-4">Nenhum jogador cadastrado</td>
                </tr>
            `;
            return;
        }

        // Ordena jogadores por nickname (opcional, pode adicionar outras opções de ordenação)
        players.sort((a, b) => (a.nickname || '').localeCompare(b.nickname || ''));


        players.forEach(player => {
            const row = document.createElement('tr');
            // Adiciona classes Tailwind para estilização da linha da tabela
            row.className = 'border-b border-gray-200 hover:bg-gray-100';

            // Preenche as células da linha com os dados do jogador
            row.innerHTML = `
                <td class="py-3 px-6 text-left whitespace-nowrap">
                     <div class="flex items-center">
                        <span class="font-medium">${player.nickname || 'Sem Nickname'}</span>
                    </div>
                </td>
                <td class="py-3 px-6 text-left">
                    <div class="flex items-center">
                        <span>${player.name || 'Sem Nome'}</span>
                    </div>
                </td>
                <td class="py-3 px-6 text-left">
                     <div class="flex items-center">
                        <span>${player.rating || 0}</span> </div>
                </td>
                <td class="py-3 px-6 text-center">
                    <div class="flex item-center justify-center space-x-4"> <a href="player-detail.html?id=${player.id}" class="w-4 mr-2 transform hover:text-blue-500 hover:scale-110" title="Ver Detalhes">
                            <i class="fas fa-eye"></i> </a>
                        <button class="w-4 mr-2 transform hover:text-yellow-500 hover:scale-110 edit-player" data-id="${player.id}" title="Editar Jogador">
                            <i class="fas fa-edit"></i> </button>
                        <button class="w-4 mr-2 transform hover:text-red-500 hover:scale-110 delete-player" data-id="${player.id}" title="Excluir Jogador">
                            <i class="fas fa-trash-alt"></i> </button>
                    </div>
                </td>
            `;

            playersList.appendChild(row); // Adiciona a linha ao corpo da tabela

            // Adicionar event listeners aos botões "Editar" e "Excluir"
            // Usando classes para selecionar os botões dentro da linha recém-adicionada
            row.querySelector('.edit-player').addEventListener('click', () => openEditModal(player));
            row.querySelector('.delete-player').addEventListener('click', () => deletePlayer(player.id));
        });
    }

    // Abre o modal para edição de jogador
    function openEditModal(player) {
        currentPlayerId = player.id; // Define o ID do jogador atual

        // Atualiza o título do modal
        if (playerFormTitle) {
            playerFormTitle.textContent = 'Editar Jogador';
        }

        // Preenche o formulário do modal com os dados do jogador
        const nicknameInput = document.getElementById('player-nickname');
        const nameInput = document.getElementById('player-name');
        const ratingInput = document.getElementById('player-rating');
        const playerIdInput = document.getElementById('player-id'); // Campo oculto para o ID

        if (nicknameInput) nicknameInput.value = player.nickname || '';
        if (nameInput) nameInput.value = player.name || '';
        if (ratingInput) ratingInput.value = player.rating || 1000; // Usando player.rating, valor padrão 1000
        if (playerIdInput) playerIdInput.value = player.id || ''; // Define o ID no campo oculto

        clearFormErrors();

        if (playerModal) {
            playerModal.classList.add('show');
            playerModal.style.display = 'block';
        }
    }

    function openCreateModal() {
        currentPlayerId = null; 

        if (playerFormTitle) {
            playerFormTitle.textContent = 'Novo Jogador';
        }

        const nicknameInput = document.getElementById('player-nickname');
        const nameInput = document.getElementById('player-name');
        const ratingInput = document.getElementById('player-rating');
        const playerIdInput = document.getElementById('player-id'); 

        if (nicknameInput) nicknameInput.value = '';
        if (nameInput) nameInput.value = '';
        if (ratingInput) ratingInput.value = '1000'; // Valor padrão para novo jogador
        if (playerIdInput) playerIdInput.value = ''; 

        clearFormErrors();

        if (playerModal) {
            playerModal.classList.add('show');
            playerModal.style.display = 'block';
        }
    }

    function closeModal() {
        if (playerModal) {
            playerModal.classList.remove('show');
            playerModal.style.display = 'none';
        }
    }

    function windowClickHandler(event) {
        if (event.target === playerModal) {
            closeModal(); 
        }
    }


    async function handlePlayerSubmit(e) {
        e.preventDefault(); 

        const nicknameInput = document.getElementById('player-nickname');
        const nameInput = document.getElementById('player-name');
        const ratingInput = document.getElementById('player-rating');

        if (!nicknameInput || !nameInput || !ratingInput) {
            showNotification('Erro interno: Elementos do formulário não encontrados', 'error');
            return;
        }

        const nickname = nicknameInput.value.trim();
        const name = nameInput.value.trim();
        const rating = parseInt(ratingInput.value);

        let isValid = true;
        clearFormErrors();

        if (!nickname) {
             displayFieldError('nickname-error', 'Nickname é obrigatório.');
             isValid = false;
        }
         if (!name) {
             displayFieldError('name-error', 'Nome completo é obrigatório.');
             isValid = false;
         }

        if (isNaN(rating) || rating <= 1 || rating >= 15000) {
            displayFieldError('rating-error', 'Rating deve ser um número entre 1 e 15000.');
            isValid = false;
        }

        if (!isValid) {
             showNotification('Por favor, corrija os erros no formulário.', 'warning');
             return; 
        }

        const playerData = {
            nickname: nickname,
            name: name,
            rating: rating, 
        };

        console.log('Enviando dados para o servidor:', JSON.stringify(playerData));

        try {
            let result;
            if (currentPlayerId) {
                console.log(`Atualizando jogador com ID: ${currentPlayerId}`);
                result = await PlayerAPI.update(currentPlayerId, playerData);
                showNotification('Jogador atualizado com sucesso!', 'success');
            } else {
                 console.log('Criando novo jogador...');
                result = await PlayerAPI.create(playerData);
                showNotification('Jogador criado com sucesso!', 'success');
            }

            console.log('Resposta do servidor:', result);

            closeModal();
            fetchPlayers(); 

        } catch (error) {
            console.error('Erro ao salvar jogador:', error);
            const errorMessage = error.message || 'Ocorreu um erro ao salvar o jogador.';
            showNotification(`Erro ao salvar jogador: ${errorMessage}`, 'error');

        }
    }

    async function deletePlayer(id) {
        
        if (!confirm('Tem certeza que deseja excluir este jogador? Esta ação é irreversível.')) {
            return; 
        }

        try {
            console.log(`Excluindo jogador com ID: ${id}`);
            await PlayerAPI.delete(id); 

            showNotification('Jogador excluído com sucesso!', 'success');
            fetchPlayers();

        } catch (error) {
            console.error('Erro ao excluir jogador:', error);
             const errorMessage = error.message || 'Ocorreu um erro ao excluir o jogador.';
            showNotification(`Erro ao excluir jogador: ${errorMessage}`, 'error');
        }
    }


    function displayFieldError(errorElementId, message) {
         const errorElement = document.getElementById(errorElementId);
         if (errorElement) {
             errorElement.textContent = message;
             errorElement.style.display = 'block'; 
             const inputId = errorElementId.replace('-error', '');
             const inputElement = document.getElementById(inputId);
             if (inputElement) {
                 inputElement.classList.add('is-invalid'); 
             }
         }
    }

    function clearFormErrors() {
         const errorElements = playerForm.querySelectorAll('.form-error');
         errorElements.forEach(el => {
             el.textContent = '';
             el.style.display = 'none'; 
         });
          const invalidInputs = playerForm.querySelectorAll('.is-invalid');
          invalidInputs.forEach(el => {
              el.classList.remove('is-invalid');
          });
    }

    

});
