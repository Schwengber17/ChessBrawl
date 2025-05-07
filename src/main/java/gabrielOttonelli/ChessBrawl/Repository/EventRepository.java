package gabrielOttonelli.ChessBrawl.Repository;

import gabrielOttonelli.ChessBrawl.Model.Event;
import gabrielOttonelli.ChessBrawl.Model.Event.EventType; // Importar o enum EventType
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    List<Event> findByMatchId(Long matchId);

    void deleteByMatchId(Long matchId);

    List<Event> findByPlayerId(Long playerId);

    List<Event> findByEventType(EventType eventType); // Usar o enum EventType

    boolean existsByMatchIdAndPlayerIdAndEventType(Long matchId, Long playerId, EventType eventType);

}
