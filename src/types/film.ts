/**
 * MintMind AI - Film Intelligence & Story Bible Types
 */

export type CharacterArchetype =
  | 'Protagonist'
  | 'Antagonist'
  | 'Mentor'
  | 'Foil'
  | 'Love Interest'
  | 'Shapeshifter'
  | 'Threshold Guardian'
  | 'Comic Relief';

export interface CharacterProfile {
  id: string;
  name: string;
  archetype: CharacterArchetype;
  logline: string;
  coreDesire: string;
  internalFlaw: string;
  externalGoal: string;
  backstory: string;
  physicalDescription: string;
  voiceCadence: string;
  arcStatus: 'unresolved' | 'transforming' | 'resolved';
}

export interface CharacterRelationship {
  id: string;
  sourceCharacterId: string;
  targetCharacterId: string;
  dynamic:
    | 'allies'
    | 'rivals'
    | 'mentor-student'
    | 'romantic'
    | 'secret-enmity'
    | 'uneasy-truce';
  tensionScore: number; // 1 - 10
  description: string;
}

export interface StoryBeat {
  id: string;
  act: 1 | 2 | 3;
  beatName: string;
  timecodePercent: number; // 0 - 100%
  description: string;
  dramaticTension: number; // 1 - 10
  keyTurningPoint: boolean;
}

export interface SceneContinuityItem {
  sceneNumber: number;
  sceneHeading: string;
  timeOfDay: 'DAWN' | 'DAY' | 'DUSK' | 'NIGHT';
  location: string;
  charactersPresent: string[];
  propContinuity: string[];
  costumeContinuity: string[];
  emotionalKeynote: string;
  flaggedErrors?: string[];
}

export interface WorldBuildingRule {
  id: string;
  domain: 'technology' | 'social_hierarchy' | 'magic_physics' | 'geography' | 'historical_lore';
  ruleTitle: string;
  ruleStatement: string;
  narrativeImpact: string;
}

export interface CopyrightRiskItem {
  parallelTitle: string;
  elementOrTrope: string;
  riskType: 'Trademark / Name Collision' | 'Plot Parallels' | 'Character Trope' | 'Public Domain Safe';
  severity: 'Safe' | 'Low' | 'Medium' | 'High';
  mitigationAdvice: string;
}

export interface CopyrightRiskAudit {
  overallRiskLevel: 'Safe' | 'Low' | 'Moderate' | 'High';
  similarityIndexPercent: number; // 0 - 100
  publicDomainStatus: boolean;
  fairUseVerdict: string;
  detectedParallels: CopyrightRiskItem[];
}

export interface FilmStoryBible {
  id: string;
  projectId: string;
  title: string;
  logline: string;
  premise: string;
  format: 'Feature Film' | 'Pilot Web Series' | 'Mini-Series' | 'Cinematic Short';
  genres: string[];
  characters: CharacterProfile[];
  relationships: CharacterRelationship[];
  beats: StoryBeat[];
  continuity: SceneContinuityItem[];
  worldRules: WorldBuildingRule[];
  copyrightAudit: CopyrightRiskAudit;
  createdAt: string;
  updatedAt: string;
}
