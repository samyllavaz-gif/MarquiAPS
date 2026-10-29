/**
 * Cálculo da dose pediátrica: aplica a regra da indicação, converte para a apresentação
 * (mL, gotas, jatos ou fração de comprimido), estima frascos e monta a linha da receita.
 * Funções puras.
 */
import { formatarNumeroArredondado } from '../../utils/texto.js';
import { MEDICAMENTOS_PEDIATRICOS } from './medicamentos.js';

export const textoIdadeEmMeses = mo =>
  mo < 12
    ? `${mo} ${mo === 1 ? 'mês' : 'meses'}`
    : `${Math.floor(mo / 12)} ano${Math.floor(mo / 12) > 1 ? 's' : ''}${mo % 12 ? ` e ${mo % 12} ${mo % 12 === 1 ? 'mês' : 'meses'}` : ''}`;

/* conversão para a apresentação */
const FRACOES = { 0.25: '¼', 0.5: '½', 0.75: '¾' };
function textoDeComprimidos(u, cap) {
  const [s1, s2] = cap ? ['cápsula', 'cápsulas'] : ['comprimido', 'comprimidos'];
  const i = Math.floor(u + 1e-9),
    f = Math.round((u - i) * 4) / 4;
  if (!f) return `${i} ${i > 1 ? s2 : s1}`;
  return (i ? i + ' ' : '') + (FRACOES[f] || formatarNumeroArredondado(f, 2)) + ' ' + (i ? s2 : s1);
}
function converterParaApresentacao(ap, mg, un) {
  if (ap.tipo === 'none') return null;
  if (ap.tipo === 'gotas') {
    const ml = mg / ap.conc;
    let g = Math.max(1, Math.round(ml * ap.gpm));
    const real = (g / ap.gpm) * ap.conc;
    return {
      q: g,
      tx: `${g} ${g > 1 ? 'gotas' : 'gota'}`,
      sub: `≈ ${formatarNumeroArredondado(g / ap.gpm, 2)} mL`,
      real,
    };
  }
  if (ap.tipo === 'liq' || ap.tipo === 'inj') {
    const ml = mg / ap.conc,
      st = ap.tipo === 'inj' || ml < 3 ? 0.1 : 0.5;
    let r = Math.max(st, Math.round(ml / st) * st);
    r = Math.round(r * 10) / 10;
    return { q: r, ml: r, tx: `${formatarNumeroArredondado(r)} mL`, real: r * ap.conc };
  }
  if (ap.tipo === 'jato') {
    const j = Math.max(1, Math.round((mg * 1000) / ap.mcg));
    return { q: j, tx: `${j} ${j > 1 ? 'jatos' : 'jato'}`, real: (j * ap.mcg) / 1000 };
  }
  if (ap.tipo === 'comp') {
    const fr = ap.cap ? 1 : ap.frac;
    const u = Math.round(mg / ap.mg / fr) * fr;
    if (u < fr) return { q: 0, tx: 'dose menor que a menor fração possível', bad: true, real: 0 };
    return { q: u, tx: textoDeComprimidos(u, ap.cap), real: u * ap.mg };
  }
}
export const textoDaQuantidade = (v, un) =>
  un === 'UI'
    ? Math.round(v).toLocaleString('pt-BR') + ' UI'
    : un === 'mL'
      ? formatarNumeroArredondado(v) + ' mL'
      : formatarNumeroArredondado(v, v < 1 ? 2 : v < 10 ? 1 : 0) + ' ' + un;
