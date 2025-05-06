package gabrielOttonelli.ChessBrawl.Event;

import org.springframework.context.ApplicationEvent;
import gabrielOttonelli.ChessBrawl.Model.Match;
// Evento disparado quando uma partida é finalizada
public class MatchFinishedEvent extends ApplicationEvent {

    private final Long finishedMatchId; // ID da partida que terminou

    // Construtor do evento
    public MatchFinishedEvent(Object source, Long finishedMatchId) {
        super(source); // 'source' é geralmente o objeto que disparou o evento (ex: o MatchService)
        this.finishedMatchId = finishedMatchId;
    }

    // Getter para obter o ID da partida finalizada
    public Long getFinishedMatchId() {
        return finishedMatchId;
    }

    @Override
    public String toString() {
        return "MatchFinishedEvent [finishedMatchId=" + finishedMatchId + "]";
    }
}
