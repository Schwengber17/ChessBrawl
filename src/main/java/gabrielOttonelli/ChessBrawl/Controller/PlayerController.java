package gabrielOttonelli.ChessBrawl.Controller;

import gabrielOttonelli.ChessBrawl.DTO.PlayerDTO; // Importar o DTO do Jogador
import gabrielOttonelli.ChessBrawl.Service.PlayerService; // Importar o Service do Jogador
import lombok.RequiredArgsConstructor;

import jakarta.validation.Valid; // Para validar o DTO no corpo da requisição

import java.util.List; // Para retornar listas de DTOs

import org.springframework.http.HttpStatus; // Para definir status HTTP
import org.springframework.http.ResponseEntity; // Para construir a resposta HTTP
import org.springframework.web.bind.annotation.*; // Anotações de mapeamento HTTP

@RestController // Indica que esta classe é um Controller REST
@RequestMapping("/api/players") // Define o caminho base para todos os endpoints deste Controller
@RequiredArgsConstructor // Usa Lombok para gerar um construtor com todos os campos finais (injeção de dependência)
public class PlayerController {

    private final PlayerService playerService; // Injeta a dependência do PlayerService

    // Endpoint para buscar todos os jogadores
    // Mapeado para GET /api/players
    @GetMapping
    public ResponseEntity<List<PlayerDTO>> getAllPlayers() {
        // Chama o método do Service para obter todos os jogadores como DTOs
        List<PlayerDTO> players = playerService.getAllPlayers();
        // Retorna a lista de DTOs com status HTTP 200 OK
        return ResponseEntity.ok(players);
    }

    // Endpoint para buscar um jogador por ID
    // Mapeado para GET /api/players/{id}
    @GetMapping("/{id}")
    public ResponseEntity<PlayerDTO> getPlayerById(@PathVariable Long id) {
        // @PathVariable extrai o ID da URL
        // Chama o método do Service para obter o jogador por ID como DTO
        PlayerDTO player = playerService.getPlayerById(id);
        // Retorna o DTO do jogador com status HTTP 200 OK (o Service lança exceção se não encontrar)
        return ResponseEntity.ok(player);
    }

    // Endpoint para buscar um jogador por nickname
    // Mapeado para GET /api/players/by-nickname/{nickname}
    @GetMapping("/by-nickname/{nickname}")
    public ResponseEntity<PlayerDTO> getPlayerByNickname(@PathVariable String nickname) {
        // @PathVariable extrai o nickname da URL
        // Chama o método do Service para obter o jogador por nickname como DTO
        PlayerDTO player = playerService.getPlayerByNickname(nickname);
        // Retorna o DTO do jogador com status HTTP 200 OK (o Service lança exceção se não encontrar)
        return ResponseEntity.ok(player);
    }

    // Endpoint para criar um novo jogador
    // Mapeado para POST /api/players
    @PostMapping
    public ResponseEntity<PlayerDTO> createPlayer(@Valid @RequestBody PlayerDTO playerDTO) {
        // @Valid aciona a validação definida no PlayerDTO
        // @RequestBody mapeia o corpo da requisição HTTP para o objeto PlayerDTO
        // Chama o método do Service para salvar (criar) o jogador
        PlayerDTO createdPlayer = playerService.save(playerDTO);
        // Retorna o DTO do jogador criado com status HTTP 201 Created
        return new ResponseEntity<>(createdPlayer, HttpStatus.CREATED);
    }

    // Endpoint para atualizar um jogador existente
    // Mapeado para PUT /api/players/{id}
    @PutMapping("/{id}")
    public ResponseEntity<PlayerDTO> updatePlayer(@PathVariable Long id, @Valid @RequestBody PlayerDTO playerDTO) {
        // @PathVariable extrai o ID da URL
        // @Valid e @RequestBody mapeiam o corpo da requisição para o DTO
        // Define o ID no DTO para garantir que o Service saiba qual jogador atualizar
        playerDTO.setId(id);
        // Chama o método do Service para salvar (atualizar) o jogador
        PlayerDTO updatedPlayer = playerService.save(playerDTO);
        // Retorna o DTO do jogador atualizado com status HTTP 200 OK
        return ResponseEntity.ok(updatedPlayer);
    }

    // Endpoint para excluir um jogador por ID
    // Mapeado para DELETE /api/players/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlayer(@PathVariable Long id) {
        // @PathVariable extrai o ID da URL
        // Chama o método do Service para excluir o jogador
        playerService.delete(id);
        // Retorna uma resposta vazia com status HTTP 204 No Content para indicar sucesso na exclusão
        return ResponseEntity.noContent().build();
    }
}
