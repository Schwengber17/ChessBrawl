package gabrielOttonelli.ChessBrawl.Service;

import gabrielOttonelli.ChessBrawl.Model.Tournament;
import gabrielOttonelli.ChessBrawl.Model.Player;
import gabrielOttonelli.ChessBrawl.Model.Round; 
import gabrielOttonelli.ChessBrawl.DTO.TournamentDTO;
import gabrielOttonelli.ChessBrawl.DTO.PlayerDTO;
import gabrielOttonelli.ChessBrawl.Exception.BusinessException;
import gabrielOttonelli.ChessBrawl.Repository.TournamentRepository;
import gabrielOttonelli.ChessBrawl.Repository.PlayerRepository; 
import gabrielOttonelli.ChessBrawl.Repository.RoundRepository; 

import gabrielOttonelli.ChessBrawl.Event.RoundFinishedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.annotation.Lazy; 
import org.springframework.context.event.EventListener; 

import java.util.List;
import java.util.stream.Collectors;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor 
public class TournamentService {

    private final TournamentRepository tournamentRepository; 
    private final PlayerRepository playerRepository; 
    @Lazy private final RoundService roundService;
    private final RoundRepository roundRepository;

    private final PlayerService playerService;



    private TournamentDTO convertToDTO(Tournament tournament) {
        TournamentDTO dto = new TournamentDTO();
        dto.setId(tournament.getId());
        dto.setName(tournament.getName());
        // Verifica se o status não é null antes de converter para String
        if (tournament.getStatus() != null) {
             dto.setStatus(tournament.getStatus().name()); // Converte o enum para String
        } else {
             dto.setStatus(null); // Ou um valor padrão
        }

        if(tournament.getChampion()!=null){
            dto.setChampionId(tournament.getChampion().getId());
            dto.setChampionNickname(tournament.getChampion().getNickname());
            dto.setChampionName(tournament.getChampion().getName());
        }else{
            dto.setChampionId(null); // Ou um valor padrão
            dto.setChampionNickname(null); // Ou um valor padrão
            dto.setChampionName(null); // Ou um valor padrão
        }

        if (tournament.getPlayers() != null) {
            dto.setPlayerCount(tournament.getPlayers().size());
        } else {
            dto.setPlayerCount(0);
        }
        if (tournament.getRounds() != null) {
            dto.setRoundCount(tournament.getRounds().size());
        } else {
            dto.setRoundCount(0);
        }

        return dto;
    }

    private Tournament convertToEntity(TournamentDTO tournamentDTO) {
        Tournament tournament = new Tournament();
        tournament.setName(tournamentDTO.getName());

        return tournament;
    }


    public List<TournamentDTO> getAllTournaments() {
        return tournamentRepository.findAll().stream()
                 .map(this::convertToDTO) 
                 .collect(Collectors.toList());
    }

    public List<TournamentDTO> getTournamentsByStatus(Tournament.TournamentStatus status) {
        return tournamentRepository.findByStatus(status).stream()
                 .map(this::convertToDTO)
                 .collect(Collectors.toList());
    }


    public TournamentDTO getTournamentById(Long id) {
        Tournament tournament = tournamentRepository.findById(id)
                 .orElseThrow(() -> new BusinessException("Torneio não encontrado com ID: " + id));

        TournamentDTO dto = convertToDTO(tournament);
        return dto;
    }

