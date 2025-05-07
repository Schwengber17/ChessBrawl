// api.js - Funções para interagir com a API

const API_BASE_URL = '/api'; // Não precisa especificar o host quando frontend e backend estão no mesmo servidor

// Função genérica para fazer requisições
async function fetchAPI(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const fetchOptions = {
        ...defaultOptions,
        ...options
    };

    try {
        const response = await fetch(url, fetchOptions);

        if (!response.ok) {
            // Tenta ler a mensagem de erro do corpo da resposta se disponível
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
        }
        //delete
        if (response.status === 204) {
            return { success: true };
        }

        // Tenta retornar JSON, mas lida com respostas vazias (como 204 No Content)
        const text = await response.text();
        return text ? JSON.parse(text) : {};

    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Exporta as APIs para que possam ser importadas em outros arquivos JS
export const TournamentAPI = {
    getAll: () => fetchAPI('/tournaments'),
    getById: (id) => fetchAPI(`/tournaments/${id}`),
    create: (data) => fetchAPI('/tournaments', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    getRanking: (tournamentId) => fetchAPI(`/tournaments/${tournamentId}/ranking`), // Adicionado getRanking
    delete: (id) => fetchAPI(`/tournaments/${id}`, { // Adicionado delete
        method: 'DELETE'
    }),
    start: (id) => fetchAPI(`/tournaments/${id}/start`, { // Adicionado start
        method: 'POST'
    })
};

// CORREÇÃO AQUI: Adicionado 'export const' antes de PlayerAPI
export const PlayerAPI = {
    getAll: () => fetchAPI('/players'),
    getById: (id) => fetchAPI(`/players/${id}`),
    getByNickname: (nickname) => fetchAPI(`/players/by-nickname/${encodeURIComponent(nickname)}`), // Codifica o nickname para URL
    create: (data) => fetchAPI('/players', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => fetchAPI(`/players/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (id) => fetchAPI(`/players/${id}`, {
        method: 'DELETE'
    })
};

// CORREÇÃO AQUI: Adicionado 'export const' antes de MatchAPI e a função getEventTypes
export const MatchAPI = {
    // Ajustados endpoints para incluir tournamentId e roundId conforme a estrutura do backend
    getById: (tournamentId, roundId, matchId) =>
        fetchAPI(`/tournaments/${tournamentId}/rounds/${roundId}/matches/${matchId}`),
    getEvents: (tournamentId, roundId, matchId) =>
        fetchAPI(`/tournaments/${tournamentId}/rounds/${roundId}/matches/${matchId}/events`),
     // Endpoint para buscar eventos de uma partida específica APENAS pelo matchId (se o backend suportar)
     // getEventsByMatchId: (matchId) => fetchAPI(`/matches/${matchId}/events`), // Endpoint alternativo/adicional se existir no backend
    start: (tournamentId, roundId, matchId) =>
        fetchAPI(`/tournaments/${tournamentId}/rounds/${roundId}/matches/${matchId}/start`, {
            method: 'POST'
        }),
    finish: (tournamentId, roundId, matchId, resultData) => // Mantido resultData caso o backend ainda o espere
        fetchAPI(`/tournaments/${tournamentId}/rounds/${roundId}/matches/${matchId}/finish`, {
            method: 'POST',
            body: JSON.stringify(resultData) // Envia resultData (pode estar vazio {})
            }),
    registerEvent: (tournamentId, roundId, matchId, eventData) =>
        fetchAPI(`/tournaments/${tournamentId}/rounds/${roundId}/matches/${matchId}/events`, {
            method: 'POST',
            body: JSON.stringify(eventData)
            }),
    // CORREÇÃO AQUI: Adicionada a função getEventTypes
    getEventTypes: () => fetchAPI('/matches/event-types') // Endpoint para buscar os tipos de evento
};

// CORREÇÃO AQUI: Adicionado 'export const' antes de RoundAPI
export const RoundAPI = {
    getByTournament: (tournamentId) => fetchAPI(`/tournaments/${tournamentId}/rounds`),
    getById: (tournamentId, roundId) => fetchAPI(`/tournaments/${tournamentId}/rounds/${roundId}`), // Adicionado getById para rodada
    // Método para buscar partidas de uma rodada específica APENAS pelo roundId (se o backend suportar)
    getMatchesByRoundId: (roundId) => fetchAPI(`/rounds/${roundId}/matches`), // Endpoint alternativo/adicional se existir no backend
    // TODO: Adicionar método para criar a próxima rodada se o frontend for orquestrar isso
    // createNext: (tournamentId, qualifiedPlayerIds) => fetchAPI(`/tournaments/${tournamentId}/rounds/next`, { method: 'POST', body: JSON.stringify(qualifiedPlayerIds) })
};

// TODO: Adicionar outras APIs se necessário (ex: EventAPI se eventos tiverem endpoints próprios)

// Exemplo: Exportar todas as APIs como um objeto único (opcional)
// export default {
//     TournamentAPI,
//     PlayerAPI,
//     MatchAPI,
//     RoundAPI
// };
