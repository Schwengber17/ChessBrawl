package gabrielOttonelli.ChessBrawl.DTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import gabrielOttonelli.ChessBrawl.Model.Match;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchDTO {
    private Long id;
    private Long player1Id;
    private String player1Name;
    private String player1Nickname;
    private Long player2Id;
    private String player2Name;
    private String player2Nickname;
    private Long winnerId;
    private Long roundId;
    private Long tournamentId;
    private Match.MatchStatus status;
    private boolean blitzMatch;

    // Eventos para player1
    private boolean player1OriginalMove;
    private boolean player1Blunder;
    private boolean player1AdvantageousPosition;
    private boolean player1Disrespect;
    private boolean player1RageAttack;

    // Eventos para player2
    private boolean player2OriginalMove;
    private boolean player2Blunder;
    private boolean player2AdvantageousPosition;
    private boolean player2Disrespect;
    private boolean player2RageAttack;
}
