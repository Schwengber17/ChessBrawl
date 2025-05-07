package gabrielOttonelli.ChessBrawl.Repository;

import gabrielOttonelli.ChessBrawl.Model.Event;
import gabrielOttonelli.ChessBrawl.Model.Event.EventType; // Importar o enum EventType
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    // Métodos CRUD básicos são herdados.

    // Buscar todos os eventos associados a uma partida específica pelo ID da partida.
    List<Event> findByMatchId(Long matchId);

    // Método para excluir eventos por ID de partida. Útil para exclusão em cascata no Service.
    void deleteByMatchId(Long matchId);

    // Buscar todos os eventos associados a um jogador específico pelo ID do jogador.
    List<Event> findByPlayerId(Long playerId);

    // Buscar todos os eventos de um tipo específico.
    List<Event> findByEventType(EventType eventType); // Usar o enum EventType

    // --- MÉTODO existsByMatchIdAndPlayerIdAndEventType ---
    // Verifica se um evento de um determinado tipo já existe para uma partida e um jogador específicos.
    // Usado para validar a regra de negócio de evento único por partida/jogador/tipo.
    // *** ESTE MÉTODO DEVE RECEBER EventType COMO TERCEIRO PARÂMETRO ***
    boolean existsByMatchIdAndPlayerIdAndEventType(Long matchId, Long playerId, EventType eventType);


    // Você pode precisar de outros métodos, por exemplo:
    // List<Event> findByMatchIdAndPlayerId(Long matchId, Long playerId); // Buscar todos os eventos de um jogador em uma partida
}
