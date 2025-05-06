package gabrielOttonelli.ChessBrawl.DTO;
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
    private String status;
    private Long tournamentId;
    private List<MatchDTO> matches = new ArrayList<>();
}