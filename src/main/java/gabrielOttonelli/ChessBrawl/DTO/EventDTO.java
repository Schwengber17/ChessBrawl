package gabrielOttonelli.ChessBrawl.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EventDTO {
    private Long matchId;
    private Long playerId;
    private String eventType;
}