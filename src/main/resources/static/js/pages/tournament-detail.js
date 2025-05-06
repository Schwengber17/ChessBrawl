// Elementos DOM
const tournamentName = document.getElementById("tournament-name")
const tournamentStatus = document.getElementById("tournament-status")
const tournamentLoading = document.getElementById("tournament-loading")
const tournamentContent = document.getElementById("tournament-content")
const rankingTableBody = document.getElementById("ranking-table-body")
const roundsContainer = document.getElementById("rounds-container")
const startTournamentBtn = document.getElementById("start-tournament-btn")

// Templates
const roundTemplate = document.getElementById("round-template")
const matchTemplate = document.getElementById("match-template")

// Estado da aplicação
let tournament = null
let rounds = []
let ranking = []

// Utilitários (declaração das funções faltantes)
function getUrlParams() {
  const urlSearchParams = new URLSearchParams(window.location.search)
  return Object.fromEntries(urlSearchParams.entries())
}

async function fetchAPI(url) {
  const response = await fetch(`/api${url}`)
  if (!response.ok) {
    const message = await response.text()
    throw new Error(`${response.status}: ${message}`)
  }
  return await response.json()
}

function showNotification(message, type = "info") {
  const notificationDiv = document.createElement("div")
  notificationDiv.className = `notification notification-${type}`
  notificationDiv.textContent = message

  document.body.appendChild(notificationDiv)

  setTimeout(() => {
    notificationDiv.remove()
  }, 3000)
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  // Obter ID do torneio da URL
  const params = getUrlParams()
  const tournamentId = params.id

  if (!tournamentId) {
    showNotification("ID do torneio não especificado", "error")
    setTimeout(() => {
      window.location.href = "tournaments.html"
    }, 2000)
    return
  }

  // Carregar dados do torneio
  loadTournamentData(tournamentId)

  // Configurar eventos
  startTournamentBtn.addEventListener("click", () => startTournament(tournamentId))
})

// Carregar dados do torneio
async function loadTournamentData(tournamentId) {
  try {
    showLoading(true)

    tournament = await fetchAPI(`/tournaments/${tournamentId}`)
    console.log("Torneio carregado:", tournament)

    // Carregar rodadas
    rounds = await fetchAPI(`/tournaments/${tournamentId}/rounds`)
    console.log("Rodadas carregadas:", rounds)

    // Carregar partidas para cada rodada
    for (const round of rounds) {
      try {
        const matches = await fetchAPI(`/rounds/${round.id}/matches`)
        round.matches = matches
        console.log(`Partidas da rodada ${round.roundNumber}:`, matches)
      } catch (error) {
        console.error(`Erro ao carregar partidas da rodada ${round.id}:`, error)
        round.matches = []
      }
    }

    ranking = await fetchAPI(`/tournaments/${tournamentId}/ranking`)
    console.log("Ranking carregado:", ranking)

    // Renderizar dados
    renderTournamentData()
  } catch (error) {
    console.error("Erro ao carregar dados:", error)
    showNotification(error.message, "error")
  } finally {
    showLoading(false)
  }
}

// Renderizar dados do torneio
function renderTournamentData() {
  if (!tournament || !tournament.status) {
    console.error("Torneio ou status do torneio não carregado corretamente.")
    showNotification("Erro ao carregar dados do torneio.", "error")
    return
  }

  // Atualizar título e status
  tournamentName.textContent = tournament.name
  tournamentStatus.textContent = getStatusText(tournament.status)
  tournamentStatus.className = `status-badge status-${tournament.status.toLowerCase()}`

  // Mostrar botão de iniciar se o torneio estiver criado
  if (tournament.status === "CREATED") {
    startTournamentBtn.style.display = "block"
  } else {
    startTournamentBtn.style.display = "none"
  }

  // Renderizar classificação
  renderRanking()
  renderRounds()
}

// Renderizar classificação
function renderRanking() {
  // Limpar tabela
  rankingTableBody.innerHTML = ""

  // Adicionar jogadores
  ranking.forEach((player, index) => {
    const row = document.createElement("tr")

    row.innerHTML = `
            <td>${index + 1}</td>
            <td>${player.nickname}</td>
            <td>${player.name}</td>
            <td class="text-center">${player.tournamentPoints || 0}</td>
        `

    rankingTableBody.appendChild(row)
  })
}

