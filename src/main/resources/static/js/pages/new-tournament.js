import { TournamentAPI, PlayerAPI } from '../api.js'; 
import { showNotification } from '../utils.js'; 

let selectedPlayers = []; 
let activeTournament = null; 


document.addEventListener('DOMContentLoaded', () => {
    const tournamentForm = document.getElementById('tournament-form');
    const tournamentNameInput = document.getElementById('tournament-name');
    const playerSearchInput = document.getElementById('player-search-input');
    const searchPlayerBtn = document.getElementById('search-player-btn');
    const playerSearchResults = document.getElementById('player-search-results');
    const selectedPlayersContainer = document.getElementById('selected-players-container');
    const selectedCountElement = document.getElementById('selected-count');
    const createTournamentBtn = document.getElementById('create-tournament-btn');
    const activeTournamentWarning = document.getElementById('active-tournament-warning');
    const viewActiveTournamentBtn = document.getElementById('view-active-tournament');
    const newTournamentFormSection = document.getElementById('new-tournament-form-section');
    const selectedPlayersError = document.getElementById('selected-players-error');

    const playerResultTemplate = document.getElementById('player-result-template');
    const selectedPlayerTemplate = document.getElementById('selected-player-template');

    checkActiveTournament();

    if (searchPlayerBtn) {
        searchPlayerBtn.addEventListener('click', searchPlayer);
    }
    if (playerSearchInput) {
        playerSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchPlayer(); 
            }
        });
    }

    if (tournamentForm) {
        tournamentForm.addEventListener('submit', createTournament); 
    }

    document.addEventListener('click', (e) => {
        if (playerSearchResults && !playerSearchResults.contains(e.target) && e.target !== playerSearchInput && e.target !== searchPlayerBtn) {
            playerSearchResults.innerHTML = ''; 
        }
    });

    renderSelectedPlayers();

    async function checkActiveTournament() {
        try {
            console.log("Verificando torneio ativo...");
            const allTournaments = await TournamentAPI.getAll();
            activeTournament = allTournaments.find(t => t.status === 'IN_PROGRESS');

            if (activeTournamentWarning && newTournamentFormSection && viewActiveTournamentBtn) {
                if (activeTournament) {
                    console.log("Torneio ativo encontrado. Mostrando aviso e escondendo formulário.");
                    activeTournamentWarning.classList.remove('hidden');
                    activeTournamentWarning.style.display = 'block'; 
                    newTournamentFormSection.style.display = 'none'; 
                    viewActiveTournamentBtn.href = `tournament-detail.html?id=${activeTournament.id}`;
                    console.log(`Torneio ativo encontrado: ${activeTournament.name} (ID: ${activeTournament.id})`);
                    console.log("Estado do aviso após tentar mostrar:", activeTournamentWarning.className, activeTournamentWarning.style.display); // Log de diagnóstico
                } else {
                    console.log("Nenhum torneio ativo encontrado. Escondendo aviso e mostrando formulário.");
                    activeTournamentWarning.classList.add('hidden'); 
                    activeTournamentWarning.style.display = 'none'; 
                    newTournamentFormSection.style.display = 'block'; 
                    console.log("Estado do aviso após tentar esconder:", activeTournamentWarning.className, activeTournamentWarning.style.display); // Log de diagnóstico
                }
            } else {
                 console.error("Elementos DOM para aviso de torneio ativo não encontrados!");
                 if (newTournamentFormSection) newTournamentFormSection.style.display = 'block';
            }

        } catch (error) {
            console.error('Erro ao verificar torneio ativo:', error);
            showNotification(`Erro ao verificar torneio ativo: ${error.message}`, 'error');
             if (activeTournamentWarning) {
                 activeTournamentWarning.classList.add('hidden'); 
                 activeTournamentWarning.style.display = 'none'; 
                 console.log("Estado do aviso após erro na API:", activeTournamentWarning.className, activeTournamentWarning.style.display); // Log de diagnóstico
             }
             if (newTournamentFormSection) newTournamentFormSection.style.display = 'block';
        }
    }


    async function searchPlayer() {
        if (!playerSearchInput) {
            console.error("Elemento #player-search-input não encontrado.");
            return;
        }

        const nickname = playerSearchInput.value.trim();

        if (!nickname) {
            showNotification('Digite um nickname para buscar.', 'warning');
            if (playerSearchResults) playerSearchResults.innerHTML = ''; 
            return;
        }

        if (playerSearchResults) {
            playerSearchResults.innerHTML = `
                <div class="search-loading">
                    <i class="fas fa-spinner fa-spin"></i> Buscando...
                </div>
            `;
        }


        try {
            console.log(`Buscando jogador por nickname: ${nickname}`);
            const player = await PlayerAPI.getByNickname(nickname);
            console.log("Jogador encontrado:", player);

            if (playerSearchResults) playerSearchResults.innerHTML = '';

            const isAlreadySelected = selectedPlayers.some(p => p.id === player.id);

            if (isAlreadySelected) {
                 if (playerSearchResults) playerSearchResults.innerHTML = '<div class="search-message">Jogador já selecionado.</div>';
                 return;
            }

             if (player.currentTournamentId) {
                  if (playerSearchResults) playerSearchResults.innerHTML = `<div class="search-message">Jogador já está em outro torneio ativo: ${player.currentTournamentName || 'Desconhecido'}.</div>`;
                  return;
             }


            if (!playerResultTemplate) {
                 console.error("Template #player-result-template não encontrado.");
                 return;
            }
            const resultElement = playerResultTemplate.content.cloneNode(true);

            const nicknameElement = resultElement.querySelector('.player-nickname');
            if(nicknameElement) nicknameElement.textContent = player.nickname || 'Sem Nickname';

            const nameElement = resultElement.querySelector('.player-name');
            if(nameElement) nameElement.textContent = player.name || 'Sem Nome';

            const ratingElement = resultElement.querySelector('.rating-value');
            if(ratingElement) ratingElement.textContent = player.rating || 0;

            const addButton = resultElement.querySelector('.add-player-btn');
            if(addButton) {
                 addButton.addEventListener('click', () => addPlayerToSelected(player));
            }

            if (playerSearchResults) playerSearchResults.appendChild(resultElement);

        } catch (error) {
            console.error('Erro ao buscar jogador:', error);
            if (playerSearchResults) playerSearchResults.innerHTML = '<div class="search-message">Jogador não encontrado ou erro na busca.</div>';
            showNotification(`Erro ao buscar jogador: ${error.message}`, 'error');
        }
    }

    function addPlayerToSelected(player) {
        if (selectedPlayers.length >= 8) {
            showNotification('Máximo de 8 jogadores já selecionados.', 'warning');
            return;
        }

        if (selectedPlayers.some(p => p.id === player.id)) {
            showNotification('Este jogador já foi adicionado.', 'warning');
            return;
        }

        selectedPlayers.push(player);
        console.log("Jogador adicionado:", player.nickname, "Total selecionados:", selectedPlayers.length);

        if (playerSearchInput) playerSearchInput.value = '';
        if (playerSearchResults) playerSearchResults.innerHTML = '';

        renderSelectedPlayers();
    }

    function removePlayerFromSelected(playerId) {
        selectedPlayers = selectedPlayers.filter(player => player.id !== playerId);
        console.log("Jogador removido com ID:", playerId, "Total selecionados:", selectedPlayers.length);

        renderSelectedPlayers();
    }


    function renderSelectedPlayers() {
        if (!selectedPlayersContainer || !selectedPlayerTemplate || !selectedCountElement || !createTournamentBtn || !selectedPlayersError) {
             console.error("Elementos DOM necessários para renderSelectedPlayers não encontrados.");
             return;
        }

        selectedPlayersContainer.innerHTML = ''; 

        selectedCountElement.textContent = selectedPlayers.length;

        selectedPlayers.forEach(player => {
            if (!selectedPlayerTemplate) { 
                console.error("Template #selected-player-template não encontrado durante iteração.");
                return;
            }
            const playerElement = selectedPlayerTemplate.content.cloneNode(true);

            const nicknameElement = playerElement.querySelector('.player-nickname');
            if(nicknameElement) nicknameElement.textContent = player.nickname || 'Sem Nickname';

            const nameElement = playerElement.querySelector('.player-name');
            if(nameElement) nameElement.textContent = player.name || 'Sem Nome';

            const ratingElement = playerElement.querySelector('.player-rating .rating-value');
            if(ratingElement) ratingElement.textContent = player.rating || 0;


            const removeButton = playerElement.querySelector('.remove-player-btn');
            if(removeButton) {
                 removeButton.addEventListener('click', () => removePlayerFromSelected(player.id));
            }

            selectedPlayersContainer.appendChild(playerElement);
        });

        updateCreateButtonState();
    }

    function updateCreateButtonState() {
        if (!createTournamentBtn || !selectedCountElement || !selectedPlayersError) {
             console.error("Elementos DOM necessários para updateCreateButtonState não encontrados.");
             return;
        }

        const count = selectedPlayers.length;
        const isValidCount = count >= 4 && count <= 8 && count % 2 === 0 & count != 6;

        createTournamentBtn.disabled = !isValidCount;

        if (!isValidCount && count > 0) {
             selectedPlayersError.textContent = 'Selecione entre 4 e 8 jogadores (número par).';
             selectedPlayersError.style.display = 'block';
        } else {
             selectedPlayersError.textContent = '';
             selectedPlayersError.style.display = 'none';
        }
    }


    async function createTournament(e) {
        e.preventDefault(); 

        if (!tournamentNameInput || !selectedPlayersError) {
            console.error("Elementos DOM necessários para createTournament não encontrados.");
            showNotification('Erro interno: Elementos do formulário não encontrados.', 'error');
            return;
        }

        const tournamentName = tournamentNameInput.value.trim();

        let isValid = true;
        const tournamentNameError = document.getElementById('tournament-name-error'); 
        if (tournamentNameError) {
             if (!tournamentName) {
                 tournamentNameError.textContent = 'Nome do torneio é obrigatório.';
                 tournamentNameError.style.display = 'block';
                 isValid = false;
             } else {
                 tournamentNameError.textContent = '';
                 tournamentNameError.style.display = 'none';
             }
        }

         const count = selectedPlayers.length;
         const isValidCount = count >= 4 && count <= 8 && count % 2 === 0;
         if (!isValidCount) {
             if (selectedPlayersError) {
                 selectedPlayersError.textContent = 'Selecione entre 4 e 8 jogadores (número par).';
                 selectedPlayersError.style.display = 'block';
             }
             isValid = false;
         }


        if (!isValid) {
            showNotification('Por favor, corrija os erros no formulário.', 'warning');
            return; 
        }


        try {
            const tournamentData = {
                name: tournamentName,
                playerIds: selectedPlayers.map(player => player.id)
            };

            console.log('Enviando dados do novo torneio para o servidor:', JSON.stringify(tournamentData));

            const createdTournament = await TournamentAPI.create(tournamentData);
            console.log('Torneio criado:', createdTournament);

            showNotification('Torneio criado com sucesso!', 'success');

            setTimeout(() => {
                window.location.href = `tournament-detail.html?id=${createdTournament.id}`;
            }, 2000); 

        } catch (error) {
            console.error('Erro ao criar torneio:', error);
             const errorMessage = error.message || 'Ocorreu um erro ao criar o torneio.';
            showNotification(`Erro ao criar torneio: ${errorMessage}`, 'error');
        }
    }


});
