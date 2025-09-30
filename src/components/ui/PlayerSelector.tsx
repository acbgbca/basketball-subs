import React, { useState, useMemo } from 'react';
import { Card, Button, Badge, Form, Row, Col, ButtonGroup, InputGroup } from 'react-bootstrap';
import { Player } from '../../types';

interface PlayerSelectorProps {
  players: Player[];
  selectedPlayers: Set<string>;
  onSelectionChange: (selectedPlayers: Set<string>) => void;
  maxSelectable?: number;
  minSelectable?: number;
  title?: string;
  disabled?: boolean;
  showSearch?: boolean;
  showSelectAll?: boolean;
  variant?: 'default' | 'compact' | 'grid';
  className?: string;
}

/**
 * Reusable player selector component with multiple display variants
 */
export const PlayerSelector: React.FC<PlayerSelectorProps> = ({
  players,
  selectedPlayers,
  onSelectionChange,
  maxSelectable,
  minSelectable = 0,
  title = 'Select Players',
  disabled = false,
  showSearch = true,
  showSelectAll = true,
  variant = 'default',
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter players based on search query
  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim()) return players;
    
    const query = searchQuery.toLowerCase();
    return players.filter(player =>
      player.name.toLowerCase().includes(query) ||
      player.number.includes(searchQuery)
    );
  }, [players, searchQuery]);

  // Handle individual player selection
  const handlePlayerToggle = (playerId: string) => {
    if (disabled) return;

    const newSelection = new Set(selectedPlayers);
    
    if (newSelection.has(playerId)) {
      // Can only remove if we're above minimum
      if (newSelection.size > minSelectable) {
        newSelection.delete(playerId);
      }
    } else {
      // Can only add if we're below maximum
      if (!maxSelectable || newSelection.size < maxSelectable) {
        newSelection.add(playerId);
      }
    }
    
    onSelectionChange(newSelection);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (disabled) return;
    
    const availablePlayerIds = filteredPlayers.map(p => p.id);
    const limitedSelection = maxSelectable 
      ? availablePlayerIds.slice(0, maxSelectable)
      : availablePlayerIds;
    
    onSelectionChange(new Set(limitedSelection));
  };

  // Handle clear selection
  const handleClearAll = () => {
    if (disabled || minSelectable > 0) return;
    onSelectionChange(new Set());
  };

  // Check if a player can be selected/deselected
  const canSelectPlayer = (playerId: string) => {
    if (disabled) return false;
    
    if (selectedPlayers.has(playerId)) {
      return selectedPlayers.size > minSelectable;
    } else {
      return !maxSelectable || selectedPlayers.size < maxSelectable;
    }
  };

  // Render player button based on variant
  const renderPlayerButton = (player: Player) => {
    const isSelected = selectedPlayers.has(player.id);
    const canSelect = canSelectPlayer(player.id);
    
    const buttonProps = {
      key: player.id,
      variant: isSelected ? 'primary' : 'outline-secondary',
      size: variant === 'compact' ? 'sm' : undefined,
      disabled: !canSelect && !isSelected,
      onClick: () => handlePlayerToggle(player.id),
      className: `player-button ${variant === 'grid' ? 'w-100' : ''}`,
    };

    const content = (
      <>
        <span className="fw-bold">#{player.number}</span>
        <span className="ms-2">{player.name}</span>
        {isSelected && <i className="fas fa-check ms-2" />}
      </>
    );

    if (variant === 'compact') {
      return (
        <Button {...buttonProps} className={`${buttonProps.className} mb-1 me-1`}>
          #{player.number}
        </Button>
      );
    }

    return (
      <Button {...buttonProps} className={`${buttonProps.className} mb-2 text-start`}>
        {content}
      </Button>
    );
  };

  const selectedCount = selectedPlayers.size;
  const canSelectMore = !maxSelectable || selectedCount < maxSelectable;
  const hasSelection = selectedCount > 0;

  return (
    <Card className={className}>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h6 className="mb-0">{title}</h6>
        <div className="d-flex align-items-center gap-2">
          <Badge bg={selectedCount === 0 ? 'secondary' : 'primary'}>
            {selectedCount}
            {maxSelectable ? `/${maxSelectable}` : ''} selected
          </Badge>
          
          {showSelectAll && (
            <ButtonGroup size="sm">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={handleSelectAll}
                disabled={disabled || !canSelectMore}
              >
                All
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={handleClearAll}
                disabled={disabled || !hasSelection || minSelectable > 0}
              >
                Clear
              </Button>
            </ButtonGroup>
          )}
        </div>
      </Card.Header>

      <Card.Body>
        {showSearch && (
          <Form.Group className="mb-3">
            <InputGroup size="sm">
              <InputGroup.Text>
                <i className="fas fa-search" />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search players by name or number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={disabled}
              />
              {searchQuery && (
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                >
                  <i className="fas fa-times" />
                </Button>
              )}
            </InputGroup>
          </Form.Group>
        )}

        {filteredPlayers.length === 0 ? (
          <div className="text-center text-muted py-3">
            {searchQuery ? 'No players match your search' : 'No players available'}
          </div>
        ) : (
          <>
            {variant === 'grid' ? (
              <Row>
                {filteredPlayers.map(player => (
                  <Col key={player.id} xs={6} md={4} lg={3}>
                    {renderPlayerButton(player)}
                  </Col>
                ))}
              </Row>
            ) : (
              <div className="d-flex flex-column">
                {filteredPlayers.map(renderPlayerButton)}
              </div>
            )}
          </>
        )}

        {/* Selection constraints info */}
        <div className="mt-3 small text-muted">
          {minSelectable > 0 && (
            <div>Minimum: {minSelectable} players</div>
          )}
          {maxSelectable && (
            <div>Maximum: {maxSelectable} players</div>
          )}
          {!canSelectMore && maxSelectable && (
            <div className="text-warning">
              <i className="fas fa-info-circle me-1" />
              Maximum selection reached
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

/**
 * Compact player selector for use in modals or limited space
 */
export const CompactPlayerSelector: React.FC<Omit<PlayerSelectorProps, 'variant'>> = (props) => {
  return <PlayerSelector {...props} variant="compact" showSearch={false} />;
};

/**
 * Grid-based player selector for larger displays
 */
export const GridPlayerSelector: React.FC<Omit<PlayerSelectorProps, 'variant'>> = (props) => {
  return <PlayerSelector {...props} variant="grid" />;
};