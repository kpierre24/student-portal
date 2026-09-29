import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  RefreshCw, 
  Download, 
  ArrowUp, 
  ArrowDown, 
  User, 
  Trophy, 
  CheckCircle2, 
  AlertTriangle,
  UserX,
  Sparkles
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { CustomAssignment, AssignmentSubmission, StudentSummary } from '../../../types';
import { getQuizScoreForStudent } from '../../../components/ExamsTab';
import { 
  CHRONOLOGICAL_CURRICULUM_LESSONS, 
  CURRICULUM_QUIZ_MAX_POINTS, 
  TOTAL_CURRICULUM_MAX_POINTS, 
  getLessonMaxPoints 
} from '../../../data/curriculum';

export interface ExamQuizScoreMatrixProps {
  students: StudentSummary[];
  assignments?: CustomAssignment[];
  submissions?: AssignmentSubmission[];
  allQuizSheets?: string[];
  records?: any[];
  effectiveClassDays?: any[];
  rubricScores?: Record<string, { participation: number; scripture: number; assignment: number }>;
  onUpdateRubric?: (studentName: string, key: 'participation' | 'scripture' | 'assignment', val: number) => void;
  onSyncGoogleSheets?: () => void;
  isLoadingSheets?: boolean;
  className?: string;
}

export const getGradeLetter = (pct: number | null): string => {
  if (pct === null || pct === undefined) return 'N/A';
  if (pct >= 100) return 'A+';
  if (pct >= 90) return 'A';
  if (pct >= 80) return 'B';
  if (pct >= 70) return 'C';
  if (pct >= 60) return 'D';
  return 'F';
};

