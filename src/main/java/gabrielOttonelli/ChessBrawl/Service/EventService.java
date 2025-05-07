package gabrielOttonelli.ChessBrawl.Service;

import gabrielOttonelli.ChessBrawl.Model.Event;
import gabrielOttonelli.ChessBrawl.Model.Match;
import gabrielOttonelli.ChessBrawl.Model.Player;
import gabrielOttonelli.ChessBrawl.DTO.EventDTO;
import gabrielOttonelli.ChessBrawl.Exception.BusinessException;
import gabrielOttonelli.ChessBrawl.Repository.EventRepository;
import gabrielOttonelli.ChessBrawl.Repository.MatchRepository;
import gabrielOttonelli.ChessBrawl.Repository.PlayerRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository; 
    private final MatchRepository matchRepository; 
    private final PlayerRepository playerRepository; 


    private EventDTO convertToDTO(Event event) {
        EventDTO dto = new EventDTO();
        dto.setId(event.getId()); 
        dto.setMatchId(event.getMatch().getId());
        dto.setPlayerId(event.getPlayer().getId());
        dto.setEventType(event.getEventType());
        return dto;
    }

    private Event convertToEntity(EventDTO eventDTO) {
        Event event = new Event();
        event.setId(eventDTO.getId()); 

        Match match = matchRepository.findById(eventDTO.getMatchId())
                .orElseThrow(() -> new BusinessException("Partida não encontrada para o evento com ID: " + eventDTO.getMatchId()));
        event.setMatch(match);

        Player player = playerRepository.findById(eventDTO.getPlayerId())
                .orElseThrow(() -> new BusinessException("Jogador não encontrado para o evento com ID: " + eventDTO.getPlayerId()));
        event.setPlayer(player);

        try {
            event.setEventType(eventDTO.getEventType());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Tipo de evento inválido: " + eventDTO.getEventType());
        }

        return event;
    }



    public EventDTO findById(Long id) {
        return eventRepository.findById(id)
                .map(this::convertToDTO)
                .orElseThrow(() -> new BusinessException("Evento não encontrado com ID: " + id));
    }

    public List<EventDTO> getEventsForMatch(Long matchId) {
        List<Event> events = eventRepository.findByMatchId(matchId);
        return events.stream()
                     .map(this::convertToDTO) 
                     .collect(Collectors.toList());
    }

    public List<EventDTO> getEventsForPlayer(Long playerId) {
        List<Event> events = eventRepository.findByPlayerId(playerId); 
        return events.stream()
                     .map(this::convertToDTO)
                     .collect(Collectors.toList());
    }


   
    @Transactional
    public EventDTO save(EventDTO eventDTO) {
        Event event = convertToEntity(eventDTO); 
        Event savedEvent = eventRepository.save(event); 

        return convertToDTO(savedEvent); 
    }

}
