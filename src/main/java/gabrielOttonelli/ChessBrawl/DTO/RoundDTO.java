package gabrielOttonelli.ChessBrawl.DTO;
import gabrielOttonelli.ChessBrawl.Model.Round;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoundDTO {
    private Long id;
    private int roundNumber;
    private Round.RoundStatus status;
    private Long tournamentId;
    private List<MatchDTO> matches = new ArrayList<>();
}