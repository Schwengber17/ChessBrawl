// js/pages/match-detail.js

// Importa as funções da API e utilitários
import { MatchAPI, RoundAPI } from '../api.js'; // Importa MatchAPI e RoundAPI
// Importa utilitários. Garanta que estas funções estejam exportadas em utils.js
// CORREÇÃO AQUI: Garante que getMatchStatusText e outras funções utilitárias estão importadas
import { getUrlParams, showNotification, getStatusText, getRoundStatusText, getMatchStatusText, getEventTypeText, getEventIcon, getEventClass } from '../utils.js'; // Inclui funções de status e evento

// Elementos DOM
const matchLoading = document.getElementById('match-loading');
const matchContent = document.getElementById('match-content');
const player1NicknameElement = document.getElementById('player1-nickname');
const player1NameElement = document.getElementById('player1-name');
const player2NicknameElement = document.getElementById('player2-nickname');
const player2NameElement = document.getElementById('player2-name');
const matchRoundElement = document.getElementById('match-round');
const matchStatusElement = document.getElementById('match-status');
const backBtn = document.getElementById('back-btn'); // Botão Voltar


// Seções de Ação e Eventos
const startMatchBtn = document.getElementById('start-match-btn'); // Botão Iniciar Partida
const finishMatchBtn = document.getElementById('finish-match-btn'); // Botão Finalizar Partida - VERIFIQUE SE ESTE ID CORRESPONDE AO SEU HTML
const registerEventSection = document.getElementById('register-event-section'); // Seção Registrar Evento
const finishMatchSection = document.getElementById('finish-match-section'); // Seção Finalizar Partida
const eventsSection = document.getElementById('events-section'); // Seção Eventos Registrados

// Elementos do Formulário de Eventos
const eventForm = document.getElementById('event-form');
const eventTypeSelect = document.getElementById('event-type');
const eventPlayerSelect = document.getElementById('event-player');
const eventsContainer = document.getElementById('events-container'); // Contêiner para listar eventos

// Templates
const eventTemplate = document.getElementById('event-template');


// Estado da aplicação
let currentMatch = null;
let currentRound = null; // Para ter acesso ao número da rodada
let tournamentId = null;
let roundId = null;
let matchId = null;


// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    console.log('Página match-detail.js carregada.');
    const params = getUrlParams(); // Usando getUrlParams do utils.js
    tournamentId = params.tournamentId; // Obter ID do torneio da URL
    roundId = params.roundId; // Obter ID da rodada da URL
    matchId = params.matchId; // Obter ID da partida da URL

    if (!tournamentId || !roundId || !matchId) {
        showNotification('Parâmetros da partida não especificados na URL.', 'error');
        // Redireciona após um pequeno delay se os IDs estiverem faltando
        setTimeout(() => {
             window.location.href = 'tournaments.html'; // Redireciona para a lista de torneios
        }, 2000);
        return;
    }

    // Carregar dados da partida e rodada
    loadMatchData(tournamentId, roundId, matchId);

    // Adicionar event listeners aos botões (verificando se existem)
    if (backBtn) backBtn.addEventListener('click', goBack); else console.warn("Botão #back-btn não encontrado.");
    if (startMatchBtn) startMatchBtn.addEventListener('click', startMatch); else console.warn("Botão #start-match-btn não encontrado.");

    // --- NOVO: Adicionar listener ao botão Finalizar Partida ---
    if (finishMatchBtn) {
        finishMatchBtn.addEventListener('click', handleFinishMatch);
    } else {
        console.warn("Botão #finish-match-btn não encontrado. Verifique o ID no HTML.");
    }

    // Adicionar event listener para o formulário de eventos (chamando handleEventFormSubmit)
    if (eventForm) {
        eventForm.addEventListener('submit', handleEventFormSubmit);
    } else {
        console.warn("Formulário de evento (#event-form) não encontrado.");
    }


}); // Fim do DOMContentLoaded listener


