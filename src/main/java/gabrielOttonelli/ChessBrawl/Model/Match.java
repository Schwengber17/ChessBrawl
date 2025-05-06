package gabrielOttonelli.ChessBrawl.Model;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "matches")
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
    @JoinColumn(name = "tournament_id")
    private Tournament tournament;
    
    @ManyToOne
    @JoinColumn(name ="round_id")
    private Round round;

    @Enumerated(EnumType.STRING)
    private MatchStatus status = MatchStatus.PENDING;

    @OneToMany(mappedBy = "match", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Event> events = new ArrayList<>();
    
    private boolean blitzMatch = false;

    public enum MatchStatus {
        PENDING, IN_PROGRESS, FINISHED
    }
}
