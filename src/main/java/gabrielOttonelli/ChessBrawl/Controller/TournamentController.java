package gabrielOttonelli.ChessBrawl.Controller;

import gabrielOttonelli.ChessBrawl.DTO.TournamentDTO; 
import gabrielOttonelli.ChessBrawl.DTO.PlayerDTO; 
import gabrielOttonelli.ChessBrawl.Service.TournamentService; 
import gabrielOttonelli.ChessBrawl.Model.Tournament.TournamentStatus; 
import lombok.RequiredArgsConstructor;

import jakarta.validation.Valid; 

import java.util.List; 

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tournaments")
@RequiredArgsConstructor
public class TournamentController {

    private final TournamentService tournamentService; // Injeta a dependência do TournamentService

    @GetMapping
    public ResponseEntity<List<TournamentDTO>> getAllTournaments() {
        List<TournamentDTO> tournaments = tournamentService.getAllTournaments();
        return ResponseEntity.ok(tournaments);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<TournamentDTO>> getTournamentsByStatus(@PathVariable TournamentStatus status) {
        List<TournamentDTO> tournaments = tournamentService.getTournamentsByStatus(status);
        return ResponseEntity.ok(tournaments);
    }


    @GetMapping("/{id}")
    public ResponseEntity<TournamentDTO> getTournamentById(@PathVariable Long id) {
        TournamentDTO tournament = tournamentService.getTournamentById(id);
        return ResponseEntity.ok(tournament);
    }

    @PostMapping
    public ResponseEntity<TournamentDTO> createTournament(@Valid @RequestBody TournamentDTO tournamentDTO) {
        TournamentDTO createdTournament = tournamentService.createTournament(tournamentDTO);
        return new ResponseEntity<>(createdTournament, HttpStatus.CREATED);
    }

    @PostMapping("/{tournamentId}/add-player/{playerId}")
    public ResponseEntity<TournamentDTO> addPlayerToTournament(
            @PathVariable Long tournamentId,
            @PathVariable Long playerId) {
        TournamentDTO updatedTournament = tournamentService.addPlayerToTournament(tournamentId, playerId);
        return ResponseEntity.ok(updatedTournament);
    }

    @DeleteMapping("/{tournamentId}/remove-player/{playerId}")
    public ResponseEntity<TournamentDTO> removePlayerFromTournament(
            @PathVariable Long tournamentId,
            @PathVariable Long playerId) {
        TournamentDTO updatedTournament = tournamentService.removePlayerFromTournament(tournamentId, playerId);
        return ResponseEntity.ok(updatedTournament);
    }


    @PostMapping("/{id}/start")
    public ResponseEntity<TournamentDTO> startTournament(@PathVariable Long id) {
        TournamentDTO startedTournament = tournamentService.startTournament(id);
        return ResponseEntity.ok(startedTournament);
    }

    @PostMapping("/{id}/finish")
    public ResponseEntity<TournamentDTO> finishTournament(@PathVariable Long id) {
        //Seria para uma tela de fim do torneio, mas não foi implementada
         return ResponseEntity.ok().build(); 
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTournament(@PathVariable Long id) {
        tournamentService.deleteTournament(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/ranking") 
    public ResponseEntity<List<PlayerDTO>> getTournamentRanking(@PathVariable Long id) {
        List<PlayerDTO> ranking = tournamentService.getTournamentRanking(id);
        return ResponseEntity.ok(ranking);
    }
}
