package gabrielOttonelli.ChessBrawl.Service;

import gabrielOttonelli.ChessBrawl.Model.Match;
import gabrielOttonelli.ChessBrawl.Model.Player;
import gabrielOttonelli.ChessBrawl.Model.Event; // Importar entidade Event
import gabrielOttonelli.ChessBrawl.Model.Match.MatchStatus; // Importar enum MatchStatus
import gabrielOttonelli.ChessBrawl.Model.Event.EventType; // Importar enum EventType
import gabrielOttonelli.ChessBrawl.DTO.MatchDTO; // Importar MatchDTO
import gabrielOttonelli.ChessBrawl.DTO.EventDTO; // Importar EventDTO
import gabrielOttonelli.ChessBrawl.Exception.BusinessException;
import gabrielOttonelli.ChessBrawl.Repository.MatchRepository;
import gabrielOttonelli.ChessBrawl.Repository.PlayerRepository; // Injetar PlayerRepository (para buscar jogadores)
import gabrielOttonelli.ChessBrawl.Repository.EventRepository; // Injetar EventRepository (para salvar eventos)
import gabrielOttonelli.ChessBrawl.Repository.RoundRepository; // Injetar RoundRepository para validar roundId

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
// Removendo a injeção direta de RoundService para quebrar o ciclo
// import org.springframework.context.annotation.Lazy; // Não necessário para a dependência circular via eventos
import org.springframework.context.ApplicationEventPublisher; // Importar ApplicationEventPublisher

import gabrielOttonelli.ChessBrawl.Event.MatchFinishedEvent; // Importar o evento criado

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.ArrayList; // Para criar novas listas
import java.util.Random; // Para Blitz Match
import java.util.Arrays; // Para getEventTypes

@Service
@RequiredArgsConstructor // Usando Lombok para injeção de dependência via construtor
public class MatchService {

    private final MatchRepository matchRepository; // Gerencia entidades Match
    private final PlayerRepository playerRepository; // Gerencia entidades Player
    private final EventRepository eventRepository; // Gerencia entidades Event
    private final RoundRepository roundRepository; // Necessário para validar roundId ao buscar partidas por rodada

    // Injetando outros Services para orquestração e atualização de dados
    private final PlayerService playerService;

    // --- REMOVENDO A DEPENDÊNCIA CIRCULAR DIRETA ---
    // @Lazy private final RoundService roundService; // Removido injeção direta de RoundService

    // Injetando o publicador de eventos do Spring
    private final ApplicationEventPublisher eventPublisher;


    // --- Métodos de Conversão (Entidade <-> DTO) ---

    // Converte uma entidade Match para um MatchDTO
    public MatchDTO convertToDTO(Match match) { // Tornar público para uso em outros Services (ex: RoundService)
        MatchDTO dto = new MatchDTO();
        dto.setId(match.getId()); // Inclui o ID da partida
        // Verifica se a rodada associada não é null antes de obter o ID
        if (match.getRound() != null) {
            dto.setRoundId(match.getRound().getId()); // Obtém o ID da rodada associada
        } else {
             dto.setRoundId(null); // Define como null se não houver rodada associada
        }
        // Converte o enum para String, verificando se não é null
        if (match.getStatus() != null) {
             // CORREÇÃO AQUI: Converter o enum MatchStatus para String
             dto.setStatus(match.getStatus());
        } else {
             dto.setStatus(null); // Ou um valor padrão como "UNKNOWN"
        }
        dto.setBlitzMatch(match.isBlitzMatch());

        // Populando IDs e informações básicas dos jogadores
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

        // TODO: Se você decidir incluir a lista de EventDTOs no MatchDTO:
        // dto.setEvents(match.getEvents().stream()
        //     .map(this::convertToDTO) // Assumindo um método convertToDTO para Event
        //     .collect(Collectors.toList()));

        return dto;
    }

    // Converte uma entidade Event para um EventDTO
    public EventDTO convertToDTO(Event event) { // Tornar público para uso em outros Services (ex: EventService)
        EventDTO dto = new EventDTO();
        dto.setId(event.getId()); // Inclui o ID do evento
        // Obtém os IDs das entidades associadas, verificando se não são null
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
        // Converte o enum EventType para String, verificando se não é null
        if (event.getEventType() != null) {
            // CORREÇÃO AQUI: Converter o enum EventType para String
            dto.setEventType(event.getEventType());
        } else {
             dto.setEventType(null); // Ou um valor padrão
        }
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

        // *** CORREÇÃO AQUI: Definir o EventType diretamente do DTO, sem try-catch desnecessário ***
        // Assumimos que o EventDTO já tem o tipo correto (EventType enum)
        event.setEventType(eventDTO.getEventType());


        return event;
    }


    // --- Métodos de Lógica de Negócio ---