// Carrega os dados da partida e da rodada
async function loadMatchData(tournamentId, roundId, matchId) {
    try {
        showLoading(true); // Mostra carregamento
        console.log(`Carregando dados da partida ${matchId} da rodada ${roundId} do torneio ${tournamentId}...`);

        // Buscar dados da partida usando MatchAPI
        // Passar tournamentId, roundId e matchId para MatchAPI.getById
        currentMatch = await MatchAPI.getById(tournamentId, roundId, matchId);
        console.log('Dados da partida carregados:', currentMatch);


        // Buscar dados da rodada para exibir o número da rodada
        // Passar tournamentId e roundId para RoundAPI.getById
        currentRound = await RoundAPI.getById(tournamentId, roundId); // Usando tournamentId e roundId
        console.log('Dados da rodada carregados:', currentRound);


        // TODO: Carregar eventos da partida (se houver)
        // Assumindo que MatchAPI.getEvents(tournamentId, roundId, matchId) existe.
        // loadMatchEvents(tournamentId, roundId, matchId); // Passar todos os IDs
        // CORREÇÃO: Chamar loadMatchEvents aqui para carregar os eventos ao carregar a página
        loadMatchEvents(matchId); // Usando a versão que espera apenas matchId no frontend por enquanto


        renderMatchData(); // Renderiza os dados principais e controla a visibilidade das seções

    } catch (error) {
        console.error('Erro ao carregar dados da partida:', error);
        showNotification(`Erro ao carregar dados da partida: ${error.message}`, 'error');
         // Opcional: Redirecionar ou mostrar um estado de erro na interface
         // setTimeout(() => { window.location.href = `tournament-detail.html?id=${tournamentId}`; }, 2000);
    } finally {
        showLoading(false); // Esconde carregamento
    }
}

// Renderiza os dados da partida e controla a visibilidade das seções
function renderMatchData() {
    if (!currentMatch || !currentMatch.status) {
        console.error("Dados da partida não carregados para renderizar.");
        // showNotification("Erro interno ao exibir dados da partida.", "error"); // Evita notificação duplicada
        return;
    }

    // Verifica se os elementos DOM existem antes de definir o texto
    if (player1NicknameElement) player1NicknameElement.textContent = currentMatch.player1Nickname || 'Jogador 1';
    if (player1NameElement) player1NameElement.textContent = currentMatch.player1Name || '';
    if (player2NicknameElement) player2NicknameElement.textContent = currentMatch.player2Nickname || 'Jogador 2';
    if (player2NameElement) player2NameElement.textContent = currentMatch.player2Name || '';

    // Exibe o número da rodada (se os dados da rodada foram carregados)
    if (matchRoundElement && currentRound) {
         matchRoundElement.textContent = `Rodada ${currentRound.roundNumber || '?'}`;
    } else if (matchRoundElement) {
         matchRoundElement.textContent = 'Rodada Desconhecida';
    }


    // Exibe o status da partida usando a função utilitária
    if (matchStatusElement) {
        // Usa getMatchStatusText importado do utils.js
        // getMatchStatusText espera o status e o objeto match completo
        matchStatusElement.textContent = getMatchStatusText(currentMatch.status, currentMatch);
        matchStatusElement.className = `status-badge status-${(currentMatch.status || '').toLowerCase()}`; // Adiciona classe para estilizar
    }


    // Controla a visibilidade das seções com base no status da partida
    // Esconde todas as seções de ação/eventos inicialmente
    if (startMatchBtn) startMatchBtn.style.display = 'none';
    if (finishMatchBtn) finishMatchBtn.style.display = 'none';
    if (registerEventSection) registerEventSection.classList.add('hidden'); // Usa classe hidden
    if (finishMatchSection) finishMatchSection.classList.add('hidden'); // Usa classe hidden
    if (eventsSection) eventsSection.classList.add('hidden'); // Usa classe hidden


    if (currentMatch.status === 'PENDING') {
        // Mostra botão Iniciar se a partida está pendente
        if (startMatchBtn) startMatchBtn.style.display = 'block';

    } else if (currentMatch.status === 'IN_PROGRESS') {
        // Mostra seções de Registrar Evento e Finalizar Partida se a partida está em andamento
        if (registerEventSection) registerEventSection.classList.remove('hidden');
        if (finishMatchBtn) finishMatchBtn.style.display = 'block'; // Mostra o botão Finalizar
        if (eventsSection) eventsSection.classList.remove('hidden'); // Mostra a seção de eventos registrados

        // Carregar tipos de evento e jogadores para o formulário
        loadEventFormData();
        // TODO: Carregar eventos registrados para exibir na seção de eventos
        // loadMatchEvents(tournamentId, roundId, matchId); // Passar todos os IDs
        // loadMatchEvents(matchId); // Já chamado na loadMatchData

    } else if (currentMatch.status === 'FINISHED') {
        // Mostra apenas a seção de Eventos Registrados se a partida terminou
         if (eventsSection) eventsSection.classList.remove('hidden');
         // TODO: Carregar eventos registrados para exibir na seção de eventos
         // loadMatchEvents(tournamentId, roundId, matchId); // Passar todos os IDs
         // loadMatchEvents(matchId); // Já chamado na loadMatchData
    }

    // Mostra o conteúdo da partida após renderizar
    if (matchContent) matchContent.classList.remove('hidden');
}

