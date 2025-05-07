package gabrielOttonelli.ChessBrawl.Service;

import gabrielOttonelli.ChessBrawl.Model.Tournament;
import gabrielOttonelli.ChessBrawl.Model.Player;
import gabrielOttonelli.ChessBrawl.Model.Round; // Importar entidade Round
import gabrielOttonelli.ChessBrawl.DTO.TournamentDTO;
import gabrielOttonelli.ChessBrawl.DTO.PlayerDTO; // Importar PlayerDTO se necessário para DTOs aninhados
import gabrielOttonelli.ChessBrawl.DTO.RoundDTO; // Importar RoundDTO se necessário para DTOs aninhados
import gabrielOttonelli.ChessBrawl.Exception.BusinessException;
import gabrielOttonelli.ChessBrawl.Repository.TournamentRepository;
import gabrielOttonelli.ChessBrawl.Repository.PlayerRepository; // Injetar PlayerRepository
import gabrielOttonelli.ChessBrawl.Repository.RoundRepository; // Injetar RoundRepository
// Você pode precisar injetar MatchRepository e EventRepository para exclusão em cascata manual

import gabrielOttonelli.ChessBrawl.Event.RoundFinishedEvent; // Importar o evento de rodada

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.annotation.Lazy; // Mantido para a dependência com RoundService (se ainda usada em createRound)
import org.springframework.context.event.EventListener; // Importar EventListener

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.Collections; // Para embaralhar jogadores
import java.util.ArrayList; // Para criar novas listas

@Service
@RequiredArgsConstructor // Usando Lombok para injeção de dependência via construtor
public class TournamentService {

    private final TournamentRepository tournamentRepository; // Gerencia entidades Tournament
    private final PlayerRepository playerRepository; // Necessário para adicionar jogadores e gerenciar currentTournament/tournamentsPlayed
    // Usamos @Lazy aqui para a dependência com RoundService, mas a lógica de progressão será via evento.
    @Lazy private final RoundService roundService; // Orquestra a criação de rodadas/partidas (ainda necessário para createRound)
    // Você pode precisar injetar RoundRepository, MatchRepository, EventRepository
    // se a lógica de exclusão em cascata manual for feita aqui.
    private final RoundRepository roundRepository; // Injetar RoundRepository para buscar rodadas
    // private final MatchRepository matchRepository;
    // private final EventRepository eventRepository; // Se Event for entidade persistida

    // Injetando PlayerService para gerenciar o estado do jogador (currentTournament, tournamentsPlayed)
    private final PlayerService playerService;


    // --- Métodos de Conversão (Entidade <-> DTO) ---
    // Métodos auxiliares para mapear entre Entidade e DTO.

    // Converte uma entidade Tournament para um TournamentDTO (para listagem ou detalhes)
    private TournamentDTO convertToDTO(Tournament tournament) {
        TournamentDTO dto = new TournamentDTO();
        dto.setId(tournament.getId());
        dto.setName(tournament.getName());
        // Verifica se o status não é null antes de converter para String
        if (tournament.getStatus() != null) {
             dto.setStatus(tournament.getStatus().name()); // Converte o enum para String
        } else {
             dto.setStatus(null); // Ou um valor padrão
        }


        // Populando campos de contagem para listagem
        // Verifica se a lista de jogadores não é null antes de obter o tamanho
        if (tournament.getPlayers() != null) {
            dto.setPlayerCount(tournament.getPlayers().size());
        } else {
            dto.setPlayerCount(0);
        }
        // Verifica se a lista de rodadas não é null antes de obter o tamanho
        if (tournament.getRounds() != null) {
            dto.setRoundCount(tournament.getRounds().size());
        } else {
            dto.setRoundCount(0);
        }


        // Se este DTO for usado para detalhes, você pode popular listas de DTOs aninhados aqui:
        // Exemplo: Populando lista de RoundDTOs (buscando as rodadas e convertendo)
        // TODO: Descomentar e usar o método getRoundsByTournamentId do RoundService
        // if (tournament.getId() != null) { // Só busca rodadas se o torneio tiver ID
        //     dto.setRounds(roundService.getRoundsByTournamentId(tournament.getId()));
        // }


        // Exemplo: Populando lista de PlayerDTOs (buscando os jogadores e convertendo)
        // TODO: Implementar um método getPlayersByTournamentId no PlayerService e usá-lo aqui
        // if (tournament.getId() != null) { // Só busca jogadores se o torneio tiver ID
        //     dto.setPlayers(playerService.getPlayersByTournamentId(tournament.getId()));
        // }


        return dto;
    }

