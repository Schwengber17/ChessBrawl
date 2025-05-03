package gabrielOttonelli.ChessBrawl.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import gabrielOttonelli.ChessBrawl.DTO.RoundDTO;
import gabrielOttonelli.ChessBrawl.Service.RoundService;
import lombok.RequiredArgsConstructor;
@RestController
@RequestMapping("/api/rounds")
@RequiredArgsConstructor
public class RoundController {
    private final RoundService roundService;

    @GetMapping("/tournament/{tournamentId}")
    public ResponseEntity<List<RoundDTO>> getRoundsByTournament(@PathVariable Long tournamentId) {
        return ResponseEntity.ok(roundService.findRoundsByTournament(tournamentId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoundDTO> getRoundById(@PathVariable Long id) {
        return ResponseEntity.ok(roundService.findRoundById(id));
    }

    @PostMapping("/tournament/{tournamentId}/next")
    public ResponseEntity<RoundDTO> getNextRound(@PathVariable Long tournamentId) {
        return ResponseEntity.ok(roundService.createNextRound(tournamentId));
    }

    
}
