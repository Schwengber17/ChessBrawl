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
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
        }
        //delete
        if (response.status === 204) {
            return { success: true };
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

const TournamentAPI = {
    getAll: () => fetchAPI('/tournaments'),
    getById: (id) => fetchAPI(`/tournaments/${id}`),
    create: (data) => fetchAPI('/tournaments', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    start: (id) => fetchAPI(`/tournaments/${id}/start`, {
        method: 'POST'
    }),
    getRanking: (id) => fetchAPI(`/tournaments/${id}/ranking`),
};

const PlayerAPI = {
    getAll: () => fetchAPI('/players'),
    getById: (id) => fetchAPI(`/players/${id}`),
    getByNickname: (nickname) => fetchAPI(`/players/by-nickname/${nickname}`),
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

const MatchAPI = {
    getById: (tournamentId,roundId,matchId) => 
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
            })
};

const RoundAPI = {
    getByTournament: (tournamentId) => fetchAPI(`/tournaments/${tournamentId}/rounds`),
    getById: (tournamentId, roundId) => fetchAPI(`/tournaments/${tournamentId}/rounds/${roundId}`),
    createNext: (tournamentId) => fetchAPI(`/tournaments/${tournamentId}/rounds/next`, {
        method: 'POST'
    })
};