    // Converte um TournamentDTO para uma entidade Tournament.
    // Usado principalmente para mapear dados de entrada na criação de torneio.
    private Tournament convertToEntity(TournamentDTO tournamentDTO) {
        Tournament tournament = new Tournament();
        // O ID só é definido se o DTO tiver um ID (indicando uma atualização, menos comum para torneios)
        // tournament.setId(tournamentDTO.getId()); // Não defina ID na criação
        tournament.setName(tournamentDTO.getName());
        // O status inicial é sempre CREATED por padrão na entidade.
        // tournament.setStatus(Tournament.TournamentStatus.valueOf(tournamentDTO.getStatus())); // Usar apenas na atualização se status puder ser alterado via DTO

        // A lista de jogadores e rodadas não é mapeada diretamente do DTO de entrada.
        // Elas são gerenciadas pela lógica do Service (addPlayerToTournament, startTournament).

        return tournament;
    }


    // --- Métodos de Lógica de Negócio ---

    // Busca todos os torneios e retorna como lista de DTOs (para listagem)
    public List<TournamentDTO> getAllTournaments() {
        return tournamentRepository.findAll().stream()
                 .map(this::convertToDTO) // Converte cada entidade para DTO (com contagens)
                 .collect(Collectors.toList());
    }

    // Busca torneios por status e retorna como lista de DTOs
    public List<TournamentDTO> getTournamentsByStatus(Tournament.TournamentStatus status) {
        return tournamentRepository.findByStatus(status).stream()
                 .map(this::convertToDTO)
                 .collect(Collectors.toList());
    }


    // Busca um torneio por ID e retorna como DTO (pode incluir mais detalhes, como rodadas/jogadores)
    public TournamentDTO getTournamentById(Long id) {
        // 1. Buscar a entidade Tournament
        Tournament tournament = tournamentRepository.findById(id)
                 .orElseThrow(() -> new BusinessException("Torneio não encontrado com ID: " + id));

        // 2. Criar o DTO (usando o método auxiliar que já popula contagens)
        TournamentDTO dto = convertToDTO(tournament);

        // TODO: Se este DTO for usado para detalhes e precisar de listas aninhadas (players, rounds), popule-as aqui:
        // Exemplo: Populando lista de RoundDTOs (buscando as rodadas e convertendo)
        // dto.setRounds(roundService.getRoundsByTournamentId(tournament.getId()));

        // Exemplo: Populando lista de PlayerDTOs (buscando os jogadores e convertendo)
        // dto.setPlayers(playerService.getPlayersByTournamentId(tournament.getId()));


        return dto;
    }

    // Cria um novo torneio.
    @Transactional // Garante que a criação do torneio e a atualização dos jogadores sejam atômicas
    public TournamentDTO createTournament(TournamentDTO tournamentDTO) {
        // 1. Validar o número de jogadores (frontend já valida, mas backend deve garantir)
        if (tournamentDTO.getPlayerIds() == null || tournamentDTO.getPlayerIds().size() < 4 || tournamentDTO.getPlayerIds().size() > 8 || tournamentDTO.getPlayerIds().size() % 2 != 0) {
             throw new BusinessException("Um torneio deve ter entre 4 e 8 jogadores (número par).");
        }

        // 2. Criar a nova entidade Tournament
        Tournament newTournament = new Tournament();
        newTournament.setName(tournamentDTO.getName());
        // O status é definido como CREATED por padrão na entidade.

        // Lista para armazenar os jogadores que serão associados a este torneio
        List<Player> associatedPlayers = new ArrayList<>();

        // 3. Processar os jogadores selecionados
        for (Long playerId : tournamentDTO.getPlayerIds()) {
            // Buscar a entidade Player pelo ID
            Player player = playerRepository.findById(playerId)
                    .orElseThrow(() -> new BusinessException("Jogador não encontrado com ID: " + playerId));

            // *** VALIDAÇÃO CRUCIAL: Verificar se o jogador já está em outro torneio ativo ***
            if (player.getCurrentTournament() != null) {
                throw new BusinessException("O jogador '" + player.getNickname() + "' já está participando do torneio '" + player.getCurrentTournament().getName() + "'. Um jogador só pode participar de um torneio por vez.");
            }

            player.setTournamentPoints(70);
            playerRepository.save(player);// Resetar os pontos de torneio do jogador (se necessário)
            associatedPlayers.add(player);


            // *** CORREÇÃO AQUI: Definir o torneio atual para o jogador ***
            // Usando o PlayerService para centralizar a lógica de atualização do jogador
            playerService.setCurrentTournamentForPlayer(player, newTournament); // Associa o jogador ao novo torneio
            // O PlayerService.setCurrentTournamentForPlayer já deve salvar o jogador.
        }

        // 4. Associar os jogadores ao torneio (relação ManyToMany)
        // Isso pode ser feito definindo a lista de jogadores na entidade Tournament
        newTournament.setPlayers(associatedPlayers);

        // 5. Salvar a nova entidade Tournament
        Tournament savedTournament = tournamentRepository.save(newTournament);

        // 6. Converter a entidade salva de volta para DTO para retorno
        // Usando o método auxiliar que já popula contagens
        return convertToDTO(savedTournament);
    }

