/**
 * @file src/features/exam_training/ExamTraining.tsx
 * @description 真题训练主界面
 * 布局：左侧知识点筛选 + 右侧答题卡主体（题目 / 选项 / 提示 / 解析）
 */
import { useMemo, useState } from 'react';
import { useExamStore } from '@/store/useExamStore';
import { QUESTION_BANK } from '@/features/exam_training/questionBank';
import type { KnowledgeTag } from '@/types/exam';
import 'katex/dist/katex.min.css';
import katex from 'katex';

// ─── 工具：将含 $...$ 的字符串渲染为含 HTML 的字符串 ───────────────────────
function renderLatex(raw: string): string {
  return raw.replace(/\$([^$]+)\$/g, (_, expr) => {
    try {
      return katex.renderToString(expr, { throwOnError: false });
    } catch {
      return expr;
    }
  });
}

function MathText({ text, className }: { text: string; className?: string }) {
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: renderLatex(text) }}
    />
  );
}

// ─── 知识点标签映射 ─────────────────────────────────────────────────────────
const TAG_LABELS: Record<KnowledgeTag, string> = {
  'unit-circle': '单位圆',
  induction: '诱导公式',
  'trig-graph': '函数图像',
  'auxiliary-angle': '辅助角',
  'solving-triangle': '解三角形',
  'vector-basic': '向量基础',
  'vector-dot': '点积投影',
  'benz-theorem': '奔驰定理',
};

const ALL_TAGS: KnowledgeTag[] = Object.keys(TAG_LABELS) as KnowledgeTag[];

const DIFF_COLOR: Record<string, string> = {
  easy: '#22c55e',
  medium: '#f59e0b',
  hard: '#ef4444',
};
const DIFF_LABEL: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};

