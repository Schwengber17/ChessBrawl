package gabrielOttonelli.ChessBrawl.Service;

import gabrielOttonelli.ChessBrawl.Model.Match;
import gabrielOttonelli.ChessBrawl.Model.Player;
import gabrielOttonelli.ChessBrawl.Model.Event; 
import gabrielOttonelli.ChessBrawl.Model.Match.MatchStatus; 
import gabrielOttonelli.ChessBrawl.Model.Event.EventType; 
import gabrielOttonelli.ChessBrawl.DTO.MatchDTO;
import gabrielOttonelli.ChessBrawl.DTO.EventDTO;
import gabrielOttonelli.ChessBrawl.Exception.BusinessException;
import gabrielOttonelli.ChessBrawl.Repository.MatchRepository;
import gabrielOttonelli.ChessBrawl.Repository.PlayerRepository; 
import gabrielOttonelli.ChessBrawl.Repository.EventRepository; 
import gabrielOttonelli.ChessBrawl.Repository.RoundRepository; 

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.ApplicationEventPublisher;

import gabrielOttonelli.ChessBrawl.Event.MatchFinishedEvent;

import java.util.List;
import java.util.stream.Collectors;
import java.util.Random; 
import java.util.Arrays;

@Service
@RequiredArgsConstructor

public class MatchService {

    private final MatchRepository matchRepository; 
    private final PlayerRepository playerRepository; 
    private final EventRepository eventRepository; 
    private final RoundRepository roundRepository; 
    private final PlayerService playerService;
    private final ApplicationEventPublisher eventPublisher;



    public MatchDTO convertToDTO(Match match) { 
        MatchDTO dto = new MatchDTO();
        dto.setId(match.getId());
        if (match.getRound() != null) {
            dto.setRoundId(match.getRound().getId());
        } else {
             dto.setRoundId(null);
        }
        if (match.getStatus() != null) {
             dto.setStatus(match.getStatus());
        } else {
             dto.setStatus(null);
        }
        dto.setBlitzMatch(match.isBlitzMatch());

        if (match.getPlayer1() != null) {
            dto.setPlayer1Id(match.getPlayer1().getId());
            dto.setPlayer1Name(match.getPlayer1().getName());
            dto.setPlayer1Nickname(match.getPlayer1().getNickname());
        }
        if (match.getPlayer2() != null) {
            dto.setPlayer2Id(match.getPlayer2().getId());
            dto.setPlayer2Name(match.getPlayer2().getName());
            dto.setPlayer2Nickname(match.getPlayer2().getNickname());
        }
        if (match.getWinner() != null) {
            dto.setWinnerId(match.getWinner().getId());
        }

        return dto;
    }

    public EventDTO convertToDTO(Event event) { 
        EventDTO dto = new EventDTO();
        dto.setId(event.getId());
        if (event.getMatch() != null) {
            dto.setMatchId(event.getMatch().getId());
        } else {
             dto.setMatchId(null);
        }
        if (event.getPlayer() != null) {
             dto.setPlayerId(event.getPlayer().getId());
        } else {
             dto.setPlayerId(null);
        }
        if (event.getEventType() != null) {
            dto.setEventType(event.getEventType());
        } else {
             dto.setEventType(null);
        }
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

        event.setEventType(eventDTO.getEventType());


        return event;
    }



    public MatchDTO findByID(Long id) {
        Match match = matchRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Partida não encontrada com ID: " + id));
        return convertToDTO(match);
    }

    public List<EventDTO> getEventsForMatch(Long matchId) {
        List<Event> events = eventRepository.findByMatchId(matchId);
        return events.stream()
                     .map(this::convertToDTO) 
                     .collect(Collectors.toList());
    }



    @Transactional
    public MatchDTO startMatch(Long matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new BusinessException("Partida não encontrada com ID: " + matchId));

        if (match.getStatus() != MatchStatus.PENDING) {
            throw new BusinessException("Não é possível iniciar uma partida que não está no status PENDING.");
        }

        match.setStatus(MatchStatus.IN_PROGRESS);

        Match startedMatch = matchRepository.save(match);

