package gabrielOttonelli.ChessBrawl.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EventDTO {
    private Long id;
    @NotNull(message = "ID da partida é obrigatório")
    private Long matchId;
    @NotNull(message = "ID do jogador é obrigatório")
    private Long playerId;
    @NotBlank(message = "Tipo de evento é obrigatório")
    private String eventType;
    
}