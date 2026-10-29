/**
 * Regras da calculadora pediátrica: sinais gerais de perigo (AIDPI), desidratação,
 * marcos do desenvolvimento e vacinas por idade. Funções puras.
 * A avaliação antropométrica (OMS) está em js/regras/crescimento-oms.js.
 */
const ALERTA_SINAIS_DE_PERIGO =
  'Classificar como doença muito grave: estabilizar, tratar antes de referir, e referir urgentemente ao hospital conforme protocolo AIDPI.';

export function avaliarSinaisDePerigo(quantidade) {
  return quantidade > 0
    ? {
        rotulo: `${quantidade} sinal(is) geral(is) de perigo presente(s) — referência URGENTE`,
        cls: 'risk-vhigh',
        alerta: ALERTA_SINAIS_DE_PERIGO,
      }
    : { rotulo: 'Sem sinais gerais de perigo identificados', cls: 'risk-low', alerta: '' };
}

/** Classificação da desidratação (AIDPI) e plano A/B/C. */
export function classificarDesidratacao({ consciencia, olhosFundos, bebeMal, sinalDaPrega, sede, irritado }) {
  if (consciencia || olhosFundos || bebeMal || sinalDaPrega) {
    return {
      rotulo: 'Desidratação grave',
      cls: 'risk-vhigh',
      plano: 'Plano C — reidratação venosa/intensiva urgente conforme protocolo, referência hospitalar.',
    };
  }
  if (sede || irritado || olhosFundos) {
    return {
      rotulo: 'Algum grau de desidratação',
      cls: 'risk-high',
      plano: 'Plano B — TRO (terapia de reidratação oral) supervisionada na unidade, reavaliar após 4 horas.',
    };
  }
  return {
    rotulo: 'Sem sinais de desidratação',
    cls: 'risk-low',
    plano: 'Plano A — manter hidratação domiciliar, orientar sinais de alarme para retorno.',
  };
}

/** Marcos do desenvolvimento: [idade máxima (meses, exclusiva), faixa, marcos]. */
const MARCOS_DO_DESENVOLVIMENTO = [
  [2, '0–1 mês', 'Fixa o olhar no rosto; reage a sons altos; movimentos simétricos dos membros.'],
  [4, '2–3 meses', 'Sorriso social; sustenta a cabeça quando de bruços; acompanha objetos com o olhar.'],
  [7, '4–6 meses', 'Rola sobre o corpo; leva objetos à boca; ri alto; senta com apoio.'],
  [10, '7–9 meses', 'Senta sem apoio; engatinha; transfere objetos entre as mãos; balbucio.'],
  [
    13,
    '10–12 meses',
    'Fica em pé com apoio; pinça fina; pode dizer 1–2 palavras com sentido; estranhamento a estranhos.',
  ],
  [19, '13–18 meses', 'Anda sem apoio; algumas palavras; aponta para o que quer; rabisca.'],
  [25, '19–24 meses', 'Corre; frases de 2 palavras; sobe escadas com apoio; brinca de faz-de-conta simples.'],
  [
    37,
    '25–36 meses',
    'Frases curtas; pula com os 2 pés; controle esfincteriano diurno em progresso; brinca interativamente com outras crianças.',
  ],
  [
    Infinity,
    '>36 meses',
    'Fala compreensível em frases; veste-se parcialmente sozinho; segue regras simples de jogos; desenha formas simples.',
  ],
];

export function marcosParaIdade(meses) {
  const [, faixa, marcos] = MARCOS_DO_DESENVOLVIMENTO.find(([limite]) => meses < limite);
  return { faixa, marcos };
}

/** Vacinas do calendário (PNI) por idade: [idade máxima (meses, exclusiva), texto]. */
const VACINAS_POR_IDADE = [
  [2, 'Ao nascer: BCG, Hepatite B.'],
  [4, '2 meses: Pentavalente (1ª), VIP (1ª), Pneumocócica 10V (1ª), Rotavírus (1ª).'],
  [6, '4 meses: Pentavalente (2ª), VIP (2ª), Pneumocócica 10V (2ª), Rotavírus (2ª).'],
  [9, '6 meses: Pentavalente (3ª), VIP (3ª). A partir de 6 meses: Influenza conforme campanha.'],
  [12, '9 meses: Febre amarela.'],
  [15, '12 meses: Pneumocócica 10V (reforço), Meningocócica C/ACWY (reforço), Tríplice viral (1ª dose).'],
  [16, '15 meses: DTP (1º reforço), VIP (reforço), Hepatite A, Tetra viral (SCRV).'],
  [
    Infinity,
    'A partir de 4 anos: DTP (2º reforço), Varicela e demais doses de reforço conforme calendário PNI vigente.',
  ],
];

export function vacinasParaIdade(meses) {
  return VACINAS_POR_IDADE.find(([limite]) => meses < limite)[1];
}
