package gabrielOttonelli.ChessBrawl.Service;

import gabrielOttonelli.ChessBrawl.Model.Player;
import gabrielOttonelli.ChessBrawl.DTO.PlayerDTO;
import gabrielOttonelli.ChessBrawl.Repository.PlayerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
@Service
@RequiredArgsConstructor
public class PlayerService {
    private final PlayerRepository playerRepository;
    
    private PlayerDTO convertToDTO(Player player) {
        PlayerDTO dto = new PlayerDTO();
        dto.setId(player.getId());
        dto.setName(player.getName());
        dto.setNickname(player.getNickname());
        dto.setRating(player.getRating());
        dto.setTournamentPoints(player.getTournamentPoints());
        dto.setOriginalMoves(player.getOriginalMoves());
        dto.setBlunders(player.getBlundersMade());
        dto.setAdvantageousPositions(player.getAdvantageousPositions());
        dto.setDisrespectfulBehavior(player.getDisrespectfulBehavior());
        dto.setRage(player.getRage());
        return dto;
    }
    
    private Player convertToEntity(PlayerDTO playerDTO) {
        Player player = new Player();
          // Campos obrigatórios
          player.setName(playerDTO.getName());
          player.setNickname(playerDTO.getNickname());
          player.setRating(playerDTO.getRating());
          
          // Campos opcionais com valores padrão se forem nulos
          // Usando Optional para tratar valores nulos de forma segura
          player.setTournamentPoints(Optional.ofNullable(playerDTO.getTournamentPoints()).orElse(0));
          player.setOriginalMoves(Optional.ofNullable(playerDTO.getOriginalMoves()).orElse(0));
          player.setBlundersMade(Optional.ofNullable(playerDTO.getBlunders()).orElse(0));
          player.setAdvantageousPositions(Optional.ofNullable(playerDTO.getAdvantageousPositions()).orElse(0));
          player.setDisrespectfulBehavior(Optional.ofNullable(playerDTO.getDisrespectfulBehavior()).orElse(0));
          player.setRage(Optional.ofNullable(playerDTO.getRage()).orElse(0));
          
          return player;
    }

    public List<PlayerDTO> getAllPlayers() {
        return playerRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    //lançar BusinessException se o jogador não existir
    public PlayerDTO getPlayerById(Long id) {
        return playerRepository.findById(id)
                .map(this::convertToDTO)
                .orElse(null);
    }

    @Transactional
    public PlayerDTO save(PlayerDTO playerDTO){
        if(playerDTO.getId() == null && playerRepository.existsByNickname(playerDTO.getNickname())) {
            throw new RuntimeException("Nickname já existe!");
        }
        Player player = convertToEntity(playerDTO);
        player = playerRepository.save(player);
        return convertToDTO(player);
    }

    @Transactional
    public void delete(Long id) {
        if (!playerRepository.existsById(id)) {
            throw new RuntimeException("Jogador não encontrado!");
        }
        playerRepository.deleteById(id);
    }

    @Transactional
    public PlayerDTO updateStatistics(Long id, String eventType) {
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Jogador não encontrado!"));
        
                switch (eventType) {
                    case "ORIGINAL_MOVE":
                        player.setOriginalMoves(player.getOriginalMoves() + 1);
                        player.setTournamentPoints(player.getTournamentPoints() + 5);
                        break;
                    case "BLUNDER":
                        player.setBlundersMade(player.getBlundersMade() + 1);
                        player.setTournamentPoints(player.getTournamentPoints() - 3);
                        break;
                    case "ADVANTAGEOUS_POSITION":
                        player.setAdvantageousPositions(player.getAdvantageousPositions() + 1);
                        player.setTournamentPoints(player.getTournamentPoints() + 2);
                        break;
                    case "DISRESPECT":
                        player.setDisrespectfulBehavior(player.getDisrespectfulBehavior() + 1);
                        player.setTournamentPoints(player.getTournamentPoints() - 5);
                        break;
                    case "RAGE_ATTACK":
                        player.setRage(player.getRage() + 1);
                        player.setTournamentPoints(player.getTournamentPoints() - 7);
                        break;
                    default:
                        throw new RuntimeException("Tipo de evento inválido!");
                    }
                
                playerRepository.save(player);
        
        return convertToDTO(player);
    }
}
