import React, { useEffect } from 'react';
import { Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { useGame } from '../../hooks/useGames';
import { useGameStore } from '../../stores/gameStore';
import { useNotifications } from '../../stores/uiStore';

// Import the new game components
import { GameTimer } from './GameTimer';
import { GameControls } from './GameControls';
import { PlayerStatsTable } from './PlayerStatsTable';
import { SubstitutionHistory } from './SubstitutionHistory';
import { GameModals } from './GameModals';

// Import the existing header component (will be refactored later if needed)
import GameHeader from '../GameHeader';

/**
 * Refactored GameView component using composition pattern
 * Utilizes our new stores, hooks, and smaller focused components
 */
export const GameView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { error: notificationError } = useNotifications();
  
  // Use our new hooks for data management
  const { game: gameFromHook, loading: gameLoading, error: gameError } = useGame(id || null);
  const { 
    game: gameFromStore, 
    loading: storeLoading, 
    error: storeError,
    loadGame 
  } = useGameStore();

  // Load game when component mounts or ID changes
  useEffect(() => {
    if (id && (!gameFromStore || gameFromStore.id !== id)) {
      loadGame(id);
    }
  }, [id, gameFromStore, loadGame]);

  // Show loading state
  if (gameLoading || storeLoading || (!gameFromStore && id)) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <Spinner animation="border" role="status" className="me-2" />
          <span>Loading game...</span>
        </div>
      </Container>
    );
  }

  // Show error state
  if (gameError || storeError) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Game</Alert.Heading>
          <p>{gameError || storeError}</p>
          <hr />
          <p className="mb-0">
            Please try refreshing the page or return to the game list.
          </p>
        </Alert>
      </Container>
    );
  }

  // Show not found state
  if (!gameFromStore && id) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">
          <Alert.Heading>Game Not Found</Alert.Heading>
          <p>The game with ID "{id}" could not be found.</p>
        </Alert>
      </Container>
    );
  }

  // Game is required for the rest of the component
  if (!gameFromStore) {
    return (
      <Container className="mt-4">
        <Alert variant="info">
          <Alert.Heading>No Game Selected</Alert.Heading>
          <p>Please select a game to view.</p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-3">
      {/* Game Header - keeping existing component for now */}
      <Row className="mb-3">
        <Col>
          <GameHeader
            teamName={gameFromStore.team.name}
            opponent={gameFromStore.opponent}
            currentPeriod={gameFromStore.currentPeriod}
            periodFouls={0} // This will be calculated by the component itself
            timeRemaining={0} // This will be managed by the timer component
            isRunning={gameFromStore.isRunning}
            onTimeAdjustment={() => {}} // This will be handled by GameTimer
            onToggleClock={() => {}} // This will be handled by GameTimer
            onEndPeriod={() => {}} // This will be handled by GameControls
            onShowSub={() => {}} // This will be handled by GameControls
            onShowFoul={() => {}} // This will be handled by GameControls
            formatTime={(seconds: number) => {
              const mins = Math.floor(seconds / 60);
              const secs = seconds % 60;
              return `${mins}:${secs.toString().padStart(2, '0')}`;
            }}
          />
        </Col>
      </Row>

      {/* Main Game Content */}
      <Row>
        {/* Left Column - Timer and Controls */}
        <Col lg={4} className="mb-4">
          <div className="d-flex flex-column gap-3">
            <GameTimer />
            <GameControls />
          </div>
        </Col>

        {/* Right Column - Player Stats */}
        <Col lg={8} className="mb-4">
          <PlayerStatsTable />
        </Col>
      </Row>

      {/* Substitution History */}
      <Row>
        <Col>
          <SubstitutionHistory />
        </Col>
      </Row>

      {/* All Game Modals */}
      <GameModals />

      {/* Show any notifications */}
      {storeError && (
        <Alert variant="danger" className="mt-3" dismissible>
          <Alert.Heading>Game Action Error</Alert.Heading>
          <p>{storeError}</p>
        </Alert>
      )}
    </Container>
  );
};