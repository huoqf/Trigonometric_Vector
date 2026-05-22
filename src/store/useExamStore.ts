/**
 * @file src/store/useExamStore.ts
 * @description 题库做题会话 Zustand Store
 */
import { create } from 'zustand';
import type { ExamSession, QuestionRecord } from '@/types/exam';
import { QUESTION_BANK } from '@/features/exam_training/questionBank';

interface ExamActions {
  /** 开始一次练习（按标签筛选，传空数组代表全题库） */
  startSession(tagFilter?: string[]): void;
  /** 提交当前题目答案 */
  submitAnswer(answer: 'A' | 'B' | 'C' | 'D'): void;
  /** 跳到下一题 */
  nextQuestion(): void;
  /** 跳到上一题 */
  prevQuestion(): void;
  /** 使用一个提示级别 */
  useHint(): void;
  /** 查看解析 */
  viewExplanation(): void;
  /** 重置会话 */
  resetSession(): void;
}

type ExamStore = ExamSession & ExamActions;

const EMPTY_SESSION: ExamSession = {
  questionIds: [],
  currentIndex: 0,
  records: {},
  isFinished: false,
};

export const useExamStore = create<ExamStore>((set, get) => ({
  ...EMPTY_SESSION,

  startSession(tagFilter = []) {
    const filtered =
      tagFilter.length === 0
        ? QUESTION_BANK
        : QUESTION_BANK.filter((q) =>
            q.tags.some((t) => tagFilter.includes(t)),
          );

    const ids = filtered.map((q) => q.id);
    const records: Record<string, QuestionRecord> = {};
    ids.forEach((id) => {
      records[id] = {
        questionId: id,
        userAnswer: null,
        isCorrect: null,
        hintsUsed: 0,
        explanationViewed: false,
      };
    });

    set({ questionIds: ids, currentIndex: 0, records, isFinished: false });
  },

  submitAnswer(answer) {
    const { questionIds, currentIndex, records } = get();
    const qid = questionIds[currentIndex];
    if (!qid) return;
    const question = QUESTION_BANK.find((q) => q.id === qid);
    if (!question) return;
    const isCorrect = question.answer === answer;
    set({
      records: {
        ...records,
        [qid]: { ...records[qid], userAnswer: answer, isCorrect },
      },
    });
  },

  nextQuestion() {
    const { currentIndex, questionIds } = get();
    if (currentIndex < questionIds.length - 1) {
      set({ currentIndex: currentIndex + 1 });
    } else {
      set({ isFinished: true });
    }
  },

  prevQuestion() {
    const { currentIndex } = get();
    if (currentIndex > 0) set({ currentIndex: currentIndex - 1 });
  },

  useHint() {
    const { questionIds, currentIndex, records } = get();
    const qid = questionIds[currentIndex];
    if (!qid) return;
    const question = QUESTION_BANK.find((q) => q.id === qid);
    if (!question) return;
    const rec = records[qid];
    if (rec.hintsUsed < question.hints.length) {
      set({
        records: {
          ...records,
          [qid]: { ...rec, hintsUsed: rec.hintsUsed + 1 },
        },
      });
    }
  },

  viewExplanation() {
    const { questionIds, currentIndex, records } = get();
    const qid = questionIds[currentIndex];
    if (!qid) return;
    set({
      records: {
        ...records,
        [qid]: { ...records[qid], explanationViewed: true },
      },
    });
  },

  resetSession() {
    set(EMPTY_SESSION);
  },
}));
