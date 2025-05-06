package gabrielOttonelli.ChessBrawl.Repository;

import gabrielOttonelli.ChessBrawl.Model.Player;
import gabrielOttonelli.ChessBrawl.Model.Tournament;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlayerRepository extends JpaRepository<Player, Long> {
    boolean existsByNickname(String nickname);
    Optional<Player> findByNickname(String nickname);
    List<Player> findByCurrentTournament(Tournament tournament);
    List<Player> findByTournamentsPlayedContaining(Tournament tournament);
}