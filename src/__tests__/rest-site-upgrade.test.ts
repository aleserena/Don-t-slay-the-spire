import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../store/gameStore';
import { GamePhase } from '../types/game';

describe('Rest Site Upgrade Functionality', () => {
  beforeEach(() => {
    // Reset the store before each test
    useGameStore.getState().startNewRun();
  });

  describe('Rest Site State Management', () => {
    it('should have card upgrade modal state management', () => {
      const { openCardUpgradeModal, closeCardUpgradeModal } = useGameStore.getState();
      
      expect(useGameStore.getState().showCardUpgradeModal).toBe(false);
      
      openCardUpgradeModal();
      expect(useGameStore.getState().showCardUpgradeModal).toBe(true);
      
      closeCardUpgradeModal();
      expect(useGameStore.getState().showCardUpgradeModal).toBe(false);
    });
  });

  describe('Rest and Heal Action', () => {
    it('should heal player and return to map when resting', () => {
      const { restAndHeal } = useGameStore.getState();
      
      // Manually set health to test healing
      const initialHealth = 50;
      useGameStore.setState({ 
        player: { 
          ...useGameStore.getState().player, 
          health: initialHealth 
        },
        gamePhase: GamePhase.REST
      });
      
      restAndHeal();
      
      const state = useGameStore.getState();
      expect(state.gamePhase).toBe(GamePhase.MAP);
      expect(state.player.health).toBe(initialHealth + 30);
      expect(state.selectedCard).toBe(null);
    });

    it('should not heal beyond max health', () => {
      const { restAndHeal } = useGameStore.getState();
      
      // Set health close to max
      useGameStore.setState({ 
        player: { 
          ...useGameStore.getState().player, 
          health: 70 
        }
      });
      
      restAndHeal();
      
      expect(useGameStore.getState().player.health).toBe(80); // Should cap at max health
    });
  });

  describe('Card Upgrade Action', () => {
    it('should open upgrade modal when no card ID provided', () => {
      const { upgradeCardAtRest } = useGameStore.getState();
      
      upgradeCardAtRest();
      
      expect(useGameStore.getState().showCardUpgradeModal).toBe(true);
      expect(useGameStore.getState().selectedCard).toBe(null);
    });

    it('should upgrade a specific card and return to map', () => {
      const { upgradeCardAtRest } = useGameStore.getState();
      
      // Get a card from the deck that can be upgraded
      const upgradableCard = useGameStore.getState().drawPile.find(card => !card.upgraded);
      expect(upgradableCard).toBeDefined();
      
      const cardId = upgradableCard!.id;
      const originalName = upgradableCard!.name;
      
      upgradeCardAtRest(cardId);
      
      // Check that the card was upgraded
      const state = useGameStore.getState();
      const upgradedCard = state.drawPile.find(card => card.id === cardId);
      expect(upgradedCard).toBeDefined();
      expect(upgradedCard!.upgraded).toBe(true);
      expect(upgradedCard!.name).toBe(`${originalName}+`);
      
      // Check state cleanup
      expect(state.showCardUpgradeModal).toBe(false);
      expect(state.gamePhase).toBe(GamePhase.MAP);
      expect(state.selectedCard).toBe(null);
    });

    it('should upgrade cards in discard pile', () => {
      const { upgradeCardAtRest } = useGameStore.getState();
      
      // Move a card to discard pile
      const state = useGameStore.getState();
      const cardToMove = state.drawPile[0];
      useGameStore.setState({
        drawPile: state.drawPile.slice(1),
        discardPile: [...state.discardPile, cardToMove]
      });
      
      const cardId = cardToMove.id;
      
      upgradeCardAtRest(cardId);
      
      // Check that the card was upgraded in discard pile
      const newState = useGameStore.getState();
      const upgradedCard = newState.discardPile.find(card => card.id === cardId);
      expect(upgradedCard).toBeDefined();
      expect(upgradedCard!.upgraded).toBe(true);
    });

    it('should not upgrade already upgraded cards', () => {
      const { upgradeCardAtRest } = useGameStore.getState();
      
      // Get a card and upgrade it first
      const card = useGameStore.getState().drawPile[0];
      const cardId = card.id;
      
      // First upgrade
      upgradeCardAtRest(cardId);
      const firstUpgrade = useGameStore.getState().drawPile.find(c => c.id === cardId);
      expect(firstUpgrade!.upgraded).toBe(true);
      
      // Try to upgrade again - should not change anything
      const beforeSecondUpgrade = { ...firstUpgrade! };
      upgradeCardAtRest(cardId);
      const afterSecondUpgrade = useGameStore.getState().drawPile.find(c => c.id === cardId);
      
      expect(afterSecondUpgrade).toEqual(beforeSecondUpgrade);
    });

    it('should handle non-existent card IDs gracefully', () => {
      const { upgradeCardAtRest } = useGameStore.getState();
      
      const initialState = useGameStore.getState();
      const stateBefore = {
        drawPile: [...initialState.drawPile],
        discardPile: [...initialState.discardPile],
        gamePhase: initialState.gamePhase
      };
      
      upgradeCardAtRest('non_existent_card_id');
      
      // State should remain unchanged
      const stateAfter = useGameStore.getState();
      expect(stateAfter.drawPile).toEqual(stateBefore.drawPile);
      expect(stateAfter.discardPile).toEqual(stateBefore.discardPile);
      expect(stateAfter.gamePhase).toBe(stateBefore.gamePhase);
    });
  });

  describe('Card Upgrade Integration', () => {
    it('should properly upgrade Strike card', () => {
      const { upgradeCardAtRest } = useGameStore.getState();
      
      // Find a Strike card
      const strikeCard = useGameStore.getState().drawPile.find(card => card.baseId === 'strike');
      expect(strikeCard).toBeDefined();
      
      upgradeCardAtRest(strikeCard!.id);
      
      const upgradedStrike = useGameStore.getState().drawPile.find(card => card.id === strikeCard!.id);
      expect(upgradedStrike!.name).toBe('Strike+');
      expect(upgradedStrike!.damage).toBe(9); // Strike+ does 9 damage
      expect(upgradedStrike!.upgraded).toBe(true);
    });

    it('should properly upgrade Defend card', () => {
      const { upgradeCardAtRest } = useGameStore.getState();
      
      // Find a Defend card
      const defendCard = useGameStore.getState().drawPile.find(card => card.baseId === 'defend');
      expect(defendCard).toBeDefined();
      
      upgradeCardAtRest(defendCard!.id);
      
      const upgradedDefend = useGameStore.getState().drawPile.find(card => card.id === defendCard!.id);
      expect(upgradedDefend!.name).toBe('Defend+');
      expect(upgradedDefend!.block).toBe(8); // Defend+ gives 8 block
      expect(upgradedDefend!.upgraded).toBe(true);
    });

    it('should properly upgrade Bash card', () => {
      const { upgradeCardAtRest } = useGameStore.getState();
      
      // Find a Bash card
      const bashCard = useGameStore.getState().drawPile.find(card => card.baseId === 'bash');
      expect(bashCard).toBeDefined();
      
      upgradeCardAtRest(bashCard!.id);
      
      const upgradedBash = useGameStore.getState().drawPile.find(card => card.id === bashCard!.id);
      expect(upgradedBash!.name).toBe('Bash+');
      expect(upgradedBash!.description).toBe('Deal 10 damage. Apply 2 Vulnerable.');
      expect(upgradedBash!.upgraded).toBe(true);
      
      // Check that damage effect was updated
      const damageEffect = upgradedBash!.effects?.find(effect => effect.type === 'damage');
      expect(damageEffect?.value).toBe(10);
    });
  });

  describe('Modal State Consistency', () => {
    it('should clear selected card when opening upgrade modal', () => {
      const { setSelectedCard, openCardUpgradeModal } = useGameStore.getState();
      
      // Set a selected card
      setSelectedCard(useGameStore.getState().drawPile[0]);
      expect(useGameStore.getState().selectedCard).not.toBe(null);
      
      openCardUpgradeModal();
      
      expect(useGameStore.getState().selectedCard).toBe(null);
      expect(useGameStore.getState().showCardUpgradeModal).toBe(true);
    });

    it('should clear selected card when closing upgrade modal', () => {
      const { openCardUpgradeModal, closeCardUpgradeModal, setSelectedCard } = useGameStore.getState();
      
      openCardUpgradeModal();
      setSelectedCard(useGameStore.getState().drawPile[0]);
      
      closeCardUpgradeModal();
      
      expect(useGameStore.getState().selectedCard).toBe(null);
      expect(useGameStore.getState().showCardUpgradeModal).toBe(false);
    });

    it('should maintain modal state independence from other modals', () => {
      const { openCardUpgradeModal, closeCardUpgradeModal, openCardRemovalModal } = useGameStore.getState();
      
      // Open card upgrade modal
      openCardUpgradeModal();
      expect(useGameStore.getState().showCardUpgradeModal).toBe(true);
      expect(useGameStore.getState().showCardRemovalModal).toBe(false);
      
      // Opening card removal modal should not affect upgrade modal
      openCardRemovalModal();
      expect(useGameStore.getState().showCardUpgradeModal).toBe(true);
      expect(useGameStore.getState().showCardRemovalModal).toBe(true);
      
      // Closing upgrade modal should not affect removal modal
      closeCardUpgradeModal();
      expect(useGameStore.getState().showCardUpgradeModal).toBe(false);
      expect(useGameStore.getState().showCardRemovalModal).toBe(true);
    });
  });
}); 