    package gabrielOttonelli.ChessBrawl.DTO;

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
    }