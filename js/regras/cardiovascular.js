/**
 * Risco cardiovascular: equações PREVENT (AHA, 2023) e estratificação da
 * Diretriz Brasileira de Dislipidemias e Prevenção da Aterosclerose 2025 (SBC).
 * Usado na consulta de HiperDia e na calculadora cardiovascular. Funções puras.
 */
import { formatarNumero, minusculaInicialPreservandoSiglas } from '../utils/texto.js';

/** Coeficientes das equações PREVENT (modelo base), por desfecho e sexo. */
const COEFICIENTES_PREVENT = {
  cvd: {
    F: [
      -3.307728, 0.7939329, 0.0305239, -0.1606857, -0.2394003, 0.360078, 0.8667604, 0.5360739, 0.6045917, 0.0433769,
      0.3151672, 0.1477655, -0.0663612, 0.1197879, -0.0819715, 0.0306769, -0.0946348, -0.27057, -0.078715, -0.1637806,
    ],
    M: [
      -3.031168, 0.7688528, 0.0736174, -0.0954431, -0.4347345, 0.3362658, 0.7692857, 0.4386871, 0.5378979, 0.0164827,
      0.288879, -0.1337349, -0.0475924, 0.150273, -0.0517874, 0.0191169, -0.1049477, -0.2251948, -0.0895067, -0.1543702,
    ],
  },
  ascvd: {
    F: [
      -3.819975, 0.719883, 0.1176967, -0.151185, -0.0835358, 0.3592852, 0.8348585, 0.4831078, 0.4864619, 0.0397779,
      0.2265309, -0.0592374, -0.0395762, 0.0844423, -0.0567839, 0.0325692, -0.1035985, -0.2417542, -0.0791142,
      -0.1671492,
    ],
    M: [
      -3.500655, 0.7099847, 0.1658663, -0.1144285, -0.2837212, 0.3239977, 0.7189597, 0.3956973, 0.3690075, 0.0203619,
      0.2036522, -0.0865581, -0.0322916, 0.114563, -0.0300005, 0.0232747, -0.0927024, -0.2018525, -0.0970527,
      -0.1217081,
    ],
  },
  hf: {
    F: [
      -4.310409, 0.8998235, -0.4559771, 0.3576505, 1.038346, 0.583916, -0.0072294, 0.2997706, 0.7451638, 0.0556,
      0.3534442, -0.0981511, -0.0946663, -0.3581041, -0.1159453, -0.003878, -0.1884289,
    ],
    M: [
      -3.946391, 0.8972642, -0.6811466, 0.3634461, 0.923776, 0.5023736, -0.0485841, 0.3726929, 0.6926917, 0.0251827,
      0.2980922, -0.0497731, -0.1289201, -0.3040924, -0.1401688, 0.0068126, -0.1797778,
    ],
  },
};

/** Campos obrigatórios do PREVENT: [chave, nome mostrado quando falta]. */
const CAMPOS_OBRIGATORIOS_PREVENT = [
  ['sx', 'sexo'],
  ['age', 'idade'],
  ['tc', 'colesterol total'],
  ['hdl', 'HDL'],
  ['sbp', 'PA sistólica'],
  ['egfr', 'TFG'],
  ['dm', 'diabetes'],
  ['smk', 'tabagismo'],
  ['bptx', 'anti-hipertensivo'],
  ['st', 'estatina'],
];

/** Faixas em que as equações foram validadas: [chave, mínimo, máximo, rótulo, unidade]. */
const FAIXAS_VALIDADAS_PREVENT = [
  ['age', 30, 79, 'Idade', 'anos'],
  ['tc', 130, 320, 'Colesterol total', 'mg/dL'],
  ['hdl', 20, 100, 'HDL', 'mg/dL'],
  ['sbp', 90, 200, 'PA sistólica', 'mmHg'],
  ['egfr', 15, 140, 'TFG', 'mL/min'],
];

/**
 * Risco em 10 anos pelo PREVENT.
 * @param {object} o sx ('F'|'M'), age, tc, hdl, sbp, bmi, egfr (números),
 *   dm, smk, bptx, st ('1'|'0'|''), eventoPrevio (booleano), mensagemSemImc (opcional)
 * @returns {{dcv:true}|{miss:string[]}|{out:string[]}|{ascvd:number,cvd:number,hf:number|null,bmiNote:string,cat:string[],inp:object}}
 */
