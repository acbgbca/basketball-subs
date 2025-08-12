import React from 'react';
import { Table, Badge } from 'react-bootstrap';
import { Game } from '../types';
import { gameService } from '../services/gameService';

interface PlayerTableProps {
  game: Game;
  activePlayers: Set<string>;
  currentPeriod: number;
  timeRemaining: number;
}

const PlayerTable: React.FC<PlayerTableProps> = ({
  game,
  activePlayers,
  currentPeriod,
  timeRemaining,
}) => (
  <>
    <h4>Players</h4>
    <Table striped bordered data-testid="player-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Name</th>
          <th>Played</th>
          <th>Fouls</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {game.players
          .sort((a, b) => {
            // First sort by court status
            const aOnCourt = activePlayers.has(a.id);
            const bOnCourt = activePlayers.has(b.id);
            if (aOnCourt !== bOnCourt) {
              return bOnCourt ? 1 : -1;
            }
            // Then sort by name
            return a.name.localeCompare(b.name);
          })
          .map(player => (
            <tr key={player.id} data-testid={`player-${player.number}`}>
              <td>{player.number}</td>
              <td>{player.name}</td>
              <td>
                <div>{gameService.formatTime(gameService.calculatePlayerMinutes(game, player.id, activePlayers, timeRemaining, currentPeriod))}</div>
                <div className="text-muted small">
                  {(() => {
                    const subTime = gameService.calculatePlayerSubTime(game, player.id, currentPeriod, activePlayers);
                    return subTime !== null ? gameService.formatTime(subTime) : '';
                  })()}
                </div>
              </td>
              <td>{gameService.calculatePlayerFouls(game, player.id)}</td>
              <td>
                <Badge bg={activePlayers.has(player.id) ? "success" : "secondary"}>
                  {activePlayers.has(player.id) ? "Court" : "Bench"}
                </Badge>
              </td>
            </tr>
          ))}
      </tbody>
    </Table>
  </>
);

export default PlayerTable;
