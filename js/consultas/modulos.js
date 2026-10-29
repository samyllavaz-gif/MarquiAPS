/**
 * Monta os módulos da consulta única a partir dos modelos (js/consultas/modelos).
 *
 * 1. Campos que a base já tem (alergias, medicamentos, sinais vitais, avaliação, hipótese,
 *    exames solicitados, conduta, prescrição, orientações, encaminhamentos, retorno…) saem dos
 *    módulos: são preenchidos uma vez só, na base, e valem para todos os tipos marcados.
 * 2. Um mesmo id usado por mais de um modelo ganha o prefixo do modelo (ex.: mulher_alertas),
 *    para que cada módulo guarde seus próprios valores. O modelo "dono" de um id lido pelo
 *    código específico (cálculos, resumos) mantém o id original — ver DONOS_DOS_IDS.
 * 3. O exame físico é um campo só (o da base): os botões "Inserir normal" de cada módulo
 *    (ex.: Mamas, Especular) aparecem junto do exame da base — ver montarConsulta().exame.
 * 4. A base passa para os módulos o que eles usam nos cálculos (idade, sexo e sinais vitais):
 *    ver valoresCompartilhados().
 */
import { CHIPS } from './base/dados.js';
import { MODELOS } from './modelos/index.js';
import { TIPOS_DE_CONSULTA } from './tipos.js';

/** Campos removidos de todos os módulos porque existem na base. */
const CAMPOS_DA_BASE = new Set([
  'alerg',
  'alerg_txt',
  'meds',
  'aval',
  'hd',
  'exsol',
  'conduta',
  'presc',
  'orient',
  'alarme_or',
  'enc',
  'ret',
]);

/** Remoções específicas: [modelo, id] — o equivalente está na base (Motivo/HDA, Sexo). */
const REMOVIDOS_POR_MODELO = new Set([
  'prenatal:qp', // queixa principal → Motivo da consulta e HDA da base
  'mulher:queixas', // queixas → HDA da base
  'homem:queixas',
  'puericultura:queixas',
  'puericultura:sexo', // sexo → Identificação da base
]);

/** Sinais vitais que a base já registra; o que sobra da grade "sv" de um modelo continua no módulo. */
const SINAIS_DA_BASE = new Set(['pa', 'fc', 'fr', 'tax', 'spo2', 'hgt', 'peso', 'alt', 'ca']);

/** Ids repetidos que o código específico lê pelo nome: o dono mantém o id; os outros ganham prefixo. */
export const DONOS_DOS_IDS = {
  sv: 'prenatal', // ganho de peso lê gv('sv','peso')
  ident: 'mulher', // rastreamentos leem gv('ident','idade')
  inicio: 'reumato', // resumo para a regulação (reumatologia)
  hip: 'reumato',
  prior: 'reumato',
  enc_tipo: 'reumato',
  impacto: 'reumato',
};

// Antecedentes e hábitos são um registro único, inclusive as opções específicas.
export const CAMPOS_COMPARTILHADOS = [];
const copiar = f => ({ ...f, ...(f.t === 'group' ? { f: f.f.map(copiar) } : {}) });

/** Prepara os campos de um modelo: remove os da base e ajusta as grades de identificação e sinais vitais. */
function filtrarCampos(nome, campos, exame) {
  const saida = [];
  for (const original of campos) {
    if (original.t === 'exam') {
      Object.assign(exame, original.ins); // vira botões no exame físico da base
      continue;
    }
    if (original.id && (CAMPOS_DA_BASE.has(original.id) || REMOVIDOS_POR_MODELO.has(`${nome}:${original.id}`)))
      continue;
    const f = copiar(original);
    if (f.t === 'chips' && ['ant', 'hab'].includes(f.id)) {
      const grupo = f.id === 'ant' ? 'ant' : 'risco';
      for (const opcao of f.opts) if (!CHIPS[grupo].includes(opcao)) CHIPS[grupo].push(opcao);
      CAMPOS_COMPARTILHADOS.push({ modelo: nome, id: f.id, grupo });
      saida.push({ t: 'link', l: grupo === 'ant' ? 'Ver antecedentes compartilhados' : 'Ver hábitos compartilhados', href: grupo === 'ant' ? '#dados-antecedentes' : '#dados-habitos', note: 'Preencha uma vez nos dados comuns; vale para todos os roteiros.' });
      continue;
    }
    if (f.t === 'group') {
      f.f = filtrarCampos(nome, f.f, exame);
      if (!f.f.length) continue;
    } else if (f.t === 'grid' && f.id === 'sv') {
      f.f = f.f.filter(([k]) => !SINAIS_DA_BASE.has(k));
      delete f.imc;
      if (!f.f.length) continue;
      if (/^Sinais vitais e /.test(f.l)) f.l = f.l.replace(/^Sinais vitais e /, '').replace(/^./, c => c.toUpperCase());
    } else if (f.t === 'grid' && f.id === 'ident') {
      f.f = f.f.filter(([k]) => k !== 'idade');
      if (!f.f.length) continue;
    }
    saida.push(f);
  }
  return saida;
}

