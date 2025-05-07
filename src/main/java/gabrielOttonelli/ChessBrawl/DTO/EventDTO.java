package gabrielOttonelli.ChessBrawl.DTO;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.validation.constraints.*; 
import gabrielOttonelli.ChessBrawl.Model.Event.EventType;

@Data
@NoArgsConstructor 
@AllArgsConstructor
public class EventDTO {

    private Long id;

    @NotNull(message = "ID da partida é obrigatório")
    private Long matchId;

    @NotNull(message = "ID do jogador é obrigatório")
    private Long playerId;

    @NotNull(message = "Tipo de evento é obrigatório") 
    private EventType eventType; 

}
