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

        return savedRound; // Retorna a entidade Round criada
    }

    // Método auxiliar para criar as entidades Match para uma rodada específica.
    private void createMatchesForRound(Round round, List<Player> playersForThisRound) {
        // Embaralhar os jogadores para o emparelhamento aleatório
        List<Player> shuffledPlayers = new ArrayList<>(playersForThisRound); // Cria uma cópia para embaralhar
        Collections.shuffle(shuffledPlayers);

        List<Match> matches = new ArrayList<>();

        // Emparelhar os jogadores em pares e criar as entidades Match
        for (int i = 0; i < shuffledPlayers.size(); i += 2) {
            Player player1 = shuffledPlayers.get(i);
            Player player2 = shuffledPlayers.get(i + 1);

            Match match = new Match();
            match.setRound(round); // Associa a partida à rodada
            match.setTournament(round.getTournament()); // Associa a partida ao torneio (se a relação direta for mantida na entidade Match)
            match.setPlayer1(player1);
            match.setPlayer2(player2);
            match.setStatus(MatchStatus.PENDING); // Status inicial da partida

            matches.add(match);
        }

        // Salvar todas as partidas criadas.
        matchRepository.saveAll(matches);
    }


    // --- Método chamado pelo Controller para criar a próxima rodada ---
    // Este método orquestra a criação da próxima rodada, determinando jogadores qualificados.
    @Transactional // Garante que a operação seja atômica
    public RoundDTO createNextRound(Long tournamentId){
        // 1. Buscar o torneio.
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new BusinessException("Torneio não encontrado com ID: " + tournamentId));

        // 2. Verificar se o torneio já foi finalizado
        if (tournament.getStatus() == Tournament.TournamentStatus.FINISHED) {
            throw new BusinessException("O torneio já foi finalizado");
        }

        // 3. Obter as rodadas existentes para determinar a última e o número da próxima.
        List<Round> existingRounds = roundRepository.findByTournamentIdOrderByRoundNumber(tournamentId);

        // 4. Determinar os jogadores qualificados para a próxima rodada.
        // Se for a primeira rodada a ser criada, todos os jogadores do torneio participam.
        // Se houver rodadas existentes, obtemos os vencedores da última rodada.
        List<Player> qualifiedPlayers = getQualifiedPlayers(tournament, existingRounds);

        // 5. Verificar se há apenas um jogador restante (campeão).
        if (qualifiedPlayers.size() == 1) {
            // Se apenas um jogador, o torneio acabou. Finalizamos o torneio.
            finalizeTournament(tournament, qualifiedPlayers.get(0));
            // Lançar uma exceção informando que o torneio finalizou (ou retornar um DTO indicando isso)
            throw new BusinessException("Torneio finalizado! Campeão: " + qualifiedPlayers.get(0).getNickname());
             // TODO: Considerar retornar um DTO específico indicando o fim do torneio em vez de lançar exceção
        }

        // 6. Verificar se o número de jogadores qualificados é par para a próxima rodada.
        if (qualifiedPlayers.size() % 2 != 0) {
             // Isso pode indicar um problema na lógica de qualificação ou empates não resolvidos.
            throw new BusinessException("Número ímpar de jogadores qualificados para a próxima rodada: " + qualifiedPlayers.size());
        }

        // 7. Criar a nova rodada e suas partidas.
        int nextRoundNumber = existingRounds.size() + 1;
        Round newRound = createRound(tournament, nextRoundNumber, qualifiedPlayers); // Chama o método createRound

        // 8. Retornar o DTO da nova rodada criada.
        return convertToDTO(newRound);
    }


    // Método auxiliar para determinar os jogadores qualificados para a próxima rodada.
    private List<Player> getQualifiedPlayers(Tournament tournament, List<Round> existingRounds) {
        if (existingRounds.isEmpty()) {
            // Primeira rodada: todos os jogadores do torneio participam.
            // Buscamos os jogadores do torneio para garantir que a coleção está carregada.
            Tournament fullTournament = tournamentRepository.findById(tournament.getId())
                                        .orElseThrow(() -> new BusinessException("Erro interno: Torneio não encontrado ao obter jogadores."));
            return new ArrayList<>(fullTournament.getPlayers());
        }

        // Última rodada
        Round lastRound = existingRounds.get(existingRounds.size() - 1);

        // Verificar se a última rodada foi finalizada.
        if (lastRound.getStatus() != RoundStatus.FINISHED) {
            throw new BusinessException("A rodada anterior (" + lastRound.getRoundNumber() + ") ainda não foi finalizada");
        }

        // Obter os vencedores das partidas da última rodada usando o método auxiliar.
        return getQualifiedPlayersFromRound(lastRound.getId());
    }

    // Determina os jogadores qualificados para a próxima rodada com base nos vencedores da rodada atual.
    // Este método é chamado internamente (por getQualifiedPlayers) e possivelmente por TournamentService.
    public List<Player> getQualifiedPlayersFromRound(Long roundId) {
        // 1. Buscar a rodada.
        Round round = findRoundEntityById(roundId); // Usa o método interno

        // 2. Verificar se a rodada está finalizada (a lógica chamadora já faz isso, mas é uma segurança).
        if (round.getStatus() != RoundStatus.FINISHED) {
            throw new BusinessException("Não é possível obter jogadores qualificados de uma rodada que não foi finalizada.");
        }

        // 3. Buscar todas as partidas desta rodada.
        List<Match> matchesInRound = matchRepository.findByRoundId(round.getId());

        // 4. Coletar os vencedores de cada partida.
        List<Player> qualifiedPlayers = matchesInRound.stream()
                .filter(match -> match.getWinner() != null) // Apenas partidas com vencedor definido
                .map(Match::getWinner) // Mapeia para a entidade Player do vencedor
                .collect(Collectors.toList());

        // TODO: Adicionar lógica para lidar com possíveis empates que resultaram em Blitz Match
        // e garantir que o vencedor do Blitz Match seja incluído aqui.
        // A lógica atual assume que match.getWinner() já reflete o vencedor final (incluindo blitz se houve).

        return qualifiedPlayers;
    }

    // --- MÉTODO LISTENER PARA EVENTOS DE PARTIDA FINALIZADA ---
    // Este método será acionado automaticamente quando um MatchFinishedEvent for publicado.
    @EventListener
    @Transactional // Garante que as operações aqui e as chamadas subsequentes sejam atômicas
    public void handleMatchFinishedEvent(MatchFinishedEvent event) {
        Long finishedMatchId = event.getFinishedMatchId();
        System.out.println("RoundService recebeu MatchFinishedEvent para partida ID: " + finishedMatchId); // Log para debug

        // 1. Buscar a partida finalizada para obter a rodada associada.
        // Usamos findById do MatchRepository diretamente, pois não precisamos do MatchService aqui.
        Match finishedMatch = matchRepository.findById(finishedMatchId)
                .orElseThrow(() -> new BusinessException("Partida finalizada não encontrada com ID: " + finishedMatchId));

        // 2. Obter a rodada associada a esta partida.
        Round round = finishedMatch.getRound();
        if (round == null) {
             System.err.println("Partida finalizada ID " + finishedMatchId + " não está associada a nenhuma rodada.");
             return; // Não podemos continuar se a partida não tem rodada
        }

        // 3. Chamar a lógica de verificação de conclusão da rodada.
        // A lógica original de checkRoundCompletion pode ser movida para um método interno.
        checkIfRoundIsCompleteAndNotify(round.getId());
    }


    // Método interno para verificar se a rodada está completa e notificar o TournamentService.
    // A lógica original de checkRoundCompletion foi movida para cá.
    @Transactional // Garante que as operações sejam atômicas
    private void checkIfRoundIsCompleteAndNotify(Long roundId) {
         // 1. Buscar a rodada.
        Round round = findRoundEntityById(roundId);

        // 2. Buscar todas as partidas desta rodada.
        List<Match> matchesInRound = matchRepository.findByRoundId(round.getId());

        // 3. Verificar se todas as partidas estão finalizadas.
        boolean allFinished = matchesInRound.stream()
            .allMatch(match -> match.getStatus() == MatchStatus.FINISHED);


        // 4. Se todas as partidas estiverem finalizadas:
        if (allFinished) {
            // 5. Mudar o status da rodada para FINISHED.
            round.setStatus(RoundStatus.FINISHED);
            roundRepository.save(round); // Salva a rodada com o novo status

            // 6. Publicar o evento de rodada finalizada.
            // Isso notificará o TournamentService (ou qualquer outro listener) que a rodada terminou.
            eventPublisher.publishEvent(new RoundFinishedEvent(this, round.getId()));
            System.out.println("Rodada " + round.getRoundNumber() + " do torneio " + round.getTournament().getId() + " finalizada. Publicando evento RoundFinishedEvent."); // Log para debug
        }
        // Se nem todas as partidas terminaram, não faz nada.
    }


     // Método auxiliar para finalizar o torneio (chamado por createNextRound quando há um campeão)
    // Este método deve ser privado, pois a lógica de finalização principal está no TournamentService.
    // TODO: Considerar mover a lógica de finalização principal para TournamentService e chamar lá.
    // Por enquanto, mantemos aqui para que createNextRound funcione.
    private void finalizeTournament(Tournament tournament, Player champion) {
        // 1. Mudar o status do torneio para FINISHED.
        tournament.setStatus(Tournament.TournamentStatus.FINISHED);

        // 2. TODO: Definir o campeão do torneio (se você tiver um campo para isso na entidade Tournament)
        // tournament.setChampion(champion);

        // 3. Remover o torneio atual de TODOS os jogadores que participaram.
        // Buscamos os jogadores que estavam neste torneio como currentTournament.
        List<Player> playersInThisTournament = playerRepository.findByCurrentTournament(tournament);
        // TODO: Usar PlayerService para atualizar o jogador
        // for (Player player : playersInThisTournament) {
        //     playerService.setCurrentTournamentForPlayer(player, null);
        //     // TODO: Adicionar este torneio à lista tournamentsPlayed do jogador (se não estiver lá)
        //     playerService.addTournamentToPlayedList(player, tournament);
        // }
         System.out.println("TODO: Finalizar jogadores no finalizeTournament do RoundService"); // Placeholder

        // 4. Salvar o torneio finalizado.
        tournamentRepository.save(tournament);

        // TODO: Lógica adicional, como distribuir pontos de torneio finais, etc.
    }


    // TODO: Adicionar outros métodos conforme a lógica de negócio da rodada evolui.
    // Ex: getRoundDetails (que pode incluir MatchDTOs completos), updateRoundStatus, etc.
}
