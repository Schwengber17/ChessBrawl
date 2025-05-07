package gabrielOttonelli.ChessBrawl.Controller;

import gabrielOttonelli.ChessBrawl.DTO.PlayerDTO; 
import gabrielOttonelli.ChessBrawl.Service.PlayerService;
import lombok.RequiredArgsConstructor;

import jakarta.validation.Valid; 

import java.util.List; 

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity; 
import org.springframework.web.bind.annotation.*; 

@RestController 
@RequestMapping("/api/players") 
@RequiredArgsConstructor 
public class PlayerController {

    private final PlayerService playerService; 

    @GetMapping
    public ResponseEntity<List<PlayerDTO>> getAllPlayers() {
        List<PlayerDTO> players = playerService.getAllPlayers();
        return ResponseEntity.ok(players);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlayerDTO> getPlayerById(@PathVariable Long id) {
        PlayerDTO player = playerService.getPlayerById(id);
        return ResponseEntity.ok(player);
    }

    @GetMapping("/by-nickname/{nickname}")
    public ResponseEntity<PlayerDTO> getPlayerByNickname(@PathVariable String nickname) {
        PlayerDTO player = playerService.getPlayerByNickname(nickname);
        return ResponseEntity.ok(player);
    }

    @PostMapping
    public ResponseEntity<PlayerDTO> createPlayer(@Valid @RequestBody PlayerDTO playerDTO) {
        PlayerDTO createdPlayer = playerService.save(playerDTO);
        return new ResponseEntity<>(createdPlayer, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PlayerDTO> updatePlayer(@PathVariable Long id, @Valid @RequestBody PlayerDTO playerDTO) {
        playerDTO.setId(id);
        PlayerDTO updatedPlayer = playerService.save(playerDTO);
        return ResponseEntity.ok(updatedPlayer);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlayer(@PathVariable Long id) {
        playerService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
