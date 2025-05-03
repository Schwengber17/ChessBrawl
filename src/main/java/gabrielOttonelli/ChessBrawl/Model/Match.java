package gabrielOttonelli.ChessBrawl.Model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Match {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name ="player1_id")
    private Player player1;

    @ManyToOne
    @JoinColumn(name ="player2_id")
    private Player player2;

    @ManyToOne
    @JoinColumn(name = "winner_id")
    private Player winner;
    
    @ManyToOne
    @JoinColumn(name ="round_id")
    private Round round;

    @Enumerated(EnumType.STRING)
    private MatchStatus status = MatchStatus.PENDING;

    private boolean blitzMatch = false;

    // Eventos para player1
    private boolean player1OriginalMove = false;
    private boolean player1Blunder = false;
    private boolean player1AdvantagousPosition = false;
    private boolean player1Disrespect = false;
    private boolean player1RageAttack = false;

    // Eventos para player2
    private boolean player2OriginalMove = false;
    private boolean player2Blunder = false;
    private boolean player2AdvantagousPosition = false;
    private boolean player2Disrespect = false;
    private boolean player2RageAttack = false;

    public enum MatchStatus {
        PENDING, IN_PROGRESS, FINISHED
    }
}
