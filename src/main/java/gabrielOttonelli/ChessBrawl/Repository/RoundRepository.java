package gabrielOttonelli.ChessBrawl.Repository;

import gabrielOttonelli.ChessBrawl.Model.Round;
import gabrielOttonelli.ChessBrawl.Model.Tournament;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoundRepository extends JpaRepository<Round, Long> {
    List<Round> findByTournamentOrderByRoundNumber(Tournament tournament);
    Round findByTournamentAndRoundNumber(Tournament tournament, int roundNumber);
}
