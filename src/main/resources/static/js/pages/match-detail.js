import { MatchAPI, RoundAPI } from '../api.js'; 
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
const backBtn = document.getElementById('back-btn');


const startMatchBtn = document.getElementById('start-match-btn'); 
const finishMatchBtn = document.getElementById('finish-match-btn'); 
const registerEventSection = document.getElementById('register-event-section'); 
const finishMatchSection = document.getElementById('finish-match-section');
const eventsSection = document.getElementById('events-section'); 

const eventForm = document.getElementById('event-form');
const eventTypeSelect = document.getElementById('event-type');
const eventPlayerSelect = document.getElementById('event-player');
const eventsContainer = document.getElementById('events-container');

const eventTemplate = document.getElementById('event-template');


let currentMatch = null;
let currentRound = null; 
let tournamentId = null;
let roundId = null;
let matchId = null;


document.addEventListener('DOMContentLoaded', () => {
    console.log('Página match-detail.js carregada.');
    const params = getUrlParams(); 
    tournamentId = params.tournamentId; 
    roundId = params.roundId; 
    matchId = params.matchId; 

    if (!tournamentId || !roundId || !matchId) {
        showNotification('Parâmetros da partida não especificados na URL.', 'error');
        
        return;
    }

    loadMatchData(tournamentId, roundId, matchId);

    if (backBtn) backBtn.addEventListener('click', goBack); else console.warn("Botão #back-btn não encontrado.");
    if (startMatchBtn) startMatchBtn.addEventListener('click', startMatch); else console.warn("Botão #start-match-btn não encontrado.");

    if (finishMatchBtn) {
        finishMatchBtn.addEventListener('click', handleFinishMatch);
    } else {
        console.warn("Botão #finish-match-btn não encontrado. Verifique o ID no HTML.");
    }

    if (eventForm) {
        eventForm.addEventListener('submit', handleEventFormSubmit);
    } else {
        console.warn("Formulário de evento (#event-form) não encontrado.");
    }


}); 


async function loadMatchData(tournamentId, roundId, matchId) {
    try {
        showLoading(true); 
        console.log(`Carregando dados da partida ${matchId} da rodada ${roundId} do torneio ${tournamentId}...`);

        currentMatch = await MatchAPI.getById(tournamentId, roundId, matchId);
        console.log('Dados da partida carregados:', currentMatch);

        currentRound = await RoundAPI.getById(tournamentId, roundId);
        console.log('Dados da rodada carregados:', currentRound);

        loadMatchEvents(matchId); 

        renderMatchData(); 

    } catch (error) {
        console.error('Erro ao carregar dados da partida:', error);
        showNotification(`Erro ao carregar dados da partida: ${error.message}`, 'error');
    } finally {
        showLoading(false); 
    }
}

function renderMatchData() {
    if (!currentMatch || !currentMatch.status) {
        console.error("Dados da partida não carregados para renderizar.");
        return;
    }

    if (player1NicknameElement) player1NicknameElement.textContent = currentMatch.player1Nickname || 'Jogador 1';
    if (player1NameElement) player1NameElement.textContent = currentMatch.player1Name || '';
    if (player2NicknameElement) player2NicknameElement.textContent = currentMatch.player2Nickname || 'Jogador 2';
    if (player2NameElement) player2NameElement.textContent = currentMatch.player2Name || '';

    if (matchRoundElement && currentRound) {
         matchRoundElement.textContent = `Rodada ${currentRound.roundNumber || '?'}`;
    } else if (matchRoundElement) {
         matchRoundElement.textContent = 'Rodada Desconhecida';
    }


    if (matchStatusElement) {
        matchStatusElement.textContent = getMatchStatusText(currentMatch.status, currentMatch);
        matchStatusElement.className = `status-badge status-${(currentMatch.status || '').toLowerCase()}`; 
    }


    if (startMatchBtn) startMatchBtn.style.display = 'none';
    if (finishMatchBtn) finishMatchBtn.style.display = 'none';
    if (registerEventSection) registerEventSection.classList.add('hidden'); 
    if (finishMatchSection) finishMatchSection.classList.add('hidden'); 
    if (eventsSection) eventsSection.classList.add('hidden'); 


    if (currentMatch.status === 'PENDING') {
        if (startMatchBtn) startMatchBtn.style.display = 'block';

    } else if (currentMatch.status === 'IN_PROGRESS') {
        if (registerEventSection) registerEventSection.classList.remove('hidden');
        if (finishMatchBtn) finishMatchBtn.style.display = 'block'; 
        if (eventsSection) eventsSection.classList.remove('hidden'); 

        loadEventFormData();

    } else if (currentMatch.status === 'FINISHED') {
         if (eventsSection) eventsSection.classList.remove('hidden');
    }

    if (matchContent) matchContent.classList.remove('hidden');
}

async function loadEventFormData() {
    if (!eventTypeSelect || !eventPlayerSelect || !currentMatch) {
         console.error("Elementos do formulário de evento ou dados da partida não encontrados.");
         return;
    }

    eventTypeSelect.innerHTML = '<option value="">Selecione o tipo</option>';
    eventPlayerSelect.innerHTML = '<option value="">Selecione o jogador</option>';


    try {
        console.log("Buscando tipos de evento...");
        const eventTypes = await MatchAPI.getEventTypes();

        eventTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = getEventTypeText(type);
            eventTypeSelect.appendChild(option);
        });
        console.log("Tipos de evento carregados:", eventTypes);

    } catch (error) {
        console.error('Erro ao carregar tipos de evento:', error);
        showNotification('Erro ao carregar tipos de evento.', 'error');
        if (eventTypeSelect) eventTypeSelect.disabled = true;
    }

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

