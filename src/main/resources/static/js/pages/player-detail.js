// js/pages/player-detail.js

// Importa as funções da API e utilitários
import { PlayerAPI, MatchAPI } from '../api.js'; // Importa PlayerAPI e MatchAPI
// Importa utilitários. Garanta que estas funções estejam exportadas em utils.js
// Removido formatDate da importação
import { getUrlParams, showNotification, getEventTypeText, getEventIcon, getEventClass } from '../utils.js';


// Elementos DOM
const playerLoading = document.getElementById('player-loading');
const playerContent = document.getElementById('player-content');
const playerNickname = document.getElementById('player-nickname');
const playerName = document.getElementById('player-name');
const playerRatingValue = document.getElementById('player-rating-value');
const originalMoves = document.getElementById('original-moves');
const advantagousPositions = document.getElementById('advantagous-positions');
const blunders = document.getElementById('blunders');
const disrespectfulBehavior = document.getElementById('disrespectful-behavior');
const rageAttacks = document.getElementById('rage-attacks');
const eventsContainer = document.getElementById('events-container');

// Templates
const eventTemplate = document.getElementById('event-template');

// Estado da aplicação
let player = null;
let events = [];

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Obter ID do jogador da URL
    const params = getUrlParams();
    const playerId = params.id;

    if (!playerId) {
        showNotification('ID do jogador não especificado', 'error');
        setTimeout(() => {
            window.location.href = 'players.html';
        }, 2000);
        return;
    }

    // Carregar dados do jogador
    loadPlayerData(playerId);
});

// Carregar dados do jogador e seus eventos
async function loadPlayerData(playerId) {
    try {
        showLoading(true);

        // Carregar jogador usando PlayerAPI
        player = await PlayerAPI.getById(playerId);
        console.log('Dados do jogador:', player);

        // --- AJUSTE AQUI ---
        // Buscar eventos do jogador. Assumindo um novo endpoint no backend: /api/players/{playerId}/events
        // Se este endpoint não existir, você precisará criá-lo no backend.
        // Alternativamente, se o DTO do jogador no backend incluir a lista de eventos,
        // você não precisaria desta chamada separada.
        try {
             // Chamada de API para buscar eventos por jogador ID (endpoint hipotético)
             // Se o backend não tiver este endpoint, esta chamada falhará.
             // Substitua pela chamada correta se o endpoint existir ou ajuste a lógica.
             // Exemplo: Se o endpoint for /api/events?playerId={playerId}
             // events = await fetchAPI(`/events?playerId=${playerId}`);

             // Exemplo: Se o backend retorna eventos junto com o jogador (menos provável para histórico completo)
             // events = player.events || []; // Assumindo que o DTO do jogador tem uma lista 'events'

             // --- Lógica de fallback/alternativa se não houver endpoint direto ---
             // Se não houver um endpoint direto para buscar eventos por jogador,
             // você precisaria buscar todos os eventos (se a API permitir) e filtrar no frontend,
             // ou buscar eventos por partida e agregar por jogador (mais complexo).
             // Por enquanto, vamos simular uma chamada de API que traria os eventos do jogador.
             // VOCÊ PRECISA GARANTIR QUE O BACKEND TENHA UM ENDPOINT PARA ISSO.
             // Vamos usar uma chamada fetch genérica assumindo o endpoint /api/players/{playerId}/events
             const eventsResponse = await fetch(`/api/players/${playerId}/events`);
             if (!eventsResponse.ok) {
                 // Se o endpoint não existir ou der erro, trata como sem eventos
                 console.warn(`Endpoint /api/players/${playerId}/events não encontrado ou erro ao carregar eventos.`, eventsResponse.status, eventsResponse.statusText);
                 events = []; // Define eventos como lista vazia em caso de erro
             } else {
                 events = await eventsResponse.json();
                 console.log('Eventos do jogador:', events);
             }


        } catch (error) {
             console.error('Erro ao carregar eventos do jogador:', error);
             // Não lançamos a exceção aqui para não impedir a exibição dos dados do jogador
             events = []; // Garante que events é uma lista vazia em caso de erro
        }


        // Renderizar dados
        renderPlayerData();
    } catch (error) {
        console.error('Erro ao carregar dados do jogador:', error);
        showNotification(`Erro ao carregar dados do jogador: ${error.message}`, 'error');
         // Redireciona se não conseguir carregar os dados principais do jogador
         setTimeout(() => {
             window.location.href = 'players.html';
         }, 2000);
    } finally {
        showLoading(false);
    }
}

