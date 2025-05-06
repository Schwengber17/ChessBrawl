package gabrielOttonelli.ChessBrawl.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import gabrielOttonelli.ChessBrawl.Model.Event;

import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    List<Event> findByMatchId(Long matchId);
    void deleteByMatchId(Long matchId);
    List<Event> findByPlayerId(Long playerId);
    List<Event> findByMatchIdAndPlayerId(Long matchId, Long playerId);
    boolean existsByMatchIdAndPlayerIdAndEventType(Long matchId, Long playerId, String eventType);

}

