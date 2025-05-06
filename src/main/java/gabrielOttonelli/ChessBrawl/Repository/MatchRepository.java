package gabrielOttonelli.ChessBrawl.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import gabrielOttonelli.ChessBrawl.Model.Match;
import gabrielOttonelli.ChessBrawl.Model.Match.MatchStatus;

@Repository
public interface MatchRepository extends JpaRepository<Match, Long> {
    List<Match> findByRoundId(Long roundId);
    List<Match> findByRoundIdAndStatus(Long roundId, MatchStatus status);
    List<Match> findByPlayer1IdOrPlayer2Id(Long player1Id, Long player2Id);
    List<Match> findByWinnerId(Long winnerId);
}
