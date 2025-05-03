package gabrielOttonelli.ChessBrawl.Service;

import gabrielOttonelli.ChessBrawl.DTO.PlayerDTO;
import gabrielOttonelli.ChessBrawl.DTO.TournamentDTO;
import gabrielOttonelli.ChessBrawl.Model.Player;
import gabrielOttonelli.ChessBrawl.Model.Tournament;
import gabrielOttonelli.ChessBrawl.Repository.TournamentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import gabrielOttonelli.ChessBrawl.Repository.PlayerRepository;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TournamentService {
    private final TournamentRepository tournamentRepository;
    private final PlayerRepository playerRepository;
    private final RoundService roundService;

    public List<TournamentDTO> findAll() {
        return tournamentRepository.findAll().stream()
                .map(this::convertToDTO)
                .toList();
    }

    public Optional<TournamentDTO> findById(Long id) {
        return tournamentRepository.findById(id).map(this::convertToDTO);
    }

    @Transactional
    public TournamentDTO createTournament(TournamentDTO tournamentDTO) {
        if (tournamentDTO.getPlayerIds().size() < 4 || 
            tournamentDTO.getPlayerIds().size() > 8 || 
            tournamentDTO.getPlayerIds().size() % 2 != 0 || 
            tournamentDTO.getPlayerIds().size() == 6) {
            throw new RuntimeException("O torneio deve ter entre 4 ou 8 jogadores");
        }
        
        Tournament tournament = new Tournament();
        tournament.setName(tournamentDTO.getName());
        tournament.setStatus(Tournament.TournamentStatus.CREATED);
        
        // Adicionar jogadores
        List<Player> players = tournamentDTO.getPlayerIds().stream()
                .map(id -> playerRepository.findById(id)
                        .orElseThrow(() -> new RuntimeException("Jogador não encontrado: " + id)))
                .collect(Collectors.toList());
        
        tournament.setPlayers(players);
        
        // Salvar torneio
        tournament = tournamentRepository.save(tournament);
        
        // Resetar pontuação dos jogadores para 70
        for (Player player : players) {
            player.setTournamentPoints(70);
            playerRepository.save(player);
        }
        
        return convertToDTO(tournament);
    }  

    @Transactional
    public TournamentDTO startTournament(Long id) {
        Tournament tournament = tournamentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Torneio não encontrado"));
        
        if (tournament.getStatus() != Tournament.TournamentStatus.CREATED) {
            throw new RuntimeException("Torneio já iniciado ou finalizado");
        }
        
        tournament.setStatus(Tournament.TournamentStatus.IN_PROGRESS);
        tournamentRepository.save(tournament);
        
        // Criar primeira rodada
        roundService.createNextRound(tournament.getId());
        
        return convertToDTO(tournament);
    }

    @Transactional
    public void finishTournament(Long id, Long championId) {
        Tournament tournament = tournamentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Torneio não encontrado"));
        
        tournament.setStatus(Tournament.TournamentStatus.FINISHED);
        tournamentRepository.save(tournament);
    }

    public List<PlayerDTO> getPlayerRanking(Long tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Torneio não encontrado"));
        
        List<Player> players = new ArrayList<>(tournament.getPlayers());
        players.sort(Comparator.comparing(Player::getTournamentPoints).reversed());
        
        return players.stream()
                .map(player -> {
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
                })
                .collect(Collectors.toList());
    }

    private TournamentDTO convertToDTO(Tournament tournament) {
        TournamentDTO dto = new TournamentDTO();
        dto.setId(tournament.getId());
        dto.setName(tournament.getName());
        dto.setStatus(tournament.getStatus());
        
        List<Long> playerIds = tournament.getPlayers().stream()
                .map(Player::getId)
                .collect(Collectors.toList());
        dto.setPlayerIds(playerIds);
        
        return dto;
    }
}