export function calcularPrevent(o) {
  if (o.eventoPrevio) return { dcv: true };
  const faltando = [];
  CAMPOS_OBRIGATORIOS_PREVENT.forEach(([k, l]) => {
    const x = o[k];
    if (x === '' || x === undefined || (typeof x === 'number' && isNaN(x))) faltando.push(l);
  });
  if (faltando.length) return { miss: faltando };
  const fora = [];
  FAIXAS_VALIDADAS_PREVENT.forEach(([k, lo, hi, l, u]) => {
    if (o[k] < lo || o[k] > hi) fora.push(`${l} fora da faixa validada (${lo}–${hi} ${u})`);
  });
  if (fora.length) return { out: fora };
  const a = (o.age - 55) / 10,
    nh = (o.tc - o.hdl) * 0.02586 - 3.5,
    h = (o.hdl * 0.02586 - 1.3) / 0.3,
    s1 = (Math.min(o.sbp, 110) - 110) / 20,
    s2 = (Math.max(o.sbp, 110) - 130) / 20,
    e1 = (Math.min(o.egfr, 60) - 60) / -15,
    e2 = (Math.max(o.egfr, 60) - 90) / -15,
    d = +o.dm,
    sm = +o.smk,
    t = +o.bptx,
    st = +o.st,
    k = o.sx;
  const lin = c =>
    c[0] +
    c[1] * a +
    c[2] * nh +
    c[3] * h +
    c[4] * s1 +
    c[5] * s2 +
    c[6] * d +
    c[7] * sm +
    c[8] * e1 +
    c[9] * e2 +
    c[10] * t +
    c[11] * st +
    c[12] * t * s2 +
    c[13] * st * nh +
    c[14] * a * nh +
    c[15] * a * h +
    c[16] * a * s2 +
    c[17] * a * d +
    c[18] * a * sm +
    c[19] * a * e1;
  const logistica = x => (100 * Math.exp(x)) / (1 + Math.exp(x));
  const r = {
    cvd: logistica(lin(COEFICIENTES_PREVENT.cvd[k])),
    ascvd: logistica(lin(COEFICIENTES_PREVENT.ascvd[k])),
    hf: null,
    bmiNote: '',
  };
  if (o.bmi >= 18.5 && o.bmi < 40) {
    const b1 = (Math.min(o.bmi, 30) - 25) / 5,
      b2 = (Math.max(o.bmi, 30) - 30) / 5,
      c = COEFICIENTES_PREVENT.hf[k];
    r.hf = logistica(
      c[0] +
        c[1] * a +
        c[2] * s1 +
        c[3] * s2 +
        c[4] * d +
        c[5] * sm +
        c[6] * b1 +
        c[7] * b2 +
        c[8] * e1 +
        c[9] * e2 +
        c[10] * t +
        c[11] * t * s2 +
        c[12] * a * s2 +
        c[13] * a * d +
        c[14] * a * sm +
        c[15] * a * b2 +
        c[16] * a * e1,
    );
  } else
    r.bmiNote = isNaN(o.bmi)
      ? o.mensagemSemImc || 'Informe o IMC para calcular o risco de IC.'
      : 'IMC fora da faixa validada (18,5–39,9) para o risco de IC.';
  const c = r.ascvd;
  r.cat = c < 5 ? ['Baixo', 'k-ok'] : c < 20 ? ['Intermediário', 'k-warn'] : ['Alto', 'k-bad'];
  r.inp = o;
  return r;
}

/** Listas de critérios da SBC 2025 exibidas como caixas de marcar. */
export const CRITERIOS_SBC = {
  ath: [
    'Obstrução arterial ≥ 50%',
    'Revascularização arterial prévia',
    'DCVA sintomática (angina, claudicação, AIT)',
    'Placa carotídea < 50%',
    'Placa < 50% na angioTC de coronárias',
    'CAC percentil > 75',
    'Aneurisma de aorta abdominal',
  ],
  cond: [
    'Hipercolesterolemia familiar',
    'Revascularização fora do evento',
    'LDL-c ≥ 100 apesar de estatina máxima e ezetimiba',
    'Evento há menos de 2 anos',
  ],
  ear: ['DM2 há mais de 10 anos', 'Neuropatia autonômica CV incipiente', 'Retinopatia não proliferativa leve'],
  emar: [
    'Neuropatia autonômica CV instalada',
    'Retinopatia moderada-grave ou proliferativa',
    'DM1 há mais de 20 anos (diagnóstico após os 18)',
  ],
  agr: [
    'História familiar de DCV prematura',
    'Adiposidade',
    'Esteatose hepática (MASLD)',
    'Síndrome metabólica',
    'Artrite reumatoide',
    'Psoríase',
    'Lúpus',
    'Doença inflamatória intestinal',
    'HIV',
    'Transplante de órgão',
    'Menarca ≤ 12 ou ≥ 17 anos',
    'Pré-eclâmpsia, hipertensão ou diabetes gestacional',
    'Parto prematuro',
    'Restrição de crescimento intrauterino',
    '3 ou mais abortos espontâneos',
    'Menopausa antes dos 40 anos',
    'PCR-us ≥ 2,0 mg/L',
  ],
};

