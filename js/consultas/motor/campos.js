/**
 * Construtores dos campos usados nos modelos de consulta (motor de formulários).
 * T texto · A área de texto · SEG escolha única · CH chips (várias) · TRI presente/ausente · EX exame físico
 * CK frases prontas · GRID grade de valores · G grupo · CALC cálculo · SC escore · PRESC prescrição · RET retorno
 * Também reúne blocos e escalas reaproveitados por vários modelos (alergias, sinais vitais, PHQ, GAD, AUDIT-C, IPSS).
 */
/* construtores de campo */
export const T = (id, l, o = {}) => ({ t: 'text', id, l, ...o }),
  A = (id, l, o = {}) => ({ t: 'area', id, l, ...o });
export const SEG = (id, l, opts, o = {}) => ({ t: 'seg', id, l, opts, ...o }),
  CH = (id, l, opts, o = {}) => ({ t: 'chips', id, l, opts, ...o });
export const TRI = (id, l, opts, o = {}) => ({ t: 'tri', id, l, opts, ...o }),
  EX = (id, l, ins, o = {}) => ({ t: 'exam', id, l, ins, ...o });
export const CK = (id, l, lines, o = {}) => ({ t: 'checks', id, l, lines, ...o }),
  GRID = (id, l, f, o = {}) => ({ t: 'grid', id, l, f, ...o });
export const G = (l, f, o = {}) => ({ t: 'group', l, f, ...o }),
  CALC = (k, o = {}) => ({ t: 'calc', k, ...o });
const SC = (id, l, items, o = {}) => ({ t: 'score', id, l, items, ...o });
export const PRESC = { t: 'presc', id: 'presc' },
  RET = { t: 'ret', id: 'ret' };
export const ALERG = [
  SEG('alerg', 'Alergias', ['Nega alergias', 'Refere alergia']),
  T('alerg_txt', 'Alergia a', { ph: 'medicamento ou substância e reação', out: 'Alergia referida' }),
];
export const stdA = (pre = [], hq = []) => ({
  k: 'A',
  title: 'Avaliação',
  sub: 'Raciocínio clínico e diagnóstico',
  f: [
    ...pre,
    A('aval', 'Avaliação clínica', { out: 'Avaliação' }),
    T('hd', 'Hipótese diagnóstica / CID-10 ou CIAP-2', { out: 'Hipótese diagnóstica', q: hq }),
  ],
});
export const stdP = (pre = []) => ({
  k: 'P',
  title: 'Plano',
  sub: 'Exames, conduta, prescrição, orientações e seguimento',
  f: [
    ...pre,
    A('exsol', 'Exames solicitados'),
    A('conduta', 'Conduta'),
    PRESC,
    A('orient', 'Outras orientações', { out: 'Orientações' }),
    A('alarme_or', 'Sinais de alarme orientados', { ph: 'Ex.: procurar o pronto atendimento se…' }),
    A('enc', 'Encaminhamentos'),
    RET,
  ],
});
export const SV = (extra = [], o = {}) =>
  GRID(
    'sv',
    'Sinais vitais',
    [
      ['pa', 'PA', '120/80', ' mmHg'],
      ['fc', 'FC', '78', ' bpm'],
      ['tax', 'Tax', '36,5', ' °C'],
      ['peso', 'Peso', '70', ' kg'],
      ['alt', 'Altura', '1,65', ' m'],
      ...extra,
    ],
    { imc: true, ...o },
  );
