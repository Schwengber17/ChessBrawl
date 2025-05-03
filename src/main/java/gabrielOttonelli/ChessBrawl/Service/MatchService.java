package gabrielOttonelli.ChessBrawl.Service;

import lombok.RequiredArgsConstructor;

import java.util.Random;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import gabrielOttonelli.ChessBrawl.DTO.EventDTO;
import gabrielOttonelli.ChessBrawl.DTO.MatchDTO;
import gabrielOttonelli.ChessBrawl.Model.Match;
import gabrielOttonelli.ChessBrawl.Model.Player;
import gabrielOttonelli.ChessBrawl.Repository.MatchRepository;
import gabrielOttonelli.ChessBrawl.Repository.PlayerRepository;

@Service
@RequiredArgsConstructor
public class MatchService {

    private final PlayerRepository playerRepository;
    private final RoundService roundService;
    private final MatchRepository matchRepository;


    public MatchDTO convertToDTO(Match match) {
        MatchDTO matchDTO = new MatchDTO();
        matchDTO.setId(match.getId());
        matchDTO.setPlayer1Id(match.getPlayer1().getId());
        matchDTO.setPlayer2Id(match.getPlayer2().getId());
        matchDTO.setRoundId(match.getRound().getId());
        matchDTO.setStatus(match.getStatus());
        matchDTO.setBlitzMatch(match.isBlitzMatch());

        matchDTO.setPlayer1OriginalMove(match.isPlayer1OriginalMove());
        matchDTO.setPlayer1Blunder(match.isPlayer1Blunder());
        matchDTO.setPlayer1AdvantagousPosition(match.isPlayer1AdvantagousPosition());
        matchDTO.setPlayer1Disrespect(match.isPlayer1Disrespect());
        matchDTO.setPlayer1RageAttack(match.isPlayer1RageAttack());

        matchDTO.setPlayer2OriginalMove(match.isPlayer2OriginalMove());
        matchDTO.setPlayer2Blunder(match.isPlayer2Blunder());
        matchDTO.setPlayer2AdvantagousPosition(match.isPlayer2AdvantagousPosition());
        matchDTO.setPlayer2Disrespect(match.isPlayer2Disrespect());
        matchDTO.setPlayer2RageAttack(match.isPlayer2RageAttack());

        return matchDTO;
    }

    public MatchDTO findByID(Long id) {
        Match match = matchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Partida não encontrada"));
        return convertToDTO(match);
    }

    @Transactional
    public MatchDTO startMatch(MatchDTO matchDTO) {
        Match match = matchRepository.findById(matchDTO.getId())
                .orElseThrow(() -> new RuntimeException("Partida não encontrada"));
        if (match.getStatus() != Match.MatchStatus.PENDING) {
            throw new RuntimeException("Partida já finalizada ou em andamento");
        }
        match.setStatus(Match.MatchStatus.IN_PROGRESS);
        match = matchRepository.save(match);
        return convertToDTO(match);
    }


    @Transactional
    public MatchDTO finishMatch(Long id) {
        Match match = matchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Partida não encontrada"));
        
        if (match.getStatus() != Match.MatchStatus.IN_PROGRESS) {
            throw new RuntimeException("Partida não está em andamento");
        }
        
        Player player1 = match.getPlayer1();
        Player player2 = match.getPlayer2();
        
        // Determinar vencedor
        Player winner;
        
        if (player1.getTournamentPoints() > player2.getTournamentPoints()) {
            winner = player1;
        } else if (player2.getTournamentPoints() > player1.getTournamentPoints()) {
            winner = player2;
        } else {
            // Empate - Blitz Match
            match.setBlitzMatch(true);
            
            // Escolher aleatoriamente quem ganha +2 pontos
            Random random = new Random();
            if (random.nextBoolean()) {
                player1.setTournamentPoints(player1.getTournamentPoints() + 2);
                winner = player1;
            } else {
                player2.setTournamentPoints(player2.getTournamentPoints() + 2);
                winner = player2;
            }
            
            playerRepository.save(player1);
            playerRepository.save(player2);
        }
        
        // Adicionar 30 pontos ao vencedor
        winner.setTournamentPoints(winner.getTournamentPoints() + 30);
        playerRepository.save(winner);
        
        // Atualizar partida
        match.setWinner(winner);
        match.setStatus(Match.MatchStatus.FINISHED);
        match = matchRepository.save(match);
        
        // Verificar se a rodada foi concluída
        roundService.checkRoundCompletion(match.getRound().getId());
        
        return convertToDTO(match);
    }

