// Elementos DOM
const tournamentsContainer = document.getElementById("tournaments-container")
const tournamentTemplate = document.getElementById("tournament-card-template")
const statusTabs = document.querySelectorAll(".tab-btn")

// Estado da aplicação
let currentStatus = "active"
let tournaments = []

// Import API functions (assuming these are defined elsewhere)
// You might need to adjust the paths depending on your project structure
import { TournamentAPI } from "./api/tournament-api.js"
import { RoundAPI } from "./api/round-api.js"
import { showNotification } from "./utils.js" // Assuming utils.js contains showNotification

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  // Adicionar eventos aos botões de filtro
  statusTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      statusTabs.forEach((t) => t.classList.remove("active"))
      tab.classList.add("active")
      currentStatus = tab.dataset.status
      filterTournaments()
    })
  })

  // Carregar torneios
  fetchTournaments()
})

// Buscar torneios da API
async function fetchTournaments() {
  try {
    showLoading(true)
    console.log("Fetching tournaments...")
    tournaments = await TournamentAPI.getAll()
    filterTournaments()
  } catch (error) {
    showError(error.message)
  } finally {
    showLoading(false)
  }
}

async function deleteTournament(tournamentId) {
  if (!confirm("Tem certeza que deseja excluir este torneio? Esta ação não pode ser desfeita.")) {
    return
  }

  try {
    await fetch(`/api/tournaments/${tournamentId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })
    showNotification("Torneio excluído com sucesso!", "success")
    // Recarregar a lista de torneios após um breve delay
    setTimeout(() => {
      fetchTournaments()
    }, 500)
  } catch (error) {
    console.error("Erro ao excluir torneio:", error)
    showNotification("Erro ao excluir torneio.", "error")
  }
}
// Filtrar torneios por status
function filterTournaments() {
  let filteredTournaments = tournaments

  if (currentStatus === "active") {
    filteredTournaments = tournaments.filter((t) => t.status === "IN_PROGRESS")
  } else if (currentStatus === "finished") {
    filteredTournaments = tournaments.filter((t) => t.status === "FINISHED")
  }

  renderTournaments(filteredTournaments)
}

// Renderizar torneios na interface
function renderTournaments(tournamentsList) {
  // Limpar container
  tournamentsContainer.innerHTML = ""

  if (tournamentsList.length === 0) {
    tournamentsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-info-circle"></i>
                <p>Nenhum torneio encontrado.</p>
            </div>
        `
    return
  }

  // Criar card para cada torneio
  tournamentsList.forEach((tournament) => {
    const tournamentCard = tournamentTemplate.content.cloneNode(true)

    // Preencher dados
    tournamentCard.querySelector(".tournament-name").textContent = tournament.name

    const statusElement = tournamentCard.querySelector(".tournament-status")
    statusElement.textContent = getStatusText(tournament.status)
    statusElement.className = `tournament-status status-${tournament.status.toLowerCase()}`

    tournamentCard.querySelector(".player-count").textContent = tournament.playerIds.length

    // Inicialmente definir como desconhecido
    tournamentCard.querySelector(".round-count").textContent = "?"

    // Configurar link
    const viewButton = tournamentCard.querySelector(".view-tournament")
    viewButton.href = `tournament-detail.html?id=${tournament.id}`

    // Configurar botão de excluir
    const deleteButton = tournamentCard.querySelector(".delete-tournament")
    if (deleteButton) {
      deleteButton.addEventListener("click", (e) => {
        e.preventDefault()
        deleteTournament(tournament.id)
      })
    }

    // Adicionar data-id ao card para referência futura
    const cardElement = tournamentCard.querySelector(".tournament-card")
    if (cardElement) {
      cardElement.dataset.id = tournament.id
    }

    // Adicionar ao container
    tournamentsContainer.appendChild(tournamentCard)

    // Buscar número de rodadas (assíncrono)
    fetchRoundCount(tournament.id)
      .then((count) => {
        const roundElement = document.querySelector(`.tournament-card[data-id="${tournament.id}"] .round-count`)
        if (roundElement) {
          roundElement.textContent = count
        }
      })
      .catch(() => {
        // Silenciosamente falhar
      })
  })
}

// Buscar contagem de rodadas
async function fetchRoundCount(tournamentId) {
  try {
    const rounds = await RoundAPI.getByTournament(tournamentId)
    return rounds.length
  } catch (error) {
    console.error(`Erro ao buscar rodadas para torneio ${tournamentId}:`, error)
    return "?"
  }
}

// Utilitários
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

function showLoading(isLoading) {
  if (isLoading) {
    tournamentsContainer.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i> Carregando torneios...
            </div>
        `
  }
}

function showError(message) {
  tournamentsContainer.innerHTML = `
        <div class="alert alert-danger">
            <i class="fas fa-exclamation-triangle"></i> ${message}
        </div>
    `
}
