package gabrielOttonelli.ChessBrawl.Service;

import gabrielOttonelli.ChessBrawl.Model.Player;
import gabrielOttonelli.ChessBrawl.Model.Tournament; // Importar Tournament para currentTournament/tournamentsPlayed
import gabrielOttonelli.ChessBrawl.DTO.PlayerDTO;
import gabrielOttonelli.ChessBrawl.Exception.BusinessException; // Assumindo que você tem esta exceção
import gabrielOttonelli.ChessBrawl.Repository.PlayerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor // Usando Lombok para injeção de dependência via construtor
public class PlayerService {

    private final PlayerRepository playerRepository; // Injetando o Repositório de Jogadores

    // --- Métodos de Conversão (Entidade <-> DTO) ---
    // Estes métodos são auxiliares e usados internamente no Service para mapear dados.

    // Converte uma entidade Player para um PlayerDTO
    public PlayerDTO convertToDTO(Player player) { // Tornar público para uso em outros Services (ex: MatchService, TournamentService)
        PlayerDTO dto = new PlayerDTO();
        dto.setId(player.getId());
        dto.setName(player.getName());
        dto.setNickname(player.getNickname());
        dto.setRating(player.getRating());
        dto.setTournamentPoints(player.getTournamentPoints());
        dto.setOriginalMoves(player.getOriginalMoves());
        dto.setBlundersMade(player.getBlundersMade());
        dto.setAdvantageousPositions(player.getAdvantageousPositions());
        dto.setDisrespectfulBehavior(player.getDisrespectfulBehavior());
        dto.setRage(player.getRage());

        // Populando informações do torneio atual (se existir)
        if (player.getCurrentTournament() != null) {
            dto.setCurrentTournamentId(player.getCurrentTournament().getId());
            // Assumindo que a entidade Tournament tem um método getName()
            dto.setCurrentTournamentName(player.getCurrentTournament().getName());
        } else {
            dto.setCurrentTournamentId(null);
            dto.setCurrentTournamentName(null);
        }

        return dto;
    }

    // Converte um PlayerDTO para uma entidade Player.
    // Usado principalmente para mapear dados de entrada do frontend.
    // NOTA: Este método NÃO deve popular campos gerenciados pela lógica do jogo (estatísticas, currentTournament).
    // A lógica de criação/atualização no método save() cuidará disso.
    private Player convertToEntity(PlayerDTO playerDTO) {
        Player player = new Player();
        // O ID só é definido se o DTO tiver um ID (indicando uma atualização)
        player.setId(playerDTO.getId());
        player.setName(playerDTO.getName());
        player.setNickname(playerDTO.getNickname());
        player.setRating(playerDTO.getRating()); // Assumindo que rating pode vir no DTO

        // Não mapear campos de estatísticas ou currentTournament aqui.
        // Eles são gerenciados pela lógica do Service.

        return player;
    }

    // --- Métodos de Lógica de Negócio ---

    // Busca todos os jogadores e retorna como lista de DTOs
    public List<PlayerDTO> getAllPlayers() {
        return playerRepository.findAll().stream()
                .map(this::convertToDTO) // Converte cada entidade para DTO
                .collect(Collectors.toList());
    }

    // Busca um jogador por ID e retorna como DTO. Lança exceção se não encontrar.
    public PlayerDTO getPlayerById(Long id) {
        return playerRepository.findById(id)
                .map(this::convertToDTO) // Converte a entidade encontrada para DTO
                .orElseThrow(() -> new BusinessException("Jogador não encontrado com ID: " + id)); // Lança exceção se Optional estiver vazio
    }

    // Busca um jogador por nickname e retorna como DTO. Lança exceção se não encontrar.
    public PlayerDTO getPlayerByNickname(String nickname) {
        return playerRepository.findByNickname(nickname) // Usa o método customizado do Repositório
                .map(this::convertToDTO) // Converte a entidade encontrada para DTO
                .orElseThrow(() -> new BusinessException("Jogador não encontrado com nickname: " + nickname)); // Lança exceção se Optional estiver vazio
    }

