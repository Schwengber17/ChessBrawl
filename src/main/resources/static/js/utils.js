// utils.js - Funções utilitárias para o frontend

// Obter parâmetros da URL
export function getUrlParams() { // Adicionado 'export'
    const params = {};
    const queryString = window.location.search.substring(1);
    const pairs = queryString.split('&');

    for (const pair of pairs) {
        const [key, value] = pair.split('=');
        if (key) {
            params[decodeURIComponent(key)] = decodeURIComponent(value || '');
        }
    }

    return params;
}

// Mostrar notificação
export function showNotification(message, type = 'success', duration = 3000) { // Adicionado 'export'
    // Remover notificações existentes (se houver uma área de notificação)
    const notificationArea = document.getElementById('notification-area');
    if (notificationArea) {
        // Limpa o conteúdo anterior
        notificationArea.innerHTML = '';
        // Remove classes de tipo anteriores
        notificationArea.className = 'mt-6 p-4 rounded-lg text-white'; // Classes base do HTML

        // Cria o elemento da notificação
        const notification = document.createElement('div');
        // Adiciona classes para estilização (ajuste conforme seu CSS)
        notification.className = `alert alert-${type}`; // Exemplo com classes Bootstrap-like
        notification.innerHTML = `
            <div class="flex items-center justify-between">
                <span>${message}</span>
                <button class="close-alert" onclick="this.parentElement.parentElement.style.display='none';">
                    &times;
                </button>
            </div>
        `;

        // Adiciona ao container
        notificationArea.appendChild(notification);
        // Torna a área de notificação visível
        notificationArea.classList.remove('hidden'); // Remove a classe 'hidden' do HTML

        // Esconder a notificação após um tempo
        if (duration > 0) {
            setTimeout(() => {
                // Verifica se a notificação ainda existe antes de tentar remover
                if (notificationArea.contains(notification)) {
                    notification.remove();
                    // Opcional: esconder a área de notificação se estiver vazia
                    if (notificationArea.children.length === 0) {
                         notificationArea.classList.add('hidden');
                    }
                }
            }, duration);
        }

    } else {
        // Fallback simples se a área de notificação não for encontrada
        console.warn('Elemento #notification-area não encontrado. Usando alert() como fallback.');
        alert(`[${type.toUpperCase()}] ${message}`);
    }
}

// Função auxiliar para showNotification (se você usar ícones)
function getIconForType(type) {
    switch (type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-times-circle';
        case 'warning': return 'fa-exclamation-triangle';
        case 'info': return 'fa-info-circle';
        default: return 'fa-info-circle';
    }
}

// Converte status geral (Torneio, Partida, Rodada) para texto amigável
export function getStatusText(status) { // Adicionado 'export'
  switch (status) {
    case 'CREATED': return 'Criado';
    case 'IN_PROGRESS': return 'Em Andamento';
    case 'FINISHED': return 'Finalizado';
    case 'PENDING': return 'Pendente';
    default: return status || 'Desconhecido';
  }
}

// Converte tipo de evento para texto amigável
export function getEventTypeText(type) { // Adicionado 'export'
    switch (type) {
        case 'ORIGINAL_MOVE': return 'Movimento Original';
        case 'ADVANTAGEOUS_POSITION': return 'Posição Vantajosa';
        case 'BLUNDER': return 'Blunder (Erro Grave)';
        case 'DISRESPECT': return 'Comportamento Desrespeitoso';
        case 'RAGE_ATTACK': return 'Ataque de Raiva';
        default: return type || 'Evento Desconhecido';
    }
}

// Retorna o ícone Font Awesome para o tipo de evento
export function getEventIcon(type) { // Adicionado 'export'
    switch (type) {
        case 'ORIGINAL_MOVE': return '<i class="fas fa-lightbulb"></i>';
        case 'ADVANTAGEOUS_POSITION': return '<i class="fas fa-chess-queen"></i>';
        case 'BLUNDER': return '<i class="fas fa-times-circle"></i>';
        case 'DISRESPECT': return '<i class="fas fa-angry"></i>';
        case 'RAGE_ATTACK': return '<i class="fas fa-fire"></i>';
        default: return '<i class="fas fa-question"></i>';
    }
}

// Retorna a classe CSS para o tipo de evento para estilização
export function getEventClass(type) { // CORREÇÃO: Adicionado 'export' aqui!
    switch (type) {
        case 'ORIGINAL_MOVE': return 'original-move';
        case 'ADVANTAGEOUS_POSITION': return 'advantagous-position';
        case 'BLUNDER': return 'blunder';
        case 'DISRESPECT': return 'disrespect';
        case 'RAGE_ATTACK': return 'rage-attack';
        default: return '';
    }
}

// Converte status da rodada para texto amigável
export function getRoundStatusText(status) { // Adicionado 'export'
  switch (status) {
    case "CREATED": return "Criada";
    case "IN_PROGRESS": return "Em Andamento";
    case "FINISHED": return "Finalizada";
    default: return status || 'Desconhecido';
  }
}

// Converte status da partida para texto amigável e inclui vencedor/empate
export function getMatchStatusText(status, match) { // Adicionado 'export'
  switch (status) {
    case "PENDING": return "Pendente";
    case "IN_PROGRESS": return "Em Andamento";
    case "FINISHED":
      if (match && match.winnerId) {
        // Encontra o nickname do vencedor (assumindo que match DTO tem player1Nickname/player2Nickname)
        const winnerNickname = (match.player1Id === match.winnerId) ? match.player1Nickname :
                               (match.player2Id === match.winnerId) ? match.player2Nickname :
                               'Desconhecido';
        return `Vencedor: ${winnerNickname}`;
      } else {
        // Se status é FINISHED mas não tem winnerId, assume empate
        return "Empate";
      }
    default:
      return status || 'Desconhecido';
  }
}


// REMOVIDO: Função formatDate não é mais necessária
// export function formatDate(dateString) { ... }


// TODO: Adicionar outras funções utilitárias comuns aqui e exportá-las
// Ex: debounce, throttle, scrollToElement, etc.
