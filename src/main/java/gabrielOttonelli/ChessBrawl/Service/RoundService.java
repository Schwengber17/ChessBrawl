package gabrielOttonelli.ChessBrawl.Service;

import gabrielOttonelli.ChessBrawl.Model.Tournament;
import gabrielOttonelli.ChessBrawl.Model.Player;
import gabrielOttonelli.ChessBrawl.Model.Round;
import gabrielOttonelli.ChessBrawl.Model.Match; // Importar entidade Match
import gabrielOttonelli.ChessBrawl.Model.Round.RoundStatus; // Importar enum RoundStatus
import gabrielOttonelli.ChessBrawl.Model.Match.MatchStatus; // Importar enum MatchStatus
import gabrielOttonelli.ChessBrawl.DTO.RoundDTO; // Importar RoundDTO
import gabrielOttonelli.ChessBrawl.DTO.MatchDTO; // Importar MatchDTO se necessário para DTOs aninhados
import gabrielOttonelli.ChessBrawl.Exception.BusinessException;
import gabrielOttonelli.ChessBrawl.Repository.RoundRepository;
import gabrielOttonelli.ChessBrawl.Repository.MatchRepository; // Injetar MatchRepository
import gabrielOttonelli.ChessBrawl.Repository.PlayerRepository; // Injetar PlayerRepository (para getQualifiedPlayers)
import gabrielOttonelli.ChessBrawl.Repository.TournamentRepository; // Injetar TournamentRepository (para finalizeTournament)

import gabrielOttonelli.ChessBrawl.Event.MatchFinishedEvent; // Importar o evento de partida
import gabrielOttonelli.ChessBrawl.Event.RoundFinishedEvent; // Importar o novo evento de rodada

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.annotation.Lazy; // Mantido para a dependência com MatchService (se ainda usada no convertToDTO)
import org.springframework.context.event.EventListener; // Importar EventListener
import org.springframework.context.ApplicationEventPublisher; // Importar ApplicationEventPublisher

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.Collections; // Para embaralhar jogadores
import java.util.ArrayList; // Para criar novas listas


@Service
@RequiredArgsConstructor // Usando Lombok para injeção de dependência via construtor
public class RoundService {

    private final RoundRepository roundRepository; // Gerencia entidades Round
    private final MatchRepository matchRepository; // Gerencia entidades Match
    private final PlayerRepository playerRepository; // Necessário para obter jogadores qualificados
    private final TournamentRepository tournamentRepository; // Necessário para finalizeTournament

    // Injetando outros Services para orquestração e atualização de dados
    // Usamos @Lazy aqui para a dependência com MatchService (se ainda usada no convertToDTO).
    // A dependência com TournamentService será via evento.
    @Lazy private final MatchService matchService; // Mantido para o convertToDTO (não causa ciclo de bean na inicialização)
    // --- REMOVENDO A DEPENDÊNCIA CIRCULAR DIRETA COM TournamentService ---
    // @Lazy private final TournamentService tournamentService; // Removido injeção direta de TournamentService

    // Injetando o publicador de eventos do Spring
    private final ApplicationEventPublisher eventPublisher;


    // --- Métodos de Conversão (Entidade <-> DTO) ---

    // Converte uma entidade Round para um RoundDTO
    private RoundDTO convertToDTO(Round round) {
        RoundDTO dto = new RoundDTO();
        dto.setId(round.getId()); // Inclui o ID da rodada
        dto.setRoundNumber(round.getRoundNumber()); // Inclui o número da rodada
        // Converte o enum para String, verificando se não é null
        if (round.getStatus() != null) {
            dto.setStatus(round.getStatus().name());
        } else {
            dto.setStatus(null); // Ou um valor padrão
        }
        // Verifica se o torneio associado não é null antes de obter o ID
        if (round.getTournament() != null) {
            dto.setTournamentId(round.getTournament().getId()); // Obtém o ID do torneio associado
        } else {
            dto.setTournamentId(null); // Define como null se não houver torneio associado
        }


        // Populando a lista de MatchDTOs associados a esta rodada
        // Usando o método convertToDTO do MatchService (injetado com @Lazy)
        if (round.getMatches() != null) {
             dto.setMatches(round.getMatches().stream()
                 .map(matchService::convertToDTO) // Usando o método convertToDTO do MatchService
                 .collect(Collectors.toList()));
        } else {
             dto.setMatches(new ArrayList<>()); // Inicializa lista vazia se a entidade não tiver matches carregados
        }


        return dto;
    }

