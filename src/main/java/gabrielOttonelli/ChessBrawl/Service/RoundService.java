package gabrielOttonelli.ChessBrawl.Service;

import gabrielOttonelli.ChessBrawl.Model.Tournament;
import gabrielOttonelli.ChessBrawl.Model.Player;
import gabrielOttonelli.ChessBrawl.Model.Round;
import gabrielOttonelli.ChessBrawl.Model.Match; 
import gabrielOttonelli.ChessBrawl.Model.Round.RoundStatus; 
import gabrielOttonelli.ChessBrawl.Model.Match.MatchStatus; 
import gabrielOttonelli.ChessBrawl.DTO.RoundDTO; 
import gabrielOttonelli.ChessBrawl.Exception.BusinessException;
import gabrielOttonelli.ChessBrawl.Repository.RoundRepository;
import gabrielOttonelli.ChessBrawl.Repository.MatchRepository; 
import gabrielOttonelli.ChessBrawl.Repository.PlayerRepository;
import gabrielOttonelli.ChessBrawl.Repository.TournamentRepository; 

import gabrielOttonelli.ChessBrawl.Event.MatchFinishedEvent; 
import gabrielOttonelli.ChessBrawl.Event.RoundFinishedEvent; 

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.annotation.Lazy; 
import org.springframework.context.event.EventListener; 
import org.springframework.context.ApplicationEventPublisher;

import java.util.List;
import java.util.stream.Collectors;
import java.util.Collections; 

import java.util.ArrayList; 


@Service
@RequiredArgsConstructor
public class RoundService {

    private final RoundRepository roundRepository;
    private final MatchRepository matchRepository;
    private final PlayerRepository playerRepository; 
    private final TournamentRepository tournamentRepository;

    @Lazy private final MatchService matchService; 

    private final ApplicationEventPublisher eventPublisher;



    private RoundDTO convertToDTO(Round round) {
        RoundDTO dto = new RoundDTO();
        dto.setId(round.getId()); 
        dto.setRoundNumber(round.getRoundNumber()); 
        if (round.getStatus() != null) {
            dto.setStatus(round.getStatus().name());
        } else {
            dto.setStatus(null);
        }
        if (round.getTournament() != null) {
            dto.setTournamentId(round.getTournament().getId()); 
        } else {
            dto.setTournamentId(null); 
        }


        if (round.getMatches() != null) {
             dto.setMatches(round.getMatches().stream()
                 .map(matchService::convertToDTO) 
                 .collect(Collectors.toList()));
        } else {
             dto.setMatches(new ArrayList<>()); 
        }


        return dto;
    }




    public Round findRoundEntityById(Long id) {
        return roundRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Rodada não encontrada com ID: " + id));
    }

    public RoundDTO findRoundById(Long id) {
        Round round = findRoundEntityById(id); 
        return convertToDTO(round); 
    }


    public List<RoundDTO> getRoundsByTournamentId(Long tournamentId) {
        List<Round> rounds = roundRepository.findByTournamentId(tournamentId);
        return rounds.stream()
                     .map(this::convertToDTO) 
                     .collect(Collectors.toList());
    }


    @Transactional 
    public Round createRound(Tournament tournament, int roundNumber, List<Player> playersForThisRound) {
        if (playersForThisRound.size() % 2 != 0) {
             throw new BusinessException("Não é possível criar uma rodada com um número ímpar de jogadores.");
        }

        Round round = new Round();
        round.setRoundNumber(roundNumber);
        round.setTournament(tournament);
        round.setStatus(RoundStatus.CREATED); 

        Round savedRound = roundRepository.save(round);

        createMatchesForRound(savedRound, playersForThisRound);

        savedRound.setStatus(RoundStatus.IN_PROGRESS);

        return savedRound; 
    }

    private void createMatchesForRound(Round round, List<Player> playersForThisRound) {
        List<Player> shuffledPlayers = new ArrayList<>(playersForThisRound);
        Collections.shuffle(shuffledPlayers);

        List<Match> matches = new ArrayList<>();

        for (int i = 0; i < shuffledPlayers.size(); i += 2) {
            Player player1 = shuffledPlayers.get(i);
            Player player2 = shuffledPlayers.get(i + 1);

            Match match = new Match();
            match.setRound(round); 
            match.setTournament(round.getTournament());
            match.setPlayer1(player1);
            match.setPlayer2(player2);
            match.setStatus(MatchStatus.PENDING);

            matches.add(match);
        }

        matchRepository.saveAll(matches);
    }


    @Transactional
    public RoundDTO createNextRound(Long tournamentId){
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new BusinessException("Torneio não encontrado com ID: " + tournamentId));