const percorrer = (campos, fn) =>
  campos.forEach(f => {
    fn(f);
    if (f.t === 'group') percorrer(f.f, fn);
  });

/** Monta, uma vez, as definições de todos os módulos com ids únicos. */
function prepararModulos() {
  const modulos = {};
  for (const tipo of TIPOS_DE_CONSULTA.filter(t => t.modelo)) {
    const def = MODELOS[tipo.modelo];
    const exame = {};
    modulos[tipo.id] = {
      id: tipo.id,
      rotulo: tipo.rotulo,
      _k: { ...def._k },
      secs: def.secs
        .map(s => ({ ...s, modulo: tipo.id, f: filtrarCampos(tipo.modelo, s.f, exame) }))
        .filter(s => s.f.length),
      exame,
    };
  }
  // ids usados por mais de um módulo
  const usos = {};
  for (const [nome, m] of Object.entries(modulos))
    m.secs.forEach(s => percorrer(s.f, f => f.id && (usos[f.id] = usos[f.id] || new Set()).add(nome)));
  for (const [nome, m] of Object.entries(modulos))
    m.secs.forEach(s =>
      percorrer(s.f, f => {
        if (f.id && usos[f.id].size > 1 && DONOS_DOS_IDS[f.id] !== nome) f.id = `${nome}_${f.id}`;
      }),
    );
  return modulos;
}

export const MODULOS = prepararModulos();

/** Definição única com os módulos marcados, na ordem dos tipos (usada pelo motor). */
export function montarConsulta(tiposMarcados) {
  const marcados = TIPOS_DE_CONSULTA.filter(t => t.modelo && tiposMarcados.includes(t.id)).map(t => MODULOS[t.id]);
  return {
    modulos: marcados.map(m => m.id),
    exame: marcados
      .filter(m => Object.keys(m.exame).length)
      .map(m => ({ modulo: m.id, rotulo: m.rotulo, ins: m.exame })),
    _k: Object.assign({}, ...marcados.map(m => m._k)),
    secs: marcados.flatMap(m => m.secs),
  };
}

const SEXO_POR_EXTENSO = { F: 'Feminino', M: 'Masculino' };

/**
 * Valores da base que os módulos usam nos cálculos, no formato do motor.
 * @param {{ idade: string, sexo: 'F'|'M'|'', sinais: object }} base
 */
export function valoresCompartilhados(base) {
  return {
    ident: { idade: base.idade },
    sexo: SEXO_POR_EXTENSO[base.sexo] || '',
    sv: { ...base.sinais },
  };
}

/** Move os registros dos rascunhos anteriores sem perder opções específicas. */
export function migrarCamposCompartilhados(valores, chips) {
  for (const { modelo, id, grupo } of CAMPOS_COMPARTILHADOS) {
    const chave = `${modelo}_${id}`;
    const anteriores = valores[chave] ?? valores[id];
    if (!Array.isArray(anteriores)) continue;
    for (const opcao of anteriores) if (!chips[grupo].includes(opcao)) chips[grupo].push(opcao);
    delete valores[chave];
    delete valores[id];
  }
}

/** Unifica a DUM somente quando os registros são compatíveis; divergências ficam visíveis. */
export function compartilharDum(definicao, valores) {
  if (!definicao.modulos.includes('mulher') || !definicao.modulos.includes('prenatal')) return definicao;
  const menstrual = String(valores.menst?.dum || '').trim();
  const prenatal = String(valores.dt?.dum || '').trim();
  if (menstrual && prenatal && menstrual !== prenatal) return { ...definicao, conflitoDum: true };
  const dum = prenatal || menstrual;
  valores.dt = { ...valores.dt, dum };
  valores.menst = { ...valores.menst, dum };
  const copiarCampos = campos => campos.map(f => {
    if (f.t === 'group') return { ...f, f: copiarCampos(f.f) };
    if (f.id === 'menst') return { ...f, f: f.f.filter(([id]) => id !== 'dum'), note: 'DUM compartilhada no roteiro de pré-natal.' };
    return f;
  });
  return { ...definicao, dumCompartilhada: true, secs: definicao.secs.map(s => ({ ...s, f: copiarCampos(s.f) })) };
}
