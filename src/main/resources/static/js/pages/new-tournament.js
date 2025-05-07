// js/pages/new-tournament.js

// Importa as funções da API e utilitários
import { TournamentAPI, PlayerAPI } from '../api.js'; // Importa TournamentAPI e PlayerAPI
import { showNotification } from '../utils.js'; // Importa showNotification

// Estado da aplicação (declarado fora do DOMContentLoaded para um escopo mais amplo,
// embora a maioria das interações ocorra após o DOM estar pronto)
// No entanto, para garantir que estejam prontas quando o DOMContentLoaded rodar,
// vamos declará-las no topo do escopo do listener.
let selectedPlayers = []; // Lista de jogadores selecionados (objetos PlayerDTO)
let activeTournament = null; // Armazena o torneio ativo, se houver


document.addEventListener('DOMContentLoaded', () => {
    // Elementos do DOM (buscados uma vez ao carregar a página)
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

    // Templates (buscados uma vez ao carregar a página)
    const playerResultTemplate = document.getElementById('player-result-template');
    const selectedPlayerTemplate = document.getElementById('selected-player-template');

    // Inicialização
    // Verificar se já existe um torneio ativo ao carregar a página
    checkActiveTournament();

    // Configurar eventos
    if (searchPlayerBtn) {
        searchPlayerBtn.addEventListener('click', searchPlayer);
    }
    if (playerSearchInput) {
        playerSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Previne o comportamento padrão do Enter (submit)
                searchPlayer(); // Chama a função de busca
            }
        });
    }

    if (tournamentForm) {
        tournamentForm.addEventListener('submit', createTournament); // Lida com o envio do formulário
    }

    // Adicionar listener para fechar resultados de busca ao clicar fora
    document.addEventListener('click', (e) => {
        // Verifica se playerSearchResults existe antes de usar contains
        if (playerSearchResults && !playerSearchResults.contains(e.target) && e.target !== playerSearchInput && e.target !== searchPlayerBtn) {
            playerSearchResults.innerHTML = ''; // Limpa os resultados se clicar fora
        }
    });

    // Inicializa a exibição dos jogadores selecionados (vazio no início)
    renderSelectedPlayers();

    // --- Funções (definidas dentro do DOMContentLoaded para acessar variáveis acima) ---

    // Verifica se já existe um torneio ativo (IN_PROGRESS)
    async function checkActiveTournament() {
        try {
            console.log("Verificando torneio ativo...");
            // Busca todos os torneios e filtra no frontend
            const allTournaments = await TournamentAPI.getAll();
            // Atribui ao 'activeTournament' declarado no escopo do DOMContentLoaded
            activeTournament = allTournaments.find(t => t.status === 'IN_PROGRESS');

            // Verifica se os elementos DOM existem antes de manipulá-los
            if (activeTournamentWarning && newTournamentFormSection && viewActiveTournamentBtn) {
                // CORREÇÃO AQUI: Mostrar o aviso SE activeTournament FOI ENCONTRADO
                if (activeTournament) {
                    console.log("Torneio ativo encontrado. Mostrando aviso e escondendo formulário.");
                    activeTournamentWarning.classList.remove('hidden'); // Mostra o aviso
                    activeTournamentWarning.style.display = 'block'; // Garante que está visível
                    newTournamentFormSection.style.display = 'none'; // Esconde o formulário
                    // Configura o link para ver o torneio ativo
                    viewActiveTournamentBtn.href = `tournament-detail.html?id=${activeTournament.id}`;
                    console.log(`Torneio ativo encontrado: ${activeTournament.name} (ID: ${activeTournament.id})`);
                    console.log("Estado do aviso após tentar mostrar:", activeTournamentWarning.className, activeTournamentWarning.style.display); // Log de diagnóstico
                } else {
                    // CORREÇÃO AQUI: Ocultar o aviso SE activeTournament NÃO FOI ENCONTRADO
                    console.log("Nenhum torneio ativo encontrado. Escondendo aviso e mostrando formulário.");
                    activeTournamentWarning.classList.add('hidden'); // Oculta o aviso
                    activeTournamentWarning.style.display = 'none'; // Garante que está oculto
                    newTournamentFormSection.style.display = 'block'; // Mostra o formulário
                    console.log("Estado do aviso após tentar esconder:", activeTournamentWarning.className, activeTournamentWarning.style.display); // Log de diagnóstico
                }
            } else {
                 console.error("Elementos DOM para aviso de torneio ativo não encontrados!");
                 // Em caso de elementos faltando, ainda mostra o formulário por padrão
                 if (newTournamentFormSection) newTournamentFormSection.style.display = 'block';
            }

        } catch (error) {
            console.error('Erro ao verificar torneio ativo:', error);
            showNotification(`Erro ao verificar torneio ativo: ${error.message}`, 'error');
             // Em caso de erro, ainda mostra o formulário para permitir a criação
             // Verifica se os elementos DOM existem antes de manipulá-los
             if (activeTournamentWarning) {
                 activeTournamentWarning.classList.add('hidden'); // Oculta o aviso em caso de erro na API
                 activeTournamentWarning.style.display = 'none'; // Garante que está oculto
                 console.log("Estado do aviso após erro na API:", activeTournamentWarning.className, activeTournamentWarning.style.display); // Log de diagnóstico
             }
             if (newTournamentFormSection) newTournamentFormSection.style.display = 'block'; // Mostra o formulário
        }
    }


    // Busca jogador por nickname
    async function searchPlayer() {
        // Elementos DOM usados nesta função (já buscados no DOMContentLoaded)
        // Acessando diretamente as constantes declaradas no escopo do DOMContentLoaded
        if (!playerSearchInput) {
            console.error("Elemento #player-search-input não encontrado.");
            return;
        }

        const nickname = playerSearchInput.value.trim();

        if (!nickname) {
            showNotification('Digite um nickname para buscar.', 'warning');
            if (playerSearchResults) playerSearchResults.innerHTML = ''; // Limpa resultados anteriores
            return;
        }

        // Limpa resultados anteriores e mostra indicador de busca
        if (playerSearchResults) {
            playerSearchResults.innerHTML = `
                <div class="search-loading">
                    <i class="fas fa-spinner fa-spin"></i> Buscando...
                </div>
            `;
        }


        try {
            console.log(`Buscando jogador por nickname: ${nickname}`);
            // Chama a API para buscar por nickname
            const player = await PlayerAPI.getByNickname(nickname);
            console.log("Jogador encontrado:", player);

            // Limpa resultados anteriores
            if (playerSearchResults) playerSearchResults.innerHTML = '';

            // Verifica se o jogador já foi selecionado
            // Acessando 'selectedPlayers' declarado no escopo do DOMContentLoaded
            const isAlreadySelected = selectedPlayers.some(p => p.id === player.id);

            if (isAlreadySelected) {
                 if (playerSearchResults) playerSearchResults.innerHTML = '<div class="search-message">Jogador já selecionado.</div>';
                 return;
            }

             // Verifica se o jogador já está em um torneio ativo (usando currentTournamentId do DTO)
             // Assumindo que o PlayerDTO retornado pela API inclui currentTournamentId
             if (player.currentTournamentId) {
                  if (playerSearchResults) playerSearchResults.innerHTML = `<div class="search-message">Jogador já está em outro torneio ativo: ${player.currentTournamentName || 'Desconhecido'}.</div>`;
                  return;
             }


            // Renderiza o resultado da busca usando o template
            // Acessando 'playerResultTemplate' declarado no escopo do DOMContentLoaded
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

            const addButton = resultElement.querySelector('.add-player-btn'); // Botão de adicionar
            if(addButton) {
                 // Adiciona um listener para adicionar o jogador à lista de selecionados
                 addButton.addEventListener('click', () => addPlayerToSelected(player));
            }

            if (playerSearchResults) playerSearchResults.appendChild(resultElement);

        } catch (error) {
            console.error('Erro ao buscar jogador:', error);
            if (playerSearchResults) playerSearchResults.innerHTML = '<div class="search-message">Jogador não encontrado ou erro na busca.</div>';
            showNotification(`Erro ao buscar jogador: ${error.message}`, 'error');
        }
    }

    // Adiciona um jogador à lista de selecionados
    function addPlayerToSelected(player) {
        // Acessando 'selectedPlayers' declarado no escopo do DOMContentLoaded
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

        // Limpa os resultados da busca após adicionar
        // Acessando 'playerSearchInput' e 'playerSearchResults' declarados no escopo do DOMContentLoaded
        if (playerSearchInput) playerSearchInput.value = '';
        if (playerSearchResults) playerSearchResults.innerHTML = '';

        // Atualiza a exibição dos jogadores selecionados
        renderSelectedPlayers();
    }

    // Remove um jogador da lista de selecionados
    function removePlayerFromSelected(playerId) {
        // Acessando 'selectedPlayers' declarado no escopo do DOMContentLoaded
        selectedPlayers = selectedPlayers.filter(player => player.id !== playerId);
        console.log("Jogador removido com ID:", playerId, "Total selecionados:", selectedPlayers.length);

        // Atualiza a exibição dos jogadores selecionados
        renderSelectedPlayers();
    }


    // Renderiza a lista de jogadores selecionados
    function renderSelectedPlayers() {
        // Acessando elementos DOM e templates declarados no escopo do DOMContentLoaded
        if (!selectedPlayersContainer || !selectedPlayerTemplate || !selectedCountElement || !createTournamentBtn || !selectedPlayersError) {
             console.error("Elementos DOM necessários para renderSelectedPlayers não encontrados.");
             return;
        }

        selectedPlayersContainer.innerHTML = ''; // Limpa o contêiner

        // Acessando 'selectedPlayers' declarado no escopo do DOMContentLoaded
        selectedCountElement.textContent = selectedPlayers.length;

        selectedPlayers.forEach(player => {
            if (!selectedPlayerTemplate) { // Verificação adicional, embora já feita no início
                console.error("Template #selected-player-template não encontrado durante iteração.");
                return;
            }
            const playerElement = selectedPlayerTemplate.content.cloneNode(true);

            const nicknameElement = playerElement.querySelector('.player-nickname');
            if(nicknameElement) nicknameElement.textContent = player.nickname || 'Sem Nickname';

            const nameElement = playerElement.querySelector('.player-name');
            if(nameElement) nameElement.textContent = player.name || 'Sem Nome';

            const ratingElement = playerElement.querySelector('.player-rating .rating-value'); // Corrigido seletor
            if(ratingElement) ratingElement.textContent = player.rating || 0;


            const removeButton = playerElement.querySelector('.remove-player-btn'); // Botão de remover
            if(removeButton) {
                 // Adiciona um listener para remover o jogador
                 removeButton.addEventListener('click', () => removePlayerFromSelected(player.id));
            }

            selectedPlayersContainer.appendChild(playerElement);
        });

        // Atualiza o estado do botão "Criar Torneio" com base na contagem de jogadores
        updateCreateButtonState();
    }

    // Atualiza o estado (habilitado/desabilitado) do botão "Criar Torneio"
    function updateCreateButtonState() {
        // Acessando elementos DOM declarados no escopo do DOMContentLoaded
        if (!createTournamentBtn || !selectedCountElement || !selectedPlayersError) {
             console.error("Elementos DOM necessários para updateCreateButtonState não encontrados.");
             return;
        }

        // Acessando 'selectedPlayers' declarado no escopo do DOMContentLoaded
        const count = selectedPlayers.length;
        // Habilita se a contagem estiver entre 4 e 8 (inclusive) e for par
        const isValidCount = count >= 4 && count <= 8 && count % 2 === 0;

        createTournamentBtn.disabled = !isValidCount;

        // Adicionar feedback visual ou mensagem de erro se a contagem for inválida
        if (!isValidCount && count > 0) {
             selectedPlayersError.textContent = 'Selecione entre 4 e 8 jogadores (número par).';
             selectedPlayersError.style.display = 'block';
        } else {
             selectedPlayersError.textContent = '';
             selectedPlayersError.style.display = 'none';
        }
    }


    // Lida com o envio do formulário para criar o torneio
    async function createTournament(e) {
        e.preventDefault(); // Previne o envio padrão do formulário

        // Acessando elementos DOM declarados no escopo do DOMContentLoaded
        if (!tournamentNameInput || !selectedPlayersError) {
            console.error("Elementos DOM necessários para createTournament não encontrados.");
            showNotification('Erro interno: Elementos do formulário não encontrados.', 'error');
            return;
        }

        // Obter dados do formulário
        const tournamentName = tournamentNameInput.value.trim();

        // Validação no frontend (já feita no updateCreateButtonState, mas reforçamos aqui)
        let isValid = true;
        const tournamentNameError = document.getElementById('tournament-name-error'); // Buscar localmente se necessário
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

         // Re-valida a contagem de jogadores
         // Acessando 'selectedPlayers' declarado no escopo do DOMContentLoaded
         const count = selectedPlayers.length;
         const isValidCount = count >= 4 && count <= 8 && count % 2 === 0;
         if (!isValidCount) {
             // Exibe o erro se a contagem for inválida (já deveria estar visível pelo updateCreateButtonState)
             if (selectedPlayersError) {
                 selectedPlayersError.textContent = 'Selecione entre 4 e 8 jogadores (número par).';
                 selectedPlayersError.style.display = 'block';
             }
             isValid = false;
         }


        if (!isValid) {
            showNotification('Por favor, corrija os erros no formulário.', 'warning');
            return; // Interrompe se a validação falhar
        }


        try {
            // Preparar dados para enviar ao backend
            const tournamentData = {
                name: tournamentName,
                // Envia apenas os IDs dos jogadores selecionados
                // Acessando 'selectedPlayers' declarado no escopo do DOMContentLoaded
                playerIds: selectedPlayers.map(player => player.id)
            };

            console.log('Enviando dados do novo torneio para o servidor:', JSON.stringify(tournamentData));

            // Chama a API para criar o torneio
            const createdTournament = await TournamentAPI.create(tournamentData);
            console.log('Torneio criado:', createdTournament);

            // Mostrar notificação de sucesso
            showNotification('Torneio criado com sucesso!', 'success');

            // Redirecionar para a página de detalhes do torneio recém-criado
            // Pequeno delay para a notificação ser visível
            setTimeout(() => {
                window.location.href = `tournament-detail.html?id=${createdTournament.id}`;
            }, 1500); // Redireciona após 1.5 segundos

        } catch (error) {
            console.error('Erro ao criar torneio:', error);
             const errorMessage = error.message || 'Ocorreu um erro ao criar o torneio.';
            showNotification(`Erro ao criar torneio: ${errorMessage}`, 'error');
        }
    }

    // TODO: Adicionar lógica de validação mais robusta (ex: nome único do torneio - validação no backend)
    // TODO: Adicionar loading state visual durante as chamadas de API (busca de jogador, criação de torneio)

}); // Fim do DOMContentLoaded listener
