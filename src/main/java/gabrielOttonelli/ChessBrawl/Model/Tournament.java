package gabrielOttonelli.ChessBrawl.Model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Tournament {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;    

    @NotBlank(message = "Nome do torneio é obrigatório")
    private String name;


    @Enumerated(EnumType.STRING)
    private TournamentStatus status = TournamentStatus.CREATED;

    @ManyToMany
    @JoinTable(
        name = "tournament_player",
        joinColumns = @JoinColumn(name = "tournament_id"),
        inverseJoinColumns = @JoinColumn(name = "player_id")
    )
    private List<Player> players = new ArrayList<>();

    @OneToMany(mappedBy = "tournament", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Round> rounds = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "champion_player_id") 
    private Player champion; 

    public enum TournamentStatus {
        CREATED, IN_PROGRESS, FINISHED
    }
}