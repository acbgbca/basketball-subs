import React from 'react';
import { Table, Badge } from 'react-bootstrap';
import { Game } from '../types';

interface PlayerTableProps {
  game: Game;
  activePlayers: Set<string>;
  currentPeriod: number;
  timeRemaining: number;
  formatTime: (seconds: number) => string;
  calculatePlayerMinutes: (game: Game, playerId: string, activePlayers: Set<string>, timeRemaining: number, currentPeriod: number) => number;
  calculatePlayerSubTime: (game: Game, playerId: string, currentPeriod: number, activePlayers: Set<string>) => number | null;
  calculatePlayerFouls: (game: Game, playerId: string) => number;
}

const PlayerTable: React.FC<PlayerTableProps> = ({
  game,
  activePlayers,
  currentPeriod,
  timeRemaining,
  formatTime,
  calculatePlayerMinutes,
  calculatePlayerSubTime,
  calculatePlayerFouls
}) => (
  <>
    <h4>Players</h4>
    <Table striped bordered>
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
                <div>{formatTime(calculatePlayerMinutes(game, player.id, activePlayers, timeRemaining, currentPeriod))}</div>
                <div className="text-muted small">
                  {(() => {
                    const subTime = calculatePlayerSubTime(game, player.id, currentPeriod, activePlayers);
                    return subTime !== null ? formatTime(subTime) : '';
                  })()}
                </div>
              </td>
              <td>{calculatePlayerFouls(game, player.id)}</td>
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