// Carrega os tipos de evento disponíveis e os jogadores da partida para o formulário de eventos
async function loadEventFormData() {
    // Verifica se os elementos DOM existem
    if (!eventTypeSelect || !eventPlayerSelect || !currentMatch) {
         console.error("Elementos do formulário de evento ou dados da partida não encontrados.");
         return;
    }

    // Limpa as opções atuais
    eventTypeSelect.innerHTML = '<option value="">Selecione o tipo</option>';
    eventPlayerSelect.innerHTML = '<option value="">Selecione o jogador</option>';


    try {
        // Buscar tipos de evento da API
        // Assumindo um endpoint MatchAPI.getEventTypes() que retorna um array de strings (ex: ["BLUNDER", "ORIGINAL_MOVE"])
        console.log("Buscando tipos de evento...");
        // CORREÇÃO AQUI: Chamar getEventTypes da MatchAPI (não precisa de IDs de partida)
        const eventTypes = await MatchAPI.getEventTypes(); // Assumindo este método na API

        // Preenche o dropdown de tipos de evento
        eventTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            // Usa a função utilitária para obter o texto amigável
            option.textContent = getEventTypeText(type);
            eventTypeSelect.appendChild(option);
        });
        console.log("Tipos de evento carregados:", eventTypes);

    } catch (error) {
        console.error('Erro ao carregar tipos de evento:', error);
        showNotification('Erro ao carregar tipos de evento.', 'error');
        // Opcional: Desabilitar o formulário ou o dropdown
        if (eventTypeSelect) eventTypeSelect.disabled = true;
    }

    // Preenche o dropdown de jogadores com os participantes da partida
    // Assumindo que currentMatch tem player1Id, player1Nickname, player2Id, player2Nickname
    if (currentMatch.player1Id && currentMatch.player1Nickname) {
        const player1Option = document.createElement('option');
        player1Option.value = currentMatch.player1Id;
        player1Option.textContent = currentMatch.player1Nickname;
        eventPlayerSelect.appendChild(player1Option);
    }
    if (currentMatch.player2Id && currentMatch.player2Nickname) {
        const player2Option = document.createElement('option');
        player2Option.value = currentMatch.player2Id;
        player2Option.textContent = currentMatch.player2Nickname;
        eventPlayerSelect.appendChild(player2Option);
    }
     console.log("Jogadores da partida carregados no formulário.");

}

// Carrega e exibe os eventos registrados para esta partida
async function loadMatchEvents(matchId) { // Mantido apenas matchId como parâmetro por enquanto
    // Verifica se os elementos DOM necessários existem
    if (!eventsContainer || !eventTemplate) {
        console.error("Elementos DOM necessários para loadMatchEvents não encontrados.");
        return;
    }

    eventsContainer.innerHTML = ''; // Limpa o contêiner de eventos

    try {
        console.log(`Carregando eventos para a partida ${matchId}...`);
        // TODO: Chamar a API para buscar eventos da partida
        // Assumindo MatchAPI.getEvents(tournamentId, roundId, matchId) ou MatchAPI.getEventsByMatchId(matchId)
        // Usando a versão que espera apenas matchId no frontend por enquanto
        // CORREÇÃO: Usar MatchAPI.getEvents que espera tournamentId, roundId, matchId
        const events = await MatchAPI.getEvents(tournamentId, roundId, matchId); // Usando IDs globais
        console.log("Eventos carregados:", events);

        if (!events || events.length === 0) {
            eventsContainer.innerHTML = `
                <div class="empty-state">
                    <p>Nenhum evento registrado para esta partida.</p>
                </div>
            `;
            return;
        }

        // Renderiza os eventos
        events.forEach(event => {
            const eventElement = eventTemplate.content.cloneNode(true);

            // Preenche os dados do evento
            // Assumindo classes .event-icon, .event-type, .event-player no template
            const iconElement = eventElement.querySelector('.event-icon');
            if(iconElement) iconElement.innerHTML = getEventIcon(event.eventType); // Usa função utilitária para ícone

            const typeElement = eventElement.querySelector('.event-type');
            if(typeElement) typeElement.textContent = getEventTypeText(event.eventType); // Usa função utilitária para texto

            const playerElement = eventElement.querySelector('.event-player');
            // Encontra o nickname do jogador do evento (assumindo que event.playerId está disponível)
            const eventPlayerNickname = (currentMatch && currentMatch.player1Id === event.playerId) ? currentMatch.player1Nickname :
                                       (currentMatch && currentMatch.player2Id === event.playerId) ? currentMatch.player2Nickname :
                                       'Jogador Desconhecido';
            if(playerElement) playerElement.textContent = `(${eventPlayerNickname})`; // Exibe o nickname do jogador

            // TODO: Adicionar timestamp ou descrição se aplicável e se existirem no DTO/Template

            // Adiciona classes de estilo baseadas no tipo de evento
            const eventItemElement = eventElement.querySelector('.event-item');
            if (eventItemElement) {
                 eventItemElement.classList.add(getEventClass(event.eventType));
            }


            eventsContainer.appendChild(eventElement);
        });

    } catch (error) {
        console.error('Erro ao carregar eventos:', error);
        eventsContainer.innerHTML = `
            <div class="error-message">
                <p>Erro ao carregar eventos.</p>
                <p>${error.message}</p>
            </div>
        `;
        showNotification(`Erro ao carregar eventos: ${error.message}`, "error");
    }
}