async function loadMatchEvents(matchId) { 
    if (!eventsContainer || !eventTemplate) {
        console.error("Elementos DOM necessários para loadMatchEvents não encontrados.");
        return;
    }

    eventsContainer.innerHTML = ''; 

    try {
        console.log(`Carregando eventos para a partida ${matchId}...`);
        const events = await MatchAPI.getEvents(tournamentId, roundId, matchId); 
        console.log("Eventos carregados:", events);

        if (!events || events.length === 0) {
            eventsContainer.innerHTML = `
                <div class="empty-state">
                    <p>Nenhum evento registrado para esta partida.</p>
                </div>
            `;
            return;
        }

        events.forEach(event => {
            const eventElement = eventTemplate.content.cloneNode(true);

            const iconElement = eventElement.querySelector('.event-icon');
            if(iconElement) iconElement.innerHTML = getEventIcon(event.eventType); 

            const typeElement = eventElement.querySelector('.event-type');
            if(typeElement) typeElement.textContent = getEventTypeText(event.eventType); 

            const playerElement = eventElement.querySelector('.event-player');
            const eventPlayerNickname = (currentMatch && currentMatch.player1Id === event.playerId) ? currentMatch.player1Nickname :
                                       (currentMatch && currentMatch.player2Id === event.playerId) ? currentMatch.player2Nickname :
                                       'Jogador Desconhecido';
            if(playerElement) playerElement.textContent = `(${eventPlayerNickname})`;


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


async function handleEventFormSubmit(e) {
    e.preventDefault(); 

    if (!eventForm || !eventTypeSelect || !eventPlayerSelect || !currentMatch) {
         console.error("Elementos do formulário de evento ou dados da partida não encontrados.");
         showNotification("Erro interno: Não foi possível registrar o evento.", "error");
         return;
    }

    const eventType = eventTypeSelect.value;
    const playerId = eventPlayerSelect.value;

    if (!eventType || !playerId) {
        showNotification("Selecione o tipo de evento e o jogador.", "warning");
        return;
    }

    const eventData = {
        matchId: currentMatch.id, 
        playerId: parseInt(playerId),
        eventType: eventType
    };

    console.log("Registrando evento:", eventData);

    try {
        showLoading(true); 

        const updatedMatch = await MatchAPI.registerEvent(tournamentId, roundId, matchId, eventData);
        console.log("Evento registrado. Partida atualizada:", updatedMatch);

        showNotification("Evento registrado com sucesso!", "success");

        currentMatch = updatedMatch; 
        renderMatchData(); 
        loadMatchEvents(matchId); 

        eventForm.reset();

    } catch (error) {
        console.error("Erro ao registrar evento:", error);
        showNotification(`Erro ao registrar evento: ${error.message}`, "error");
    } finally {
        showLoading(false);
    }
}


async function startMatch() {
    if (!currentMatch || !matchId) {
        console.error("Dados da partida não disponíveis para iniciar.");
        showNotification("Erro interno: Não foi possível iniciar a partida.", "error");
        return;
    }

    if (!confirm('Tem certeza que deseja iniciar esta partida?')) {
        return;
    }

    try {
        showLoading(true); 
        console.log(`Iniciando partida com ID: ${matchId}`);
        const startedMatch = await MatchAPI.start(tournamentId, roundId, matchId); 

        console.log("Partida iniciada:", startedMatch);
        showNotification('Partida iniciada com sucesso!', 'success');

        currentMatch = startedMatch; 
        renderMatchData();
        loadMatchEvents(matchId);

    } catch (error) {
        console.error('Erro ao iniciar partida:', error);
        showNotification(`Erro ao iniciar partida: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}


async function handleFinishMatch() {
    if (!currentMatch || !matchId || !tournamentId || !roundId) {
        console.error("Dados essenciais da partida (currentMatch, matchId, tournamentId, roundId) não disponíveis para finalizar.");
        showNotification("Erro interno: Dados da partida não carregados completamente.", "error");
        return;
    }

    if (!confirm('Tem certeza que deseja finalizar esta partida? Esta ação não pode ser desfeita.')) {
        return; 
    }

    try {
        showLoading(true); 
        console.log(`Finalizando partida com ID: ${matchId} (Torneio: ${tournamentId}, Rodada: ${roundId})`);
        const finishedMatch = await MatchAPI.finish(tournamentId, roundId, matchId);

        console.log("Partida finalizada:", finishedMatch);
        showNotification('Partida finalizada com sucesso!', 'success');

        currentMatch = finishedMatch; 
        renderMatchData(); 

    } catch (error) {
        console.error('Erro ao finalizar partida:', error);
        const errorMessage = error.message || 'Ocorreu um erro ao finalizar a partida.';
        showNotification(`Erro ao finalizar partida: ${errorMessage}`, 'error');
    } finally {
        showLoading(false); 
    }
}


function goBack() {
    if (tournamentId) {
        window.location.href = `tournament-detail.html?id=${tournamentId}`;
    } else {
        window.location.href = 'tournaments.html';
    }
}

function showLoading(isLoading) {
    if (matchLoading && matchContent) {
        if (isLoading) {
            matchLoading.style.display = 'flex'; 
            matchContent.classList.add('hidden');
        } else {
            matchLoading.style.display = 'none';
        }
    } else {
         console.error("Elementos de carregamento ou conteúdo da partida não encontrados.");
         console.log("Estado de carregamento:", isLoading);
    }
}

if (eventForm) {
    eventForm.addEventListener('submit', handleEventFormSubmit);
} else {
    console.warn("Formulário de evento (#event-form) não encontrado.");
}