const FREQ = [
  ['Nenhuma vez', 0],
  ['Vários dias', 1],
  ['Mais da metade dos dias', 2],
  ['Quase todos os dias', 3],
];
const PHQ9 = [
  'Pouco interesse ou prazer em fazer as coisas',
  'Sentir-se para baixo, deprimido(a) ou sem perspectiva',
  'Dificuldade para dormir, ou dormir demais',
  'Cansaço ou pouca energia',
  'Pouco apetite ou comer demais',
  'Sentir-se mal consigo mesmo(a), um fracasso ou que decepcionou a família',
  'Dificuldade de concentração',
  'Lentidão para se movimentar ou falar, ou agitação e inquietação',
  'Pensar em se ferir ou que seria melhor estar morto(a)',
];
const GAD7 = [
  'Sentir-se nervoso(a), ansioso(a) ou muito tenso(a)',
  'Não conseguir parar ou controlar as preocupações',
  'Preocupar-se muito com diversas coisas',
  'Dificuldade para relaxar',
  'Ficar tão agitado(a) que é difícil ficar parado(a)',
  'Ficar facilmente aborrecido(a) ou irritado(a)',
  'Sentir medo de que algo terrível vá acontecer',
];
export const SC_PHQ9 = SC(
  'phq9',
  'PHQ-9 · nas últimas 2 semanas',
  PHQ9.map(t => [t, FREQ]),
  {
    name: 'PHQ-9',
    band: p =>
      p < 5
        ? ['sintomas depressivos mínimos', 'k-ok']
        : p < 10
          ? ['sintomas depressivos leves', 'k-ok']
          : p < 15
            ? ['sintomas depressivos moderados', 'k-warn']
            : p < 20
              ? ['sintomas depressivos moderadamente graves', 'k-mid']
              : ['sintomas depressivos graves', 'k-bad'],
    alert: a => (a[8] > 0 ? 'Item 9 positivo: avaliar risco de suicídio agora.' : ''),
  },
);
export const SC_PHQ2 = SC(
  'phq2',
  'PHQ-2 · rastreio de depressão (últimas 2 semanas)',
  PHQ9.slice(0, 2).map(t => [t, FREQ]),
  { name: 'PHQ-2', band: p => (p >= 3 ? ['positivo – aplicar PHQ-9 e avaliar', 'k-warn'] : ['negativo', 'k-ok']) },
);
export const SC_GAD7 = SC(
  'gad7',
  'GAD-7 · nas últimas 2 semanas',
  GAD7.map(t => [t, FREQ]),
  {
    name: 'GAD-7',
    band: p =>
      p < 5
        ? ['ansiedade mínima', 'k-ok']
        : p < 10
          ? ['ansiedade leve', 'k-ok']
          : p < 15
            ? ['ansiedade moderada', 'k-warn']
            : ['ansiedade grave', 'k-bad'],
  },
);
const AUDQ = [
  [
    'Com que frequência consome bebidas alcoólicas?',
    [
      ['Nunca', 0],
      ['Mensalmente ou menos', 1],
      ['2 a 4 vezes por mês', 2],
      ['2 a 3 vezes por semana', 3],
      ['4 ou mais vezes por semana', 4],
    ],
  ],
  [
    'Quantas doses consome em um dia típico?',
    [
      ['1 ou 2', 0],
      ['3 ou 4', 1],
      ['5 ou 6', 2],
      ['7 a 9', 3],
      ['10 ou mais', 4],
    ],
  ],
  [
    'Com que frequência consome 6 ou mais doses em uma ocasião?',
    [
      ['Nunca', 0],
      ['Menos que mensalmente', 1],
      ['Mensalmente', 2],
      ['Semanalmente', 3],
      ['Diariamente ou quase', 4],
    ],
  ],
];
export const SC_AUD = sexo =>
  SC('auditc', 'AUDIT-C · consumo de álcool', AUDQ, {
    name: 'AUDIT-C',
    band: p =>
      sexo === 'M'
        ? p >= 4
          ? ['positivo para uso de risco', 'k-warn']
          : ['negativo', 'k-ok']
        : p >= 4
          ? ['positivo para uso de risco', 'k-warn']
          : p === 3
            ? ['positivo em mulheres; negativo em homens', 'k-warn']
            : ['negativo', 'k-ok'],
    note: 'Positivo: ≥ 4 em homens, ≥ 3 em mulheres. Se positivo, aplicar AUDIT completo.',
  });
const IPS = [
  ['Nunca', 0],
  ['Menos de 1 em 5 vezes', 1],
  ['Menos da metade das vezes', 2],
  ['Cerca da metade', 3],
  ['Mais da metade', 4],
  ['Quase sempre', 5],
];
export const SC_IPSS = SC(
  'ipss',
  'IPSS · último mês',
  [
    ['Sensação de não esvaziar completamente a bexiga', IPS],
    ['Precisar urinar de novo em menos de 2 horas', IPS],
    ['Parar e recomeçar várias vezes ao urinar', IPS],
    ['Dificuldade para segurar a urina', IPS],
    ['Jato urinário fraco', IPS],
    ['Precisar fazer força para começar a urinar', IPS],
    [
      'Quantas vezes levanta à noite para urinar',
      [
        ['Nenhuma', 0],
        ['1', 1],
        ['2', 2],
        ['3', 3],
        ['4', 4],
        ['5 ou mais', 5],
      ],
    ],
  ],
  {
    name: 'IPSS',
    band: p =>
      p <= 7 ? ['sintomas leves', 'k-ok'] : p <= 19 ? ['sintomas moderados', 'k-warn'] : ['sintomas graves', 'k-bad'],
  },
);
export const TR = ['Não reagente', 'Reagente', 'Não realizado'],
  TRI3 = ['Normal', 'Alterado', 'Pendente'];