// Lida com o envio do formulário de registro de eventos
async function handleEventFormSubmit(e) {
    e.preventDefault(); // Previne o envio padrão do formulário

    // Verifica se os elementos DOM necessários existem
    if (!eventForm || !eventTypeSelect || !eventPlayerSelect || !currentMatch) {
         console.error("Elementos do formulário de evento ou dados da partida não encontrados.");
         showNotification("Erro interno: Não foi possível registrar o evento.", "error");
         return;
    }

    // Obter dados do formulário
    const eventType = eventTypeSelect.value;
    const playerId = eventPlayerSelect.value;

    // Validação básica do formulário
    if (!eventType || !playerId) {
        showNotification("Selecione o tipo de evento e o jogador.", "warning");
        return;
    }

    // Preparar dados para enviar ao backend
    const eventData = {
        matchId: currentMatch.id, // ID da partida atual
        playerId: parseInt(playerId), // Converte para número (Long no backend)
        eventType: eventType // Tipo de evento (String)
        // TODO: Adicionar outros campos do evento se existirem no formulário (ex: description)
    };

    console.log("Registrando evento:", eventData);

    try {
        showLoading(true); // Mostra carregamento

        // Chamar a API para registrar o evento
        // Usando tournamentId, roundId, matchId globais
        const updatedMatch = await MatchAPI.registerEvent(tournamentId, roundId, matchId, eventData);
        console.log("Evento registrado. Partida atualizada:", updatedMatch);

        showNotification("Evento registrado com sucesso!", "success");

        // Atualiza o estado da partida (se necessário) e recarrega a lista de eventos
        currentMatch = updatedMatch; // Atualiza o objeto da partida
        renderMatchData(); // Re-renderiza para garantir que tudo está atualizado
        // CORREÇÃO: Chamar loadMatchEvents para atualizar a lista na interface
        loadMatchEvents(matchId); // Recarrega apenas os eventos

        // Limpa o formulário após o registro
        eventForm.reset();

    } catch (error) {
        console.error("Erro ao registrar evento:", error);
        showNotification(`Erro ao registrar evento: ${error.message}`, "error");
    } finally {
        showLoading(false); // Esconde carregamento
    }
}


// Inicia a partida (chamado pelo botão "Iniciar Partida")
async function startMatch() {
    // Verifica se currentMatch e matchId estão disponíveis
    if (!currentMatch || !matchId) {
        console.error("Dados da partida não disponíveis para iniciar.");
        showNotification("Erro interno: Não foi possível iniciar a partida.", "error");
        return;
    }

    // Confirmação antes de iniciar
    if (!confirm('Tem certeza que deseja iniciar esta partida?')) {
        return; // Cancela se o usuário não confirmar
    }

    try {
        showLoading(true); // Mostra carregamento
        console.log(`Iniciando partida com ID: ${matchId}`);
        // Chama a API para iniciar a partida
        // Nota: A MatchAPI.start espera tournamentId, roundId, matchId na URL.
        // Precisamos garantir que tournamentId e roundId (variáveis globais) estejam disponíveis.
        const startedMatch = await MatchAPI.start(tournamentId, roundId, matchId); // Usando IDs globais

        console.log("Partida iniciada:", startedMatch);
        showNotification('Partida iniciada com sucesso!', 'success');

        // Atualiza o estado da partida na interface e recarrega dados
        currentMatch = startedMatch; // Atualiza o objeto da partida
        renderMatchData(); // Re-renderiza para atualizar status e exibir seções
        // CORREÇÃO: Chamar loadMatchEvents para garantir que a lista de eventos (vazia inicialmente) seja exibida
        loadMatchEvents(matchId);

    } catch (error) {
        console.error('Erro ao iniciar partida:', error);
        showNotification(`Erro ao iniciar partida: ${error.message}`, 'error');
    } finally {
        showLoading(false); // Esconde carregamento
    }
}


