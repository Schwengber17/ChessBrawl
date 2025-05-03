package gabrielOttonelli.ChessBrawl.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import gabrielOttonelli.ChessBrawl.Model.Match;
import gabrielOttonelli.ChessBrawl.Model.Player;
import gabrielOttonelli.ChessBrawl.DTO.MatchDTO;
import gabrielOttonelli.ChessBrawl.DTO.RoundDTO;
import gabrielOttonelli.ChessBrawl.Model.Round;
import gabrielOttonelli.ChessBrawl.Model.Tournament;
import gabrielOttonelli.ChessBrawl.Repository.MatchRepository;
import gabrielOttonelli.ChessBrawl.Repository.RoundRepository;
import gabrielOttonelli.ChessBrawl.Repository.TournamentRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RoundService {
    private final TournamentRepository tournamentRepository;
    private final MatchRepository matchRepository;
    private final RoundRepository roundRepository;


    public RoundDTO findRoundById(Long id) {
        Round round = roundRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rodada não encontrada"));
        return convertToDTO(round);
    }

    public List<RoundDTO> findRoundsByTournament(Long tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Torneio não encontrado"));
        
        return roundRepository.findByTournamentOrderByRoundNumber(tournament).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    @Transactional
    public RoundDTO createNextRound(Long tournamentId){
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Torneio não encontrado"));
        
        List<Player> qualifiedPlayers;
        
        // Se for a primeira rodada, usar todos os jogadores
        List<Round> existingRounds = roundRepository.findByTournamentOrderByRoundNumber(tournament);
        if (existingRounds.isEmpty()) {
            qualifiedPlayers = new ArrayList<>(tournament.getPlayers());
        } else {
            // Caso contrário, usar apenas os vencedores da rodada anterior
            Round lastRound = existingRounds.get(existingRounds.size() - 1);
            
            if (lastRound.getStatus() != Round.RoundStatus.FINISHED) {
                throw new RuntimeException("A rodada anterior ainda não foi finalizada");
            }
            
            qualifiedPlayers = matchRepository.findByRoundId(lastRound.getId()).stream()
                    .map(Match::getWinner)
                    .collect(Collectors.toList());
        }
        
        // Se só sobrou um jogador, finalizar o torneio
        if (qualifiedPlayers.size() == 1) {
            tournament.setStatus(Tournament.TournamentStatus.FINISHED);
            tournamentRepository.save(tournament);
            throw new RuntimeException("Torneio finalizado! Campeão: " + qualifiedPlayers.get(0).getNickname());
        }
        
        // Criar nova rodada
        int roundNumber = existingRounds.size() + 1;
        Round round = new Round();
        round.setRoundNumber(roundNumber);
        round.setTournament(tournament);
        round.setStatus(Round.RoundStatus.CREATED);
        
        round = roundRepository.save(round);
        
        // Sortear partidas
        Collections.shuffle(qualifiedPlayers);
        List<Match> matches = new ArrayList<>();
        
        for (int i = 0; i < qualifiedPlayers.size(); i += 2) {
            Match match = new Match();
            match.setPlayer1(qualifiedPlayers.get(i));
            match.setPlayer2(qualifiedPlayers.get(i + 1));
            match.setRound(round);
            match.setStatus(Match.MatchStatus.PENDING);
            
            matches.add(match);
        }
        
        matchRepository.saveAll(matches);
        
        // Atualizar status da rodada
        round.setStatus(Round.RoundStatus.IN_PROGRESS);
        round = roundRepository.save(round);
        
        return convertToDTO(round);
    }

    private RoundDTO convertToDTO(Round round) {
        RoundDTO dto = new RoundDTO();
        dto.setId(round.getId());
        dto.setRoundNumber(round.getRoundNumber());
        dto.setStatus(round.getStatus());
        dto.setTournamentId(round.getTournament().getId());
        
        List<MatchDTO> matchDTOs = round.getMatches().stream()
                .map(match -> {
                    MatchDTO matchDTO = new MatchDTO();
                    matchDTO.setId(match.getId());
                    matchDTO.setPlayer1Id(match.getPlayer1().getId());
                    matchDTO.setPlayer2Id(match.getPlayer2().getId());
                    matchDTO.setWinnerId(match.getWinner() != null ? match.getWinner().getId() : null);
                    matchDTO.setRoundId(match.getRound().getId());
                    matchDTO.setStatus(match.getStatus());
                    matchDTO.setBlitzMatch(match.isBlitzMatch());
                    
                    matchDTO.setPlayer1OriginalMove(match.isPlayer1OriginalMove());
                    matchDTO.setPlayer1Blunder(match.isPlayer1Blunder());
                    matchDTO.setPlayer1AdvantagousPosition(match.isPlayer1AdvantagousPosition());
                    matchDTO.setPlayer1Disrespect(match.isPlayer1Disrespect());
                    matchDTO.setPlayer1RageAttack(match.isPlayer1RageAttack());
                    
                    matchDTO.setPlayer2OriginalMove(match.isPlayer2OriginalMove());
                    matchDTO.setPlayer2Blunder(match.isPlayer2Blunder());
                    matchDTO.setPlayer2AdvantagousPosition(match.isPlayer2AdvantagousPosition());
                    matchDTO.setPlayer2Disrespect(match.isPlayer2Disrespect());
                    matchDTO.setPlayer2RageAttack(match.isPlayer2RageAttack());
                    
                    return matchDTO;
                })
                .collect(Collectors.toList());
        
        dto.setMatches(matchDTOs);
        
        return dto;
    }

    @Transactional
    public void checkRoundCompletion(Long roundId){
        Round round = roundRepository.findById(roundId)
                .orElseThrow(() -> new RuntimeException("Rodada não encontrada"));
        
        List<Match> pendingMatches = matchRepository.findByRoundAndStatus(round, Match.MatchStatus.PENDING);
        List<Match> inProgressMatches = matchRepository.findByRoundAndStatus(round, Match.MatchStatus.IN_PROGRESS);
        
        if (pendingMatches.isEmpty() && inProgressMatches.isEmpty()) {
            round.setStatus(Round.RoundStatus.FINISHED);
            roundRepository.save(round);
            
            // Verificar se é necessário criar próxima rodada
            List<Player> winners = matchRepository.findByRound(round).stream()
                    .map(Match::getWinner)
                    .collect(Collectors.toList());
            
            if (winners.size() > 1) {
                createNextRound(round.getTournament().getId());
            } else if (winners.size() == 1) {
                Tournament tournament = round.getTournament();
                tournament.setStatus(Tournament.TournamentStatus.FINISHED);
                tournamentRepository.save(tournament);
            }   
        }
    }


}
