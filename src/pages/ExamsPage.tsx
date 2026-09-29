import React, { Suspense } from 'react';
import { AssessmentsPage } from '../features/assessments';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { DashboardSkeleton } from '../components/DashboardSkeleton';
import { INITIAL_ASSIGNMENTS, INITIAL_SUBMISSIONS } from '../components/ExamsTab';
import { CustomAssignment } from '../types';

export interface ExamsPageProps {
  [key: string]: any;
}

export const ExamsPage: React.FC<ExamsPageProps> = (props) => {
  const appUser = props.appUser || (props.userRole ? {
    id: 'user_active',
    name: props.currentStudentName || 'Hannah Abbott',
    email: 'student@hteim.org',
    role: props.userRole,
    studentName: props.currentStudentName || 'Hannah Abbott',
  } : null);

  const assignments = props.customAssignments && props.customAssignments.length > 0
    ? props.customAssignments
    : INITIAL_ASSIGNMENTS;

  const submissions = props.submissions && props.submissions.length > 0
    ? props.submissions
    : INITIAL_SUBMISSIONS;

  const students = props.students || [];

  const handleGradeSubmission = (submissionId: string, score: number, feedback: string) => {
    if (props.setSubmissions) {
      props.setSubmissions((prev: any[]) => {
        const existingIdx = prev.findIndex((s) => s.id === submissionId);
        if (existingIdx !== -1) {
          return prev.map((sub, idx) =>
            idx === existingIdx
              ? {
                  ...sub,
                  score,
                  teacherFeedback: feedback,
                  status: 'Graded',
                  updatedAt: new Date().toISOString(),
                }
              : sub
          );
        }
        // If new submission record
        return [
          {
            id: submissionId,
            assignmentId: 'asg-general',
            studentName: appUser?.studentName || appUser?.name || 'Student',
            score,
            teacherFeedback: feedback,
            status: 'Graded',
            submittedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          ...prev,
        ];
      });
    }
  };

  const handleSaveAssignment = (newAssignment: CustomAssignment) => {
    if (props.setCustomAssignments) {
      props.setCustomAssignments((prev: CustomAssignment[]) => {
        const existing = prev.findIndex((a) => a.id === newAssignment.id);
        if (existing !== -1) {
          return prev.map((a, idx) => (idx === existing ? newAssignment : a));
        }
        return [newAssignment, ...prev];
      });
    }
  };

  const handleSyncSheets = () => {
    if (props.onLoadSheets) {
      props.onLoadSheets();
    }
  };

  const allQuizSheets = props.allQuizSheets || (props.effectiveClassDays ? props.effectiveClassDays.map((d: any) => d.name || d.id) : []);

  return (
    <Suspense fallback={<DashboardSkeleton label="Loading Examinations & Assessment Hub..." />}>
      <ErrorBoundary label="Exams & Grading Workspace">
        <AssessmentsPage
          appUser={appUser}
          students={students}
          assignments={assignments}
          submissions={submissions}
          allQuizSheets={allQuizSheets}
          records={props.records || []}
          effectiveClassDays={props.effectiveClassDays || props.classDays || []}
          rubricScores={props.rubricScores || {}}
          onUpdateRubric={props.onUpdateRubric}
          onGradeSubmission={handleGradeSubmission}
          onSaveAssignment={handleSaveAssignment}
          onSyncGoogleSheets={handleSyncSheets}
          isLoadingSheets={props.isLoadingSheets}
        />
      </ErrorBoundary>
    </Suspense>
  );
};

export default ExamsPage;