// Renderizar dados do jogador na interface
function renderPlayerData() {
    // Atualizar informações básicas
    playerNickname.textContent = player.nickname;
    playerName.textContent = player.name;
    playerRatingValue.textContent = player.rating || 0; // Usando player.rating

    // Atualizar estatísticas (assumindo que o DTO do jogador inclui esses campos)
    originalMoves.textContent = player.originalMoves || 0;
    advantagousPositions.textContent = player.advantagousPositions || 0;
    blunders.textContent = player.blundersMade || 0; // CORRIGIDO: Usando blundersMade
    disrespectfulBehavior.textContent = player.disrespectfulBehavior || 0;
    rageAttacks.textContent = player.rage || 0; // CORRIGIDO: Usando rage

    // Renderizar eventos
    renderEvents();
}

// Renderizar eventos na interface
function renderEvents() {
    // Limpar container
    eventsContainer.innerHTML = '';

    if (!events || events.length === 0) {
        eventsContainer.innerHTML = `
            <div class="empty-state">
                <p>Nenhum evento registrado para este jogador.</p>
            </div>
        `;
        return;
    }

    // Ordenar eventos por data (mais recentes primeiro) - Assumindo que o evento tem um campo de data/timestamp
    // Se o evento não tiver timestamp, você pode precisar ajustar a ordenação ou removê-la.
    // events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Descomente se tiver timestamp

    // Criar elemento para cada evento
    events.forEach(event => {
        const eventElement = eventTemplate.content.cloneNode(true);

        // Preencher dados
        const eventIcon = eventElement.querySelector('.event-icon');
        // Assumindo que getEventIcon e getEventClass estão em utils.js e importados
        if (eventIcon) {
            eventIcon.innerHTML = getEventIcon(event.eventType);
            eventIcon.className = `event-icon ${getEventClass(event.eventType)}`;
        }


        const eventTypeTextElement = eventElement.querySelector('.event-type');
        // Assumindo que getEventTypeText está em utils.js e importado
        if (eventTypeTextElement) eventTypeTextElement.textContent = getEventTypeText(event.eventType);


        // Assumindo que o evento DTO tem pointsChange
        const pointsElement = eventElement.querySelector('.event-points');
        // Verifica se pointsChange existe e é um número antes de formatar
        if (pointsElement) {
            if (typeof event.pointsChange === 'number') {
                 pointsElement.textContent = event.pointsChange > 0 ? `+${event.pointsChange}` : event.pointsChange;
                 pointsElement.className = `event-points ${event.pointsChange > 0 ? 'positive' : 'negative'}`;
            } else {
                 pointsElement.textContent = ''; // Ou um valor padrão se pointsChange não existir
                 pointsElement.className = 'event-points';
            }
        }


        // Assumindo que o evento DTO tem description, matchId e timestamp
        // TODO: Verificar se esses campos existem no seu Event DTO do backend
        const descriptionElement = eventElement.querySelector('.event-description');
        if (descriptionElement) descriptionElement.textContent = event.description || 'Sem descrição';


        const matchElement = eventElement.querySelector('.event-match');
         if (matchElement) matchElement.textContent = event.matchId ? `Partida #${event.matchId}` : 'Partida não especificada';


        const timeElement = eventElement.querySelector('.event-time');
         // REMOVIDO: Chamada para formatDate não é mais necessária
         if (timeElement) timeElement.textContent = event.timestamp ? event.timestamp : 'Data não disponível'; // Exibe o timestamp bruto ou mensagem


        // Adicionar ao container
        eventsContainer.appendChild(eventElement);
    });
}

// Utilitários (funções auxiliares)

// Mostra/esconde indicador de carregamento
function showLoading(isLoading) {
    if (isLoading) {
        if(playerLoading) playerLoading.style.display = 'flex';
        if(playerContent) playerContent.style.display = 'none';
    } else {
        if(playerLoading) playerLoading.style.display = 'none';
        if(playerContent) playerContent.style.display = 'block';
    }
}

// REMOVIDO: getStatusText não é usado nesta página
// function getStatusText(status) { ... }

// REMOVIDO: getEventTypeText, getEventIcon, getEventClass - Devem ser importados de utils.js
// function getEventTypeText(type) { ... }
// function getEventIcon(type) { ... }
// function getEventClass(type) { ... }

// REMOVIDO: Função para formatar data não é mais necessária
// function formatDate(dateString) { ... }
