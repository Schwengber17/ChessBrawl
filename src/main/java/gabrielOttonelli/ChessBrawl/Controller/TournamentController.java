package gabrielOttonelli.ChessBrawl.Controller;

import java.util.List;
import java.util.Optional;
import org.springframework.http.HttpStatus;

import gabrielOttonelli.ChessBrawl.DTO.PlayerDTO;
import gabrielOttonelli.ChessBrawl.DTO.TournamentDTO;
import gabrielOttonelli.ChessBrawl.Service.TournamentService;
import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/api/tournaments")
@RequiredArgsConstructor
public class TournamentController {
    private final TournamentService tournamentService;

    @GetMapping
    public ResponseEntity<List<TournamentDTO>> getAllTournaments() {
        return ResponseEntity.ok(tournamentService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Optional<TournamentDTO>> getTournamentById(@PathVariable Long id) {
        return ResponseEntity.ok(tournamentService.findById(id));
    }

    @PostMapping
    public ResponseEntity<TournamentDTO> createTournament(@Valid @RequestBody TournamentDTO tournamentDTO) {
        return new ResponseEntity<>(tournamentService.createTournament(tournamentDTO), HttpStatus.CREATED);
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<TournamentDTO> startTournament(@PathVariable Long id) {
        return ResponseEntity.ok(tournamentService.startTournament(id));
    }

    @GetMapping("/{id}/ranking")
    public ResponseEntity<List<PlayerDTO>> getTournamentRanking(@PathVariable Long id) {
        return ResponseEntity.ok(tournamentService.getPlayerRanking(id));
    }
    

}