    @Transactional
    public MatchDTO registerEvent(EventDTO eventDTO) {
        Match match = matchRepository.findById(eventDTO.getMatchId())
                .orElseThrow(() -> new RuntimeException("Partida não encontrada"));        
        Player player = playerRepository.findById(eventDTO.getPlayerId())
                .orElseThrow(() -> new RuntimeException("Jogador não encontrado"));
        
        if (match.getStatus() != Match.MatchStatus.IN_PROGRESS) {
            throw new RuntimeException("Partida não está em andamento");
        }
        
        if (!match.getPlayer1().getId().equals(eventDTO.getPlayerId()) && 
            !match.getPlayer2().getId().equals(eventDTO.getPlayerId())) {
            throw new RuntimeException("Jogador não participa desta partida");
        }
        
        boolean isPlayer1 = match.getPlayer1().getId().equals(eventDTO.getPlayerId());
        
        switch (eventDTO.getEventType()) {
            case "ORIGINAL_MOVE":
                if (isPlayer1 && !match.isPlayer1OriginalMove()) {
                    match.setPlayer1OriginalMove(true);
                    player.setOriginalMoves(player.getOriginalMoves() + 1);
                    player.setTournamentPoints(player.getTournamentPoints() + 5);
                } else if (!isPlayer1 && !match.isPlayer2OriginalMove()) {
                    match.setPlayer2OriginalMove(true);
                    player.setOriginalMoves(player.getOriginalMoves() + 1);
                    player.setTournamentPoints(player.getTournamentPoints() + 5);
                } else {
                    throw new RuntimeException("Evento já registrado para este jogador");
                }
                break;
            case "BLUNDER":
                if (isPlayer1 && !match.isPlayer1Blunder()) {
                    match.setPlayer1Blunder(true);
                    player.setBlundersMade(player.getBlundersMade() + 1);
                    player.setTournamentPoints(player.getTournamentPoints() - 3);
                } else if (!isPlayer1 && !match.isPlayer2Blunder()) {
                    match.setPlayer2Blunder(true);
                    player.setBlundersMade(player.getBlundersMade() + 1);
                    player.setTournamentPoints(player.getTournamentPoints() - 3);
                } else {
                    throw new RuntimeException("Evento já registrado para este jogador");
                }
                break;
            case "ADVANTAGEOUS_POSITION":
                if (isPlayer1 && !match.isPlayer1AdvantagousPosition()) {
                    match.setPlayer1AdvantagousPosition(true);
                    player.setAdvantageousPositions(player.getAdvantageousPositions() + 1);
                    player.setTournamentPoints(player.getTournamentPoints() + 2);
                } else if (!isPlayer1 && !match.isPlayer2AdvantagousPosition()) {
                    match.setPlayer2AdvantagousPosition(true);
                    player.setAdvantageousPositions(player.getAdvantageousPositions() + 1);
                    player.setTournamentPoints(player.getTournamentPoints() + 2);
                } else {
                    throw new RuntimeException("Evento já registrado para este jogador");
                }
                break;
            case "DISRESPECT":
                if (isPlayer1 && !match.isPlayer1Disrespect()) {
                    match.setPlayer1Disrespect(true);
                    player.setDisrespectfulBehavior(player.getDisrespectfulBehavior() + 1);
                    player.setTournamentPoints(player.getTournamentPoints() - 5);
                } else if (!isPlayer1 && !match.isPlayer2Disrespect()) {
                    match.setPlayer2Disrespect(true);
                    player.setDisrespectfulBehavior(player.getDisrespectfulBehavior() + 1);
                    player.setTournamentPoints(player.getTournamentPoints() - 5);
                } else {
                    throw new RuntimeException("Evento já registrado para este jogador");
                }
                break;
            case "RAGE_ATTACK":
                if (isPlayer1 && !match.isPlayer1RageAttack()) {
                    match.setPlayer1RageAttack(true);
                    player.setRage(player.getRage() + 1);
                    player.setTournamentPoints(player.getTournamentPoints() - 7);
                } else if (!isPlayer1 && !match.isPlayer2RageAttack()) {
                    match.setPlayer2RageAttack(true);
                    player.setRage(player.getRage() + 1);
                    player.setTournamentPoints(player.getTournamentPoints() - 7);
                } else {
                    throw new RuntimeException("Evento já registrado para este jogador");
                }
                break;
            default:
                throw new RuntimeException("Tipo de evento inválido");
        }
        
        playerRepository.save(player);
        match = matchRepository.save(match);
        
        return convertToDTO(match);
    }


    
}
