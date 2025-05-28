import { PowerCard, PowerTrigger, EffectType, TargetType, StatusType } from '../types/game';

export const getPowerCardDefinition = (cardId: string): PowerCard | null => {
  switch (cardId) {
    case 'metallicize':
      return {
        id: 'metallicize',
        name: 'Metallicize',
        description: 'At the end of your turn, gain 3 Block.',
        effects: [{
          trigger: PowerTrigger.TURN_END,
          type: EffectType.BLOCK,
          value: 3,
          target: TargetType.SELF
        }]
      };
      
    case 'demon_form':
      return {
        id: 'demon_form',
        name: 'Demon Form',
        description: 'At the start of each turn, gain 2 Strength.',
        effects: [{
          trigger: PowerTrigger.TURN_START,
          type: EffectType.APPLY_STATUS,
          value: 2,
          target: TargetType.SELF,
          statusType: StatusType.STRENGTH
        }]
      };
      
    case 'inflame':
      return {
        id: 'inflame',
        name: 'Inflame',
        description: 'Gain 2 Strength.',
        effects: [{
          trigger: PowerTrigger.COMBAT_START,
          type: EffectType.APPLY_STATUS,
          value: 2,
          target: TargetType.SELF,
          statusType: StatusType.STRENGTH
        }]
      };
      
    default:
      return null;
  }
}; 