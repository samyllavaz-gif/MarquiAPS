/**
 * Ferramentas da base da consulta (queixas do dia e HiperDia): leem os campos da consulta e aplicam as
 * regras clínicas compartilhadas (js/regras): IMC, TFG, PREVENT + SBC 2025, pé diabético,
 * FINDRISC e estadiamento da dengue.
 */
import { calcularPrevent, estratificarSbc, METAS_SBC } from '../../regras/cardiovascular.js';
import { diaDeDoenca, grupoDengue, volumeHidratacaoOral } from '../../regras/dengue.js';
import { calcularFindrisc } from '../../regras/findrisc.js';
import { classificarPeDiabetico } from '../../regras/pe-diabetico.js';
import { categoriaAlbuminuria, DESCRICAO_ESTAGIO_TFG, estagioTfg, tfgCkdEpi2021 } from '../../regras/renal.js';
import { lerNumero } from '../../utils/texto.js';
import { FOOT_TESTS } from './dados.js';
import { state, v } from './estado.js';

/** IMC da consulta (altura em m ou cm); null quando ausente ou implausível. */
export function imc() {
  const p = lerNumero(v('sv-peso'));
  let a = lerNumero(v('sv-alt'));
  if (!(p > 0 && a > 0)) return null;
  if (a > 3) a = a / 100;
  const r = p / (a * a);
  return r > 8 && r < 90 ? r : null;
}

/** PA sistólica registrada nos sinais vitais (NaN se ausente). */
export function pasConsulta() {
  const m = v('sv-pa').match(/(\d{2,3})/);
  return m ? +m[1] : NaN;
}

/** TFG pela creatinina (CKD-EPI 2021) com estágio KDIGO e albuminúria; null sem creatinina, idade ≥ 18 e sexo. */
export function tfgCalc() {
  const cr = lerNumero(v('hd-cr')),
    age = lerNumero(v('hd-idade')),
    sx = state.hd.sexo;
  if (!(cr > 0) || !(age >= 18) || !sx) return null;
  const g = tfgCkdEpi2021(cr, age, sx),
    st = estagioTfg(g);
  const rac = lerNumero(v('hd-rac'));
  return { g, st, desc: DESCRICAO_ESTAGIO_TFG[st], al: categoriaAlbuminuria(rac), rac, cr };
}

/** Dados do PREVENT a partir da aba de risco cardiovascular (com valores da consulta como padrão). */
function preventInputs() {
  const t = tfgCalc(),
    h = state.hd;
  return {
    sx: h.sexo,
    age: lerNumero(v('hd-idade')),
    tc: lerNumero(v('hd-ct')),
    hdl: lerNumero(v('hd-hdl')),
    sbp: v('hd-pas') ? lerNumero(v('hd-pas')) : pasConsulta(),
    bmi: v('hd-imc') ? lerNumero(v('hd-imc')) : (imc() ?? NaN),
    egfr: v('hd-tfg') ? lerNumero(v('hd-tfg')) : t ? t.g : NaN,
    dm: h.dm,
    smk: h.tab,
    bptx: h.antiht,
    st: h.estatina,
    dcv: h.dcv,
  };
}
export function prevent() {
  const o = preventInputs();
  return calcularPrevent({ ...o, eventoPrevio: o.dcv === '1' || o.dcv === '2' });
}

/** Categorias SBC no formato usado na tela: [nome, classe, LDL, redução, não-HDL, ApoB]. */
const CLASSE_CATEGORIA_SBC = { baixo: 'k-ok', inter: 'k-warn', alto: 'k-mid', mu: 'k-bad', ext: 'k-bad' };
const SBC_CAT = Object.fromEntries(
  Object.entries(METAS_SBC).map(([k, m]) => [k, [m.nome, CLASSE_CATEGORIA_SBC[k], m.ldl, m.reducao, m.naoHdl, m.apoB]]),
);

/** Categoria de risco da SBC 2025 com os dados da consulta. */
export function sbc(pv, t) {
  const h = state.hd,
    g = v('hd-tfg') ? lerNumero(v('hd-tfg')) : t ? t.g : NaN;
  return estratificarSbc(
    {
      idade: lerNumero(v('hd-idade')),
      sexo: h.sexo,
      ldl: lerNumero(v('hd-ldl')),
      lpa: lerNumero(v('hd-lpa')),
      cac: lerNumero(v('hd-cac')),
      ct: lerNumero(v('hd-ct')),
      tfg: g,
      hipertensao: h.antiht === '1' || state.chips.ant.includes('HAS') || state.chips.prior.includes('Hipertensão'),
      tabagismo: h.tab === '1',
      diabetes: h.dm === '1',
      albuminuria: (t && t.al) || 'A1',
      estagioTexto: t ? t.st : 'TFG',
      eventos: h.dcv,
      aterosclerose: h.ath || [],
      condicoes: h.cond,
      estratificadoresAlto: h.ear,
      estratificadoresMuitoAlto: h.emar,
      agravantes: h.agr,
    },
    pv,
  );
}

/** Situação do LDL-c e do não-HDL em relação às metas da categoria. */
export function sbcTargets(res) {
  const c = SBC_CAT[res.k],
    ldl = lerNumero(v('hd-ldl')),
    ct = lerNumero(v('hd-ct')),
    hdl = lerNumero(v('hd-hdl')),
    nh = ct > 0 && hdl > 0 ? ct - hdl : null,
    st = [];
  if (ldl > 0) st.push([`LDL-c ${ldl} mg/dL`, ldl < c[2]]);
  if (nh != null) st.push([`não-HDL ${nh} mg/dL`, nh < c[4]]);
  return { c, st };
}

/** Pé diabético com os testes marcados na aba. */
export const pe = () => classificarPeDiabetico(state.hd.feet, state.hd);

/** Descrição dos testes de um pé ('d' ou 'e') para o texto. */
export function footDesc(s) {
  const f = state.hd.feet[s];
  const parts = [];
  FOOT_TESTS.forEach(t => {
    if (f[t.k])
      parts.push(
        `${t.t.split(' /')[0].replace(' post.', '')} ${(t.o.find(o => o[0] === f[t.k]) || [])[1].toLowerCase()}`,
      );
  });
  return parts.join(', ');
}

/** FINDRISC com os dados da consulta. */
export function findrisc() {
  const h = state.hd,
    f = h.fr;
  return calcularFindrisc({
    diabetes: h.dm,
    idade: lerNumero(v('hd-idade')),
    imc: v('hd-imc') ? lerNumero(v('hd-imc')) : (imc() ?? NaN),
    cintura: lerNumero(v('sv-ca')),
    sexo: h.sexo,
    antiHipertensivo: h.antiht,
    ativ: f.ativ,
    frutas: f.frutas,
    glic: f.glic,
    fam: f.fam,
  });
}

/** Dia de doença da ficha de dengue. */
export const dgDay = () => diaDeDoenca(v('dg-inicio'));

/** Grupo da dengue com a ficha atual. */
export const dgGroup = () => grupoDengue(state.dg);

/** Volume de hidratação: o digitado ou o sugerido pelo peso. */
export function dgLiq() {
  if (state.dg.liq) return state.dg.liq;
  return volumeHidratacaoOral(lerNumero(v('sv-peso')));
}
