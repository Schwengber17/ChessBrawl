import { PlayerAPI, MatchAPI } from '../api.js';
import { getUrlParams, showNotification, getEventTypeText, getEventIcon, getEventClass } from '../utils.js';


// Elementos DOM
const playerLoading = document.getElementById('player-loading');
const playerContent = document.getElementById('player-content');
const playerNickname = document.getElementById('player-nickname');
const playerName = document.getElementById('player-name');
const playerRatingValue = document.getElementById('player-rating-value');


const originalMovesElement = document.getElementById('original-moves');
const blundersMadeElement = document.getElementById('blunders-made'); 
const advantageousPositionsElement = document.getElementById('advantageous-positions'); 
const disrespectfulBehaviorElement = document.getElementById('disrespectful-behavior');
const rageElement = document.getElementById('rage'); 

let player = null;

document.addEventListener('DOMContentLoaded', () => {
    const params = getUrlParams();
    const playerId = params.id;

    if (!playerId) {
        showNotification('ID do jogador não especificado', 'error');
        setTimeout(() => {
            window.location.href = 'players.html';
        }, 2000);
        return;
    }

    loadPlayerData(playerId);
});

async function loadPlayerData(playerId) {
    try {
        showLoading(true);

        player = await PlayerAPI.getById(playerId);
        console.log('Dados do jogador:', player);

        renderPlayerData();

    } catch (error) {
        console.error('Erro ao carregar dados do jogador:', error);
        showNotification(`Erro ao carregar dados do jogador: ${error.message}`, 'error');
        setTimeout(() => {
            window.location.href = 'players.html';
        }, 2000);
    } finally {
        showLoading(false); 
    }
}

function renderPlayerData() {
    if (!player || !playerNickname || !playerName || !playerRatingValue ||
        !originalMovesElement || !blundersMadeElement || !advantageousPositionsElement || !disrespectfulBehaviorElement || !rageElement) {
        console.error("Dados do jogador ou elementos DOM necessários para renderização não encontrados.");
        showNotification("Erro interno ao exibir dados do jogador.", "error");
        return;
    }


    playerNickname.textContent = player.nickname || 'Sem Nickname';
    playerName.textContent = player.name || 'Sem Nome';
    playerRatingValue.textContent = player.rating || 0;

    originalMovesElement.textContent = player.originalMoves || 0;
    blundersMadeElement.textContent = player.blundersMade || 0; 
    advantageousPositionsElement.textContent = player.advantageousPositions || 0; 
    disrespectfulBehaviorElement.textContent = player.disrespectfulBehavior || 0;
    rageElement.textContent = player.rage || 0; 


}

function showLoading(isLoading) {
    if (playerLoading && playerContent) {
        if (isLoading) {
            playerLoading.style.display = 'flex'; 
            playerContent.classList.add('hidden'); 
        } else {
            playerLoading.style.display = 'none';
            playerContent.classList.remove('hidden'); 
        }
    } else {
         console.error("Elementos de carregamento ou conteúdo principal não encontrados.");
         console.log("Estado de carregamento:", isLoading);
    }
}


