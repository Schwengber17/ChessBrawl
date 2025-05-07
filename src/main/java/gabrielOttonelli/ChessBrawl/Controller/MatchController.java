package gabrielOttonelli.ChessBrawl.Controller;

import gabrielOttonelli.ChessBrawl.DTO.MatchDTO; // Importar o DTO da Partida
import gabrielOttonelli.ChessBrawl.DTO.EventDTO; // Importar o DTO do Evento
import gabrielOttonelli.ChessBrawl.Service.MatchService; // Importar o Service da Partida
import lombok.RequiredArgsConstructor;

import jakarta.validation.Valid; // Para validar o DTO no corpo da requisição

import java.util.List; // Para retornar listas de DTOs

import org.springframework.http.ResponseEntity; // Para construir a resposta HTTP
import org.springframework.web.bind.annotation.*; // Anotações de mapeamento HTTP

@RestController // Indica que esta classe é um Controller REST
// Define o caminho base, aninhando partidas sob rodadas e torneios
// Este RequestMapping aplica-se a todos os métodos ABAIXO dele, a menos que o @GetMapping use um caminho absoluto (começando com /)
@RequestMapping("/api/tournaments/{tournamentId}/rounds/{roundId}/matches")
@RequiredArgsConstructor // Usa Lombok para gerar um construtor com todos os campos finais
public class MatchController {

    private final MatchService matchService; // Injeta a dependência do MatchService

    // Endpoint para buscar uma partida específica por ID (dentro de uma rodada/torneio)
    // Mapeado para GET /api/tournaments/{tournamentId}/rounds/{roundId}/matches/{id}
    @GetMapping("/{id}")
    public ResponseEntity<MatchDTO> getMatchById(
            @PathVariable Long tournamentId, // Pode ser usado para validação ou contexto
            @PathVariable Long roundId, // Pode ser usado para validação ou contexto
            @PathVariable Long id) { // ID da partida (matchId)
        // @PathVariable extrai os IDs da URL
        // Chama o método do Service para obter a partida por ID como DTO
        MatchDTO match = matchService.findByID(id);
        // Opcional: Definir tournamentId e roundId no DTO se eles não forem populados pelo Service
        // match.setTournamentId(tournamentId); // Se o MatchDTO tiver este campo
        // match.setRoundId(roundId); // O Service já deve popular RoundId
        // Retorna o DTO da partida com status HTTP 200 OK
        return ResponseEntity.ok(match);
    }

    // Endpoint para iniciar uma partida
    // Mapeado para POST /api/tournaments/{tournamentId}/rounds/{roundId}/matches/{id}/start
    @PostMapping("/{id}/start")
    public ResponseEntity<MatchDTO> startMatch(
            @PathVariable Long tournamentId, // Contexto
            @PathVariable Long roundId, // Contexto
            @PathVariable Long id) { // ID da partida (matchId)
        // Chama o método do Service para iniciar a partida
        MatchDTO startedMatch = matchService.startMatch(id);
        // Retorna o DTO da partida iniciada com status HTTP 200 OK
        return ResponseEntity.ok(startedMatch);
    }

    // Endpoint para registrar um evento em uma partida
    // Mapeado para POST /api/tournaments/{tournamentId}/rounds/{roundId}/matches/{matchId}/events
    // Nota: O ID da partida é incluído no corpo do EventDTO, mas também pode ser útil na URL.
    // Decidi usar o ID da partida na URL para clareza.
    @PostMapping("/{id}/events") // Usando {id} para o matchId na URL
    public ResponseEntity<MatchDTO> registerEvent(
            @PathVariable Long tournamentId, // Contexto
            @PathVariable Long roundId, // Contexto
            @PathVariable Long id, // ID da partida (matchId)
            @Valid @RequestBody EventDTO eventDTO) {
        // @Valid e @RequestBody mapeiam o corpo da requisição para o DTO
        // Define o matchId no DTO a partir da URL para garantir consistência
        eventDTO.setMatchId(id);
        // Chama o método do Service para registrar o evento
        MatchDTO updatedMatch = matchService.registerEvent(eventDTO);
        // Retorna o DTO da partida atualizada (com o evento registrado) com status HTTP 200 OK
        return ResponseEntity.ok(updatedMatch);
    }

    // Endpoint para finalizar uma partida
    // Mapeado para POST /api/tournaments/{tournamentId}/rounds/{roundId}/matches/{id}/finish
    @PostMapping("/{id}/finish")
    public ResponseEntity<MatchDTO> finishMatch(
            @PathVariable Long tournamentId, // Contexto
            @PathVariable Long roundId, // Contexto
            @PathVariable Long id) { // ID da partida (matchId)
        // Chama o método do Service para finalizar a partida
        // O Service determinará o vencedor e atualizará estatísticas
        MatchDTO finishedMatch = matchService.finishMatch(id);
        // Retorna o DTO da partida finalizada com status HTTP 200 OK
        return ResponseEntity.ok(finishedMatch);
    }

    // Endpoint para buscar eventos de uma partida específica
    // Mapeado para GET /api/tournaments/{tournamentId}/rounds/{roundId}/matches/{id}/events
    @GetMapping("/{id}/events")
    public ResponseEntity<List<EventDTO>> getMatchEvents(
            @PathVariable Long tournamentId, // Contexto
            @PathVariable Long roundId, // Contexto
            @PathVariable Long id) { // ID da partida (matchId)
        // Chama o método do Service para buscar eventos da partida
        List<EventDTO> events = matchService.getEventsForMatch(id);
        // Retorna a lista de DTOs de eventos com status HTTP 200 OK
        return ResponseEntity.ok(events);
    }


    // Endpoint para buscar todas as partidas de uma rodada
    // Mapeado para GET /api/tournaments/{tournamentId}/rounds/{roundId}/matches
    // Este é o @GetMapping sem o /{id} no final
    @GetMapping
    public ResponseEntity<List<MatchDTO>> getMatchesByRound(@PathVariable Long tournamentId, @PathVariable Long roundId) {
        List<MatchDTO> matches = matchService.getMatchesByRoundId(roundId); // Método implementado no MatchService
        return ResponseEntity.ok(matches);
    }
}