// ─── 主组件 ────────────────────────────────────────────────────────────────
export function ExamTraining() {
  const {
    questionIds,
    currentIndex,
    records,
    isFinished,
    mode,
    wrongQuestionIds,
    startSession,
    submitAnswer,
    nextQuestion,
    prevQuestion,
    useHint,
    viewExplanation,
    resetSession,
    startReviewSession,
    toggleWrongQuestion,
    clearWrongQuestions,
  } = useExamStore();

  const [selectedTags, setSelectedTags] = useState<KnowledgeTag[]>([]);

  const currentQId = questionIds[currentIndex];
  const currentQ = useMemo(
    () => QUESTION_BANK.find((q) => q.id === currentQId),
    [currentQId],
  );
  const currentRec = currentQId ? records[currentQId] : undefined;

  const score = useMemo(() => {
    const answered = Object.values(records).filter((r) => r.isCorrect !== null);
    const correct = answered.filter((r) => r.isCorrect).length;
    return { correct, total: answered.length };
  }, [records]);

  const hasStarted = questionIds.length > 0;

  // ── 未开始界面 ────────────────────────────────────────────────────────────
  if (!hasStarted) {
    return (
      <div style={s.wrapper}>
        <div style={s.startCard}>
          <h2 style={s.startTitle}>📝 真题训练</h2>
          <p style={s.startDesc}>选择知识点范围，开始随机练习。留空则训练全部题目。</p>

          <div style={s.tagGrid}>
            {ALL_TAGS.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  style={{ ...s.tagChip, ...(active ? s.tagChipActive : {}) }}
                  onClick={() =>
                    setSelectedTags((prev) =>
                      active ? prev.filter((t) => t !== tag) : [...prev, tag],
                    )
                  }
                >
                  {TAG_LABELS[tag]}
                </button>
              );
            })}
          </div>

          <button
            style={s.startBtn}
            onClick={() => startSession(selectedTags)}
          >
            开始练习 →
          </button>

          {/* 错题本集成面板 */}
          <div style={s.wrongStatsContainer}>
            <div style={s.wrongStatBox}>
              <span style={s.wrongStatTitle}>📚 我的错题本</span>
              <span style={s.wrongStatCount}>
                {wrongQuestionIds.length}{' '}
                <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 'normal' }}>道错题</span>
              </span>
            </div>
            <div style={s.wrongActionRow}>
              <button
                disabled={wrongQuestionIds.length === 0}
                style={{
                  ...s.reviewBtn,
                  ...(wrongQuestionIds.length === 0 ? s.reviewBtnDisabled : {}),
                }}
                onClick={() => startReviewSession()}
              >
                🔥 错题专项复盘
              </button>
              {wrongQuestionIds.length > 0 && (
                <button
                  style={s.clearWrongsBtn}
                  onClick={() => {
                    if (window.confirm('确定要清空错题本吗？此操作不可恢复。')) {
                      clearWrongQuestions();
                    }
                  }}
                >
                  🗑️ 清空错题本
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── 已完成界面 ────────────────────────────────────────────────────────────
  if (isFinished) {
    const total = questionIds.length;
    const pct = total > 0 ? Math.round((score.correct / total) * 100) : 0;

    // 统计本次练习答错的题数
    const sessionWrongsCount = questionIds.filter((id) => {
      const rec = records[id];
      return rec && rec.isCorrect === false;
    }).length;

    return (
      <div style={s.wrapper}>
        <div style={s.resultCard}>
          <div style={s.resultEmoji}>{pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '💪'}</div>
          <h2 style={s.resultTitle}>{mode === 'review' ? '复盘练习完成！' : '练习完成！'}</h2>
          <p style={s.resultScore}>
            {total} 题 · 答对 <span style={{ color: '#6366f1', fontWeight: 700 }}>{score.correct}</span> 题 · 正确率{' '}
            <span style={{ color: pct >= 80 ? '#22c55e' : '#f59e0b', fontWeight: 700 }}>{pct}%</span>
          </p>

          {mode !== 'review' && sessionWrongsCount > 0 && (
            <div style={s.resultWrongNotice}>
              ⚠️ 本次练习有 <span style={{ color: '#ef4444', fontWeight: 700 }}>{sessionWrongsCount}</span> 道题答错，已自动记入错题本。
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            {wrongQuestionIds.length > 0 && (
              <button
                style={{ ...s.startBtn, background: 'linear-gradient(135deg, #b91c1c, #dc2626)' }}
                onClick={() => {
                  startReviewSession();
                }}
              >
                🔥 立即开始错题复盘 ({wrongQuestionIds.length})
              </button>
            )}
            <button
              style={{ ...s.startBtn, backgroundColor: '#1e293b', backgroundImage: 'none', border: '1px solid #334155', color: '#94a3b8' }}
              onClick={resetSession}
            >
              返回主菜单
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── 答题界面 ──────────────────────────────────────────────────────────────
  if (!currentQ || !currentRec) return null;

  const answered = currentRec.userAnswer !== null;
  const showExplanation = currentRec.explanationViewed;

  return (
    <div style={s.wrapper}>
      {/* 进度条 */}
      <div style={s.progressBar}>
        <div
          style={{
            ...s.progressFill,
            width: `${((currentIndex + 1) / questionIds.length) * 100}%`,
          }}
        />
      </div>

      <div style={s.mainLayout}>
        {/* 左侧：题号导航 */}
        <aside style={s.sidebar}>
          <p style={s.sideTitle}>题目列表</p>
          <div style={s.dotGrid}>
            {questionIds.map((id, idx) => {
              const rec = records[id];
              const isActive = idx === currentIndex;
              const dotColor =
                rec.isCorrect === true
                  ? '#22c55e'
                  : rec.isCorrect === false
                    ? '#ef4444'
                    : isActive
                      ? '#6366f1'
                      : '#334155';
              return (
                <button
                  key={id}
                  style={{ ...s.dot, backgroundColor: dotColor }}
                  title={`第 ${idx + 1} 题`}
                  onClick={() => useExamStore.setState({ currentIndex: idx })}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
          <div style={s.scorePill}>
            得分: {score.correct} / {questionIds.length}
          </div>
        </aside>

        {/* 右侧：题目卡片 */}
        <div style={s.card}>
          {/* 题目头部 */}
          <div style={s.qHeader}>
            {mode === 'review' && (
              <span style={s.reviewBadge}>🔥 错题复盘</span>
            )}
            <span style={s.qIndex}>第 {currentIndex + 1} / {questionIds.length} 题</span>
            <span
              style={{
                ...s.diffBadge,
                backgroundColor: DIFF_COLOR[currentQ.difficulty] + '22',
                color: DIFF_COLOR[currentQ.difficulty],
              }}
            >
              {DIFF_LABEL[currentQ.difficulty]}
            </span>
            <div style={s.tagRow}>
              {currentQ.tags.map((t) => (
                <span key={t} style={s.tagMini}>
                  {TAG_LABELS[t as KnowledgeTag]}
                </span>
              ))}
            </div>

            {/* 手动加入/移出错题本按钮 */}
            <button
              onClick={() => toggleWrongQuestion(currentQ.id)}
              style={{
                ...s.favBtn,
                color: wrongQuestionIds.includes(currentQ.id) ? '#fbbf24' : '#64748b',
              }}
              title={wrongQuestionIds.includes(currentQ.id) ? "从错题本移出" : "存入错题本"}
            >
              {wrongQuestionIds.includes(currentQ.id) ? '★ 已记录错题' : '☆ 记录错题'}
            </button>
          </div>

          {/* 题目正文 */}
          <p style={s.qText}>
            <MathText text={currentQ.question} />
          </p>

          {/* 选项 */}
          <div style={s.optionList}>
            {currentQ.options.map((opt) => {
              const isSelected = currentRec.userAnswer === opt.id;
              const isCorrect = currentQ.answer === opt.id;
              let bg = '#1e293b';
              let border = '1px solid #334155';
              if (answered) {
                if (isCorrect) { bg = '#16a34a22'; border = '1px solid #22c55e'; }
                else if (isSelected) { bg = '#dc262622'; border = '1px solid #ef4444'; }
              } else if (isSelected) {
                bg = '#4f46e522'; border = '1px solid #6366f1';
              }
              return (
                <button
                  key={opt.id}
                  disabled={answered}
                  style={{ ...s.optBtn, backgroundColor: bg, border }}
                  onClick={() => submitAnswer(opt.id)}
                >
                  <span style={s.optLabel}>{opt.id}</span>
                  <MathText text={opt.text} />
                </button>
              );
            })}
          </div>

          {/* 渐进式提示面板 */}
          {currentQ.hints.length > 0 && (
            <div style={s.hintPanel}>
              <div style={s.hintPanelHeader}>
                <span style={s.hintPanelTitle}>💡 渐进式解题提示</span>
                <span style={s.hintPanelCount}>
                  已解锁 {currentRec.hintsUsed} / {currentQ.hints.length}
                </span>
              </div>
              <div style={s.hintList}>
                {currentQ.hints.map((hint, idx) => {
                  const isUnlocked = idx < currentRec.hintsUsed;
                  return (
                    <div
                      key={idx}
                      style={{
                        ...s.hintCard,
                        ...(isUnlocked ? s.hintCardUnlocked : s.hintCardLocked),
                      }}
                    >
                      <div style={s.hintCardHeader}>
                        <span style={s.hintCardLabel}>提示 {idx + 1}</span>
                        <span>{isUnlocked ? '🔓 已解锁' : '🔒 未解锁'}</span>
                      </div>
                      {isUnlocked ? (
                        <p style={s.hintCardText}>
                          <MathText text={hint} />
                        </p>
                      ) : (
                        <p style={s.hintCardTextLocked}>
                          需要提示？请在下方点击“获取提示”解锁
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 解析区 */}
          {showExplanation && (
            <div style={s.explanationBox}>
              <p style={s.explanationTitle}>📖 解题思路</p>
              <MathText text={currentQ.explanation} className={s.explanationText as string} />
            </div>
          )}

          {/* 操作栏 */}
          <div style={s.actionRow}>
            <button style={s.secondaryBtn} onClick={prevQuestion} disabled={currentIndex === 0}>
              ← 上一题
            </button>
            {!answered && currentRec.hintsUsed < currentQ.hints.length && (
              <button style={s.hintBtn} onClick={useHint}>
                💡 获取提示
              </button>
            )}
            {answered && !showExplanation && (
              <button style={s.hintBtn} onClick={viewExplanation}>
                查看解析
              </button>
            )}
            <button style={s.primaryBtn} onClick={nextQuestion}>
              {currentIndex === questionIds.length - 1 ? '完成 ✓' : '下一题 →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 样式 ──────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  wrapper: {
    width: '100%',
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '0 16px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  progressBar: {
    width: '100%',
    height: '4px',
    borderRadius: '2px',
    backgroundColor: '#1e293b',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #6366f1, #a78bfa)',
    transition: 'width 0.4s ease',
    borderRadius: '2px',
  },
  mainLayout: {
    display: 'flex',
    gap: '20px',
    alignItems: 'flex-start',
  },
  sidebar: {
    minWidth: '110px',
    background: '#111827',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid #1e293b',
  },
  sideTitle: { fontSize: '11px', color: '#64748b', marginBottom: '10px', fontWeight: 600 },
  dotGrid: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' },
  dot: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    border: 'none',
    color: '#fff',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  scorePill: {
    fontSize: '11px',
    color: '#94a3b8',
    textAlign: 'center',
    padding: '6px 0',
    borderTop: '1px solid #1e293b',
  },
  card: {
    flex: 1,
    background: '#111827',
    borderRadius: '16px',
    padding: '28px',
    border: '1px solid #1e293b',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  qHeader: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
  qIndex: { fontSize: '12px', color: '#64748b', fontWeight: 600 },
  diffBadge: { fontSize: '11px', padding: '2px 8px', borderRadius: '99px', fontWeight: 700 },
  tagRow: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  tagMini: {
    fontSize: '10px',
    padding: '2px 7px',
    borderRadius: '99px',
    backgroundColor: '#1e293b',
    color: '#94a3b8',
  },
  qText: { fontSize: '17px', lineHeight: '1.8', color: '#f1f5f9', margin: 0 },
  optionList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  optBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px 18px',
    borderRadius: '10px',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: '15px',
    color: '#e2e8f0',
    transition: 'all 0.2s',
  },
  optLabel: {
    minWidth: '24px',
    height: '24px',
    lineHeight: '24px',
    textAlign: 'center',
    borderRadius: '6px',
    backgroundColor: '#0f172a',
    fontSize: '13px',
    fontWeight: 700,
    color: '#a78bfa',
  },
  hintBox: {
    background: '#1e293b',
    borderRadius: '10px',
    padding: '14px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  hintLine: { margin: 0, fontSize: '14px', color: '#94a3b8' },
  explanationBox: {
    background: '#0f2231',
    border: '1px solid #1e4060',
    borderRadius: '10px',
    padding: '16px 20px',
  },
  explanationTitle: { margin: '0 0 8px 0', fontWeight: 700, color: '#38bdf8', fontSize: '14px' },
  explanationText: { fontSize: '14px', color: '#cbd5e1', lineHeight: '1.8' },
  actionRow: { display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' },
  primaryBtn: {
    padding: '10px 24px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
    border: 'none',
    color: '#fff',
    fontWeight: 700,
    fontSize: '14px',
    cursor: 'pointer',
  },
  secondaryBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    background: '#1e293b',
    border: '1px solid #334155',
    color: '#94a3b8',
    fontSize: '14px',
    cursor: 'pointer',
    marginRight: 'auto',
  },
  hintBtn: {
    padding: '10px 18px',
    borderRadius: '8px',
    background: '#1e293b',
    border: '1px solid #f59e0b44',
    color: '#f59e0b',
    fontSize: '13px',
    cursor: 'pointer',
  },
  // 开始 / 结果卡片
  startCard: {
    maxWidth: '540px',
    margin: '40px auto',
    background: '#111827',
    borderRadius: '20px',
    padding: '40px',
    border: '1px solid #1e293b',
    textAlign: 'center',
  },
  startTitle: { fontSize: '26px', fontWeight: 800, color: '#f1f5f9', marginBottom: '10px' },
  startDesc: { fontSize: '14px', color: '#64748b', marginBottom: '28px' },
  tagGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    justifyContent: 'center',
    marginBottom: '28px',
  },
  tagChip: {
    padding: '8px 16px',
    borderRadius: '99px',
    background: '#1e293b',
    border: '1px solid #334155',
    color: '#94a3b8',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tagChipActive: {
    background: '#4f46e522',
    border: '1px solid #6366f1',
    color: '#a78bfa',
    fontWeight: 700,
  },
  startBtn: {
    padding: '12px 36px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
    border: 'none',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  resultCard: {
    maxWidth: '420px',
    margin: '60px auto',
    background: '#111827',
    borderRadius: '20px',
    padding: '40px',
    border: '1px solid #1e293b',
    textAlign: 'center',
  },
  resultEmoji: { fontSize: '56px', marginBottom: '16px' },
  resultTitle: { fontSize: '24px', fontWeight: 800, color: '#f1f5f9', margin: '0 0 12px' },
  resultScore: { fontSize: '16px', color: '#94a3b8', marginBottom: '28px' },
  // 错题本相关样式
  wrongStatsContainer: {
    marginTop: '24px',
    padding: '20px',
    background: '#1a1013', // 深红色偏黑背景
    borderRadius: '14px',
    border: '1px solid #7f1d1d33',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    alignItems: 'center',
  },
  wrongStatBox: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    borderBottom: '1px solid #7f1d1d22',
    paddingBottom: '10px',
  },
  wrongStatTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#fca5a5',
  },
  wrongStatCount: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#ef4444',
  },
  wrongActionRow: {
    display: 'flex',
    gap: '10px',
    width: '100%',
  },
  reviewBtn: {
    flex: 1,
    padding: '10px 16px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #b91c1c, #dc2626)',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  reviewBtnDisabled: {
    background: '#1e293b',
    color: '#475569',
    cursor: 'not-allowed',
    border: '1px solid #334155',
  },
  clearWrongsBtn: {
    padding: '10px 14px',
    borderRadius: '8px',
    background: '#1e293b',
    border: '1px solid #ef444433',
    color: '#f87171',
    fontSize: '13px',
    cursor: 'pointer',
  },
  reviewBadge: {
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '99px',
    backgroundColor: '#b91c1c22',
    color: '#f87171',
    fontWeight: 700,
    border: '1px solid #b91c1c44',
  },
  favBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginLeft: 'auto',
    padding: '4px 8px',
    borderRadius: '6px',
    transition: 'all 0.2s',
  },
  hintPanel: {
    background: '#0b0f19',
    borderRadius: '12px',
    padding: '18px',
    border: '1px solid #1e293b',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  hintPanelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #1e293b',
    paddingBottom: '8px',
  },
  hintPanelTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#fbbf24',
  },
  hintPanelCount: {
    fontSize: '12px',
    color: '#64748b',
  },
  hintList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  hintCard: {
    borderRadius: '8px',
    padding: '12px 14px',
    border: '1px solid transparent',
    transition: 'all 0.2s ease',
  },
  hintCardUnlocked: {
    background: '#1e293b55',
    borderColor: '#d9770633',
  },
  hintCardLocked: {
    background: '#0f172a33',
    borderColor: '#33415533',
    borderStyle: 'dashed',
  },
  hintCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
    color: '#64748b',
    marginBottom: '6px',
  },
  hintCardLabel: {
    fontWeight: 700,
    color: '#d97706',
  },
  hintCardText: {
    margin: 0,
    fontSize: '14px',
    color: '#cbd5e1',
    lineHeight: '1.6',
  },
  hintCardTextLocked: {
    margin: 0,
    fontSize: '13px',
    color: '#475569',
    fontStyle: 'italic',
  },
  resultWrongNotice: {
    background: '#7f1d1d22',
    border: '1px solid #b91c1c44',
    borderRadius: '10px',
    padding: '12px',
    fontSize: '14px',
    color: '#fca5a5',
    margin: '10px 0 20px',
    lineHeight: '1.5',
  },
};
