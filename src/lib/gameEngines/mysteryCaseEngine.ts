/**
 * Mystery Case Game Engine
 * Procedural mystery generation separate from React
 */

export interface Mystery {
  caseName: string;
  criminal: string;
  clues: Clue[];
  totalPoints: number;
}

export interface Clue {
  text: string;
  points: number;
  category: "witness" | "evidence" | "location" | "motive";
  difficulty: "easy" | "hard" | "expert";
  revealed: boolean;
}

/**
 * Generate a random mystery case
 */
export const generateMysteryCase = (difficulty: "easy" | "hard" | "expert"): Mystery => {
  const criminals = [
    "The Mysterious Stranger",
    "The Inside Agent",
    "The Rival Competitor",
    "The Disgruntled Employee",
    "The Hidden Mastermind"
  ];

  const caseNames = [
    "The Diamond Heist",
    "The Secret Message",
    "The Missing Artifact",
    "The Plot Unfolds",
    "The Hidden Truth"
  ];

  const witnessClues = [
    { text: "The suspect was wearing a red jacket", points: 15, category: "witness" as const },
    { text: "They arrived at midnight", points: 20, category: "witness" as const },
    { text: "Three people saw them leave together", points: 25, category: "witness" as const }
  ];

  const evidenceClues = [
    { text: "A mysterious key was found", points: 20, category: "evidence" as const },
    { text: "Fingerprints matched the database", points: 30, category: "evidence" as const },
    { text: "Security footage shows the escape route", points: 35, category: "evidence" as const }
  ];

  const locationClues = [
    { text: "The crime occurred near the docks", points: 15, category: "location" as const },
    { text: "The safe house was on the outskirts", points: 25, category: "location" as const }
  ];

  const motiveClues = [
    { text: "Financial desperation was the motive", points: 25, category: "motive" as const },
    { text: "Revenge was the driving force", points: 30, category: "motive" as const }
  ];

  const allClues = [
    ...witnessClues,
    ...evidenceClues,
    ...locationClues,
    ...motiveClues
  ];

  // Shuffle and select clues based on difficulty
  const clueCount = difficulty === "easy" ? 5 : difficulty === "hard" ? 8 : 10;
  const selectedClues = allClues
    .sort(() => Math.random() - 0.5)
    .slice(0, clueCount)
    .map(clue => ({
      ...clue,
      difficulty,
      revealed: false
    }));

  const totalPoints = selectedClues.reduce((sum, clue) => sum + clue.points, 0);

  return {
    caseName: caseNames[Math.floor(Math.random() * caseNames.length)],
    criminal: criminals[Math.floor(Math.random() * criminals.length)],
    clues: selectedClues,
    totalPoints
  };
};

/**
 * Reveal a clue and update mystery state
 */
export const revealClue = (clues: Clue[], clueIndex: number): Clue[] => {
  return clues.map((c, i) => (i === clueIndex ? { ...c, revealed: true } : c));
};

/**
 * Calculate mystery score based on clues revealed
 */
export const calculateMysteryScore = (clues: Clue[], correctAnswers: number): number => {
  const revealedClues = clues.filter(c => c.revealed);
  const unrevealedPoints = revealedClues.reduce((sum, c) => sum + c.points, 0);
  return Math.max(0, (correctAnswers / clues.length) * unrevealedPoints);
};
