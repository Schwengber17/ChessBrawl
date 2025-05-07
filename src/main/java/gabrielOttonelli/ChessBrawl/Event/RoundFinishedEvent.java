package gabrielOttonelli.ChessBrawl.Event;

import org.springframework.context.ApplicationEvent;

public class RoundFinishedEvent extends ApplicationEvent {

    private final Long finishedRoundId;

    public RoundFinishedEvent(Object source, Long finishedRoundId) {
        super(source); 
        this.finishedRoundId = finishedRoundId;
    }

    public Long getFinishedRoundId() {
        return finishedRoundId;
    }

    @Override
    public String toString() {
        return "RoundFinishedEvent [finishedRoundId=" + finishedRoundId + "]";
    }
}
