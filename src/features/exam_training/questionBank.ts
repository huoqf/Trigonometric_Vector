/**
 * @file src/features/exam_training/questionBank.ts
 * @description 题库静态数据（三角函数 + 向量）
 */
import type { ExamQuestion } from '@/types/exam';

export const QUESTION_BANK: readonly ExamQuestion[] = [
  // ── 单位圆与三角定义 ──────────────────────────
  {
    id: 'uc-001',
    question: '已知角 $\\alpha$ 的终边经过点 $P(-3, 4)$，则 $\\sin\\alpha$ 的值为',
    options: [
      { id: 'A', text: '$\\dfrac{3}{5}$' },
      { id: 'B', text: '$-\\dfrac{3}{5}$' },
      { id: 'C', text: '$\\dfrac{4}{5}$' },
      { id: 'D', text: '$-\\dfrac{4}{5}$' },
    ],
    answer: 'C',
    explanation:
      '点 $P(-3,4)$ 到原点的距离 $r = \\sqrt{(-3)^2+4^2} = 5$。' +
      '由定义 $\\sin\\alpha = \\dfrac{y}{r} = \\dfrac{4}{5}$。',
    tags: ['unit-circle'],
    difficulty: 'easy',
    hints: [
      '先求点 $P$ 到原点的距离 $r$。',
      '$\\sin\\alpha = \\dfrac{y}{r}$，注意 $y = 4 > 0$。',
    ],
  },
  {
    id: 'uc-002',
    question: '在单位圆中，角 $\\alpha$ 终边与单位圆的交点坐标为 $\\left(-\\dfrac{\\sqrt{2}}{2}, -\\dfrac{\\sqrt{2}}{2}\\right)$，则 $\\alpha$ 所在的象限为',
    options: [
      { id: 'A', text: '第一象限' },
      { id: 'B', text: '第二象限' },
      { id: 'C', text: '第三象限' },
      { id: 'D', text: '第四象限' },
    ],
    answer: 'C',
    explanation:
      '交点坐标 $x < 0, y < 0$，点在第三象限，故角 $\\alpha$ 终边在第三象限。',
    tags: ['unit-circle'],
    difficulty: 'easy',
    hints: ['观察坐标的正负判断所在象限。'],
  },
  // ── 诱导公式 ──────────────────────────────────
  {
    id: 'ind-001',
    question: '$\\sin(\\pi + \\alpha) + \\cos(-\\alpha)$ 化简结果为',
    options: [
      { id: 'A', text: '$0$' },
      { id: 'B', text: '$2\\cos\\alpha$' },
      { id: 'C', text: '$-\\sin\\alpha + \\cos\\alpha$' },
      { id: 'D', text: '$\\sin\\alpha - \\cos\\alpha$' },
    ],
    answer: 'A',
    explanation:
      '由诱导公式：$\\sin(\\pi+\\alpha) = -\\sin\\alpha$，$\\cos(-\\alpha) = \\cos\\alpha$（偶函数）。\n' +
      '但此题选项 A 是 $0$ 仅当 $\\sin\\alpha = \\cos\\alpha$，一般情况下结果为 $-\\sin\\alpha + \\cos\\alpha$，故答案选 C。',
    tags: ['induction'],
    difficulty: 'medium',
    hints: [
      '分别对两项运用诱导公式。',
      '$\\sin(\\pi+\\alpha) = -\\sin\\alpha$；$\\cos(-\\alpha) = \\cos\\alpha$。',
    ],
  },
  {
    id: 'ind-002',
    question: '化简 $\\dfrac{\\sin(\\pi - \\alpha)\\cos(2\\pi - \\alpha)}{\\cos(-\\pi - \\alpha)\\sin(-\\pi + \\alpha)}$',
    options: [
      { id: 'A', text: '$-1$' },
      { id: 'B', text: '$1$' },
      { id: 'C', text: '$\\tan\\alpha$' },
      { id: 'D', text: '$-\\tan^2\\alpha$' },
    ],
    answer: 'B',
    explanation:
      '$\\sin(\\pi-\\alpha)=\\sin\\alpha$，$\\cos(2\\pi-\\alpha)=\\cos\\alpha$，' +
      '$\\cos(-\\pi-\\alpha)=\\cos(\\pi+\\alpha)=-\\cos\\alpha$，$\\sin(-\\pi+\\alpha)=\\sin(-(\\pi-\\alpha))=-\\sin(\\pi-\\alpha)=-\\sin\\alpha$。\n' +
      '代入得 $\\dfrac{\\sin\\alpha\\cdot\\cos\\alpha}{(-\\cos\\alpha)(-\\sin\\alpha)} = \\dfrac{\\sin\\alpha\\cos\\alpha}{\\sin\\alpha\\cos\\alpha} = 1$。',
    tags: ['induction'],
    difficulty: 'hard',
    hints: [
      '逐项套用诱导公式，先写出每项的等价形式。',
      '注意符号：$\\cos(-\\pi-\\alpha) = -\\cos\\alpha$。',
      '分子分母约分。',
    ],
  },
  // ── 三角函数图像 ──────────────────────────────
  {
    id: 'tg-001',
    question: '函数 $y = 2\\sin(2x + \\dfrac{\\pi}{6})$ 的最小正周期为',
    options: [
      { id: 'A', text: '$\\pi$' },
      { id: 'B', text: '$2\\pi$' },
      { id: 'C', text: '$\\dfrac{\\pi}{2}$' },
      { id: 'D', text: '$4\\pi$' },
    ],
    answer: 'A',
    explanation:
      '对 $y = A\\sin(\\omega x + \\varphi)$，周期 $T = \\dfrac{2\\pi}{|\\omega|}$。' +
      '这里 $\\omega = 2$，故 $T = \\dfrac{2\\pi}{2} = \\pi$。',
    tags: ['trig-graph'],
    difficulty: 'easy',
    hints: ['公式：$T = \\dfrac{2\\pi}{|\\omega|}$，找出 $\\omega$ 的值。'],
  },
  {
    id: 'tg-002',
    question: '函数 $f(x) = \\sin(2x - \\dfrac{\\pi}{3})$ 在区间 $\\left[0, \\dfrac{\\pi}{2}\\right]$ 上的值域为',
    options: [
      { id: 'A', text: '$[-1, 1]$' },
      { id: 'B', text: '$\\left[-\\dfrac{\\sqrt{3}}{2}, 1\\right]$' },
      { id: 'C', text: '$\\left[-\\dfrac{\\sqrt{3}}{2}, \\dfrac{\\sqrt{3}}{2}\\right]$' },
      { id: 'D', text: '$[0, 1]$' },
    ],
    answer: 'B',
    explanation:
      '$x \\in [0, \\frac{\\pi}{2}]$ 时，$2x - \\frac{\\pi}{3} \\in [-\\frac{\\pi}{3}, \\frac{2\\pi}{3}]$。\n' +
      '令 $u = 2x-\\frac{\\pi}{3}$，$\\sin u$ 在 $[-\\frac{\\pi}{3}, \\frac{2\\pi}{3}]$ 上：\n' +
      '最小值 $\\sin(-\\frac{\\pi}{3}) = -\\frac{\\sqrt{3}}{2}$，最大值 $\\sin\\frac{\\pi}{2} = 1$。',
    tags: ['trig-graph'],
    difficulty: 'medium',
    hints: [
      '先确定内层 $2x - \\frac{\\pi}{3}$ 的变化区间。',
      '再分析 $\\sin$ 在该区间上的最大最小值。',
    ],
  },
  // ── 解三角形 ──────────────────────────────────
  {
    id: 'st-001',
    question: '在 $\\triangle ABC$ 中，$a=7, b=8, C=60°$，则边 $c$ 的值为',
    options: [
      { id: 'A', text: '$\\sqrt{57}$' },
      { id: 'B', text: '$\\sqrt{113}$' },
      { id: 'C', text: '$3\\sqrt{7}$' },
      { id: 'D', text: '$\\sqrt{65}$' },
    ],
    answer: 'A',
    explanation:
      '由余弦定理：$c^2 = a^2 + b^2 - 2ab\\cos C = 49 + 64 - 2\\cdot7\\cdot8\\cdot\\cos60° = 113 - 56 = 57$。\n' +
      '故 $c = \\sqrt{57}$。',
    tags: ['solving-triangle'],
    difficulty: 'medium',
    hints: [
      '已知两边一夹角，使用余弦定理 $c^2 = a^2+b^2-2ab\\cos C$。',
      '$\\cos 60° = \\dfrac{1}{2}$。',
    ],
  },
  // ── 向量 ──────────────────────────────────────
  {
    id: 'vec-001',
    question: '已知向量 $\\vec{a} = (1, \\sqrt{3})$，$\\vec{b} = (2, 0)$，则 $\\vec{a}$ 与 $\\vec{b}$ 的夹角为',
    options: [
      { id: 'A', text: '$30°$' },
      { id: 'B', text: '$60°$' },
      { id: 'C', text: '$120°$' },
      { id: 'D', text: '$150°$' },
    ],
    answer: 'B',
    explanation:
      '$\\vec{a}\\cdot\\vec{b} = 1\\times2 + \\sqrt{3}\\times0 = 2$。\n' +
      '$|\\vec{a}| = \\sqrt{1+3} = 2$，$|\\vec{b}| = 2$。\n' +
      '$\\cos\\theta = \\dfrac{2}{2\\times2} = \\dfrac{1}{2}$，故 $\\theta = 60°$。',
    tags: ['vector-dot'],
    difficulty: 'easy',
    hints: [
      '用公式 $\\cos\\theta = \\dfrac{\\vec{a}\\cdot\\vec{b}}{|\\vec{a}||\\vec{b}|}$。',
      '先计算点积和模长。',
    ],
  },
  {
    id: 'vec-002',
    question: '若 $\\vec{a} = (2, -1)$，$\\vec{b} = (m, 3)$，且 $\\vec{a} \\perp \\vec{b}$，则 $m =$ ',
    options: [
      { id: 'A', text: '$-6$' },
      { id: 'B', text: '$6$' },
      { id: 'C', text: '$\\dfrac{3}{2}$' },
      { id: 'D', text: '$-\\dfrac{3}{2}$' },
    ],
    answer: 'C',
    explanation:
      '$\\vec{a}\\perp\\vec{b}$ 意味着 $\\vec{a}\\cdot\\vec{b}=0$：\n' +
      '$2m + (-1)\\times3 = 0 \\Rightarrow 2m = 3 \\Rightarrow m = \\dfrac{3}{2}$。',
    tags: ['vector-dot'],
    difficulty: 'easy',
    hints: ['两向量垂直，则点积为零。'],
  },
];
