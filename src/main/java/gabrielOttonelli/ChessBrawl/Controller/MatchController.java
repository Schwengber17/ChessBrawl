package gabrielOttonelli.ChessBrawl.Controller;

import gabrielOttonelli.ChessBrawl.DTO.MatchDTO; 
import gabrielOttonelli.ChessBrawl.DTO.EventDTO;
import gabrielOttonelli.ChessBrawl.Service.MatchService;
import lombok.RequiredArgsConstructor;

import jakarta.validation.Valid; 

import java.util.List; 

import org.springframework.http.ResponseEntity; 
import org.springframework.web.bind.annotation.*; 

@RestController 
@RequestMapping("/api/tournaments/{tournamentId}/rounds/{roundId}/matches")
@RequiredArgsConstructor 
public class MatchController {

    private final MatchService matchService; 
    @GetMapping("/{id}")
    public ResponseEntity<MatchDTO> getMatchById(
            @PathVariable Long tournamentId,
            @PathVariable Long roundId,
            @PathVariable Long id) {
        MatchDTO match = matchService.findByID(id);
        return ResponseEntity.ok(match);
    }

    
    @PostMapping("/{id}/start")
    public ResponseEntity<MatchDTO> startMatch(
            @PathVariable Long tournamentId,
            @PathVariable Long roundId,
            @PathVariable Long id) { 
        MatchDTO startedMatch = matchService.startMatch(id);
        return ResponseEntity.ok(startedMatch);
    }

    @PostMapping("/{id}/events") 
    public ResponseEntity<MatchDTO> registerEvent(
            @PathVariable Long tournamentId, 
            @PathVariable Long roundId,
            @PathVariable Long id, 
            @Valid @RequestBody EventDTO eventDTO) {
        eventDTO.setMatchId(id);
        MatchDTO updatedMatch = matchService.registerEvent(eventDTO);
        return ResponseEntity.ok(updatedMatch);
    }

    @PostMapping("/{id}/finish")
    public ResponseEntity<MatchDTO> finishMatch(
            @PathVariable Long tournamentId, 
            @PathVariable Long roundId, 
            @PathVariable Long id) { 
        MatchDTO finishedMatch = matchService.finishMatch(id);
        return ResponseEntity.ok(finishedMatch);
    }

    @GetMapping("/{id}/events")
    public ResponseEntity<List<EventDTO>> getMatchEvents(
            @PathVariable Long tournamentId, 
            @PathVariable Long roundId, 
            @PathVariable Long id) { 
        List<EventDTO> events = matchService.getEventsForMatch(id);
        return ResponseEntity.ok(events);
    }


    @GetMapping
    public ResponseEntity<List<MatchDTO>> getMatchesByRound(@PathVariable Long tournamentId, @PathVariable Long roundId) {
        List<MatchDTO> matches = matchService.getMatchesByRoundId(roundId); 
        return ResponseEntity.ok(matches);
    }
}
