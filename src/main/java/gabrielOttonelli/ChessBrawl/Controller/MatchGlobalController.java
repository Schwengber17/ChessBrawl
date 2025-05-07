package gabrielOttonelli.ChessBrawl.Controller;

import gabrielOttonelli.ChessBrawl.Service.MatchService; 
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity; 
import org.springframework.web.bind.annotation.*; 

@RestController 
@RequestMapping("/api/matches") 
@RequiredArgsConstructor 
public class MatchGlobalController {

    private final MatchService matchService; 

    // Fiz este endpoint não aninhado com /tournaments/{tournamentId}/rounds/{roundId}/matches para tratamento de um erro
    @GetMapping("/event-types")
    @CrossOrigin(origins = "http://localhost:8080") 
    public ResponseEntity<String[]> getEventTypes() {
        String[] eventTypes = matchService.getEventTypes();
        return ResponseEntity.ok(eventTypes);
    }

}
