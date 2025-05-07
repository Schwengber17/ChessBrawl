    package gabrielOttonelli.ChessBrawl.DTO;

    import java.util.ArrayList;
import java.util.List;

import jakarta.validation.constraints.*;
    import lombok.AllArgsConstructor;
    import lombok.Data;
    import lombok.NoArgsConstructor;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public class TournamentDTO {
        private Long id;
        
        @NotBlank(message = "Nome do torneio é obrigatório")
        private String name;
        
        private String status;
        private int playerCount;
        private int roundCount;
        private List<Long> playerIds= new ArrayList<>();
        private String championName;
        private String championNickname;
        private Long championId;
    }