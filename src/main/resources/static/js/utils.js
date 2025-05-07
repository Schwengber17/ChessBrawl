// utils.js - Funções utilitárias para o frontend

// pegar parametros 
export function getUrlParams() { 
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


export function showNotification(message, type = 'success', duration = 3000) { 
    const notificationArea = document.getElementById('notification-area');
    if (notificationArea) {
        notificationArea.innerHTML = '';
        notificationArea.className = 'mt-6 p-4 rounded-lg text-white';

        const notification = document.createElement('div');
        notification.className = `alert alert-${type}`; 
        notification.innerHTML = `
            <div class="flex items-center justify-between">
                <span>${message}</span>
                <button class="close-alert" onclick="this.parentElement.parentElement.style.display='none';">
                    &times;
                </button>
            </div>
        `;

        notificationArea.appendChild(notification);
        notificationArea.classList.remove('hidden'); 

        if (duration > 0) {
            setTimeout(() => {
                if (notificationArea.contains(notification)) {
                    notification.remove();
                    if (notificationArea.children.length === 0) {
                         notificationArea.classList.add('hidden');
                    }
                }
            }, duration);
        }

    } else {
        console.warn('Elemento #notification-area não encontrado. Usando alert() como fallback.');
        alert(`[${type.toUpperCase()}] ${message}`);
    }
}

//corrigir icone de status
function getIconForType(type) {
    switch (type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-times-circle';
        case 'warning': return 'fa-exclamation-triangle';
        case 'info': return 'fa-info-circle';
        default: return 'fa-info-circle';
    }
}

export function getStatusText(status) {
  switch (status) {
    case 'CREATED': return 'Criado';
    case 'IN_PROGRESS': return 'Em Andamento';
    case 'FINISHED': return 'Finalizado';
    case 'PENDING': return 'Pendente';
    default: return status || 'Desconhecido';
  }
}

export function getEventTypeText(type) { 
    switch (type) {
        case 'ORIGINAL_MOVE': return 'Movimento Original';
        case 'ADVANTAGEOUS_POSITION': return 'Posição Vantajosa';
        case 'BLUNDER': return 'Blunder (Erro Grave)';
        case 'DISRESPECT': return 'Comportamento Desrespeitoso';
        case 'RAGE_ATTACK': return 'Ataque de Raiva';
        default: return type || 'Evento Desconhecido';
    }
}

export function getEventIcon(type) { 
    switch (type) {
        case 'ORIGINAL_MOVE': return '<i class="fas fa-lightbulb"></i>';
        case 'ADVANTAGEOUS_POSITION': return '<i class="fas fa-chess-queen"></i>';
        case 'BLUNDER': return '<i class="fas fa-times-circle"></i>';
        case 'DISRESPECT': return '<i class="fas fa-angry"></i>';
        case 'RAGE_ATTACK': return '<i class="fas fa-fire"></i>';
        default: return '<i class="fas fa-question"></i>';
    }
}

export function getEventClass(type) {
    switch (type) {
        case 'ORIGINAL_MOVE': return 'original-move';
        case 'ADVANTAGEOUS_POSITION': return 'advantagous-position';
        case 'BLUNDER': return 'blunder';
        case 'DISRESPECT': return 'disrespect';
        case 'RAGE_ATTACK': return 'rage-attack';
        default: return '';
    }
}

export function getRoundStatusText(status) {
  switch (status) {
    case "CREATED": return "Criada";
    case "IN_PROGRESS": return "Em Andamento";
    case "FINISHED": return "Finalizada";
    default: return status || 'Desconhecido';
  }
}

export function getMatchStatusText(status, match) { 
//logica para determinar o status da partida e o vencedor

  switch (status) {
    case "PENDING": return "Pendente";
    case "IN_PROGRESS": return "Em Andamento";
    case "FINISHED":
      if (match && match.winnerId) {
        const winnerNickname = (match.player1Id === match.winnerId) ? match.player1Nickname :
                               (match.player2Id === match.winnerId) ? match.player2Nickname :
                               'Desconhecido';
        return `Vencedor: ${winnerNickname}`;
      } else {
        return "Empate";
      }
    default:
      return status || 'Desconhecido';
  }
}


