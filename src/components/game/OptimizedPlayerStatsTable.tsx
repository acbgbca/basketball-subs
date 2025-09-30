import React, { useMemo, useCallback } from 'react';
import { Card, Table, Badge, Button } from 'react-bootstrap';
import { useGameStore } from '../../stores/gameStore';
import { usePlayerStats } from '../../hooks/usePlayerStats';
import { useUIStore } from '../../stores/uiStore';
import { Player } from '../../types';

interface OptimizedPlayerStatsTableProps {
  className?: string;
}

/**
 * Optimized individual player row component with React.memo
 */
const PlayerRow = React.memo<{ 
  player: Player; 
  className?: string;
  onFoulClick: (playerId: string) => void;
}>(({ player, className, onFoulClick }) => {
  const { activePlayers } = useGameStore();
  const stats = usePlayerStats(player.id);

  const handleFoulClick = useCallback(() => {
    onFoulClick(player.id);
  }, [player.id, onFoulClick]);

  const isActive = stats.isActive;
  const rowClass = isActive ? 'table-success' : '';

  return (
    <tr className={`${rowClass} ${className || ''}`}>
      <td className="fw-bold">
        <div className="d-flex align-items-center">
          <span className="me-2">#{player.number}</span>
          <div>
            <div>{player.name}</div>
            {isActive && (
              <Badge bg="success" size="sm">
                On Court
              </Badge>
            )}
          </div>
        </div>
      </td>
      
      <td className="text-center">
        <div className="fw-bold">{stats.formattedTotalTime}</div>
        {isActive && (
          <small className="text-muted">
            Current: {stats.formattedCurrentTime}
          </small>
        )}
      </td>
      
      <td className="text-center">
        <Badge 
          bg={stats.fouls >= 4 ? 'danger' : stats.fouls >= 3 ? 'warning' : 'secondary'}
          className="fs-6"
        >
          {stats.fouls}
        </Badge>
        {stats.fouls >= 4 && (
          <div>
            <small className="text-danger">
              {stats.fouls >= 5 ? 'Fouled Out' : 'Danger'}
            </small>
          </div>
        )}
      </td>
      
      <td className="text-center">
        <Button
          variant="outline-warning"
          size="sm"
          onClick={handleFoulClick}
          disabled={stats.fouls >= 5}
          title={`Add foul for ${player.name}`}
        >
          <i className="fas fa-plus" />
        </Button>
      </td>
    </tr>
  );
});

PlayerRow.displayName = 'PlayerRow';

/**
 * Optimized player statistics table with performance improvements
 */
export const OptimizedPlayerStatsTable: React.FC<OptimizedPlayerStatsTableProps> = React.memo(({ className }) => {
  const { game, activePlayers } = useGameStore();
  const { showFoulModal } = useUIStore();

  // Memoize sorted players to prevent unnecessary re-sorting
  const sortedPlayers = useMemo(() => {
    if (!game?.players) return [];
    
    return [...game.players].sort((a, b) => {
      const aActive = activePlayers.has(a.id);
      const bActive = activePlayers.has(b.id);
      
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      
      // Both have same active status, sort by number
      return parseInt(a.number) - parseInt(b.number);
    });
  }, [game?.players, activePlayers]);

  // Memoize counts to prevent recalculation
  const playerCounts = useMemo(() => {
    const activeCount = activePlayers.size;
    const totalCount = game?.players.length || 0;
    const maxPlayers = 5;
    
    return {
      active: activeCount,
      total: totalCount,
      max: maxPlayers,
      isOverLimit: activeCount > maxPlayers,
    };
  }, [activePlayers.size, game?.players.length]);

  // Memoize foul click handler to prevent re-creation
  const handleFoulClick = useCallback((playerId: string) => {
    showFoulModal(playerId);
  }, [showFoulModal]);

  if (!game) {
    return (
      <Card className={className}>
        <Card.Body>
          <Card.Title>Player Statistics</Card.Title>
          <div className="text-muted">No game loaded</div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Player Statistics</h5>
        <div className="d-flex align-items-center gap-2">
          <Badge bg={playerCounts.isOverLimit ? 'danger' : 'primary'}>
            {playerCounts.active}/{playerCounts.max} Active
          </Badge>
          <Badge bg="info">
            {playerCounts.total} Total
          </Badge>
        </div>
      </Card.Header>
      
      <Card.Body className="p-0">
        <Table responsive striped hover className="mb-0">
          <thead>
            <tr>
              <th>Player</th>
              <th className="text-center">Minutes</th>
              <th className="text-center">Fouls</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((player) => (
              <PlayerRow
                key={player.id}
                player={player}
                onFoulClick={handleFoulClick}
              />
            ))}
          </tbody>
        </Table>

        {playerCounts.isOverLimit && (
          <div className="p-3 bg-danger text-white text-center">
            <i className="fas fa-exclamation-triangle me-2" />
            <strong>Too many players on court!</strong>
            <div className="small">Maximum {playerCounts.max} players allowed</div>
          </div>
        )}

        {playerCounts.active === 0 && (
          <div className="p-3 bg-warning text-center">
            <i className="fas fa-info-circle me-2" />
            <strong>No players on court</strong>
            <div className="small">Add players using substitutions</div>
          </div>
        )}
      </Card.Body>

      <Card.Footer className="text-muted small">
        <div className="d-flex justify-content-between">
          <span>
            <i className="fas fa-clock me-1" />
            Live updates when timer is running
          </span>
          <span>
            <i className="fas fa-basketball-ball me-1" />
            Period {game.currentPeriod + 1}
          </span>
        </div>
      </Card.Footer>
    </Card>
  );
});

OptimizedPlayerStatsTable.displayName = 'OptimizedPlayerStatsTable';