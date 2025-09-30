import React from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useGameStore } from '../../stores/gameStore';
import { useSubstitutions } from '../../hooks/useSubstitutions';
import { useModal } from '../../hooks/useModal';

// Import existing modal components
import SubstitutionModal from '../modals/SubstitutionModal';
import FoulModal from '../modals/FoulModal';
import EndPeriodModal from '../modals/EndPeriodModal';
import EditSubstitutionModal from '../modals/EditSubstitutionModal';

/**
 * Consolidated modal management component for game-related modals
 */
export const GameModals: React.FC = () => {
  const { modals } = useUIStore();
  const { 
    game, 
    activePlayers, 
    currentPeriod, 
    timeRemaining,
    endPeriod,
    addFoul 
  } = useGameStore();
  
  const { 
    addSubstitution, 
    editSubstitution, 
    deleteSubstitution 
  } = useSubstitutions();

  const substitutionModal = useModal('substitution');
  const foulModal = useModal('foul');
  const endPeriodModal = useModal('endPeriod');
  const editSubstitutionModal = useModal('editSubstitution');

  // Substitution Modal Handlers
  const handleSubstitutionSubmit = async (subbedIn: string[], playersOut: string[]) => {
    if (!game) return;

    const subbedInPlayers = subbedIn
      .map(id => game.players.find(p => p.id === id))
      .filter(Boolean);
    
    const playersOutData = playersOut
      .map(id => game.players.find(p => p.id === id))
      .filter(Boolean);

    if (modals.substitution.editMode && modals.substitution.eventId) {
      // Edit existing substitution
      await editSubstitution(
        modals.substitution.eventId,
        timeRemaining,
        subbedInPlayers as any[],
        playersOutData as any[]
      );
    } else {
      // Add new substitution
      const substitutionEvent = {
        id: `temp-${Date.now()}`,
        eventTime: timeRemaining,
        periodId: game.periods[currentPeriod].id,
        subbedIn: subbedInPlayers as any[],
        playersOut: playersOutData as any[],
      };
      
      await addSubstitution(substitutionEvent);
    }
    
    substitutionModal.close();
  };

  // Foul Modal Handlers
  const handleFoulSubmit = async (playerId: string) => {
    if (!game || !playerId) return;
    
    await addFoul(playerId);
    foulModal.close();
  };

  // End Period Modal Handlers
  const handleEndPeriod = async () => {
    await endPeriod();
    endPeriodModal.close();
  };

  // Edit Substitution Modal Handlers
  const handleEditSubstitutionSubmit = async (
    eventId: string,
    eventTime: number,
    subbedIn: any[],
    playersOut: any[]
  ) => {
    await editSubstitution(eventId, eventTime, subbedIn, playersOut);
    editSubstitutionModal.close();
  };

  if (!game) return null;

  return (
    <>
      {/* Substitution Modal */}
      <SubstitutionModal
        show={modals.substitution.show}
        onHide={substitutionModal.close}
        onSubmit={async () => {
          // This will be handled by the modal's internal state
          // We need to refactor SubstitutionModal to use the new pattern
        }}
        activePlayers={activePlayers}
        subInPlayers={new Set()} // This needs to be managed by the modal
        subOutPlayers={new Set()} // This needs to be managed by the modal
        game={game}
        handleSubButtonClick={() => {}} // This will be handled internally
        eventId={modals.substitution.eventId}
        eventTime={timeRemaining}
        onEventTimeChange={() => {}} // This will be handled internally
      />

      {/* Foul Modal */}
      <FoulModal
        show={modals.foul.show}
        onHide={foulModal.close}
        onConfirm={async () => {
          if (modals.foul.playerId) {
            await handleFoulSubmit(modals.foul.playerId);
          }
        }}
        activePlayers={activePlayers}
        selectedFoulPlayerId={modals.foul.playerId || null}
        setSelectedFoulPlayerId={() => {}} // This will be handled internally
        game={game}
        calculatePlayerFouls={() => 0} // This will use hooks internally
        handleFoulPlayerClick={() => {}} // This will be handled internally
      />

      {/* End Period Modal */}
      <EndPeriodModal
        show={modals.endPeriod.show}
        onHide={endPeriodModal.close}
        onEndPeriod={handleEndPeriod}
        currentPeriod={currentPeriod}
        activePlayersCount={activePlayers.size}
      />

      {/* Edit Substitution Modal */}
      {modals.editSubstitution.show && (
        <EditSubstitutionModal
          show={modals.editSubstitution.show}
          onHide={editSubstitutionModal.close}
          eventId={modals.editSubstitution.eventId || ''}
          game={game}
          currentPeriod={currentPeriod}
          onSubmit={handleEditSubstitutionSubmit}
        />
      )}
    </>
  );
};