    @Transactional 
    public TournamentDTO createTournament(TournamentDTO tournamentDTO) {
        if (tournamentDTO.getPlayerIds() == null || tournamentDTO.getPlayerIds().size() < 4 || tournamentDTO.getPlayerIds().size() > 8 || tournamentDTO.getPlayerIds().size() % 2 != 0 || tournamentDTO.getPlayerIds().size() == 6) {
             throw new BusinessException("Um torneio deve ter 4 ou 8 jogadores");
        }
        
        Tournament newTournament = new Tournament();
        newTournament.setName(tournamentDTO.getName());
        List<Player> associatedPlayers = new ArrayList<>();

        for (Long playerId : tournamentDTO.getPlayerIds()) {
            Player player = playerRepository.findById(playerId)
                    .orElseThrow(() -> new BusinessException("Jogador não encontrado com ID: " + playerId));

            if (player.getCurrentTournament() != null) {
                throw new BusinessException("O jogador '" + player.getNickname() + "' já está participando do torneio '" + player.getCurrentTournament().getName() + "'. Um jogador só pode participar de um torneio por vez.");
            }

            player.setTournamentPoints(70);
            playerRepository.save(player);
            associatedPlayers.add(player);


            playerService.setCurrentTournamentForPlayer(player, newTournament);
        }

        newTournament.setPlayers(associatedPlayers);
        Tournament savedTournament = tournamentRepository.save(newTournament);

        return convertToDTO(savedTournament);
    }

    @Transactional
    public TournamentDTO addPlayerToTournament(Long tournamentId, Long playerId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                 .orElseThrow(() -> new BusinessException("Torneio não encontrado com ID: " + tournamentId));

        Player player = playerRepository.findById(playerId)
                 .orElseThrow(() -> new BusinessException("Jogador não encontrado com ID: " + playerId));

        if (tournament.getStatus() != Tournament.TournamentStatus.CREATED) {
            throw new BusinessException("Não é possível adicionar jogadores a um torneio que não está no status CREATED.");
        }
        if (tournament.getPlayers().contains(player)) {
            throw new BusinessException("O jogador '" + player.getNickname() + "' já está neste torneio.");
        }
        if (player.getCurrentTournament() != null) {
             throw new BusinessException("O jogador '" + player.getNickname() + "' já está participando do torneio '" + player.getCurrentTournament().getName() + "'. Ele só pode participar de um torneio por vez.");
        }
        if (tournament.getPlayers().size() >= 8) {
            throw new BusinessException("O torneio já atingiu o número máximo de 8 jogadores.");
        }

        tournament.getPlayers().add(player);

        playerService.setCurrentTournamentForPlayer(player, tournament);
        Tournament updatedTournament = tournamentRepository.save(tournament);

        return convertToDTO(updatedTournament);
    }

    @Transactional
    public TournamentDTO removePlayerFromTournament(Long tournamentId, Long playerId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                 .orElseThrow(() -> new BusinessException("Torneio não encontrado com ID: " + tournamentId));

        Player player = playerRepository.findById(playerId)
                 .orElseThrow(() -> new BusinessException("Jogador não encontrado com ID: " + playerId));

        if (tournament.getStatus() != Tournament.TournamentStatus.CREATED) {
            throw new BusinessException("Não é possível remover jogadores de um torneio que não está no status CREATED.");
        }
        if (!tournament.getPlayers().contains(player)) {
            throw new BusinessException("O jogador '" + player.getNickname() + "' não está neste torneio.");
        }

        tournament.getPlayers().remove(player);

        if (player.getCurrentTournament() != null && player.getCurrentTournament().getId().equals(tournamentId)) {
             playerService.setCurrentTournamentForPlayer(player, null);
        }

        Tournament updatedTournament = tournamentRepository.save(tournament);

        return convertToDTO(updatedTournament);
    }


    @Transactional
    public TournamentDTO startTournament(Long tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                 .orElseThrow(() -> new BusinessException("Torneio não encontrado com ID: " + tournamentId));

        if (tournament.getStatus() != Tournament.TournamentStatus.CREATED) {
            throw new BusinessException("O torneio já foi iniciado ou finalizado.");
        }
        int playerCount = tournament.getPlayers().size();

        if (playerCount == 6) {
            throw new BusinessException("O torneio não pode ter exatamente 6 jogadores.");
        }
        if (playerCount < 4 || playerCount > 8 || playerCount % 2 != 0) {
             throw new BusinessException("O torneio deve ter entre 4 e 8 jogadores. Jogadores atuais: " + playerCount);
        }
        
        //Dupla reinicialização 
        for (Player player : tournament.getPlayers()) {
            player.setTournamentPoints(70);
            playerRepository.save(player); 
        }
    

        tournament.setStatus(Tournament.TournamentStatus.IN_PROGRESS);
        roundService.createRound(tournament, 1, new ArrayList<>(tournament.getPlayers())); // Passa uma nova lista para evitar problemas de modificação

        Tournament startedTournament = tournamentRepository.save(tournament);

        return convertToDTO(startedTournament);
    }


