/**
 * @file src/types/exam.ts
 * @description 题库系统核心类型定义
 *
 * 设计原则：
 *   - 题目数据为只读静态数据，不混入动态做题状态
 *   - 做题状态单独建模（ExamSession）
 *   - 支持单选题（后续可扩展填空/简答）
 *   - 知识点标签为枚举，便于筛选与统计
 */

// ─────────────────────────────────────────────
// § 知识点标签枚举
// ─────────────────────────────────────────────

export type KnowledgeTag =
  | 'unit-circle'       // 单位圆与三角定义
  | 'induction'         // 诱导公式
  | 'trig-graph'        // 三角函数图像与变换
  | 'auxiliary-angle'   // 辅助角公式
  | 'solving-triangle'  // 解三角形
  | 'vector-basic'      // 向量基础
  | 'vector-dot'        // 向量点积与投影
  | 'benz-theorem';     // 奔驰定理

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

// ─────────────────────────────────────────────
// § 题目数据结构（静态只读）
// ─────────────────────────────────────────────

/** 单个选项 */
export interface ExamOption {
  readonly id: 'A' | 'B' | 'C' | 'D';
  /** 选项文本（支持 LaTeX，使用 $...$ 包裹） */
  readonly text: string;
}

/** 一道选择题的完整定义 */
export interface ExamQuestion {
  readonly id: string;
  /** 题目正文（支持 LaTeX） */
  readonly question: string;
  readonly options: readonly ExamOption[];
  /** 正确答案的选项 id */
  readonly answer: 'A' | 'B' | 'C' | 'D';
  /** 解题思路（支持 LaTeX） */
  readonly explanation: string;
  /** 所属知识点标签（可多个） */
  readonly tags: readonly KnowledgeTag[];
  readonly difficulty: DifficultyLevel;
  /** 渐进式提示数组（从模糊到精确） */
  readonly hints: readonly string[];
}

// ─────────────────────────────────────────────
// § 做题会话状态（动态状态，不存入静态数据）
// ─────────────────────────────────────────────

/** 单题作答记录 */
export interface QuestionRecord {
  readonly questionId: string;
  /** 用户选择的答案，null 表示未作答 */
  readonly userAnswer: 'A' | 'B' | 'C' | 'D' | null;
  readonly isCorrect: boolean | null;
  /** 本题已使用的提示级别（0 = 未看提示） */
  readonly hintsUsed: number;
  /** 是否已查看解析 */
  readonly explanationViewed: boolean;
}

/** 当前做题会话的完整状态 */
export interface ExamSession {
  /** 本次练习的题目 id 列表（有序） */
  readonly questionIds: readonly string[];
  /** 当前答题索引 */
  readonly currentIndex: number;
  /** 各题作答记录（key = questionId） */
  readonly records: Readonly<Record<string, QuestionRecord>>;
  /** 是否已完成全部作答 */
  readonly isFinished: boolean;
  /** 练习模式：normal=普通练习，review=错题复盘 */
  readonly mode: 'normal' | 'review';
}