    // TODO: Método para converter RoundDTO para entidade Round (se necessário)
    // private Round convertToEntity(RoundDTO roundDTO) { ... }


    // --- Métodos de Lógica de Negócio ---

    // Busca uma rodada por ID e retorna a entidade Round.
    // Usado internamente por outros Services (como TournamentService) que precisam da entidade completa.
    public Round findRoundEntityById(Long id) {
        return roundRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Rodada não encontrada com ID: " + id));
    }

    // Busca uma rodada por ID e retorna como DTO. Lança exceção se não encontrar.
    public RoundDTO findRoundById(Long id) {
        Round round = findRoundEntityById(id); // Busca a entidade usando o método interno
        return convertToDTO(round); // Converte a entidade para DTO e retorna
    }


    // Busca rodadas por ID de torneio e retorna como lista de DTOs.
    public List<RoundDTO> getRoundsByTournamentId(Long tournamentId) {
        List<Round> rounds = roundRepository.findByTournamentId(tournamentId);
        return rounds.stream()
                     .map(this::convertToDTO) // Converte cada entidade para DTO
                     .collect(Collectors.toList());
    }


    // Cria uma nova rodada e suas partidas para um torneio específico.
    // Este método é chamado pelo TournamentService.
    @Transactional // Garante que a criação da rodada e partidas seja atômica
    public Round createRound(Tournament tournament, int roundNumber, List<Player> playersForThisRound) {
        // 1. Validação básica: Verificar se o número de jogadores é par (para emparelhamento)
        if (playersForThisRound.size() % 2 != 0) {
             throw new BusinessException("Não é possível criar uma rodada com um número ímpar de jogadores.");
        }

        // 2. Criar a nova entidade Round.
        Round round = new Round();
        round.setRoundNumber(roundNumber);
        round.setTournament(tournament); // Associa a rodada ao torneio
        round.setStatus(RoundStatus.CREATED); // Status inicial

        // 3. Salvar a rodada para obter o ID (necessário para associar as partidas).
        Round savedRound = roundRepository.save(round);

        // 4. Criar as partidas para esta rodada.
        createMatchesForRound(savedRound, playersForThisRound); // Chama o método auxiliar para criar partidas

        // 5. Atualizar o status da rodada para IN_PROGRESS após criar as partidas.
        // O JPA pode gerenciar isso se a rodada for salva novamente dentro da transação.
        savedRound.setStatus(RoundStatus.IN_PROGRESS);
        // roundRepository.save(savedRound); // O @Transactional deve salvar as mudanças

        return savedRound; 
    }

    private void createMatchesForRound(Round round, List<Player> playersForThisRound) {
        List<Player> shuffledPlayers = new ArrayList<>(playersForThisRound);
        Collections.shuffle(shuffledPlayers);

        List<Match> matches = new ArrayList<>();

        for (int i = 0; i < shuffledPlayers.size(); i += 2) {
            Player player1 = shuffledPlayers.get(i);
            Player player2 = shuffledPlayers.get(i + 1);

            Match match = new Match();
            match.setRound(round); 
            match.setTournament(round.getTournament());
            match.setPlayer1(player1);
            match.setPlayer2(player2);
            match.setStatus(MatchStatus.PENDING);

            matches.add(match);
        }

        matchRepository.saveAll(matches);
    }


    @Transactional
    public RoundDTO createNextRound(Long tournamentId){
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new BusinessException("Torneio não encontrado com ID: " + tournamentId));

        if (tournament.getStatus() == Tournament.TournamentStatus.FINISHED) {
            throw new BusinessException("O torneio já foi finalizado");
        }

        List<Round> existingRounds = roundRepository.findByTournamentIdOrderByRoundNumber(tournamentId);

        List<Player> qualifiedPlayers = getQualifiedPlayers(tournament, existingRounds);