    // Adiciona um jogador a um torneio (status CREATED).
    @Transactional
    public TournamentDTO addPlayerToTournament(Long tournamentId, Long playerId) {
        // 1. Buscar o torneio. Lança exceção se não encontrar.
        Tournament tournament = tournamentRepository.findById(tournamentId)
                 .orElseThrow(() -> new BusinessException("Torneio não encontrado com ID: " + tournamentId));

        // 2. Buscar o jogador. Lança exceção se não encontrar.
        Player player = playerRepository.findById(playerId)
                 .orElseThrow(() -> new BusinessException("Jogador não encontrado com ID: " + playerId));

        // 3. Validações de negócio para adicionar jogador:
        //    - Torneio deve estar no status CREATED.
        if (tournament.getStatus() != Tournament.TournamentStatus.CREATED) {
            throw new BusinessException("Não é possível adicionar jogadores a um torneio que não está no status CREATED.");
        }
        //    - Jogador não deve já estar neste torneio.
        if (tournament.getPlayers().contains(player)) {
            throw new BusinessException("O jogador '" + player.getNickname() + "' já está neste torneio.");
        }
        //    - Jogador não deve estar em outro torneio ativo (usando currentTournament).
        if (player.getCurrentTournament() != null) {
             throw new BusinessException("O jogador '" + player.getNickname() + "' já está participando do torneio '" + player.getCurrentTournament().getName() + "'. Ele só pode participar de um torneio por vez.");
        }
        //    - Número máximo de jogadores (8).
        if (tournament.getPlayers().size() >= 8) {
            throw new BusinessException("O torneio já atingiu o número máximo de 8 jogadores.");
        }

        // 4. Adicionar o jogador ao torneio (relação Many-to-Many)
        tournament.getPlayers().add(player);

        // 5. Definir o torneio atual para o jogador (relação Many-to-One)
        // Usando o PlayerService para centralizar a lógica de atualização do jogador
        playerService.setCurrentTournamentForPlayer(player, tournament);

        // 6. Salvar o torneio (o JPA gerencia a relação Many-to-Many)
        Tournament updatedTournament = tournamentRepository.save(tournament);

        return convertToDTO(updatedTournament);
    }

    // Remove um jogador de um torneio (status CREATED).
    @Transactional
    public TournamentDTO removePlayerFromTournament(Long tournamentId, Long playerId) {
        // 1. Buscar o torneio. Lança exceção se não encontrar.
        Tournament tournament = tournamentRepository.findById(tournamentId)
                 .orElseThrow(() -> new BusinessException("Torneio não encontrado com ID: " + tournamentId));

        // 2. Buscar o jogador. Lança exceção se não encontrar.
        Player player = playerRepository.findById(playerId)
                 .orElseThrow(() -> new BusinessException("Jogador não encontrado com ID: " + playerId));

        // 3. Validações de negócio para remover jogador:
        //    - Torneio deve estar no status CREATED.
        if (tournament.getStatus() != Tournament.TournamentStatus.CREATED) {
            throw new BusinessException("Não é possível remover jogadores de um torneio que não está no status CREATED.");
        }
        //    - Jogador deve estar neste torneio.
        if (!tournament.getPlayers().contains(player)) {
            throw new BusinessException("O jogador '" + player.getNickname() + "' não está neste torneio.");
        }

        // 4. Remover o jogador do torneio (relação Many-to-Many)
        tournament.getPlayers().remove(player);

        // 5. Remover o torneio atual do jogador (se for este torneio)
        // Usando o PlayerService para centralizar a lógica de atualização do jogador
        if (player.getCurrentTournament() != null && player.getCurrentTournament().getId().equals(tournamentId)) {
             playerService.setCurrentTournamentForPlayer(player, null);
        }

        // 6. Salvar o torneio
        Tournament updatedTournament = tournamentRepository.save(tournament);

        return convertToDTO(updatedTournament);
    }


