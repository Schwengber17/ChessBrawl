// Corrigindo o erro de "Cannot set properties of null (setting 'textContent')"
document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const playerForm = document.getElementById('player-form');
    const playersList = document.getElementById('players-list');
    const playerModal = document.getElementById('player-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const playerFormTitle = document.getElementById('player-form-title');
    
    let currentPlayerId = null;
    
    // Carregar jogadores ao iniciar
    fetchPlayers();
    
    // Event listeners
    if (playerForm) {
        playerForm.addEventListener('submit', handlePlayerSubmit);
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    
    // Funções
    async function fetchPlayers() {
        try {
            console.log('Iniciando busca de jogadores...');
            
            // Mostrar indicador de carregamento
            const playersList = document.getElementById('players-list');
            if (playersList) {
                playersList.innerHTML = '<tr><td colspan="4" class="text-center">Carregando jogadores...</td></tr>';
            }
            
            const response = await fetch('http://localhost:8080/api/players');
            console.log('Resposta da API:', response);
            
            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }
            
            const players = await response.json();
            console.log('Jogadores recebidos:', players);
            
            renderPlayers(players);
        } catch (error) {
            console.error('Erro ao buscar jogadores:', error);
            
            // Mostrar mensagem de erro na interface
            const playersList = document.getElementById('players-list');
            if (playersList) {
                playersList.innerHTML = `<tr><td colspan="4" class="text-center text-danger">
                    Erro ao carregar jogadores: ${error.message}
                </td></tr>`;
            }
        }
    }
    
    function renderPlayers(players) {
        if (!playersList) return;
        
        playersList.innerHTML = '';
        
        if (players.length === 0) {
            playersList.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum jogador cadastrado</td></tr>';
            return;
        }
        
        players.forEach(player => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${player.nickname}</td>
                <td>${player.name}</td>
                <td>${player.rating}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-player" data-id="${player.id}">Editar</button>
                    <button class="btn btn-sm btn-danger delete-player" data-id="${player.id}">Excluir</button>
                </td>
            `;
            
            playersList.appendChild(row);
            
            // Adicionar event listeners aos botões
            row.querySelector('.edit-player').addEventListener('click', () => openEditModal(player));
            row.querySelector('.delete-player').addEventListener('click', () => deletePlayer(player.id));
        });
    }
    
    function openEditModal(player) {
        currentPlayerId = player.id;
        
        // Verificar se o elemento existe antes de definir textContent
        if (playerFormTitle) {
            playerFormTitle.textContent = 'Editar Jogador';
        }
        
        const nicknameInput = document.getElementById('player-nickname');
        const nameInput = document.getElementById('player-name');
        const ratingInput = document.getElementById('player-rating');
        
        if (nicknameInput) nicknameInput.value = player.nickname;
        if (nameInput) nameInput.value = player.name;
        if (ratingInput) ratingInput.value = player.rankingPoints;
        
        if (playerModal) {
            playerModal.classList.add('show');
            playerModal.style.display = 'block';
        }
    }
    
    function openCreateModal() {
        currentPlayerId = null;
        
        // Verificar se o elemento existe antes de definir textContent
        if (playerFormTitle) {
            playerFormTitle.textContent = 'Novo Jogador';
        }
        
        const nicknameInput = document.getElementById('player-nickname');
        const nameInput = document.getElementById('player-name');
        const ratingInput = document.getElementById('player-rating');
        
        if (nicknameInput) nicknameInput.value = '';
        if (nameInput) nameInput.value = '';
        if (ratingInput) ratingInput.value = '1000';
        
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
    
    async function handlePlayerSubmit(e) {
        e.preventDefault();
        
        const nicknameInput = document.getElementById('player-nickname');
        const nameInput = document.getElementById('player-name');
        const ratingInput = document.getElementById('player-rating');
        
        if (!nicknameInput || !nameInput || !ratingInput) {
            showNotification('Erro: Elementos do formulário não encontrados', 'error');
            return;
        }
        
        // Obter dados do formulário
        const nickname = nicknameInput.value.trim();
        const name = nameInput.value.trim();
        const rating = parseInt(ratingInput.value);
        
        // Validação básica
        if (!nickname || !name || isNaN(rating)) {
            showNotification('Preencha todos os campos corretamente', 'error');
            return;
        }
        
        // Preparar dados
        const playerData = {
            nickname: nickname,
            name: name,
            rankingPoints: rating,
            // Inicializar outros campos com valores padrão
            tournamentPoints: 0,
            originalMoves: 0,
            blunders: 0,
            advantagousPositions: 0,
            disrespectfulBehavior: 0,
            rageAttacks: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            gamesPlayed: 0,
            movesMade: 0
        };
        
        if (currentPlayerId) {
            playerData.id = currentPlayerId;
        }
        
        console.log('Enviando dados para o servidor:', JSON.stringify(playerData));
        
        try {
            const url = currentPlayerId 
                ? `http://localhost:8080/api/players/${currentPlayerId}`
                : 'http://localhost:8080/api/players';
            
            const response = await fetch(url, {
                method: currentPlayerId ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(playerData)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('Resposta do servidor:', result);
            
            showNotification(currentPlayerId ? 'Jogador atualizado com sucesso!' : 'Jogador criado com sucesso!', 'success');
            closeModal();
            fetchPlayers();
        } catch (error) {
            console.error('Erro ao salvar jogador:', error);
            showNotification(`Erro ao salvar jogador: ${error.message}`, 'error');
        }
    }
    
    async function deletePlayer(id) {
        if (!confirm('Tem certeza que deseja excluir este jogador?')) {
            return;
        }
        
        try {
            const response = await fetch(`http://localhost:8080/api/players/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }
            
            showNotification('Jogador excluído com sucesso!', 'success');
            fetchPlayers();
        } catch (error) {
            console.error('Erro ao excluir jogador:', error);
            showNotification(`Erro ao excluir jogador: ${error.message}`, 'error');
        }
    }
    
    // Função para mostrar notificações
    function showNotification(message, type) {
        // Implementação simples de notificação
        alert(message);
    }
    
    // Adicionar botão para criar novo jogador
    const newPlayerBtn = document.getElementById('new-player-btn');
    if (newPlayerBtn) {
        newPlayerBtn.addEventListener('click', openCreateModal);
    }
});