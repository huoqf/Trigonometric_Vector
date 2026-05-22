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
  /** 开启错题复盘会话 */
  startReviewSession(): void;
  /** 手动在错题本中添加/移出某道题 */
  toggleWrongQuestion(qid: string): void;
  /** 一键清空所有错题 */
  clearWrongQuestions(): void;
}

type ExamStore = ExamSession & {
  wrongQuestionIds: string[];
} & ExamActions;

const LOCAL_STORAGE_KEY = 'mathvision_wrong_questions';

function loadWrongQuestions(): string[] {
  try {
    const val = localStorage.getItem(LOCAL_STORAGE_KEY);
    return val ? JSON.parse(val) : [];
  } catch {
    return [];
  }
}

function saveWrongQuestions(ids: string[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(ids));
  } catch (err) {
    console.error('Failed to save wrong questions:', err);
  }
}

const EMPTY_SESSION: ExamSession = {
  questionIds: [],
  currentIndex: 0,
  records: {},
  isFinished: false,
  mode: 'normal',
};

export const useExamStore = create<ExamStore>((set, get) => ({
  ...EMPTY_SESSION,
  wrongQuestionIds: loadWrongQuestions(),

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

    set({ questionIds: ids, currentIndex: 0, records, isFinished: false, mode: 'normal' });
  },

  submitAnswer(answer) {
    const { questionIds, currentIndex, records, wrongQuestionIds, mode } = get();
    const qid = questionIds[currentIndex];
    if (!qid) return;
    const question = QUESTION_BANK.find((q) => q.id === qid);
    if (!question) return;
    const isCorrect = question.answer === answer;
    
    // 更新作答记录
    const updatedRecords = {
      ...records,
      [qid]: { ...records[qid], userAnswer: answer, isCorrect },
    };

    // 错题库处理逻辑
    let updatedWrongs = [...wrongQuestionIds];
    if (!isCorrect) {
      if (!updatedWrongs.includes(qid)) {
        updatedWrongs.push(qid);
        saveWrongQuestions(updatedWrongs);
      }
    } else if (mode === 'review') {
      // 在复盘模式下，答对会自动移出
      updatedWrongs = updatedWrongs.filter((id) => id !== qid);
      saveWrongQuestions(updatedWrongs);
    }

    set({
      records: updatedRecords,
      wrongQuestionIds: updatedWrongs,
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

  startReviewSession() {
    const { wrongQuestionIds } = get();
    if (wrongQuestionIds.length === 0) return;

    // 过滤以确保题目在题库中真实存在
    const ids = wrongQuestionIds.filter((id) =>
      QUESTION_BANK.some((q) => q.id === id),
    );

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

    set({
      questionIds: ids,
      currentIndex: 0,
      records,
      isFinished: false,
      mode: 'review',
    });
  },

  toggleWrongQuestion(qid) {
    const { wrongQuestionIds } = get();
    let updated: string[];
    if (wrongQuestionIds.includes(qid)) {
      updated = wrongQuestionIds.filter((id) => id !== qid);
    } else {
      updated = [...wrongQuestionIds, qid];
    }
    saveWrongQuestions(updated);
    set({ wrongQuestionIds: updated });
  },

  clearWrongQuestions() {
    saveWrongQuestions([]);
    set({ wrongQuestionIds: [] });
  },

  resetSession() {
    set(EMPTY_SESSION);
  },
}));
