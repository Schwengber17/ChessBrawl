package gabrielOttonelli.ChessBrawl.Repository;

import gabrielOttonelli.ChessBrawl.Model.Tournament;
import gabrielOttonelli.ChessBrawl.Model.Tournament.TournamentStatus;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TournamentRepository extends JpaRepository<Tournament, Long> {
    
    List<Tournament> findByStatus(TournamentStatus status);
}