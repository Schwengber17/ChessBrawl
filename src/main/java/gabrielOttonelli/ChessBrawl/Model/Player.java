package gabrielOttonelli.ChessBrawl.Model;


import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;


@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Player {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Nome é obrigatório")
    private String name;

    @NotBlank(message = "Nickname é obrigatório")
    @Column(name = "nickname", unique = true)
    private String nickname;

    @Min(value = 1, message = "Pontuação deve ser maior que 0")
    @Max(value = 15000, message = "Pontuação deve ser menor que 15000")
    private int rating;

    private int tournamentPoints = 70;

    //Feature extras - Estatisticas pós jogo
    private int originalMoves=0;
    private int blundersMade=0;
    private int advantageousPositions=0;
    private int disrespectfulBehavior=0;
    private int rage=0;
    
    @ManyToMany(mappedBy = "players")
    @JsonIgnore
    private List<Tournament> tournamentsPlayed = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "current_tournament_id")
    private Tournament currentTournament;

}
