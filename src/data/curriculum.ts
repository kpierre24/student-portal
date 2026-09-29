// HTEIM School of Ministry — Master Institutional Curriculum & Student Roster
// Official Academic Cohort 2025–2026 Definitions

export interface CurriculumRecord {
  name: string;
  classDay: string;
  timestamp: string;
  score: string;
  present: boolean;
  isDemo?: boolean;
  source?: string;
}

export interface ClassDayItem {
  id: string;
  name: string;
  date: string;
}

/**
 * Detects obsolete legacy class day IDs or duplicated placeholder names
 * (e.g. "School of the Pastors Pt 4", "School of the Pastors Pt 3", "Apostolic Pt 1", "Lesson 8 Assignment", etc.)
 * that were superseded by the canonical 16 Google Sheet tabs.
 */
export const isObsoleteLegacyClassDay = (idOrName: string | undefined | null): boolean => {
  if (!idOrName) return false;
  const normalized = idOrName.toLowerCase().trim();

  // Pattern matching for old naming conventions:
  // 1. School of the Pastors Pt 1..4 / Part 1..4
  if (/^school\s+of\s+the\s+pastors\s+(pt|part)\.?\s*\d+/i.test(normalized)) return true;
  // 2. Apostolic Pt 1..3 / Part 1..3
  if (/^apostolic\s+(pt|part)\.?\s*\d+/i.test(normalized)) return true;
  // 3. Lesson X Assignment / Lesson 1 Responses / Lesson 4 Assignment Part 2
  if (/^lesson\s+\d+\s+(assignment|responses)/i.test(normalized)) return true;

  const LEGACY_OBSOLETE_SET = new Set([
    'school of the pastors pt 4',
    'school of the pastors pt4',
    'school of the pastors pt 3',
    'school of the pastors pt3',
    'school of the pastors pt 2',
    'school of the pastors pt2',
    'school of the pastors pt 1',
    'school of the pastors pt1',
    'school of the pastors pt. 4',
    'school of the pastors pt. 3',
    'school of the pastors pt. 2',
    'school of the pastors pt. 1',
    'school of the pastors part 4',
    'school of the pastors part 3',
    'school of the pastors part 2',
    'school of the pastors part 1',
    'apostolic pt 3',
    'apostolic pt3',
    'apostolic pt 2',
    'apostolic pt2',
    'apostolic pt 1',
    'apostolic pt1',
    'apostolic pt. 3',
    'apostolic pt. 2',
    'apostolic pt. 1',
    'apostolic part 3',
    'apostolic part 2',
    'apostolic part 1',
    'lesson 8 assignment',
    'lesson 7 assignment',
    'lesson 6 assignment',
    'lesson 5 assignment',
    'lesson 4 assignment part 2',
    'lesson 4 assignment',
    'lesson 3 assignment',
    'lesson 2 assignment',
    'lesson 1 responses'
  ]);

  return LEGACY_OBSOLETE_SET.has(normalized);
};

/**
 * The 16 official curriculum class sessions & quiz lessons for the HTEIM School of Ministry course.
 */
export const CURRICULUM_CLASS_DAYS: ClassDayItem[] = [
  { id: "School of the Pastors Lesson 16", name: "School of the Pastors Lesson 16 (15/09/2026)", date: "2026-09-15" },
  { id: "School of the Pastors Lesson 15", name: "School of the Pastors Lesson 15 (08/09/2026)", date: "2026-09-08" },
  { id: "School of the Pastors Lesson 14", name: "School of the Pastors Lesson 14 (01/09/2026)", date: "2026-09-01" },
  { id: "School of the Pastors Lesson 13", name: "School of the Pastors Lesson 13 (18/08/2026)", date: "2026-08-18" },
  { id: "Apostolic Lesson 12", name: "Apostolic Lesson 12 (11/08/2026)", date: "2026-08-11" },
  { id: "Apostolic Lesson 11", name: "Apostolic Lesson 11 (04/08/2026)", date: "2026-08-04" },
  { id: "Apostolic Lesson 10", name: "Apostolic Lesson 10 (21/07/2026)", date: "2026-07-21" },
  { id: "Ministerial Ethics lesson 9", name: "Ministerial Ethics Lesson 9 (14/07/2026)", date: "2026-07-14" },
  { id: "Ministerial Ethics Lesson 8", name: "Ministerial Ethics Lesson 8 (30/06/2026)", date: "2026-06-30" },
  { id: "Evangelism Lesson 7", name: "Evangelism Lesson 7 (09/06/2026)", date: "2026-06-09" },
  { id: "Evangelism lesson 6", name: "Evangelism Lesson 6 (02/06/2026)", date: "2026-06-02" },
  { id: "Evangelism Lesson 5", name: "Evangelism Lesson 5 (26/05/2026)", date: "2026-05-26" },
  { id: "Evangelism Lesson 4", name: "Evangelism Lesson 4 (19/05/2026)", date: "2026-05-19" },
  { id: "Evangelism Lesson 3", name: "Evangelism Lesson 3 (12/05/2026)", date: "2026-05-12" },
  { id: "Evangelism Lesson 2", name: "Evangelism Lesson 2 (05/05/2026)", date: "2026-05-05" },
  { id: "Introduction", name: "Introduction (21/04/2026)", date: "2026-04-21" },
];