// --- NOVO: Lida com o clique no botão Finalizar Partida ---
async function handleFinishMatch() {
    // Verifica se currentMatch e matchId estão disponíveis
    if (!currentMatch || !matchId || !tournamentId || !roundId) {
        console.error("Dados essenciais da partida (currentMatch, matchId, tournamentId, roundId) não disponíveis para finalizar.");
        showNotification("Erro interno: Dados da partida não carregados completamente.", "error");
        return;
    }

    // Confirmação antes de finalizar
    if (!confirm('Tem certeza que deseja finalizar esta partida? Esta ação não pode ser desfeita.')) {
        return; // Cancela se o usuário não confirmar
    }

    try {
        showLoading(true); // Mostra carregamento
        console.log(`Finalizando partida com ID: ${matchId} (Torneio: ${tournamentId}, Rodada: ${roundId})`);
        // Chama a API para finalizar a partida
        // Nota: A MatchAPI.finish espera tournamentId, roundId, matchId na URL.
        // Usando IDs globais
        const finishedMatch = await MatchAPI.finish(tournamentId, roundId, matchId);

        console.log("Partida finalizada:", finishedMatch);
        showNotification('Partida finalizada com sucesso!', 'success');

        // Atualiza o estado da partida na interface e recarrega dados
        currentMatch = finishedMatch; // Atualiza o objeto da partida
        renderMatchData(); // Re-renderiza para atualizar status e esconder/mostrar seções
        // Não precisa recarregar eventos aqui, pois a lista já deve estar completa
        // e a renderMatchData cuidará de exibir a seção de eventos.

    } catch (error) {
        console.error('Erro ao finalizar partida:', error);
        const errorMessage = error.message || 'Ocorreu um erro ao finalizar a partida.';
        showNotification(`Erro ao finalizar partida: ${errorMessage}`, 'error');
    } finally {
        showLoading(false); // Esconde carregamento
    }
}


// Volta para a página de detalhes do torneio
function goBack() {
    // Verifica se tournamentId está disponível antes de redirecionar
    if (tournamentId) {
        window.location.href = `tournament-detail.html?id=${tournamentId}`;
    } else {
        // Fallback para a página de torneios se o ID do torneio não estiver disponível
        window.location.href = 'tournaments.html';
    }
}

// Mostra/esconde indicador de carregamento e conteúdo principal
function showLoading(isLoading) {
    // Verifica se os elementos DOM existem
    if (matchLoading && matchContent) {
        if (isLoading) {
            matchLoading.style.display = 'flex'; // Ou 'block'
            matchContent.classList.add('hidden');
        } else {
            matchLoading.style.display = 'none';
            // matchContent.classList.remove('hidden'); // Removido, pois renderMatchData já faz isso
        }
    } else {
         console.error("Elementos de carregamento ou conteúdo da partida não encontrados.");
         console.log("Estado de carregamento:", isLoading);
    }
}

// Adicionar event listener para o formulário de eventos (chamando handleEventFormSubmit)
if (eventForm) {
    eventForm.addEventListener('submit', handleEventFormSubmit);
} else {
    console.warn("Formulário de evento (#event-form) não encontrado.");
}


// TODO: Implementar lógica para:
// 1. Implementar a seção e lógica para Finalizar Partida (botão finishMatchBtn e seção finishMatchSection)
//    - Já adicionado o listener e a função handleFinishMatch acima.
//    - A visibilidade da seção e botão é controlada em renderMatchData.
// 2. Melhorar a exibição dos eventos registrados (usar template, ícones, etc.) - JÁ FEITO PARCIALMENTE COM TEMPLATE
// 3. Adicionar validação no frontend para o formulário de eventos (opcional, backend já valida)
// 4. Adicionar tratamento de erros mais específico (ex: exibir mensagens de erro do backend nos campos do formulário de evento)

