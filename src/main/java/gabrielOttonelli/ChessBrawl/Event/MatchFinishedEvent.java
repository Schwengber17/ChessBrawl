package gabrielOttonelli.ChessBrawl.Event;

import org.springframework.context.ApplicationEvent;
public class MatchFinishedEvent extends ApplicationEvent {

    private final Long finishedMatchId; 
    
    public MatchFinishedEvent(Object source, Long finishedMatchId) {
        super(source); // objeto que gerou o evento
        this.finishedMatchId = finishedMatchId;
    }

    public Long getFinishedMatchId() {
        return finishedMatchId;
    }

    @Override
    public String toString() {
        return "MatchFinishedEvent [finishedMatchId=" + finishedMatchId + "]";
    }
}
