package gabrielOttonelli.ChessBrawl.DTO;

import gabrielOttonelli.ChessBrawl.Model.Tournament;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TournamentDTO {
    private Long id;
    
    @NotBlank(message = "Nome do torneio é obrigatório")
    private String name;
    
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Tournament.TournamentStatus status;
    private List<Long> playerIds = new ArrayList<>();
}