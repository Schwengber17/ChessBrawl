// api.js - Funções para interagir com a API

const API_BASE_URL = '/api'; 

// Função para fazer requisições
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
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
        }
        if (response.status === 204) {
            return { success: true };
        }

        const text = await response.text();
        return text ? JSON.parse(text) : {};

    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

export const TournamentAPI = {
    getAll: () => fetchAPI('/tournaments'),
    getById: (id) => fetchAPI(`/tournaments/${id}`),
    getTournamentsByStatus: async (status) => {
        const response = await fetch(`${API_BASE_URL}/tournaments/status/${status}`);
        if (!response.ok) {
             if (response.status === 404) {
                 console.warn(`Nenhum torneio encontrado com status ${status}.`);
                 return []; 
             }
            const error = await response.json();
            throw new Error(error.message || `Erro ao buscar torneios com status ${status}.`);
        }
        return response.json();
    },
    create: (data) => fetchAPI('/tournaments', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    getRanking: (tournamentId) => fetchAPI(`/tournaments/${tournamentId}/ranking`), 
    delete: (id) => fetchAPI(`/tournaments/${id}`, { 
        method: 'DELETE'
    }),
    start: (id) => fetchAPI(`/tournaments/${id}/start`, {
        method: 'POST'
    })
};

export const PlayerAPI = {
    getAll: () => fetchAPI('/players'),
    getById: (id) => fetchAPI(`/players/${id}`),
    getByNickname: (nickname) => fetchAPI(`/players/by-nickname/${encodeURIComponent(nickname)}`), 
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

export const MatchAPI = {
    getById: (tournamentId, roundId, matchId) =>
        fetchAPI(`/tournaments/${tournamentId}/rounds/${roundId}/matches/${matchId}`),
    getEvents: (tournamentId, roundId, matchId) =>
        fetchAPI(`/tournaments/${tournamentId}/rounds/${roundId}/matches/${matchId}/events`),
    start: (tournamentId, roundId, matchId) =>
        fetchAPI(`/tournaments/${tournamentId}/rounds/${roundId}/matches/${matchId}/start`, {
            method: 'POST'
        }),
    finish: (tournamentId, roundId, matchId, resultData) => 
        fetchAPI(`/tournaments/${tournamentId}/rounds/${roundId}/matches/${matchId}/finish`, {
            method: 'POST',
            body: JSON.stringify(resultData) 
            }),
    registerEvent: (tournamentId, roundId, matchId, eventData) =>
        fetchAPI(`/tournaments/${tournamentId}/rounds/${roundId}/matches/${matchId}/events`, {
            method: 'POST',
            body: JSON.stringify(eventData)
            }),
    getEventTypes: () => fetchAPI('/matches/event-types') 
};

export const RoundAPI = {
    getByTournament: (tournamentId) => fetchAPI(`/tournaments/${tournamentId}/rounds`),
    getById: (tournamentId, roundId) => fetchAPI(`/tournaments/${tournamentId}/rounds/${roundId}`), 
    getMatchesByRoundId: (roundId) => fetchAPI(`/rounds/${roundId}/matches`), 
};


