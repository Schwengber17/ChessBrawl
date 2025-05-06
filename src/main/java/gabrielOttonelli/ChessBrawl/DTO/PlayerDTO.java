package gabrielOttonelli.ChessBrawl.DTO;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlayerDTO {
    private Long id;
    
    @NotBlank(message = "Nome é obrigatório")
    private String name;
    
    @NotBlank(message = "Nickname é obrigatório")
    private String nickname;
    
    @Min(value = 1, message = "Pontuação mínima no ranking é 1")
    @Max(value = 15000, message = "Pontuação máxima no ranking é 15000")
    private int rating;
    private Long currentTournamentId;
    private String currentTournamentName;
    private int tournamentPoints = 70;
    private int originalMoves = 0;
    private int blundersMade = 0;
    private int advantageousPositions = 0;
    private int disrespectfulBehavior = 0;
    private int rage = 0;

    
}