/** Metas por categoria (Tabela 5.1): nome, LDL-c, redução, não-HDL, ApoB. */
export const METAS_SBC = {
  baixo: { nome: 'Baixo', ldl: 115, reducao: '≥ 30%', naoHdl: 145, apoB: 100 },
  inter: { nome: 'Intermediário', ldl: 100, reducao: '≥ 30%', naoHdl: 130, apoB: 90 },
  alto: { nome: 'Alto', ldl: 70, reducao: '≥ 50%', naoHdl: 100, apoB: 70 },
  mu: { nome: 'Muito alto', ldl: 50, reducao: '≥ 50%', naoHdl: 80, apoB: 55 },
  ext: { nome: 'Extremo', ldl: 40, reducao: '≥ 50%', naoHdl: 70, apoB: 45 },
};

/** Conduta hipolipemiante resumida por categoria. */
export const CONDUTA_SBC = {
  baixo: 'Mudança de estilo de vida; estatina se LDL-c acima da meta após MEV.',
  inter: 'MEV e estatina de moderada ou alta intensidade para reduzir LDL-c ≥ 30% e atingir a meta.',
  alto: 'Estatina de alta intensidade (redução ≥ 50%); associar ezetimiba se a meta não for atingida.',
  mu: 'Estatina de alta intensidade + ezetimiba frequentemente necessária; considerar terapias adicionais (iPCSK9) se a meta não for atingida.',
  ext: 'Estatina de alta intensidade + ezetimiba; considerar iPCSK9 se a meta não for atingida.',
};

/**
 * Categoria de risco da SBC 2025 (Fig. 4.1 e Tabelas 4.1–4.8).
 * @param {object} o idade, sexo ('F'|'M'), ldl, lpa, cac, ct, tfg (números),
 *   hipertensao, tabagismo, diabetes (booleanos), albuminuria ('A1'|'A2'|'A3'),
 *   estagioTexto (como o estágio da TFG aparece no texto), eventos ('0'|'1'|'2'),
 *   aterosclerose, condicoes, estratificadoresAlto, estratificadoresMuitoAlto, agravantes (listas de CRITERIOS_SBC),
 *   mensagemPreventIncompleto (opcional)
 * @param {object|null} pv resultado do PREVENT (usado só quando tem ascvd)
 * @returns {{k:string, why:string[]}|{miss:string}}
 */