/**
 * Exact maximum quiz points for each lesson across the curriculum from start to finish.
 * Introduction (5), Evangelism 2 (12), Evangelism 3 (10), Evangelism 4 (7),
 * Evangelism 5 (10), Evangelism 6 (10), Evangelism 7 (10), Ministerial Ethics 8 (5),
 * Ministerial Ethics 9 (10), Apostolic 10 (6), Apostolic 11 (5), Apostolic 12 (8),
 * Pastors 13 (10), Pastors 14 (16), Pastors 15 (13), Pastors 16 (10).
 * Total points from start to finish: 147 points.
 */
export const CURRICULUM_QUIZ_MAX_POINTS: Record<string, number> = {
  "Introduction": 5,
  "Evangelism Lesson 2": 12,
  "Evangelism Lesson 3": 10,
  "Evangelism Lesson 4": 7,
  "Evangelism Lesson 5": 10,
  "Evangelism lesson 6": 10,
  "Evangelism Lesson 7": 10,
  "Ministerial Ethics Lesson 8": 5,
  "Ministerial Ethics lesson 9": 10,
  "Apostolic Lesson 10": 6,
  "Apostolic Lesson 11": 5,
  "Apostolic Lesson 12": 8,
  "School of the Pastors Lesson 13": 10,
  "School of the Pastors Lesson 14": 16,
  "School of the Pastors Lesson 15": 13,
  "School of the Pastors Lesson 16": 10,
};

export const TOTAL_CURRICULUM_MAX_POINTS = Object.values(CURRICULUM_QUIZ_MAX_POINTS).reduce((a, b) => a + b, 0); // 147

export const getLessonMaxPoints = (lessonName?: string): number => {
  if (!lessonName) return 10;
  const clean = lessonName.toLowerCase().trim().split('(')[0].trim();
  for (const [k, max] of Object.entries(CURRICULUM_QUIZ_MAX_POINTS)) {
    const kClean = k.toLowerCase().trim();
    if (clean === kClean || clean.includes(kClean) || kClean.includes(clean)) {
      return max;
    }
  }
  // Pattern based matching
  if (clean.includes('introduction')) return 5;
  if (clean.includes('lesson 2')) return 12;
  if (clean.includes('lesson 4')) return 7;
  if (clean.includes('lesson 8')) return 5;
  if (clean.includes('lesson 10')) return 6;
  if (clean.includes('lesson 11')) return 5;
  if (clean.includes('lesson 12')) return 8;
  if (clean.includes('lesson 14')) return 16;
  if (clean.includes('lesson 15')) return 13;
  return 10;
};

/**
 * Chronological order of curriculum quiz lessons from start to finish.
 */
export const CHRONOLOGICAL_CURRICULUM_LESSONS = [
  'Introduction',
  'Evangelism Lesson 2',
  'Evangelism Lesson 3',
  'Evangelism Lesson 4',
  'Evangelism Lesson 5',
  'Evangelism lesson 6',
  'Evangelism Lesson 7',
  'Ministerial Ethics Lesson 8',
  'Ministerial Ethics lesson 9',
  'Apostolic Lesson 10',
  'Apostolic Lesson 11',
  'Apostolic Lesson 12',
  'School of the Pastors Lesson 13',
  'School of the Pastors Lesson 14',
  'School of the Pastors Lesson 15',
  'School of the Pastors Lesson 16',
];

/**
 * The 59 enrolled students in the HTEIM School of Ministry active cohort.
 */
export const MASTER_ENROLLED_STUDENTS: string[] = [
  "Afeshia Burke",
  "Afi Thompson",
  "Alicia Noray Bowles",
  "Anne-Marie Davis",
  "Atiya Williams",
  "Beverly Selkridge",
  "Candy Webb",
  "Catherine Vidale",
  "Claudia Cashe",
  "Colette Blackburne-Joseph",
  "Denise Edwards",
  "Dessel Williams",
  "Diana Selkridge",
  "Felicia Williams",
  "Francisca Swift",
  "Ingrid Bonval-Butcher",
  "Javier Marks",
  "Jenetta Pierre",
  "Jennylyn Dickson",
  "Jerzelle Whiteman",
  "Jessica Fiddler",
  "Josanne Pompey",
  "Jovanka Williams",
  "Julie-Ann Fernandes-Charles",
  "Kabrina Morris-Jack",
  "Kadijah Daniel",
  "Kathleen Joseph-Sandy",
  "Kemrolene Bowens-Opadeyi",
  "Keyshana Gomes",
  "Kristy Alexander",
  "Krystal Mohammed",
  "Leslie Inniss",
  "Lynton Pompey",
  "Marlene Walker-Castle",
  "Mishael Daniel",
  "Natalie Webb Lewis",
  "Natasha Williams",
  "Nevillean Dundas",
  "Niomi Loverne Joseph Marksman",
  "Paula Massiah Blount",
  "Quacy Marecheau",
  "Racine Roy",
  "Racquel Gumbs",
  "Regina Joseph-Gonzales",
  "Rennie Bowles",
  "Richard Roberts",
  "Roxanne Sealey",
  "Ruth Vernon",
  "Shellon Liddell",
  "Stacey Waithe",
  "Susan Sparks",
  "Sybris Walker-Castle",
  "Tessa Phipps",
  "Tricia Worrell",
  "Vanessa Mohammed",
  "Vikash Ramnarace",
  "Wendy Woodruffe",
  "Whitney Tracey Seelochan",
  "Zahra Andrews"
];