function quantidadeDeFrascos(ap, doses) {
  if (ap.tipo !== 'liq') return '';
  const tot = doses.reduce((s, d) => s + (d.c && d.c.ml && d.dias ? d.c.ml * d.nDia * d.dias : 0), 0);
  if (!tot) return '';
  if (ap.frascos) {
    const pick = ap.frascos.find(f => f[0] >= tot);
    return `Volume total do tratamento ≈ ${formatarNumeroArredondado(tot)} mL → ${pick ? pick[1] : Math.ceil(tot / ap.frascos[ap.frascos.length - 1][0]) + ' × ' + ap.frascos[ap.frascos.length - 1][1]}.`;
  }
  if (ap.frasco) {
    const n = Math.ceil(tot / ap.frasco - 0.02);
    return `Volume total do tratamento ≈ ${formatarNumeroArredondado(tot)} mL → ${n} frasco${n > 1 ? 's' : ''} de ${formatarNumeroArredondado(ap.frasco)} mL.`;
  }
  return `Volume total do tratamento ≈ ${formatarNumeroArredondado(tot)} mL.`;
}
function verboDaVia(ap) {
  return ap.tipo === 'inj' ? 'aplicar' : ap.tipo === 'jato' ? 'fazer' : ap.tipo === 'comp' ? 'tomar' : 'dar';
}
function textoDaVia(ap) {
  return ap.tipo === 'inj'
    ? 'por via intramuscular'
    : ap.tipo === 'jato'
      ? 'por via inalatória com espaçador'
      : 'por via oral';
}

export function calcularDosePediatrica(medId, indId, apId, ctx) {
  const m = MEDICAMENTOS_PEDIATRICOS.find(x => x.id === medId);
  if (!m) return null;
  const ind = m.ind.find(x => x.id === indId) || m.ind[0];
  const r = ind.calc(ctx) || { doses: [] };
  const allow = ind.aps
    ? m.ap.filter(x => ind.aps.includes(x.id)).sort((a, b) => ind.aps.indexOf(a.id) - ind.aps.indexOf(b.id))
    : m.ap;
  const ap = allow.find(x => x.id === apId) || allow[0];
  const warn = [...(r.warn || [])],
    notes = [...(r.notes || []), ...(m.notas || [])];
  if (ctx.mo != null && m.minMo && ctx.mo < m.minMo) warn.unshift(m.minTx);
  if (m.minKg && ctx.kg < m.minKg) warn.unshift(m.minTx);
  if (ap.gotaNota) notes.push(ap.gotaNota);
  const doses = (r.doses || []).map(d => {
    const c = converterParaApresentacao(ap, d.mg, m.un);
    const out = { ...d, c };
    if (c && !c.bad && c.real && Math.abs(c.real - d.mg) / d.mg > 0.15) out.dif = true;
    return out;
  });
  doses.forEach(d => {
    if (d.c && d.c.bad) warn.push(`Com ${ap.rx.toLowerCase()} não é possível fracionar a dose: use a forma líquida.`);
    else if (d.dif)
      notes.push(
        `A apresentação escolhida arredonda a dose para ${textoDaQuantidade(d.c.real, m.un)} (calculado ${textoDaQuantidade(d.mg, m.un)}); considere a forma líquida.`,
      );
  });
  let rx = r.rx || '';
  if (!rx && doses.length) {
    const parts = doses
      .filter(d => d.c && !d.c.bad)
      .map(
        d =>
          `${d.rot ? d.rot + ': ' : ''}${verboDaVia(ap)} ${d.c.tx} ${textoDaVia(ap)} ${d.freq}${d.dur ? ' ' + d.dur : ''}`,
      );
    if (parts.length) rx = `${ap.rx} — ${parts.join('; ')}.`;
  }
  return {
    m,
    ind,
    ap,
    doses,
    warn: [...new Set(warn)],
    notes: [...new Set(notes)],
    faixa: r.faixa,
    rx,
    fr: quantidadeDeFrascos(ap, doses),
  };
}
export const apresentacoesPermitidas = (medId, indId) => {
  const m = MEDICAMENTOS_PEDIATRICOS.find(x => x.id === medId);
  if (!m) return [];
  const ind = m.ind.find(x => x.id === indId) || m.ind[0];
  return ind.aps
    ? m.ap.filter(x => ind.aps.includes(x.id)).sort((a, b) => ind.aps.indexOf(a.id) - ind.aps.indexOf(b.id))
    : m.ap;
};