export const ExamQuizScoreMatrix: React.FC<ExamQuizScoreMatrixProps> = ({
  students = [],
  assignments = [],
  submissions = [],
  allQuizSheets = [],
  records = [],
  effectiveClassDays = [],
  rubricScores = {},
  onUpdateRubric,
  onSyncGoogleSheets,
  isLoadingSheets = false,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'dropped_out' | 'passed' | 'at-risk' | 'honor'>('all');
  const [sortOrder, setSortOrder] = useState<'name_asc' | 'name_desc' | 'score_desc' | 'score_asc'>('name_asc');

  // Complete curriculum quiz lessons in chronological order from start to finish
  const sanitizedQuizSheets = useMemo(() => {
    // If external quiz sheets were passed and contain items not in default, merge them
    if (allQuizSheets && allQuizSheets.length > 0) {
      const set = new Set(CHRONOLOGICAL_CURRICULUM_LESSONS);
      const additional = allQuizSheets.filter(
        (qs) => qs && !qs.toLowerCase().includes('duplicate') && !qs.toLowerCase().includes('legacy')
      );
      additional.forEach((qs) => set.add(qs));
      return Array.from(set);
    }
    return CHRONOLOGICAL_CURRICULUM_LESSONS;
  }, [allQuizSheets]);

  // Helper to calculate student's comprehensive quiz statistics
  const getStudentQuizMetrics = (student: StudentSummary) => {
    const studentKey = (student?.name || '').toLowerCase().trim();
    let earnedPoints = 0;
    let possiblePoints = 0;
    let quizPercentages: number[] = [];

    sanitizedQuizSheets.forEach((qs) => {
      const { displayScore, hasScore, numericPct } = getQuizScoreForStudent(
        student as any,
        qs,
        records,
        effectiveClassDays
      );
      if (hasScore && numericPct !== null) {
        const max = getLessonMaxPoints(qs);
        // Extract raw points if available in displayScore e.g. "9/10"
        let pts = (numericPct / 100) * max;
        if (displayScore.includes('/')) {
          const p = parseFloat(displayScore.split('/')[0]);
          if (!isNaN(p)) pts = p;
        }
        earnedPoints += pts;
        possiblePoints += max;
        quizPercentages.push(numericPct);
      }
    });

    // Also include custom assignments
    assignments.forEach((asg) => {
      const sub = submissions.find(
        (subItem) =>
          subItem.assignmentId === asg.id &&
          ((subItem?.studentName || '').toLowerCase().trim() === studentKey ||
            studentKey.includes((subItem?.studentName || '').toLowerCase().trim()))
      );
      if (sub && sub.score !== undefined) {
        const max = asg.maxPoints || 100;
        const pct = Math.min(100, Math.round((sub.score / max) * 100));
        earnedPoints += sub.score;
        possiblePoints += max;
        quizPercentages.push(pct);
      }
    });

    const quizzesCompleted = quizPercentages.length;
    // Quiz Average % is strictly based on quizzes taken
    const quizAvg =
      quizzesCompleted > 0
        ? Math.round(quizPercentages.reduce((a, b) => a + b, 0) / quizzesCompleted)
        : null;

    // Overall Score from start to finish (out of total points possible in the curriculum)
    const curriculumTotalPossible = TOTAL_CURRICULUM_MAX_POINTS + assignments.reduce((acc, a) => acc + (a.maxPoints || 100), 0);
    const overallFromStartToFinish =
      curriculumTotalPossible > 0 ? Math.round((earnedPoints / curriculumTotalPossible) * 100) : null;

    const rub = rubricScores[studentKey] || { participation: 90, scripture: 95, assignment: 85 };
    const effectivePct = quizAvg !== null ? quizAvg : (student.avgScore ?? 0);
    const compositeFinal = Math.round((effectivePct + rub.assignment) / 2);

    return {
      earnedPoints: Math.round(earnedPoints * 10) / 10,
      possiblePoints,
      quizzesCompleted,
      quizAvg,
      overallFromStartToFinish,
      compositeFinal,
      rubricAssignment: rub.assignment,
      gradeLetter: getGradeLetter(quizAvg),
    };
  };

  // Metric summaries across all students
  const studentMetricsMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getStudentQuizMetrics>>();
    students.forEach((s) => {
      map.set((s.name || '').toLowerCase().trim(), getStudentQuizMetrics(s));
    });
    return map;
  }, [students, sanitizedQuizSheets, records, effectiveClassDays, assignments, submissions, rubricScores]);

  const droppedOutCount = useMemo(() => {
    return students.filter(
      (s) => s.isDroppedOut || s.enrollmentStatus === 'dropped_out' || s.enrollmentStatus === 'withdrawn'
    ).length;
  }, [students]);

  const activeCount = students.length - droppedOutCount;

  const evaluatedStudents = useMemo(() => {
    return students.filter((s) => {
      const isDropped = s.isDroppedOut || s.enrollmentStatus === 'dropped_out' || s.enrollmentStatus === 'withdrawn';
      if (isDropped) return false;
      const m = studentMetricsMap.get((s.name || '').toLowerCase().trim());
      return m && m.quizzesCompleted > 0;
    });
  }, [students, studentMetricsMap]);

  const totalEvaluated = evaluatedStudents.length;
  const avgSum = evaluatedStudents.reduce((acc, curr) => {
    const m = studentMetricsMap.get((curr.name || '').toLowerCase().trim());
    return acc + (m?.quizAvg ?? 0);
  }, 0);
  const classAvg = totalEvaluated > 0 ? Math.round(avgSum / totalEvaluated) : 0;

  const honorCount = students.filter((s) => {
    const isDropped = s.isDroppedOut || s.enrollmentStatus === 'dropped_out' || s.enrollmentStatus === 'withdrawn';
    if (isDropped) return false;
    const m = studentMetricsMap.get((s.name || '').toLowerCase().trim());
    return m && m.quizAvg !== null && m.quizAvg >= 85;
  }).length;

  const passedCount = students.filter((s) => {
    const isDropped = s.isDroppedOut || s.enrollmentStatus === 'dropped_out' || s.enrollmentStatus === 'withdrawn';
    if (isDropped) return false;
    const m = studentMetricsMap.get((s.name || '').toLowerCase().trim());
    return m && m.quizAvg !== null && m.quizAvg >= 75;
  }).length;

  const atRiskCount = students.filter((s) => {
    const isDropped = s.isDroppedOut || s.enrollmentStatus === 'dropped_out' || s.enrollmentStatus === 'withdrawn';
    if (isDropped) return false;
    const m = studentMetricsMap.get((s.name || '').toLowerCase().trim());
    return !m || m.quizAvg === null || m.quizAvg < 75 || s.rate < 75;
  }).length;

  // Filtered and sorted students
  const displayedStudents = useMemo(() => {
    let list = [...students];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((s) => (s?.name || '').toLowerCase().includes(q));
    }

    if (filterMode === 'active') {
      list = list.filter((s) => !s.isDroppedOut && s.enrollmentStatus !== 'dropped_out' && s.enrollmentStatus !== 'withdrawn');
    } else if (filterMode === 'dropped_out') {
      list = list.filter((s) => s.isDroppedOut || s.enrollmentStatus === 'dropped_out' || s.enrollmentStatus === 'withdrawn');
    } else if (filterMode === 'passed') {
      list = list.filter((s) => {
        const m = studentMetricsMap.get((s.name || '').toLowerCase().trim());
        return m && m.quizAvg !== null && m.quizAvg >= 75;
      });
    } else if (filterMode === 'at-risk') {
      list = list.filter((s) => {
        const m = studentMetricsMap.get((s.name || '').toLowerCase().trim());
        return !m || m.quizAvg === null || m.quizAvg < 75 || s.rate < 75;
      });
    } else if (filterMode === 'honor') {
      list = list.filter((s) => {
        const m = studentMetricsMap.get((s.name || '').toLowerCase().trim());
        return m && m.quizAvg !== null && m.quizAvg >= 85;
      });
    }

    return list.sort((a, b) => {
      const nameA = (a?.name || '').trim();
      const nameB = (b?.name || '').trim();
      const mA = studentMetricsMap.get(nameA.toLowerCase());
      const mB = studentMetricsMap.get(nameB.toLowerCase());
      const scoreA = mA?.quizAvg ?? -1;
      const scoreB = mB?.quizAvg ?? -1;

      if (sortOrder === 'name_asc') {
        return nameA.localeCompare(nameB, undefined, { sensitivity: 'base', numeric: true });
      }
      if (sortOrder === 'name_desc') {
        return nameB.localeCompare(nameA, undefined, { sensitivity: 'base', numeric: true });
      }
      if (sortOrder === 'score_desc') {
        return scoreB - scoreA || nameA.localeCompare(nameB);
      }
      if (sortOrder === 'score_asc') {
        return scoreA - scoreB || nameA.localeCompare(nameB);
      }
      return 0;
    });
  }, [students, searchQuery, filterMode, sortOrder, studentMetricsMap]);

  // Export full matrix to CSV
  const handleExportMatrixCsv = () => {
    const headers = [
      'Student Candidate',
      'Enrollment Status',
      'Dropout Reason',
      ...sanitizedQuizSheets.map((qs) => `${qs} (${getLessonMaxPoints(qs)} pts)`),
      ...assignments.map((a) => `${a.title} (${a.maxPoints || 100} pts)`),
      'Total Points Earned',
      'Total Curriculum Points',
      'Quiz Average %',
      'Overall Start-to-Finish %',
      'Letter Grade',
      'Written Rubric %',
      'Composite Final %',
    ];

    const curriculumTotalPoints = TOTAL_CURRICULUM_MAX_POINTS + assignments.reduce((acc, a) => acc + (a.maxPoints || 100), 0);

    const rows = displayedStudents.map((s) => {
      const studentKey = (s?.name || '').toLowerCase().trim();
      const m = studentMetricsMap.get(studentKey);
      const isDropped = s.isDroppedOut || s.enrollmentStatus === 'dropped_out' || s.enrollmentStatus === 'withdrawn';
      const statusLabel = isDropped ? (s.enrollmentStatus === 'withdrawn' ? 'Withdrawn' : 'Dropped Out') : 'Active';

      const quizScores = sanitizedQuizSheets.map((qs) => {
        const { displayScore } = getQuizScoreForStudent(s as any, qs, records, effectiveClassDays);
        return displayScore;
      });

      const assignmentScores = assignments.map((asg) => {
        const sub = submissions.find(
          (subItem) =>
            subItem.assignmentId === asg.id &&
            ((subItem?.studentName || '').toLowerCase().trim() === studentKey ||
              studentKey.includes((subItem?.studentName || '').toLowerCase().trim()))
        );
        return sub && sub.score !== undefined ? `${sub.score}/${asg.maxPoints || 100}` : '—';
      });

      return [
        `"${s.name}"`,
        `"${statusLabel}"`,
        `"${s.dropoutReason || ''}"`,
        ...quizScores.map((score) => `"${score}"`),
        ...assignmentScores.map((score) => `"${score}"`),
        `"${m?.earnedPoints ?? 0}"`,
        `"${curriculumTotalPoints}"`,
        `"${m?.quizAvg !== null ? `${m?.quizAvg}%` : 'N/A'}"`,
        `"${m?.overallFromStartToFinish !== null ? `${m?.overallFromStartToFinish}%` : 'N/A'}"`,
        `"${m?.gradeLetter ?? 'N/A'}"`,
        `"${m?.rubricAssignment ?? 85}%"`,
        `"${m?.compositeFinal ?? 0}%"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HTEIM_Curriculum_Score_Matrix_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 1. Header Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Exam, Quiz & Written Assignment Score Matrix
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live multi-column grade sheet tracking all 16 curriculum lessons & assignments from start to finish
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
          {onSyncGoogleSheets && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSyncGoogleSheets}
              disabled={isLoadingSheets}
              className="text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSheets ? 'animate-spin' : ''}`} />
              {isLoadingSheets ? 'Syncing...' : 'Sync Quizzes'}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportMatrixCsv}
            className="text-xs flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export Matrix (.csv)
          </Button>
        </div>
      </div>

      {/* 2. Top Analytics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Candidates</p>
          <p className="text-xl sm:text-2xl font-black font-mono mt-1 text-slate-900 dark:text-white">
            {activeCount} <span className="text-xs font-normal text-slate-400">/ {students.length}</span>
          </p>
          <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5 truncate">
            {totalEvaluated} Quiz Submissions Logged
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Class Quiz Average</p>
          <p className="text-xl sm:text-2xl font-black font-mono mt-1 text-indigo-600 dark:text-indigo-400">
            {classAvg}%
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5 truncate">Academic Exam Mean</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">High Distinction (≥85%)</p>
          <p className="text-xl sm:text-2xl font-black font-mono mt-1 text-amber-600 dark:text-amber-400">
            {honorCount}
          </p>
          <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold mt-0.5 truncate">
            {passedCount} Passing (≥75%)
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">At-Risk (&lt;75%)</p>
          <p className="text-xl sm:text-2xl font-black font-mono mt-1 text-rose-600 dark:text-rose-400">
            {atRiskCount}
          </p>
          <p className="text-[10px] text-rose-700 dark:text-rose-400 font-medium mt-0.5 truncate">
            Academic / Attendance Flags
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Dropped Out / Withdrawn</p>
          <p className="text-xl sm:text-2xl font-black font-mono mt-1 text-slate-500 dark:text-slate-400">
            {droppedOutCount}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">
            Status Indicated on Scores
          </p>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search candidate in score matrix..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-sky-500"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterMode === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All ({students.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('active')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterMode === 'active'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('dropped_out')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterMode === 'dropped_out'
                ? 'bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Dropped Out ({droppedOutCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('honor')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterMode === 'honor'
                ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Honor (≥85%)
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('passed')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterMode === 'passed'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Passed ({passedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('at-risk')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterMode === 'at-risk'
                ? 'bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            At-Risk (&lt;75%)
          </button>
        </div>
      </div>

      {/* 4. Full Score Matrix Table from Start to Finish */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs overflow-hidden">
        {/* Mobile Swipe Hint */}
        <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 sm:hidden flex items-center justify-between">
          <span className="font-bold text-amber-600 dark:text-amber-400">← Swipe table horizontally to see all 16 lessons from start to finish →</span>
          <span>{displayedStudents.length} Students</span>
        </div>

        <div className="overflow-x-auto overflow-y-auto max-h-[640px] relative overscroll-x-contain">
          <table className="w-full text-left border-separate border-spacing-0 text-xs min-w-[1500px]">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider">
                {/* Column 1: Student Name (Sticky on Left) */}
                <th className="p-3 pl-3 sm:pl-4 min-w-[170px] sm:min-w-[210px] sticky top-0 left-0 z-30 bg-slate-100 dark:bg-slate-800 border-b border-r border-slate-200 dark:border-slate-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.12)]">
                  <button
                    type="button"
                    onClick={() => setSortOrder((prev) => (prev === 'name_asc' ? 'name_desc' : 'name_asc'))}
                    className="flex items-center gap-1.5 truncate cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase font-bold text-[10px] tracking-wider"
                    title="Toggle Student Alphabetical Sorting"
                  >
                    <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>Student Candidate</span>
                    {sortOrder === 'name_asc' ? (
                      <ArrowUp className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    ) : sortOrder === 'name_desc' ? (
                      <ArrowDown className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    ) : null}
                  </button>
                </th>

                {/* 16 Google Sheet Quizzes Columns from Start to Finish */}
                {sanitizedQuizSheets.map((qs, qIdx) => {
                  const maxPts = getLessonMaxPoints(qs);
                  let shortName = qs
                    .replace(/School of the Pastors\s*/i, 'Pastors ')
                    .replace(/Ministerial Ethics\s*/i, 'Ethics ')
                    .replace(/Evangelism\s*/i, 'Evang ')
                    .replace(/Apostolic\s*/i, 'Apost ');
                  if (shortName.toLowerCase().includes('introduction')) {
                    shortName = 'Intro (L1)';
                  }

                  return (
                    <th
                      key={`qs-head-${qs}-${qIdx}`}
                      className="p-2.5 text-center min-w-[95px] max-w-[115px] sticky top-0 z-20 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[10px]"
                      title={`${qs} (Max: ${maxPts} pts)`}
                    >
                      <div className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-400 mb-0.5">
                        {maxPts} pts
                      </div>
                      <div className="truncate font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                        {shortName}
                      </div>
                    </th>
                  );
                })}

                {/* Custom Assignments Columns */}
                {assignments.map((asg) => (
                  <th
                    key={`asg-head-${asg.id}`}
                    className="p-2.5 text-center min-w-[110px] max-w-[130px] sticky top-0 z-20 bg-indigo-50/70 dark:bg-indigo-950/70 border-b border-slate-200 dark:border-slate-700 text-indigo-950 dark:text-indigo-200 text-[10px]"
                    title={`${asg.title} (${asg.maxPoints || 100} pts)`}
                  >
                    <div className="text-[9px] uppercase font-bold text-indigo-500 dark:text-indigo-400 mb-0.5">
                      {asg.maxPoints || 100} pts · Asg
                    </div>
                    <div className="truncate font-bold text-[11px]">
                      {asg.title}
                    </div>
                  </th>
                ))}

                {/* Total Points Earned Column */}
                <th className="p-3 text-center min-w-[100px] sticky top-0 z-20 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[10px] text-slate-700 dark:text-slate-300">
                  <div className="text-[9px] uppercase font-bold text-slate-400 mb-0.5">Points</div>
                  <div className="font-black text-[11px]">Earned/Max</div>
                </th>

                {/* Quiz Average % (Strictly based on quizzes evaluated) */}
                <th className="p-3 text-center min-w-[105px] sticky top-0 z-20 bg-indigo-50 dark:bg-indigo-950/80 border-b border-indigo-200 dark:border-indigo-800 text-[10px] text-indigo-900 dark:text-indigo-200">
                  <button
                    type="button"
                    onClick={() => setSortOrder((prev) => (prev === 'score_desc' ? 'score_asc' : 'score_desc'))}
                    className="flex items-center justify-center gap-1 mx-auto cursor-pointer hover:text-indigo-600 font-bold"
                    title="Sort by Quiz Average %"
                  >
                    <span>Quiz Avg %</span>
                    {sortOrder === 'score_desc' ? (
                      <ArrowDown className="w-3 h-3 text-indigo-600" />
                    ) : sortOrder === 'score_asc' ? (
                      <ArrowUp className="w-3 h-3 text-indigo-600" />
                    ) : (
                      <Trophy className="w-3 h-3 text-amber-500" />
                    )}
                  </button>
                </th>

                {/* Overall Score From Start to Finish % */}
                <th className="p-3 text-center min-w-[110px] sticky top-0 z-20 bg-blue-50/80 dark:bg-blue-950/60 border-b border-blue-200 dark:border-blue-800 text-[10px] text-blue-900 dark:text-blue-200">
                  <div className="text-[9px] uppercase font-bold text-blue-500 mb-0.5">Curriculum</div>
                  <div className="font-bold text-[11px]">Start-to-Finish %</div>
                </th>

                {/* Letter Grade */}
                <th className="p-3 text-center min-w-[70px] sticky top-0 z-20 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[10px] text-slate-700 dark:text-slate-300">
                  <div className="font-bold text-[11px]">Grade</div>
                </th>

                {/* Written Rubric % (Interactive) */}
                <th className="p-3 text-center min-w-[95px] sticky top-0 z-20 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[10px] text-slate-700 dark:text-slate-300">
                  <div className="text-[9px] uppercase font-bold text-slate-400 mb-0.5">Rubric</div>
                  <div className="font-bold text-[11px]">Written %</div>
                </th>

                {/* Composite Final Grade % */}
                <th className="p-3 text-center min-w-[100px] sticky top-0 z-20 bg-indigo-100/70 dark:bg-indigo-900/40 border-b border-indigo-200 dark:border-indigo-700 text-[10px] text-indigo-950 dark:text-indigo-200">
                  <div className="text-[9px] uppercase font-bold text-indigo-600 dark:text-indigo-400 mb-0.5">Overall</div>
                  <div className="font-black text-[11px]">Composite %</div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayedStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={sanitizedQuizSheets.length + assignments.length + 7}
                    className="p-8 text-center text-slate-400 font-medium"
                  >
                    No matching student score records found.
                  </td>
                </tr>
              ) : (
                displayedStudents.map((s, sIdx) => {
                  const studentKey = (s?.name || '').toLowerCase().trim();
                  const m = studentMetricsMap.get(studentKey);
                  const isHonor = (m?.quizAvg ?? 0) >= 85;
                  const isPassing = (m?.quizAvg ?? 0) >= 75;
                  const isDropped = s.isDroppedOut || s.enrollmentStatus === 'dropped_out' || s.enrollmentStatus === 'withdrawn';

                  return (
                    <tr
                      key={s.id ? `matrix-std-${s.id}-${sIdx}` : `matrix-std-${sIdx}`}
                      className={`group transition-colors ${
                        isDropped
                          ? 'bg-rose-50/20 dark:bg-rose-950/10 hover:bg-rose-50/40 dark:hover:bg-rose-950/20 opacity-80'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Sticky Student Name with Status Indicator */}
                      <td className="p-3 pl-3 sm:pl-4 font-bold text-slate-900 dark:text-white sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/80 border-b border-r border-slate-200 dark:border-slate-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.12)] transition-colors min-w-[170px] sm:min-w-[210px]">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="truncate font-bold text-xs" title={s.name}>
                              {s.name}
                            </span>
                          </div>
                          {isDropped && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <span
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[9px] font-bold rounded-sm bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300"
                                title={s.dropoutReason ? `Dropout reason: ${s.dropoutReason}` : 'Student has dropped out'}
                              >
                                🔴 {s.enrollmentStatus === 'withdrawn' ? 'Withdrawn' : 'Dropped Out'}
                              </span>
                              {s.dropoutReason && (
                                <span className="text-[9px] text-slate-400 truncate max-w-[80px]" title={s.dropoutReason}>
                                  ({s.dropoutReason})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Google Sheets Quizzes Scores from Start to Finish */}
                      {sanitizedQuizSheets.map((qs, qIdx) => {
                        const { displayScore, hasScore, numericPct } = getQuizScoreForStudent(
                          s as any,
                          qs,
                          records,
                          effectiveClassDays
                        );
                        const isHigh = numericPct !== null && numericPct >= 85;
                        const isLow = numericPct !== null && numericPct < 75;

                        return (
                          <td
                            key={`qs-cell-${qs}-${s.name}-${qIdx}`}
                            className={`p-2.5 text-center font-mono font-bold border-b border-slate-200 dark:border-slate-800 transition-colors ${
                              hasScore
                                ? isHigh
                                  ? 'text-emerald-800 dark:text-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20'
                                  : isLow
                                  ? 'text-rose-800 dark:text-rose-300 bg-rose-50/40 dark:bg-rose-950/20'
                                  : 'text-indigo-900 dark:text-indigo-200 bg-indigo-50/40 dark:bg-indigo-950/20'
                                : 'text-slate-300 dark:text-slate-600 font-normal'
                            }`}
                          >
                            {displayScore}
                          </td>
                        );
                      })}

                      {/* Custom Assignments Scores */}
                      {assignments.map((asg, aIdx) => {
                        const sub = submissions.find(
                          (subItem) =>
                            subItem.assignmentId === asg.id &&
                            ((subItem?.studentName || '').toLowerCase().trim() === studentKey ||
                              studentKey.includes((subItem?.studentName || '').toLowerCase().trim()))
                        );
                        const hasScore = sub && sub.score !== undefined;
                        const scoreDisplay = hasScore
                          ? `${sub.score}/${asg.maxPoints || 100}`
                          : sub?.status === 'Submitted'
                          ? 'Submitted'
                          : '—';

                        return (
                          <td
                            key={`asg-cell-${asg.id}-${sIdx}-${aIdx}`}
                            className={`p-3 text-center font-mono border-b border-slate-200 dark:border-slate-800 ${
                              hasScore
                                ? 'text-indigo-700 dark:text-indigo-300 font-bold bg-indigo-50/30 dark:bg-indigo-950/20'
                                : 'text-slate-400'
                            }`}
                          >
                            {scoreDisplay}
                          </td>
                        );
                      })}

                      {/* Total Points Earned */}
                      <td className="p-3 text-center font-mono font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                        {m && m.quizzesCompleted > 0 ? `${m.earnedPoints}/${m.possiblePoints}` : '—'}
                      </td>

                      {/* Quiz Average % (Strictly based on quizzes) */}
                      <td className="p-3 text-center font-mono font-black border-b border-slate-200 dark:border-slate-800">
                        {m?.quizAvg !== null ? (
                          <span className={isHonor ? 'text-amber-600 dark:text-amber-400' : isPassing ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                            {m?.quizAvg}%
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">N/A</span>
                        )}
                      </td>

                      {/* Overall Score from Start to Finish % */}
                      <td className="p-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 bg-blue-50/20 dark:bg-blue-950/10">
                        {m?.overallFromStartToFinish !== null ? (
                          <span className="text-blue-700 dark:text-blue-400 font-bold">
                            {m?.overallFromStartToFinish}%
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">0%</span>
                        )}
                      </td>

                      {/* Letter Grade */}
                      <td className="p-3 text-center border-b border-slate-200 dark:border-slate-800">
                        <span
                          className={`px-2 py-0.5 rounded font-mono font-black text-[11px] ${
                            m?.gradeLetter === 'A+' || m?.gradeLetter === 'A'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                              : m?.gradeLetter === 'B'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                              : m?.gradeLetter === 'C'
                              ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                          }`}
                        >
                          {m?.gradeLetter || 'N/A'}
                        </span>
                      </td>

                      {/* Written Rubric % (Interactive) */}
                      <td className="p-3 text-center font-mono border-b border-slate-200 dark:border-slate-800">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={m?.rubricAssignment ?? 85}
                          onChange={(e) =>
                            onUpdateRubric?.(studentKey, 'assignment', parseInt(e.target.value, 10) || 0)
                          }
                          className="w-12 py-0.5 px-1 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-bold text-xs text-slate-900 dark:text-white"
                        />
                        <span className="text-slate-400 ml-1 text-xs">%</span>
                      </td>

                      {/* Composite Final Grade % */}
                      <td
                        className={`p-3 text-center font-mono font-black border-b border-slate-200 dark:border-slate-800 ${
                          (m?.compositeFinal ?? 0) >= 85
                            ? 'text-amber-700 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/20'
                            : (m?.compositeFinal ?? 0) < 75
                            ? 'text-rose-700 dark:text-rose-300 bg-rose-50/50 dark:bg-rose-950/20'
                            : 'text-indigo-900 dark:text-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/20'
                        }`}
                      >
                        {m?.compositeFinal || 0}%
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