    // --- MÉTODO LISTENER PARA EVENTOS DE RODADA FINALIZADA ---
    @EventListener
    @Transactional 
    public void handleRoundFinishedEvent(RoundFinishedEvent event) {
        Long finishedRoundId = event.getFinishedRoundId();

        Round completedRound = roundRepository.findById(finishedRoundId) // Usando RoundRepository diretamente
                 .orElseThrow(() -> new BusinessException("Rodada finalizada não encontrada com ID: " + finishedRoundId));

        Tournament tournament = completedRound.getTournament();
         if (tournament == null) {
             System.err.println("Rodada finalizada ID " + finishedRoundId + " não está associada a nenhum torneio.");
             return; 
         }

        List<Player> qualifiedPlayers = roundService.getQualifiedPlayersFromRound(finishedRoundId);

        if (qualifiedPlayers.size() == 1) {
            finalizeTournament(tournament, qualifiedPlayers.get(0));
        } else if (qualifiedPlayers.size() > 1 && qualifiedPlayers.size() % 2 == 0) {
            int nextRoundNumber = completedRound.getRoundNumber() + 1;
            roundService.createRound(tournament, nextRoundNumber, qualifiedPlayers);
        } else {
            throw new BusinessException("Erro na progressão do torneio: número ímpar de jogadores qualificados para a próxima rodada após rodada " + completedRound.getRoundNumber());
        }
    }


    @Transactional
    private void finalizeTournament(Tournament tournament, Player champion) {
        tournament.setStatus(Tournament.TournamentStatus.FINISHED);
        tournament.setChampion(champion); 

        List<Player> playersInThisTournament = playerRepository.findByCurrentTournament(tournament);
        for (Player player : playersInThisTournament) {
             playerService.setCurrentTournamentForPlayer(player, null);
        }

        tournamentRepository.save(tournament);

    }


    @Transactional 
    public void deleteTournament(Long tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                 .orElseThrow(() -> new BusinessException("Torneio não encontrado com ID: " + tournamentId));

        List<Player> playersWhoPlayedThisTournament = playerRepository.findByTournamentsPlayedContaining(tournament);
         for (Player player : playersWhoPlayedThisTournament) {
             player.getTournamentsPlayed().remove(tournament);
             playerRepository.save(player); 
         }

        List<Player> playersCurrentlyInThisTournament = playerRepository.findByCurrentTournament(tournament);
         for (Player player : playersCurrentlyInThisTournament) {
             playerService.setCurrentTournamentForPlayer(player, null);
         }

        tournamentRepository.delete(tournament);
    }

    public List<PlayerDTO> getTournamentRanking(Long tournamentId) {

        Tournament tournament = tournamentRepository.findById(tournamentId)
                 .orElseThrow(() -> new BusinessException("Torneio não encontrado para obter ranking com ID: " + tournamentId));

        if (tournament.getPlayers() == null) {
            return new ArrayList<>();
        }

        if(tournament.getStatus() == Tournament.TournamentStatus.FINISHED){
            List<PlayerDTO> ranking = new ArrayList<>();
            if(tournament.getChampion() != null) {
                PlayerDTO championDTO = playerService.convertToDTO(tournament.getChampion());
                ranking.add(championDTO);
            }
            return ranking;
        }else {
            List<Player> playersInTournament = tournament.getPlayers();
            return playersInTournament.stream()
                    .map(playerService::convertToDTO)
                    .sorted((p1, p2) -> Integer.compare(p2.getTournamentPoints(), p1.getTournamentPoints()))
                    .collect(Collectors.toList());
        }
    }

}
