package gabrielOttonelli.ChessBrawl.Controller;

import gabrielOttonelli.ChessBrawl.Service.MatchService; // Importar o Service da Partida
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity; // Para construir a resposta HTTP
import org.springframework.web.bind.annotation.*; // Anotações de mapeamento HTTP

@RestController // Indica que esta classe é um Controller REST
@RequestMapping("/api/matches") // Define o caminho base para endpoints globais de partidas
@RequiredArgsConstructor // Usa Lombok para gerar um construtor com todos os campos finais
public class MatchGlobalController {

    private final MatchService matchService; // Injeta a dependência do MatchService

    // Endpoint para obter os tipos de evento disponíveis (pode ser útil para o frontend)
    // Mapeado para GET /api/matches/event-types
    // Este endpoint NÃO está aninhado sob /tournaments/{tournamentId}/rounds/{roundId}/matches
    @GetMapping("/event-types") // Caminho relativo ao RequestMapping da classe (/api/matches)
    @CrossOrigin(origins = "http://localhost:8080") // Permitir requisições do frontend
    public ResponseEntity<String[]> getEventTypes() {
        // Chama o método no Service para obter os nomes dos tipos de evento
        String[] eventTypes = matchService.getEventTypes(); // Método implementado no MatchService
        return ResponseEntity.ok(eventTypes);
    }

    // TODO: Adicionar outros endpoints globais relacionados a partidas aqui, se necessário.
    // Por exemplo: buscar partidas por status globalmente, etc.
}