    // Busca uma partida por ID e retorna como DTO. Lança exceção se não encontrar.
    public MatchDTO findByID(Long id) {
        Match match = matchRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Partida não encontrada com ID: " + id));
        return convertToDTO(match);
    }

    // Busca eventos de uma partida específica e retorna como lista de DTOs.
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



    // Inicia uma partida (muda o status para IN_PROGRESS).
    @Transactional
    public MatchDTO startMatch(Long matchId) {
        // 1. Buscar a partida.
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new BusinessException("Partida não encontrada com ID: " + matchId));

        // 2. Validação de negócio: Partida deve estar no status PENDING.
        if (match.getStatus() != MatchStatus.PENDING) {
            throw new BusinessException("Não é possível iniciar uma partida que não está no status PENDING.");
        }

        // 3. Mudar o status para IN_PROGRESS.
        match.setStatus(MatchStatus.IN_PROGRESS);

        // 4. Salvar a partida atualizada.
        Match startedMatch = matchRepository.save(match);

        return convertToDTO(startedMatch);
    }


    // Registra um evento em uma partida.
    @Transactional // Garante que a operação de salvar evento e atualizar jogador seja atômica
    public MatchDTO registerEvent(EventDTO eventDTO) {
        // 1. Buscar a partida.
        Match match = matchRepository.findById(eventDTO.getMatchId())
                .orElseThrow(() -> new BusinessException("Partida não encontrada para registrar evento com ID: " + eventDTO.getMatchId()));

        // 2. Validação de negócio: Partida deve estar no status IN_PROGRESS.
        if (match.getStatus() != MatchStatus.IN_PROGRESS) {
            throw new BusinessException("Não é possível registrar eventos em uma partida que não está em andamento.");
        }

        // 3. Buscar o jogador que registrou o evento.
        Player eventPlayer = playerRepository.findById(eventDTO.getPlayerId())
                .orElseThrow(() -> new BusinessException("Jogador não encontrado para registrar evento com ID: " + eventDTO.getPlayerId()));

        // 4. Validação de negócio: O jogador deve ser um dos participantes da partida.
        if (!match.getPlayer1().equals(eventPlayer) && !match.getPlayer2().equals(eventPlayer)) {
            throw new BusinessException("O jogador com ID " + eventDTO.getPlayerId() + " não participa desta partida.");
        }

        // 5. Validação de negócio: Um jogador pode receber um determinado evento APENAS UMA VEZ por partida.
        // Isso requer verificar os eventos JÁ registrados para esta partida, este jogador e este tipo de evento.
        // Assumindo um método existsByMatchIdAndPlayerIdAndEventType no EventRepository
         boolean eventAlreadyRegistered = eventRepository.existsByMatchIdAndPlayerIdAndEventType(
             match.getId(), eventPlayer.getId(), eventDTO.getEventType() // *** CORREÇÃO AQUI: Passar o EventType diretamente ***
         );
         if (eventAlreadyRegistered) {
             throw new BusinessException("O evento '" + eventDTO.getEventType().name() + "' já foi registrado para este jogador nesta partida.");
         }


        // 6. Criar a entidade Event a partir do DTO.
        Event event = convertToEntity(eventDTO); // convertToEntity já busca match e player

        // 7. Salvar o novo evento no banco de dados.
        eventRepository.save(event);

        // 8. TODO: Atualizar as estatísticas do jogador IMEDIATAMENTE com base no evento.
        // As regras são: +5 Jogada Original, -3 Gafe, +2 Posicionamento Vantajoso, -5 Desrespeito, -7 Ataque de Fúria.
        // Esta atualização afeta APENAS os pontos de torneio TEMPORÁRIOS durante a partida.
        // Os pontos finais e outras estatísticas são calculados no finishMatch.
        // Você pode adicionar um campo temporário (ex: currentMatchPoints) na entidade Player
        // ou calcular isso dinamicamente ao exibir o status da partida.
        // Por enquanto, vamos apenas registrar o evento.
        // A atualização das estatísticas do jogador baseada em eventos será feita no finishMatch.

        // 9. Retornar o DTO da partida atualizada (buscando-a novamente para garantir que a lista de eventos esteja atualizada, se necessário)
        // Ou simplesmente retornar o DTO da partida que buscamos no início.
        // Para garantir que o frontend veja o estado atual, buscamos novamente ou atualizamos o objeto 'match'.
        Match updatedMatch = matchRepository.findById(match.getId()).get(); // Buscar novamente
        return convertToDTO(updatedMatch);
    }


    // Finaliza uma partida, determina o vencedor e atualiza as estatísticas dos jogadores.
    // Este método é chamado pelo Controller (ou talvez por RoundService/TournamentService).
    @Transactional // Garante que todas as operações (atualizar partida, jogadores, notificar rodada) sejam atômicas
    public MatchDTO finishMatch(Long matchId) { // Removido winnerId do parâmetro, a lógica deve determinar o vencedor
        // 1. Buscar a partida.
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new BusinessException("Partida não encontrada para finalizar com ID: " + matchId));

        // 2. Validação de negócio: Partida deve estar no status IN_PROGRESS.
        if (match.getStatus() != MatchStatus.IN_PROGRESS) {
            throw new BusinessException("Não é possível finalizar uma partida que não está em andamento.");
        }
        List<Event> eventsInMatch = eventRepository.findByMatchId(match.getId());
        // Calcular pontos totais de evento para cada jogador nesta partida.
        int player1EventPoints = calculateEventPoints(match.getPlayer1(), eventsInMatch);
        int player2EventPoints = calculateEventPoints(match.getPlayer2(), eventsInMatch);

        // Pontuação inicial de cada jogador na partida (geralmente 0, os pontos de torneio são separados).
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

        // 7. Calcular e atualizar as estatísticas finais dos jogadores (TournamentPoints, Wins, Losses, Draws, GamesPlayed, MovesMade, etc.)
        // As regras são: Vencedor ganha +30 pontos de torneio.
        // Outras estatísticas (Wins, Losses, Draws, GamesPlayed, MovesMade) também são atualizadas.
        // Chamamos o PlayerService para atualizar as estatísticas.

        // Atualizar estatísticas do Vencedor
        if (winner != null) {
            playerService.updatePlayerStats(winner, 30, calculateEventCount(eventsInMatch, winner, EventType.ORIGINAL_MOVE), calculateEventCount(eventsInMatch, winner, EventType.BLUNDER), calculateEventCount(eventsInMatch, winner, EventType.ADVANTAGEOUS_POSITION), calculateEventCount(eventsInMatch, winner, EventType.DISRESPECT), calculateEventCount(eventsInMatch, winner, EventType.RAGE_ATTACK));
        }

        // Atualizar estatísticas do Perdedor
        if (loser != null) {
             playerService.updatePlayerStats(loser, 0, calculateEventCount(eventsInMatch, loser, EventType.ORIGINAL_MOVE), calculateEventCount(eventsInMatch, loser, EventType.BLUNDER), calculateEventCount(eventsInMatch, loser, EventType.ADVANTAGEOUS_POSITION), calculateEventCount(eventsInMatch, loser, EventType.DISRESPECT), calculateEventCount(eventsInMatch, loser, EventType.RAGE_ATTACK));
        }

        // Se houve empate ANTES do Blitz Match, ambos os jogadores registram um empate.
        // A regra do +30 pontos só se aplica ao vencedor FINAL (após o Blitz se houver).
        // Se não houve Blitz (empate final), ambos registram empate (menos comum em torneios eliminatórios).
        // Assumindo que sempre há um vencedor após Blitz em caso de empate inicial:
        // O código acima já registra 1 vitória / 1 derrota. Não precisamos de um caso separado para empate aqui.
        // Se for possível empate final (sem Blitz), você precisaria de uma lógica diferente aqui.


        // 8. Salvar a partida finalizada.
        Match finishedMatch = matchRepository.save(match);

        // 9. Publicar o evento de partida finalizada
        // Isso notificará o RoundService (ou qualquer outro listener) que a partida terminou.
        eventPublisher.publishEvent(new MatchFinishedEvent(this, finishedMatch.getId()));
        System.out.println("Partida " + finishedMatch.getId() + " finalizada. Publicando evento MatchFinishedEvent."); // Log para debug


        // 10. Retornar o DTO da partida finalizada.
        return convertToDTO(finishedMatch);
    }

    // Método auxiliar para calcular pontos de evento para um jogador em uma partida.
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
                    // Adicionar outros tipos de evento se existirem
                }
            }
        }
        return points;
    }

    // Método auxiliar para contar eventos de um tipo específico para um jogador
    private int calculateEventCount(List<Event> events, Player player, EventType eventType) {
         return (int) events.stream()
            .filter(event -> event.getPlayer().equals(player) && event.getEventType() == eventType)
            .count();
    }

    // --- Novos métodos implementados para o Controller ---

    // Método para obter os nomes dos tipos de evento disponíveis.
    // Chamado pelo MatchController.
    public String[] getEventTypes() {
        // Retorna um array de Strings com os nomes das enumerações EventType
        return Arrays.stream(EventType.values())
                     .map(Enum::name) // Mapeia cada enum para seu nome em String
                     .toArray(String[]::new); // Coleta em um array de String
    }

    // Método para buscar todas as partidas de uma rodada específica pelo ID da rodada e retorna como lista de DTOs.
    // Chamado pelo MatchController.
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
