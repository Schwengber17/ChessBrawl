package gabrielOttonelli.ChessBrawl.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import gabrielOttonelli.ChessBrawl.Model.Match;
import gabrielOttonelli.ChessBrawl.Model.Round;


public interface MatchRepository extends JpaRepository<Match, Long> {
    List<Match> findByRoundId(Long roundId);
    List<Match> findByPlayerId(Long playerId);
    List<Match> findByTournamentId(Long tournamentId);
    List<Match> findByRoundIdAndPlayerId(Long roundId, Long playerId);
    List<Match> findByRoundAndStatus(Round round, Match.MatchStatus status);
    List<Match> findByRound(Round round);
}   
