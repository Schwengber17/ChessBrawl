package gabrielOttonelli.ChessBrawl.Service;

import gabrielOttonelli.ChessBrawl.Model.Player;
import gabrielOttonelli.ChessBrawl.Model.Tournament; 
import gabrielOttonelli.ChessBrawl.DTO.PlayerDTO;
import gabrielOttonelli.ChessBrawl.Exception.BusinessException;
import gabrielOttonelli.ChessBrawl.Repository.PlayerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlayerService {

    private final PlayerRepository playerRepository; 

    public PlayerDTO convertToDTO(Player player) {
        PlayerDTO dto = new PlayerDTO();
        dto.setId(player.getId());
        dto.setName(player.getName());
        dto.setNickname(player.getNickname());
        dto.setRating(player.getRating());
        dto.setTournamentPoints(player.getTournamentPoints());
        dto.setOriginalMoves(player.getOriginalMoves());
        dto.setBlundersMade(player.getBlundersMade());
        dto.setAdvantageousPositions(player.getAdvantageousPositions());
        dto.setDisrespectfulBehavior(player.getDisrespectfulBehavior());
        dto.setRage(player.getRage());

        if (player.getCurrentTournament() != null) {
            dto.setCurrentTournamentId(player.getCurrentTournament().getId());
            dto.setCurrentTournamentName(player.getCurrentTournament().getName());
        } else {
            dto.setCurrentTournamentId(null);
            dto.setCurrentTournamentName(null);
        }

        return dto;
    }

    private Player convertToEntity(PlayerDTO playerDTO) {
        Player player = new Player();
        player.setId(playerDTO.getId());
        player.setName(playerDTO.getName());
        player.setNickname(playerDTO.getNickname());
        player.setRating(playerDTO.getRating()); 

        return player;
    }

    public List<PlayerDTO> getAllPlayers() {
        return playerRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public PlayerDTO getPlayerById(Long id) {
        return playerRepository.findById(id)
                .map(this::convertToDTO)
                .orElseThrow(() -> new BusinessException("Jogador não encontrado com ID: " + id));
    }

    public PlayerDTO getPlayerByNickname(String nickname) {
        return playerRepository.findByNickname(nickname) 
                .map(this::convertToDTO)
                .orElseThrow(() -> new BusinessException("Jogador não encontrado com nickname: " + nickname)); 
    }

    @Transactional 
    public PlayerDTO save(PlayerDTO playerDTO) {
        Player player;

        if (playerDTO.getId() == null) {
            if (playerRepository.existsByNickname(playerDTO.getNickname())) {
                throw new BusinessException("Nickname '" + playerDTO.getNickname() + "' já existe!");
            }

            player = new Player();
            player.setName(playerDTO.getName());
            player.setNickname(playerDTO.getNickname());
            player.setRating(playerDTO.getRating());

            player.setTournamentPoints(70);

            player.setOriginalMoves(0);
            player.setBlundersMade(0);
            player.setAdvantageousPositions(0);
            player.setDisrespectfulBehavior(0);
            player.setRage(0);

        } else {
            player = playerRepository.findById(playerDTO.getId())
                    .orElseThrow(() -> new BusinessException("Jogador não encontrado para atualização com ID: " + playerDTO.getId()));

            if (!player.getNickname().equals(playerDTO.getNickname()) && playerRepository.existsByNickname(playerDTO.getNickname())) {
                throw new BusinessException("Nickname '" + playerDTO.getNickname() + "' já existe para outro jogador!");
            }

            player.setName(playerDTO.getName());
            player.setNickname(playerDTO.getNickname());

        }

        Player savedPlayer = playerRepository.save(player);

        return convertToDTO(savedPlayer);
    }

    @Transactional 
    public void delete(Long id) {
        if (!playerRepository.existsById(id)) {
            throw new BusinessException("Jogador não encontrado com ID: " + id);
        }
        playerRepository.deleteById(id);
    }

    @Transactional
    public void updatePlayerStats(Player player, int tournamentPointsChange, int originalMoves, int blundersMade, int advantageousPositions, int disrespectfulBehavior, int rage) {
        player.setTournamentPoints(player.getTournamentPoints() + tournamentPointsChange);
        player.setOriginalMoves(player.getOriginalMoves() + originalMoves);
        player.setBlundersMade(player.getBlundersMade() + blundersMade);
        player.setAdvantageousPositions(player.getAdvantageousPositions() + advantageousPositions);
        player.setDisrespectfulBehavior(player.getDisrespectfulBehavior() + disrespectfulBehavior);
        player.setRage(player.getRage() + rage);

        playerRepository.save(player);
    }

    @Transactional
    public void setCurrentTournamentForPlayer(Player player, Tournament tournament) {
        player.setCurrentTournament(tournament);
        playerRepository.save(player);
    }

    @Transactional
    public void addTournamentToPlayedList(Player player, Tournament tournament) { 
        if (!player.getTournamentsPlayed().contains(tournament)) {
            player.getTournamentsPlayed().add(tournament);
            playerRepository.save(player);
        }
    }

    @Transactional
    public void removeTournamentFromPlayedList(Player player, Tournament tournament) {
        if (player.getTournamentsPlayed().contains(tournament)) {
            player.getTournamentsPlayed().remove(tournament);
            playerRepository.save(player);
        }
    }
}
