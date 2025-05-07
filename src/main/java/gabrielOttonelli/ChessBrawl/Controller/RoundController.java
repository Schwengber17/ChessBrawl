package gabrielOttonelli.ChessBrawl.Controller;

import gabrielOttonelli.ChessBrawl.DTO.RoundDTO;
import gabrielOttonelli.ChessBrawl.Service.RoundService;
import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.http.ResponseEntity; 
import org.springframework.web.bind.annotation.*; 

@RestController 
@RequestMapping("/api/tournaments/{tournamentId}/rounds")
@RequiredArgsConstructor
public class RoundController {

    private final RoundService roundService;

    @GetMapping
    public ResponseEntity<List<RoundDTO>> getRoundsByTournament(@PathVariable Long tournamentId) {
        List<RoundDTO> rounds = roundService.getRoundsByTournamentId(tournamentId);
        return ResponseEntity.ok(rounds);
    }

    @GetMapping("/{roundId}")
    public ResponseEntity<RoundDTO> getRoundById(@PathVariable Long tournamentId, @PathVariable Long roundId) {
        RoundDTO round = roundService.findRoundById(roundId);
        return ResponseEntity.ok(round);
    }

    @PostMapping("/next")
    public ResponseEntity<RoundDTO> createNextRound(@PathVariable Long tournamentId) {
        RoundDTO nextRound = roundService.createNextRound(tournamentId);
        return ResponseEntity.ok(nextRound);
    }

}