        return convertToDTO(startedMatch);
    }


    @Transactional 
    public MatchDTO registerEvent(EventDTO eventDTO) {
        Match match = matchRepository.findById(eventDTO.getMatchId())
                .orElseThrow(() -> new BusinessException("Partida não encontrada para registrar evento com ID: " + eventDTO.getMatchId()));

        if (match.getStatus() != MatchStatus.IN_PROGRESS) {
            throw new BusinessException("Não é possível registrar eventos em uma partida que não está em andamento.");
        }

        Player eventPlayer = playerRepository.findById(eventDTO.getPlayerId())
                .orElseThrow(() -> new BusinessException("Jogador não encontrado para registrar evento com ID: " + eventDTO.getPlayerId()));

        if (!match.getPlayer1().equals(eventPlayer) && !match.getPlayer2().equals(eventPlayer)) {
            throw new BusinessException("O jogador com ID " + eventDTO.getPlayerId() + " não participa desta partida.");
        }

         boolean eventAlreadyRegistered = eventRepository.existsByMatchIdAndPlayerIdAndEventType(
             match.getId(), eventPlayer.getId(), eventDTO.getEventType() // *** CORREÇÃO AQUI: Passar o EventType diretamente ***
         );
         if (eventAlreadyRegistered) {
             throw new BusinessException("O evento '" + eventDTO.getEventType().name() + "' já foi registrado para este jogador nesta partida.");
         }


        Event event = convertToEntity(eventDTO); // convertToEntity já busca match e player

        eventRepository.save(event);

        Match updatedMatch = matchRepository.findById(match.getId()).get(); // Buscar novamente
        return convertToDTO(updatedMatch);
    }


    @Transactional // Garante que todas as operações (atualizar partida, jogadores, notificar rodada) sejam atômicas
    public MatchDTO finishMatch(Long matchId) { // Removido winnerId do parâmetro, a lógica deve determinar o vencedor
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new BusinessException("Partida não encontrada para finalizar com ID: " + matchId));

        if (match.getStatus() != MatchStatus.IN_PROGRESS) {
            throw new BusinessException("Não é possível finalizar uma partida que não está em andamento.");
        }
        List<Event> eventsInMatch = eventRepository.findByMatchId(match.getId());
        int player1EventPoints = calculateEventPoints(match.getPlayer1(), eventsInMatch);
        int player2EventPoints = calculateEventPoints(match.getPlayer2(), eventsInMatch);

        int player1Score = player1EventPoints;
        int player2Score = player2EventPoints;


        Player winner = null;
        Player loser = null;
        boolean isDraw = false;

        if (player1Score > player2Score) {
            winner = match.getPlayer1();
            loser = match.getPlayer2();
        } else if (player2Score > player1Score) {
            winner = match.getPlayer2();
            loser = match.getPlayer1();
        } else {
            // Empate! Acionar Blitz Match.
            isDraw = true;
            Random random = new Random();
            if (random.nextBoolean()) { // 50% de chance para cada jogador
                player1Score += 2; 
                match.setBlitzMatch(true); 
            } else {
                player2Score += 2; 
                match.setBlitzMatch(true); 
            }

            if (player1Score > player2Score) {
                winner = match.getPlayer1();
                loser = match.getPlayer2();
            } else {
                winner = match.getPlayer2();
                loser = match.getPlayer1();
            }
        }

        match.setWinner(winner);
        match.setStatus(MatchStatus.FINISHED);

        if (winner != null) {
            playerService.updatePlayerStats(winner, 30, calculateEventCount(eventsInMatch, winner, EventType.ORIGINAL_MOVE), calculateEventCount(eventsInMatch, winner, EventType.BLUNDER), calculateEventCount(eventsInMatch, winner, EventType.ADVANTAGEOUS_POSITION), calculateEventCount(eventsInMatch, winner, EventType.DISRESPECT), calculateEventCount(eventsInMatch, winner, EventType.RAGE_ATTACK));
        }

        if (loser != null) {
             playerService.updatePlayerStats(loser, 0, calculateEventCount(eventsInMatch, loser, EventType.ORIGINAL_MOVE), calculateEventCount(eventsInMatch, loser, EventType.BLUNDER), calculateEventCount(eventsInMatch, loser, EventType.ADVANTAGEOUS_POSITION), calculateEventCount(eventsInMatch, loser, EventType.DISRESPECT), calculateEventCount(eventsInMatch, loser, EventType.RAGE_ATTACK));
        }

        Match finishedMatch = matchRepository.save(match);

        eventPublisher.publishEvent(new MatchFinishedEvent(this, finishedMatch.getId()));
        System.out.println("Partida " + finishedMatch.getId() + " finalizada. Publicando evento MatchFinishedEvent."); // Log para debug


        return convertToDTO(finishedMatch);
    }

    private int calculateEventPoints(Player player, List<Event> events) {
        int points = 0;
        for (Event event : events) {
            if (event.getPlayer().equals(player)) {
                switch (event.getEventType()) {
                    case ORIGINAL_MOVE:
                        points += 5;
                        break;
                    case BLUNDER:
                        points -= 3;
                        break;
                    case ADVANTAGEOUS_POSITION:
                        points += 2;
                        break;
                    case DISRESPECT:
                        points -= 5;
                        break;
                    case RAGE_ATTACK:
                        points -= 7;
                        break;
                }
            }
        }
        return points;
    }

    private int calculateEventCount(List<Event> events, Player player, EventType eventType) {
         return (int) events.stream()
            .filter(event -> event.getPlayer().equals(player) && event.getEventType() == eventType)
            .count();
    }

    public String[] getEventTypes() {
        return Arrays.stream(EventType.values())
                     .map(Enum::name) 
                     .toArray(String[]::new); 
    }

    public List<MatchDTO> getMatchesByRoundId(Long roundId) {
        if (!roundRepository.existsById(roundId)) {
            throw new BusinessException("Rodada não encontrada com ID: " + roundId);
        }
        List<Match> matches = matchRepository.findByRoundId(roundId);
        return matches.stream()
                      .map(this::convertToDTO)
                      .collect(Collectors.toList());
    }

}
