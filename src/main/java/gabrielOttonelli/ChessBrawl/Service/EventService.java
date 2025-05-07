package gabrielOttonelli.ChessBrawl.Service;

import gabrielOttonelli.ChessBrawl.Model.Event;
import gabrielOttonelli.ChessBrawl.Model.Match; // Importar entidade Match
import gabrielOttonelli.ChessBrawl.Model.Player; // Importar entidade Player
import gabrielOttonelli.ChessBrawl.Model.Event.EventType; // Importar enum EventType
import gabrielOttonelli.ChessBrawl.DTO.EventDTO; // Importar EventDTO
import gabrielOttonelli.ChessBrawl.Exception.BusinessException;
import gabrielOttonelli.ChessBrawl.Repository.EventRepository;
import gabrielOttonelli.ChessBrawl.Repository.MatchRepository; // Injetar MatchRepository para buscar Match na conversão
import gabrielOttonelli.ChessBrawl.Repository.PlayerRepository; // Injetar PlayerRepository para buscar Player na conversão

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor // Usando Lombok para injeção de dependência via construtor
public class EventService {

    private final EventRepository eventRepository; // Gerencia entidades Event
    private final MatchRepository matchRepository; // Necessário para buscar Match na conversão DTO->Entidade
    private final PlayerRepository playerRepository; // Necessário para buscar Player na conversão DTO->Entidade

    // --- Métodos de Conversão (Entidade <-> DTO) ---

    // Converte uma entidade Event para um EventDTO
    private EventDTO convertToDTO(Event event) {
        EventDTO dto = new EventDTO();
        dto.setId(event.getId()); // Inclui o ID do evento
        // Obtém os IDs das entidades associadas
        dto.setMatchId(event.getMatch().getId());
        dto.setPlayerId(event.getPlayer().getId());
        // Converte o enum EventType para String
        dto.setEventType(event.getEventType());
        return dto;
    }

    // Converte um EventDTO para uma entidade Event.
    // Usado para mapear dados de entrada ao salvar um evento.
    // Este método buscará as entidades Match e Player com base nos IDs fornecidos no DTO.
    private Event convertToEntity(EventDTO eventDTO) {
        Event event = new Event();
        // O ID do evento é gerado no backend, não vem do DTO de entrada na criação.
        // Se o DTO tiver um ID, pode ser para uma atualização (menos comum para eventos).
        event.setId(eventDTO.getId()); // Incluir se permitir atualização via DTO

        // Buscar a partida associada ao ID do DTO
        Match match = matchRepository.findById(eventDTO.getMatchId())
                .orElseThrow(() -> new BusinessException("Partida não encontrada para o evento com ID: " + eventDTO.getMatchId()));
        event.setMatch(match);

        // Buscar o jogador associado ao ID do DTO
        Player player = playerRepository.findById(eventDTO.getPlayerId())
                .orElseThrow(() -> new BusinessException("Jogador não encontrado para o evento com ID: " + eventDTO.getPlayerId()));
        event.setPlayer(player);

        // Converte a String do DTO para o enum EventType
        try {
            event.setEventType(eventDTO.getEventType());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Tipo de evento inválido: " + eventDTO.getEventType());
        }

        return event;
    }


    // --- Métodos de Lógica de Negócio (Básica) ---

    // Busca um evento por ID e retorna como DTO.
    public EventDTO findById(Long id) {
        return eventRepository.findById(id)
                .map(this::convertToDTO) // Converte a entidade encontrada para DTO
                .orElseThrow(() -> new BusinessException("Evento não encontrado com ID: " + id)); // Lança exceção se não encontrar
    }

    // Busca todos os eventos associados a uma partida específica pelo ID da partida.
    public List<EventDTO> getEventsForMatch(Long matchId) {
        // Validação: Verificar se a partida existe (opcional, dependendo de onde este método é chamado)
        // if (!matchRepository.existsById(matchId)) {
        //     throw new BusinessException("Partida não encontrada com ID: " + matchId);
        // }
        List<Event> events = eventRepository.findByMatchId(matchId);
        return events.stream()
                     .map(this::convertToDTO) // Converte cada entidade Event para EventDTO
                     .collect(Collectors.toList());
    }

    // Busca todos os eventos associados a um jogador específico pelo ID do jogador.
    // Útil para relatórios/estatísticas.
    public List<EventDTO> getEventsForPlayer(Long playerId) {
         // Validação: Verificar se o jogador existe (opcional)
        // if (!playerRepository.existsById(playerId)) {
        //     throw new BusinessException("Jogador não encontrado com ID: " + playerId);
        // }
        List<Event> events = eventRepository.findByPlayerId(playerId); // Assumindo método no EventRepository
        return events.stream()
                     .map(this::convertToDTO)
                     .collect(Collectors.toList());
    }


    // Salva um novo evento no banco de dados.
    // Este método pode ser chamado diretamente pelo MatchService ao registrar um evento.
    @Transactional
    public EventDTO save(EventDTO eventDTO) {
        // Lógica de validação de negócio (ex: evento único por jogador/rodada)
        // Esta validação pode ser feita aqui ou no MatchService antes de chamar este método.
        // Se feita aqui, EventService precisaria injetar RoundRepository e MatchRepository
        // para verificar a rodada e outros eventos na partida.
        // Como a validação de evento único é por PARTIDA/JOGADOR/TIPO, faz mais sentido no MatchService.

        Event event = convertToEntity(eventDTO); // Converte o DTO para entidade (busca Match e Player)

        Event savedEvent = eventRepository.save(event); // Salva no banco

        return convertToDTO(savedEvent); // Retorna o DTO do evento salvo
    }

    // TODO: Método para excluir um evento (se necessário).
    // @Transactional
    // public void delete(Long id) { ... }

    // TODO: Adicionar outros métodos conforme a lógica de negócio de eventos evolui.
    // Ex: getEventCountByTypeForPlayerInMatch, etc.
}