export function estratificarSbc(o, pv) {
  const R = (k, why) => ({ k, why });
  const lcf = minusculaInicialPreservandoSiglas;
  const age = o.idade,
    sx = o.sexo,
    ldl = o.ldl,
    lpa = o.lpa,
    cac = o.cac,
    ct = o.ct,
    g = o.tfg;
  const has = o.hipertensao,
    smk = o.tabagismo,
    dm = o.diabetes,
    al = o.albuminuria,
    ath = o.aterosclerose;
  if (o.eventos === '2') return R('ext', ['2 ou mais eventos cardiovasculares ateroscleróticos maiores']);
  if (o.eventos === '1') {
    const c = [...o.condicoes];
    if (age >= 65) c.push('idade ≥ 65 anos');
    if (dm) c.push('diabetes');
    if (has) c.push('hipertensão');
    if (g >= 15 && g < 60) c.push('DRC (TFG 15–59)');
    if (smk) c.push('tabagismo atual');
    return c.length >= 2
      ? R('ext', [
          '1 evento cardiovascular aterosclerótico maior',
          `${c.length} condições de alto risco: ${c.map(lcf).join(', ')}`,
        ])
      : R('mu', [
          'evento cardiovascular aterosclerótico prévio' +
            (c.length ? ` (1 condição de alto risco: ${lcf(c[0])})` : ''),
        ]);
  }
  const sig = ath.filter(x =>
    [
      'Obstrução arterial ≥ 50%',
      'Revascularização arterial prévia',
      'DCVA sintomática (angina, claudicação, AIT)',
    ].includes(x),
  );
  if (sig.length) return R('mu', sig.map(lcf));
  if (cac > 300) return R('mu', [`CAC ${cac} UA (> 300)`]);
  if (dm) {
    const ren = isNaN(g)
      ? null
      : g < 30
        ? 'mu'
        : g < 45
          ? al === 'A1'
            ? 'alto'
            : 'mu'
          : g < 60
            ? al === 'A3'
              ? 'mu'
              : 'alto'
            : al === 'A2'
              ? 'alto'
              : al === 'A3'
                ? 'mu'
                : null;
    const ear = [...o.estratificadoresAlto];
    if (has) ear.push('hipertensão');
    if (smk) ear.push('tabagismo ativo');
    if (o.agravantes.includes('História familiar de DCV prematura')) ear.push('história familiar de DAC prematura');
    if (o.agravantes.includes('Síndrome metabólica')) ear.push('síndrome metabólica');
    if (ren === 'alto') ear.push(`doença renal de risco alto (${o.estagioTexto} ${al})`);
    if (cac >= 10 && cac <= 300) ear.push(`CAC ${cac} UA`);
    ath
      .filter(x =>
        ['Placa carotídea < 50%', 'Placa < 50% na angioTC de coronárias', 'Aneurisma de aorta abdominal'].includes(x),
      )
      .forEach(x => ear.push(lcf(x)));
    const emar = [...o.estratificadoresMuitoAlto];
    if (ear.length >= 3) emar.push(`${ear.length} estratificadores de alto risco (${ear.map(lcf).join(', ')})`);
    if (ren === 'mu') emar.push(`doença renal de risco muito alto (${o.estagioTexto} ${al})`);
    if (ct > 310 || ldl > 190) emar.push(ct > 310 ? `CT ${ct} mg/dL` : `LDL-c ${ldl} mg/dL`);
    if (emar.length) return R('mu', ['diabetes com estratificador de muito alto risco: ' + emar.map(lcf).join('; ')]);
    if (ear.length)
      return R('alto', [`diabetes com ${ear.length} estratificador(es) de alto risco: ${ear.map(lcf).join(', ')}`]);
    if (!sx || isNaN(age)) return { miss: 'Informe sexo e idade para estratificar o diabetes.' };
    if ((sx === 'M' && age >= 50) || (sx === 'F' && age >= 56))
      return R('alto', [`diabetes, ${sx === 'M' ? 'homem ≥ 50' : 'mulher ≥ 56'} anos`]);
    return R('inter', [`diabetes, ${sx === 'M' ? 'homem < 50' : 'mulher < 56'} anos, sem estratificadores`]);
  }
  const sub = ath
    .filter(x =>
      [
        'Placa carotídea < 50%',
        'Placa < 50% na angioTC de coronárias',
        'CAC percentil > 75',
        'Aneurisma de aorta abdominal',
      ].includes(x),
    )
    .map(lcf);
  if (cac > 100) sub.push(`CAC ${cac} UA`);
  if (sub.length) return R('alto', ['aterosclerose subclínica: ' + sub.join(', ')]);
  if (ldl >= 190) return R('alto', [`LDL-c ${ldl} mg/dL (≥ 190)`]);
  if (lpa > 180) return R('alto', [`Lp(a) ${formatarNumero(lpa, 0)} mg/dL (> 180)`]);
  if (age >= 80) return R('alto', ['idade ≥ 80 anos (risco em 10 anos invariavelmente ≥ 20%)']);
  const agr = o.agravantes.map(lcf);
  if (lpa >= 50) agr.push(`Lp(a) ${formatarNumero(lpa, 0)} mg/dL`);
  if (!pv || pv.ascvd == null || pv.miss || pv.out)
    return {
      miss:
        age < 30
          ? 'PREVENT não se aplica abaixo de 30 anos: avalie agravantes e LDL-c ao longo da vida.'
          : o.mensagemPreventIncompleto ||
            'Complete o PREVENT para estratificar (ou informe um critério direto de categoria).',
    };
  const r = pv.ascvd,
    rt = `PREVENT DCV aterosclerótica ${formatarNumero(r)}% em 10 anos`;
  if (r >= 20) return R('alto', [rt]);
  if (r >= 5) return agr.length ? R('alto', [rt, 'agravante: ' + agr.join(', ')]) : R('inter', [rt]);
  if (agr.length) return R('inter', [rt, 'agravante: ' + agr.join(', ')]);
  if (ldl >= 160) return R('inter', [rt, `LDL-c ${ldl} mg/dL (160–189)`]);
  return R('baixo', [rt, 'sem agravantes']);
}