    // Inicia um torneio (cria a primeira rodada e partidas).
    @Transactional
    public TournamentDTO startTournament(Long tournamentId) {
        // 1. Buscar o torneio.
        Tournament tournament = tournamentRepository.findById(tournamentId)
                 .orElseThrow(() -> new BusinessException("Torneio não encontrado com ID: " + tournamentId));

        // 2. Validações de negócio para iniciar torneio:
        //    - Torneio deve estar no status CREATED.
        if (tournament.getStatus() != Tournament.TournamentStatus.CREATED) {
            throw new BusinessException("O torneio já foi iniciado ou finalizado.");
        }
        //    - Número de jogadores entre 4 e 8 e par.
        int playerCount = tournament.getPlayers().size();
        if (playerCount < 4 || playerCount > 8 || playerCount % 2 != 0) {
             throw new BusinessException("O torneio deve ter entre 4 e 8 jogadores (inclusive) e um número par de jogadores para iniciar. Jogadores atuais: " + playerCount);
        }
        // Resetar os pontos de torneio de todos os jogadores antes de iniciar o torneio
        for (Player player : tournament.getPlayers()) {
            player.setTournamentPoints(70);
            playerRepository.save(player); // Salvar o jogador para persistir a alteração
        }
        //    - Jogadores não podem estar em outro torneio ativo (usando currentTournament).

        tournament.setStatus(Tournament.TournamentStatus.IN_PROGRESS);
        roundService.createRound(tournament, 1, new ArrayList<>(tournament.getPlayers())); // Passa uma nova lista para evitar problemas de modificação

        Tournament startedTournament = tournamentRepository.save(tournament);

        return convertToDTO(startedTournament);
    }


    // --- MÉTODO LISTENER PARA EVENTOS DE RODADA FINALIZADA ---
    // Este método será acionado automaticamente quando um RoundFinishedEvent for publicado pelo RoundService.
    @EventListener
    @Transactional // Garante que as operações aqui e as chamadas subsequentes sejam atômicas
    public void handleRoundFinishedEvent(RoundFinishedEvent event) {
        Long finishedRoundId = event.getFinishedRoundId();
        System.out.println("TournamentService recebeu RoundFinishedEvent para rodada ID: " + finishedRoundId); // Log para debug

        // 1. Buscar a rodada que terminou.
        // Usando RoundRepository diretamente ou RoundService.findRoundEntityById (se RoundService.findRoundEntityById não causar ciclo)
        Round completedRound = roundRepository.findById(finishedRoundId) // Usando RoundRepository diretamente
                 .orElseThrow(() -> new BusinessException("Rodada finalizada não encontrada com ID: " + finishedRoundId));

        // 2. Buscar o torneio associado.
        Tournament tournament = completedRound.getTournament();
         if (tournament == null) {
             System.err.println("Rodada finalizada ID " + finishedRoundId + " não está associada a nenhum torneio.");
             return; // Não podemos continuar se a rodada não tem torneio
         }


        // 3. Determinar os jogadores qualificados para a próxima etapa.
        // Usamos RoundService para obter os vencedores da rodada.
        // Usando a injeção @Lazy de RoundService
        List<Player> qualifiedPlayers = roundService.getQualifiedPlayersFromRound(finishedRoundId); // Assumindo método no RoundService

        // 4. Decidir a próxima ação:
        if (qualifiedPlayers.size() == 1) {
            // Se apenas um jogador qualificado, o torneio terminou e este é o campeão.
            finalizeTournament(tournament, qualifiedPlayers.get(0));
        } else if (qualifiedPlayers.size() > 1 && qualifiedPlayers.size() % 2 == 0) {
            // Se mais de um jogador e número par, criar a próxima rodada.
            int nextRoundNumber = completedRound.getRoundNumber() + 1;
            // Usando a injeção @Lazy de RoundService
            roundService.createRound(tournament, nextRoundNumber, qualifiedPlayers);
            // O status do torneio continua IN_PROGRESS.
        } else {
            // Cenário inesperado (número ímpar de jogadores > 1).
            throw new BusinessException("Erro na progressão do torneio: número ímpar de jogadores qualificados para a próxima rodada após rodada " + completedRound.getRoundNumber());
        }

        // O torneio já foi salvo dentro de finalizeTournament ou não precisa ser salvo se a próxima rodada for criada.
    }


