package gabrielOttonelli.ChessBrawl.Controller;

import gabrielOttonelli.ChessBrawl.DTO.TournamentDTO; // Importar o DTO do Torneio
import gabrielOttonelli.ChessBrawl.DTO.PlayerDTO; // Importar PlayerDTO para ranking
import gabrielOttonelli.ChessBrawl.Service.TournamentService; // Importar o Service do Torneio
import gabrielOttonelli.ChessBrawl.Model.Tournament.TournamentStatus; // Importar o enum de status do Torneio
import lombok.RequiredArgsConstructor;

import jakarta.validation.Valid; // Para validar o DTO no corpo da requisição

import java.util.List; // Para retornar listas de DTOs
import java.util.Optional; // Para métodos que podem retornar Optional

import org.springframework.http.HttpStatus; // Para definir status HTTP
import org.springframework.http.ResponseEntity; // Para construir a resposta HTTP
import org.springframework.web.bind.annotation.*; // Anotações de mapeamento HTTP

@RestController // Indica que esta classe é um Controller REST
@RequestMapping("/api/tournaments") // Define o caminho base para todos os endpoints deste Controller
@RequiredArgsConstructor // Usa Lombok para gerar um construtor com todos os campos finais
public class TournamentController {

    private final TournamentService tournamentService; // Injeta a dependência do TournamentService

    // Endpoint para buscar todos os torneios
    // Mapeado para GET /api/tournaments
    @GetMapping
    public ResponseEntity<List<TournamentDTO>> getAllTournaments() {
        // Chama o método do Service para obter todos os torneios como DTOs
        List<TournamentDTO> tournaments = tournamentService.getAllTournaments();
        // Retorna a lista de DTOs com status HTTP 200 OK
        return ResponseEntity.ok(tournaments);
    }

     // Endpoint para buscar torneios por status
    // Mapeado para GET /api/tournaments/status/{status}
    @GetMapping("/status/{status}")
    public ResponseEntity<List<TournamentDTO>> getTournamentsByStatus(@PathVariable TournamentStatus status) {
        // @PathVariable extrai o status da URL e o Spring converte automaticamente para o enum
        List<TournamentDTO> tournaments = tournamentService.getTournamentsByStatus(status);
        return ResponseEntity.ok(tournaments);
    }


    // Endpoint para buscar um torneio por ID
    // Mapeado para GET /api/tournaments/{id}
    @GetMapping("/{id}")
    public ResponseEntity<TournamentDTO> getTournamentById(@PathVariable Long id) {
        // Chama o método do Service para obter o torneio por ID como DTO
        // O Service já lança exceção se não encontrar
        TournamentDTO tournament = tournamentService.getTournamentById(id);
        // Retorna o DTO do torneio com status HTTP 200 OK
        return ResponseEntity.ok(tournament);
    }

    // Endpoint para criar um novo torneio
    // Mapeado para POST /api/tournaments
    @PostMapping
    public ResponseEntity<TournamentDTO> createTournament(@Valid @RequestBody TournamentDTO tournamentDTO) {
        // @Valid e @RequestBody mapeiam o corpo da requisição para o DTO
        // Chama o método do Service para criar o torneio
        TournamentDTO createdTournament = tournamentService.createTournament(tournamentDTO);
        // Retorna o DTO do torneio criado com status HTTP 201 Created
        return new ResponseEntity<>(createdTournament, HttpStatus.CREATED);
    }

    // Endpoint para adicionar um jogador a um torneio (status CREATED)
    // Mapeado para POST /api/tournaments/{tournamentId}/add-player/{playerId}
    @PostMapping("/{tournamentId}/add-player/{playerId}")
    public ResponseEntity<TournamentDTO> addPlayerToTournament(
            @PathVariable Long tournamentId,
            @PathVariable Long playerId) {
        // Chama o método do Service para adicionar o jogador
        TournamentDTO updatedTournament = tournamentService.addPlayerToTournament(tournamentId, playerId);
        // Retorna o DTO do torneio atualizado com status HTTP 200 OK
        return ResponseEntity.ok(updatedTournament);
    }

     // Endpoint para remover um jogador de um torneio (status CREATED)
    // Mapeado para DELETE /api/tournaments/{tournamentId}/remove-player/{playerId}
    // Usando DELETE pois é uma operação de remoção de um recurso associado
    @DeleteMapping("/{tournamentId}/remove-player/{playerId}")
    public ResponseEntity<TournamentDTO> removePlayerFromTournament(
            @PathVariable Long tournamentId,
            @PathVariable Long playerId) {
        // Chama o método do Service para remover o jogador
        TournamentDTO updatedTournament = tournamentService.removePlayerFromTournament(tournamentId, playerId);
        // Retorna o DTO do torneio atualizado com status HTTP 200 OK
        return ResponseEntity.ok(updatedTournament);
    }


    // Endpoint para iniciar um torneio
    // Mapeado para POST /api/tournaments/{id}/start
    @PostMapping("/{id}/start")
    public ResponseEntity<TournamentDTO> startTournament(@PathVariable Long id) {
        // Chama o método do Service para iniciar o torneio
        TournamentDTO startedTournament = tournamentService.startTournament(id);
        // Retorna o DTO do torneio iniciado com status HTTP 200 OK
        return ResponseEntity.ok(startedTournament);
    }

    // Endpoint para finalizar um torneio
    // Mapeado para POST /api/tournaments/{id}/finish
    @PostMapping("/{id}/finish")
    public ResponseEntity<TournamentDTO> finishTournament(@PathVariable Long id) {
        // TODO: O método finishTournament no Service precisa ser público
        // Chama o método do Service para finalizar o torneio
        // TournamentDTO finishedTournament = tournamentService.finishTournament(id);
        // Retorna o DTO do torneio finalizado com status HTTP 200 OK
        // return ResponseEntity.ok(finishedTournament);
        // Placeholder: Retornar 200 OK por enquanto
         return ResponseEntity.ok().build(); // Ajustar retorno após implementar finishTournament
    }


    // Endpoint para excluir um torneio por ID
    // Mapeado para DELETE /api/tournaments/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTournament(@PathVariable Long id) {
        // Chama o método do Service para excluir o torneio
        tournamentService.deleteTournament(id);
        // Retorna uma resposta vazia com status HTTP 204 No Content
        return ResponseEntity.noContent().build();
    }

    // TODO: Endpoint para obter o ranking do torneio
    // Mapeado para GET /api/tournaments/{id}/ranking
    // @GetMapping("/{id}/ranking")
    // public ResponseEntity<List<PlayerDTO>> getTournamentRanking(@PathVariable Long id) {
    //     // TODO: Implementar método getTournamentRanking no TournamentService
    //     // List<PlayerDTO> ranking = tournamentService.getTournamentRanking(id);
    //     // return ResponseEntity.ok(ranking);
    //      return ResponseEntity.ok().build(); // Placeholder
    // }
}
