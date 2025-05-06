package gabrielOttonelli.ChessBrawl.Repository;

import gabrielOttonelli.ChessBrawl.Model.Round;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoundRepository extends JpaRepository<Round, Long> {
    List<Round> findByTournamentId(Long tournamentId);
    Optional<Round> findByTournamentIdAndRoundNumber(Long tournamentId, int roundNumber);
    List<Round> findByTournamentIdOrderByRoundNumber(Long tournamentId);
}