    // Finaliza o torneio e define o campeão.
    @Transactional
    private void finalizeTournament(Tournament tournament, Player champion) {
        // 1. Mudar o status do torneio para FINISHED.
        tournament.setStatus(Tournament.TournamentStatus.FINISHED);

        // 2. TODO: Definir o campeão do torneio (se você tiver um campo para isso na entidade Tournament)
        // tournament.setChampion(champion);

        // 3. Remover o torneio atual de TODOS os jogadores que participaram.
        // Buscamos os jogadores que estavam neste torneio como currentTournament.
        List<Player> playersInThisTournament = playerRepository.findByCurrentTournament(tournament);
        for (Player player : playersInThisTournament) {
             playerService.setCurrentTournamentForPlayer(player, null);
             // TODO: Adicionar este torneio à lista tournamentsPlayed do jogador (se não estiver lá)
             // playerService.addTournamentToPlayedList(player, tournament); // Implementar este método no PlayerService
        }

        // 4. Salvar o torneio finalizado.
        tournamentRepository.save(tournament);

        // TODO: Lógica adicional, como distribuir pontos de torneio finais, etc.
    }


    // Exclui um torneio e todos os seus dados relacionados (rodadas, partidas, eventos).
    @Transactional // Garante que a operação de exclusão seja atômica
    public void deleteTournament(Long tournamentId) {
        // 1. Buscar o torneio para garantir que ele existe.
        Tournament tournament = tournamentRepository.findById(tournamentId)
                 .orElseThrow(() -> new BusinessException("Torneio não encontrado com ID: " + tournamentId));

        // 2. TODO: Validação de negócio: Verificar se o torneio não está em andamento.
        // if (tournament.getStatus() == Tournament.TournamentStatus.IN_PROGRESS) {
        //     throw new BusinessException("Não é possível excluir um torneio em andamento.");
        // }

        // 3. Remover as associações Many-to-Many na tabela de junção.
        // Buscamos os jogadores que participaram deste torneio e removemos a referência.
        List<Player> playersWhoPlayedThisTournament = playerRepository.findByTournamentsPlayedContaining(tournament);
         for (Player player : playersWhoPlayedThisTournament) {
             // TODO: Implementar removeTournamentFromPlayedList no PlayerService
             // playerService.removeTournamentFromPlayedList(player, tournament);
             // Alternativa: Remover diretamente da lista e salvar o jogador
             player.getTournamentsPlayed().remove(tournament);
             playerRepository.save(player); // Salvar o jogador para persistir a remoção da associação
         }


        // 4. Remover o torneio atual dos jogadores se for este torneio.
        List<Player> playersCurrentlyInThisTournament = playerRepository.findByCurrentTournament(tournament);
         for (Player player : playersCurrentlyInThisTournament) {
             playerService.setCurrentTournamentForPlayer(player, null);
         }


        // 5. Excluir dados relacionados em cascata (Rodadas -> Partidas -> Eventos).
        // Como configuramos cascade = CascadeType.ALL e orphanRemoval = true
        // nas relações @OneToMany (Tournament -> Round, Round -> Match, Match -> Event),
        // o JPA deve gerenciar a exclusão dos filhos automaticamente quando o pai é excluído.
        // Portanto, não precisamos buscar e excluir rodadas, partidas, eventos manualmente aqui.
        // A exclusão do Torneio acionará a exclusão em cascata.


        // 6. Finalmente, excluir o Torneio.
        tournamentRepository.delete(tournament);
    }

    // Implementação do método para obter o ranking do torneio
    public List<PlayerDTO> getTournamentRanking(Long tournamentId) {
        // Buscar o torneio
        Tournament tournament = tournamentRepository.findById(tournamentId)
                 .orElseThrow(() -> new BusinessException("Torneio não encontrado para obter ranking com ID: " + tournamentId));

        // Assumindo que a entidade Tournament tem getPlayers() que retorna a lista de jogadores associados
        if (tournament.getPlayers() == null) {
            return new ArrayList<>(); // Retorna lista vazia se não houver jogadores
        }

        // Converte as entidades Player associadas para PlayerDTOs, ordena por tournamentPoints e coleta em uma lista
        return tournament.getPlayers().stream()
                 .map(playerService::convertToDTO) // Usa PlayerService para converter Player para PlayerDTO
                 .sorted((p1, p2) -> Integer.compare(p2.getTournamentPoints(), p1.getTournamentPoints())) // Ordena por pontos (desc)
                 .collect(Collectors.toList());
    }
    // TODO: Adicionar outros métodos conforme a lógica de negócio do torneio evolui.
    // Ex: updateTournament, getTournamentStandings, etc.
}
