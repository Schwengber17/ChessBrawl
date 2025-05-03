package gabrielOttonelli.ChessBrawl.DTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import gabrielOttonelli.ChessBrawl.Model.Match;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
// DTO (Data Transfer Object) para a classe Match
public class MatchDTO {
    private Long id;
    private Long player1Id;
    private Long player2Id;
    private Long winnerId;
    private Long roundId;
    private Match.MatchStatus status;
    private boolean blitzMatch;

    // Eventos para player1
    private boolean player1OriginalMove;
    private boolean player1Blunder;
    private boolean player1AdvantagousPosition;
    private boolean player1Disrespect;
    private boolean player1RageAttack;

    // Eventos para player2
    private boolean player2OriginalMove;
    private boolean player2Blunder;
    private boolean player2AdvantagousPosition;
    private boolean player2Disrespect;
    private boolean player2RageAttack;

}