        if (qualifiedPlayers.size() == 1) {
            finalizeTournament(tournament, qualifiedPlayers.get(0));
            throw new BusinessException("Torneio finalizado! Campeão: " + qualifiedPlayers.get(0).getNickname());
            //talvez dar um tournament.setChampion(qualifiedPlayers.get(0)); e salvar o torneio aqui, mas não sei se é necessário
        }

        if (qualifiedPlayers.size() % 2 != 0) {
            throw new BusinessException("Número ímpar de jogadores qualificados para a próxima rodada: " + qualifiedPlayers.size());
        }

        int nextRoundNumber = existingRounds.size() + 1;
        Round newRound = createRound(tournament, nextRoundNumber, qualifiedPlayers); // Chama o método createRound

        return convertToDTO(newRound);
    }


    private List<Player> getQualifiedPlayers(Tournament tournament, List<Round> existingRounds) {
        if (existingRounds.isEmpty()) {
            Tournament fullTournament = tournamentRepository.findById(tournament.getId())
                                        .orElseThrow(() -> new BusinessException("Erro interno: Torneio não encontrado ao obter jogadores."));
            return new ArrayList<>(fullTournament.getPlayers());
        }

        Round lastRound = existingRounds.get(existingRounds.size() - 1);

        if (lastRound.getStatus() != RoundStatus.FINISHED) {
            throw new BusinessException("A rodada anterior (" + lastRound.getRoundNumber() + ") ainda não foi finalizada");
        }

        return getQualifiedPlayersFromRound(lastRound.getId());
    }

    public List<Player> getQualifiedPlayersFromRound(Long roundId) {
        Round round = findRoundEntityById(roundId); 

        if (round.getStatus() != RoundStatus.FINISHED) {
            throw new BusinessException("Não é possível obter jogadores qualificados de uma rodada que não foi finalizada.");
        }

        List<Match> matchesInRound = matchRepository.findByRoundId(round.getId());

        List<Player> qualifiedPlayers = matchesInRound.stream()
                .filter(match -> match.getWinner() != null) 
                .map(Match::getWinner) 
                .collect(Collectors.toList());


        return qualifiedPlayers;
    }

    // --- MÉTODO LISTENER PARA EVENTOS DE PARTIDA FINALIZADA ---
    @EventListener
    @Transactional
    public void handleMatchFinishedEvent(MatchFinishedEvent event) {
        Long finishedMatchId = event.getFinishedMatchId();
        System.out.println("RoundService recebeu MatchFinishedEvent para partida ID: " + finishedMatchId); // Log para debug

        Match finishedMatch = matchRepository.findById(finishedMatchId)
                .orElseThrow(() -> new BusinessException("Partida finalizada não encontrada com ID: " + finishedMatchId));

      
        Round round = finishedMatch.getRound();
        if (round == null) {
             System.err.println("Partida finalizada ID " + finishedMatchId + " não está associada a nenhuma rodada.");
             return; 
        }

        checkIfRoundIsCompleteAndNotify(round.getId());
    }


    @Transactional 
    private void checkIfRoundIsCompleteAndNotify(Long roundId) {
        Round round = findRoundEntityById(roundId);

        List<Match> matchesInRound = matchRepository.findByRoundId(round.getId());

        boolean allFinished = matchesInRound.stream()
            .allMatch(match -> match.getStatus() == MatchStatus.FINISHED);


        if (allFinished) {
            round.setStatus(RoundStatus.FINISHED);
            roundRepository.save(round); // Salva a rodada com o novo status

            eventPublisher.publishEvent(new RoundFinishedEvent(this, round.getId()));
            System.out.println("Rodada " + round.getRoundNumber() + " do torneio " + round.getTournament().getId() + " finalizada. Publicando evento RoundFinishedEvent."); // Log para debug
        }
    }


    private void finalizeTournament(Tournament tournament, Player champion) {
        tournament.setStatus(Tournament.TournamentStatus.FINISHED);


        List<Player> playersInThisTournament = playerRepository.findByCurrentTournament(tournament);
        // }
         System.out.println("TODO: Finalizar jogadores no finalizeTournament do RoundService");

        tournamentRepository.save(tournament);

    }


}
