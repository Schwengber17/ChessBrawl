package gabrielOttonelli.ChessBrawl.Event;

import org.springframework.context.ApplicationEvent;
import gabrielOttonelli.ChessBrawl.Model.Round; // Importar entidade Round

// Evento disparado quando uma rodada é finalizada
public class RoundFinishedEvent extends ApplicationEvent {

    private final Long finishedRoundId; // ID da rodada que terminou

    // Construtor do evento
    public RoundFinishedEvent(Object source, Long finishedRoundId) {
        super(source); // 'source' é geralmente o objeto que disparou o evento (ex: o RoundService)
        this.finishedRoundId = finishedRoundId;
    }

    // Getter para obter o ID da rodada finalizada
    public Long getFinishedRoundId() {
        return finishedRoundId;
    }

    @Override
    public String toString() {
        return "RoundFinishedEvent [finishedRoundId=" + finishedRoundId + "]";
    }
}