    // Cria ou atualiza um jogador. Contém a lógica de validação e inicialização de campos.
    @Transactional // Garante que a operação de salvar seja atômica
    public PlayerDTO save(PlayerDTO playerDTO) {
        Player player;

        if (playerDTO.getId() == null) {
            // --- Lógica para CRIAR um novo jogador ---
            // Validação de negócio: verificar se o nickname já existe
            if (playerRepository.existsByNickname(playerDTO.getNickname())) {
                throw new BusinessException("Nickname '" + playerDTO.getNickname() + "' já existe!");
            }

            // Cria nova entidade Player e mapeia dados básicos do DTO
            player = new Player();
            player.setName(playerDTO.getName());
            player.setNickname(playerDTO.getNickname());
            player.setRating(playerDTO.getRating());

            // *** Inicializar TODOS os campos de estatísticas de jogo com valores padrão ***
            // Isso é crucial para novos jogadores e deve ser feito no Service.
            player.setTournamentPoints(70); // Regra do torneio: inicia com 70 pontos

            player.setOriginalMoves(0);
            player.setBlundersMade(0);
            player.setAdvantageousPositions(0);
            player.setDisrespectfulBehavior(0);
            player.setRage(0);
            // currentTournament é null por padrão no construtor NoArgsConstructor

        } else {
            // --- Lógica para ATUALIZAR um jogador existente ---
            // Buscar o jogador existente pelo ID. Lança exceção se não encontrar.
            player = playerRepository.findById(playerDTO.getId())
                    .orElseThrow(() -> new BusinessException("Jogador não encontrado para atualização com ID: " + playerDTO.getId()));

            // Validação de negócio: verificar se a tentativa de mudar o nickname para um já existente
            if (!player.getNickname().equals(playerDTO.getNickname()) && playerRepository.existsByNickname(playerDTO.getNickname())) {
                throw new BusinessException("Nickname '" + playerDTO.getNickname() + "' já existe para outro jogador!");
            }

            // Atualizar APENAS os campos que devem ser editáveis via este endpoint (nome e nickname)
            // Estatísticas de jogo e currentTournament são gerenciados pela lógica do jogo/torneio.
            player.setName(playerDTO.getName());
            player.setNickname(playerDTO.getNickname());
            // Se o rating puder ser atualizado diretamente (ex: ajuste manual):
            // player.setRating(playerDTO.getRating());

            // Não atualizar estatísticas de jogo (tournamentPoints, wins, losses, etc.) diretamente do DTO aqui.
        }

        // Salvar a entidade (seja nova ou atualizada) no banco de dados
        Player savedPlayer = playerRepository.save(player);

        // Retornar o DTO do jogador salvo
        return convertToDTO(savedPlayer);
    }

    // Exclui um jogador por ID. Lança exceção se não existir.
    @Transactional // Garante que a operação de exclusão seja atômica
    public void delete(Long id) {
        // Validação: verificar se o jogador existe antes de tentar excluir
        if (!playerRepository.existsById(id)) {
            throw new BusinessException("Jogador não encontrado com ID: " + id);
        }
        // TODO: Adicionar validação de negócio: Verificar se o jogador não está participando de um torneio ativo
        // if (playerRepository.findById(id).orElseThrow(...).getCurrentTournament() != null) {
        //     throw new BusinessException("Não é possível excluir um jogador que está em um torneio ativo.");
        // }

        // Exclui o jogador do banco de dados
        playerRepository.deleteById(id);
    }

    // Método para atualizar estatísticas de um jogador (chamado por MatchService)
    @Transactional
    public void updatePlayerStats(Player player, int tournamentPointsChange, int wins, int losses, int draws, int gamesPlayed, int movesMade, int originalMoves, int blundersMade, int advantageousPositions, int disrespectfulBehavior, int rage) {
        // Atualiza os campos de estatísticas do jogador
        player.setTournamentPoints(player.getTournamentPoints() + tournamentPointsChange);
        player.setOriginalMoves(player.getOriginalMoves() + originalMoves);
        player.setBlundersMade(player.getBlundersMade() + blundersMade);
        player.setAdvantageousPositions(player.getAdvantageousPositions() + advantageousPositions);
        player.setDisrespectfulBehavior(player.getDisrespectfulBehavior() + disrespectfulBehavior);
        player.setRage(player.getRage() + rage);

        // Salva o jogador atualizado (dentro da transação)
        playerRepository.save(player);
    }

    // Método para definir/remover o torneio atual de um jogador (chamado por TournamentService ou RoundService/MatchService na finalização)
    @Transactional
    public void setCurrentTournamentForPlayer(Player player, Tournament tournament) { // Tornar público
        player.setCurrentTournament(tournament);
        playerRepository.save(player);
    }

     // Método para adicionar um torneio à lista de torneios jogados (chamado por TournamentService ou RoundService/MatchService na finalização)
    @Transactional
    public void addTournamentToPlayedList(Player player, Tournament tournament) { // Tornar público
        if (!player.getTournamentsPlayed().contains(tournament)) {
            player.getTournamentsPlayed().add(tournament);
            playerRepository.save(player);
        }
    }

    // Método para remover um torneio da lista de torneios jogados (chamado por TournamentService na exclusão)
    @Transactional
    public void removeTournamentFromPlayedList(Player player, Tournament tournament) {
        if (player.getTournamentsPlayed().contains(tournament)) {
            player.getTournamentsPlayed().remove(tournament);
            playerRepository.save(player);
        }
    }
}
