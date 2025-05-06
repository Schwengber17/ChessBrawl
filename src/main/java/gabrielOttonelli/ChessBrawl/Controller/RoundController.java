package gabrielOttonelli.ChessBrawl.Controller;

import gabrielOttonelli.ChessBrawl.DTO.RoundDTO; // Importar o DTO da Rodada
import gabrielOttonelli.ChessBrawl.Service.RoundService; // Importar o Service da Rodada
import lombok.RequiredArgsConstructor;

import java.util.List; // Para retornar listas de DTOs

import org.springframework.http.ResponseEntity; // Para construir a resposta HTTP
import org.springframework.web.bind.annotation.*; // Anotações de mapeamento HTTP

@RestController // Indica que esta classe é um Controller REST
// Define o caminho base, incluindo o ID do torneio pai para contexto
@RequestMapping("/api/tournaments/{tournamentId}/rounds")
@RequiredArgsConstructor // Usa Lombok para gerar um construtor com todos os campos finais
public class RoundController {

    private final RoundService roundService; // Injeta a dependência do RoundService

    // Endpoint para buscar todas as rodadas de um torneio específico
    // Mapeado para GET /api/tournaments/{tournamentId}/rounds
    @GetMapping
    public ResponseEntity<List<RoundDTO>> getRoundsByTournament(@PathVariable Long tournamentId) {
        // @PathVariable extrai o ID do torneio da URL
        // Chama o método do Service para obter as rodadas do torneio como DTOs
        List<RoundDTO> rounds = roundService.getRoundsByTournamentId(tournamentId);
        // Retorna a lista de DTOs com status HTTP 200 OK
        return ResponseEntity.ok(rounds);
    }

    // Endpoint para buscar uma rodada específica por ID (dentro de um torneio)
    // Mapeado para GET /api/tournaments/{tournamentId}/rounds/{roundId}
    @GetMapping("/{roundId}")
    public ResponseEntity<RoundDTO> getRoundById(@PathVariable Long tournamentId, @PathVariable Long roundId) {
        // @PathVariable extrai os IDs da URL
        // Nota: O Service findRoundById não usa tournamentId, mas tê-lo na URL
        // pode ser útil para validação ou contexto no futuro.
        // Chama o método do Service para obter a rodada por ID como DTO
        RoundDTO round = roundService.findRoundById(roundId);
        // Opcional: Definir o tournamentId no DTO se ele não for populado pelo Service
        // round.setTournamentId(tournamentId);
        // Retorna o DTO da rodada com status HTTP 200 OK
        return ResponseEntity.ok(round);
    }

    // Endpoint para criar a próxima rodada (geralmente chamada após a anterior terminar)
    // Mapeado para POST /api/tournaments/{tournamentId}/rounds/next
    @PostMapping("/next")
    public ResponseEntity<RoundDTO> createNextRound(@PathVariable Long tournamentId) {
        // @PathVariable extrai o ID do torneio da URL
        // Chama o método do Service para criar a próxima rodada
        RoundDTO nextRound = roundService.createNextRound(tournamentId);
        // Retorna o DTO da nova rodada com status HTTP 200 OK (ou 201 Created se preferir)
        return ResponseEntity.ok(nextRound);
    }

    // TODO: Endpoint para buscar partidas de uma rodada específica
    // Mapeado para GET /api/tournaments/{tournamentId}/rounds/{roundId}/matches
    // Esta rota pode ser definida no MatchController, mas também pode ser útil aqui
    // se você quiser obter as partidas aninhadas sob a rodada.
    // Geralmente, endpoints para recursos "filhos" vão no Controller do filho (MatchController).
}
