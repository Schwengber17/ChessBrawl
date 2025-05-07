package gabrielOttonelli.ChessBrawl.DTO;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.validation.constraints.*; // Importa todas as anotações de validação
import gabrielOttonelli.ChessBrawl.Model.Event.EventType; // Importar a enumeração EventType

// DTO para representar os dados de um Evento de Batalha
// Usado para transferir informações do evento entre as camadas e para o frontend.
@Data // Lombok para gerar getters, setters, toString, equals, hashCode
@NoArgsConstructor // Lombok para construtor sem argumentos
@AllArgsConstructor // Lombok para construtor com todos os campos
public class EventDTO {

    // ID do evento (gerado no backend ao salvar) - pode ser incluído para respostas
    private Long id;

    // ID da partida onde o evento ocorreu. Obrigatório.
    @NotNull(message = "ID da partida é obrigatório")
    private Long matchId;

    // ID do jogador que causou/participou do evento. Obrigatório.
    @NotNull(message = "ID do jogador é obrigatório")
    private Long playerId;

    // Tipo do evento (ex: "BLUNDER", "ORIGINAL_MOVE").
    // *** CORREÇÃO AQUI: O tipo DEVE ser a enumeração EventType ***
    @NotNull(message = "Tipo de evento é obrigatório") // Usamos @NotNull para enums
    private EventType eventType; // O tipo agora é a enumeração EventType

    // Opcional: Incluir timestamp ou outros detalhes do evento se necessário
    // private LocalDateTime timestamp;
}