// Renderizar rodadas
function renderRounds() {
  // Limpar container
  roundsContainer.innerHTML = ""

  if (rounds.length === 0) {
    roundsContainer.innerHTML = `
            <div class="empty-state">
                <p>Nenhuma rodada disponível. Inicie o torneio para criar a primeira rodada.</p>
            </div>
        `
    return
  }

  // Ordenar rodadas por número
  rounds.sort((a, b) => a.roundNumber - b.roundNumber)

  // Criar elemento para cada rodada
  rounds.forEach((round) => {
    const roundElement = roundTemplate.content.cloneNode(true)

    // Preencher dados
    roundElement.querySelector(".round-number").textContent = round.roundNumber

    const statusElement = roundElement.querySelector(".round-status")
    statusElement.textContent = getRoundStatusText(round.status)
    statusElement.className = `round-status status-${round.status.toLowerCase()}`

    const matchesContainer = roundElement.querySelector(".matches-container")

    if (!round.matches || round.matches.length === 0) {
      matchesContainer.innerHTML = `
                <div class="empty-matches">
                    <p>Nenhuma partida disponível para esta rodada.</p>
                </div>
            `
    } else {
      round.matches.forEach((match) => {
        const matchElement = matchTemplate.content.cloneNode(true)

        matchElement.querySelector(".player1 .player-nickname").textContent = match.player1Nickname
        matchElement.querySelector(".player2 .player-nickname").textContent = match.player2Nickname

        const matchStatus = matchElement.querySelector(".match-status")
        matchStatus.textContent = getMatchStatusText(match.status, match)

        const viewButton = matchElement.querySelector(".view-match")
        viewButton.href = `match-detail.html?id=${match.id}`

        matchesContainer.appendChild(matchElement)
      })
    }

    roundsContainer.appendChild(roundElement)
  })
}

// Iniciar torneio
async function startTournament(tournamentId) {
  try {
    // Confirmar ação
    if (!confirm("Tem certeza que deseja iniciar o torneio? Esta ação não pode ser desfeita.")) {
      return
    }

    showNotification("Iniciando torneio...", "info")

    // Iniciar torneio
    const response = await fetch(`/api/tournaments/${tournamentId}/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Erro ao iniciar torneio: ${response.status}`)
    }

    const data = await response.json()
    console.log("Torneio iniciado:", data)

    // Recarregar dados
    showNotification("Torneio iniciado com sucesso!", "success")
    setTimeout(() => {
      loadTournamentData(tournamentId)
    }, 1000)
  } catch (error) {
    console.error("Erro ao iniciar torneio:", error)
    showNotification(error.message, "error")
  }
}

// Utilitários
function showLoading(isLoading) {
  if (isLoading) {
    tournamentLoading.style.display = "flex"
    tournamentContent.style.display = "none"
  } else {
    tournamentLoading.style.display = "none"
    tournamentContent.style.display = "block"
  }
}

function getStatusText(status) {
  switch (status) {
    case "CREATED":
      return "Criado"
    case "IN_PROGRESS":
      return "Em Andamento"
    case "FINISHED":
      return "Finalizado"
    default:
      return status
  }
}

function getRoundStatusText(status) {
  switch (status) {
    case "SCHEDULED":
      return "Agendada"
    case "IN_PROGRESS":
      return "Em Andamento"
    case "FINISHED":
      return "Finalizada"
    default:
      return status
  }
}

function getMatchStatusText(status, match) {
  switch (status) {
    case "SCHEDULED":
      return "Agendada"
    case "IN_PROGRESS":
      return "Em Andamento"
    case "FINISHED":
      if (match.result === "DRAW") {
        return "Empate"
      } else if (match.winnerId) {
        const winnerNickname = match.winnerId === match.player1Id ? match.player1Nickname : match.player2Nickname
        return `Vencedor: ${winnerNickname}`
      } else {
        return "Finalizada"
      }
    default:
      return status
  }
}
