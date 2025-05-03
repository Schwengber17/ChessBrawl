package gabrielOttonelli.ChessBrawl.Repository;

import gabrielOttonelli.ChessBrawl.Model.Player;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlayerRepository extends JpaRepository<Player, Long> {
    boolean existsByNickname(String nickname);
    Player findByNickname(String nickname);
}