        if (tournament.getStatus() == Tournament.TournamentStatus.FINISHED) {
            throw new BusinessException("O torneio já foi finalizado");
        }

        List<Round> existingRounds = roundRepository.findByTournamentIdOrderByRoundNumber(tournamentId);

        List<Player> qualifiedPlayers = getQualifiedPlayers(tournament, existingRounds);

        if (qualifiedPlayers.size() == 1) {
            finalizeTournament(tournament, qualifiedPlayers.get(0));
            throw new BusinessException("Torneio finalizado! Campeão: " + qualifiedPlayers.get(0).getNickname());
            //talvez dar um tournament.setChampion(qualifiedPlayers.get(0)); e salvar o torneio aqui, mas não sei se é necessário
        }

        if (qualifiedPlayers.size() % 2 != 0) {
            throw new BusinessException("Número ímpar de jogadores qualificados para a próxima rodada: " + qualifiedPlayers.size());
        }

        int nextRoundNumber = existingRounds.size() + 1;
        Round newRound = createRound(tournament, nextRoundNumber, qualifiedPlayers); 

        return convertToDTO(newRound);
    }


    private List<Player> getQualifiedPlayers(Tournament tournament, List<Round> existingRounds) {
        if (existingRounds.isEmpty()) {
            Tournament fullTournament = tournamentRepository.findById(tournament.getId())
                                        .orElseThrow(() -> new BusinessException("Erro interno: Torneio não encontrado ao obter jogadores."));
            return new ArrayList<>(fullTournament.getPlayers());
        }

        Round lastRound = existingRounds.get(existingRounds.size() - 1);

        if (lastRound.getStatus() != RoundStatus.FINISHED) {
            throw new BusinessException("A rodada anterior (" + lastRound.getRoundNumber() + ") ainda não foi finalizada");
        }

        return getQualifiedPlayersFromRound(lastRound.getId());
    }

    public List<Player> getQualifiedPlayersFromRound(Long roundId) {
        Round round = findRoundEntityById(roundId); 

        if (round.getStatus() != RoundStatus.FINISHED) {
            throw new BusinessException("Não é possível obter jogadores qualificados de uma rodada que não foi finalizada.");
        }

        List<Match> matchesInRound = matchRepository.findByRoundId(round.getId());

        List<Player> qualifiedPlayers = matchesInRound.stream()
                .filter(match -> match.getWinner() != null) 
                .map(Match::getWinner) 
                .collect(Collectors.toList());


        return qualifiedPlayers;
    }

    // --- MÉTODO LISTENER PARA EVENTOS DE PARTIDA FINALIZADA ---
    @EventListener
    @Transactional
    public void handleMatchFinishedEvent(MatchFinishedEvent event) {
        Long finishedMatchId = event.getFinishedMatchId();
        System.out.println("RoundService recebeu MatchFinishedEvent para partida ID: " + finishedMatchId); // Log para debug

        Match finishedMatch = matchRepository.findById(finishedMatchId)
                .orElseThrow(() -> new BusinessException("Partida finalizada não encontrada com ID: " + finishedMatchId));

      
        Round round = finishedMatch.getRound();
        if (round == null) {
             System.err.println("Partida finalizada ID " + finishedMatchId + " não está associada a nenhuma rodada.");
             return; 
        }

        checkIfRoundIsCompleteAndNotify(round.getId());
    }


    @Transactional 
    private void checkIfRoundIsCompleteAndNotify(Long roundId) {
        Round round = findRoundEntityById(roundId);

        List<Match> matchesInRound = matchRepository.findByRoundId(round.getId());

        boolean allFinished = matchesInRound.stream()
            .allMatch(match -> match.getStatus() == MatchStatus.FINISHED);


        if (allFinished) {
            round.setStatus(RoundStatus.FINISHED);
            roundRepository.save(round); // Salva a rodada com o novo status

            eventPublisher.publishEvent(new RoundFinishedEvent(this, round.getId()));
            System.out.println("Rodada " + round.getRoundNumber() + " do torneio " + round.getTournament().getId() + " finalizada. Publicando evento RoundFinishedEvent."); // Log para debug
        }
    }


    private void finalizeTournament(Tournament tournament, Player champion) {
        tournament.setStatus(Tournament.TournamentStatus.FINISHED);


        List<Player> playersInThisTournament = playerRepository.findByCurrentTournament(tournament);
        // }
         System.out.println("TODO: Finalizar jogadores no finalizeTournament do RoundService");

        tournamentRepository.save(tournament);

    }


}
