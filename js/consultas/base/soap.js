/**
 * Montagem do texto SOAP da base: dados comuns, queixas do dia (com dengue/COVID/influenza) e HiperDia.
 */
import { mesmoRelato } from '../texto-inteligente.js';
import { finalizarFrase, formatarNumero } from '../../utils/texto.js';
import { dgDay, dgGroup, dgLiq, footDesc, imc, sbcTargets } from './calculos.js';
import { DG, DG_ORIENT, NA_TEXT, QM } from './dados.js';
import { chronic, line, list, state, temTipo, v } from './estado.js';

export function buildSOAP(R) {
  const S = [],
    O = [],
    A = [],
    P = [],
    hdOn = temTipo('hiperdia'),
    queixasOn = temTipo('queixas');
  const identificacao = [
    { F: 'sexo feminino', M: 'sexo masculino' }[state.hd.sexo],
    v('hd-idade') && `${v('hd-idade')} anos`,
  ]
    .filter(Boolean)
    .join(', ');
  line(S, 'Identificação', identificacao);
  line(S, 'Motivo da consulta', v('f-motivo'));
  const lc = s => s.charAt(0).toLowerCase() + s.slice(1),
    L_ = a => a.map(lc).join(', ');
  const g = state.dg,
    gOn = g.on && queixasOn;
  if (gOn) {
    const d = dgDay();
    S.push(
      'Suspeita de dengue / COVID-19 / influenza.' +
        (v('dg-inicio') ? ` Início dos sintomas: ${v('dg-inicio')}${d ? ` (${d}º dia de doença)` : ''}.` : ''),
    );
    const PL = 'Prova do laço positiva';
    const sp = DG.sint.filter(s => g.sint[s] === '+'),
      sa = DG.sint.filter(s => g.sint[s] === '-' && s !== PL);
    if (sp.length || sa.length || g.sint[PL] === '-')
      S.push(
        [
          sp.length ? `Sintomas: ${L_(sp)}.` : '',
          sa.length ? `Nega: ${L_(sa)}.` : '',
          g.sint[PL] === '-' ? 'Prova do laço negativa.' : '',
        ]
          .filter(Boolean)
          .join(' '),
      );
    if (g.prev.length) S.push(`Doenças pré-existentes: ${g.prev.includes('Nenhuma') ? 'nenhuma' : L_(g.prev)}.`);
    if (g.gest) S.push(`Gestante: ${{ sim: 'sim', nao: 'não', na: 'não se aplica' }[g.gest]}.`);
    if (g.contato)
      S.push(
        `Contato com caso positivo de COVID-19: ${g.contato === 'sim' ? 'sim' + (v('dg-contato-txt') ? ' – ' + v('dg-contato-txt') : '') : 'não'}.`,
      );
    line(S, 'COVID prévio', v('dg-covid-prev'));
    line(S, 'Vacinas', v('dg-vacinas'));
    line(S, 'Ocupação', v('dg-ocup'));
    if (g.viagem)
      S.push(
        `Deixou o município nos últimos 15 dias: ${g.viagem === 'sim' ? 'sim' + (v('dg-viagem-txt') ? ' – ' + v('dg-viagem-txt') : '') : 'não'}.`,
      );
  }
  if (queixasOn)
    state.q.forEach(it => {
      const q = QM[it.id];
      if (!q) return;
      const det = [it.dur, it.carac, q.dor && it.intens ? `intensidade ${it.intens}/10` : '', it.fat, it.trat]
        .map(x => (x || '').trim())
        .filter(Boolean)
        .join('; ');
      const pr = q.a.filter(s => it.s[s] === '+'),
        au = q.a.filter(s => it.s[s] === '-'),
        ap = q.al.filter(s => it.s[s] === '+'),
        aa = q.al.filter(s => it.s[s] === '-');
      const parts = [`${q.n}${det ? ` (${det})` : ''}.`];
      if (pr.length) parts.push(`Refere: ${L_(pr)}.`);
      if (au.length) parts.push(`Nega: ${L_(au)}.`);
      if (ap.length) parts.push(`SINAL DE ALARME: ${L_(ap)}.`);
      if (aa.length) parts.push(`Sinais de alarme pesquisados e ausentes: ${L_(aa)}.`);
      S.push(parts.join(' '));
    });
  if (!mesmoRelato(v('f-motivo'), v('f-hda'))) line(S, 'HDA', v('f-hda'));
  const historia = S.join('\n');
  if (!state.na.cont) line(S, 'Acompanhamento', v('f-cont'));
  line(S, 'Antecedentes', list(state.chips.ant, v('f-ant-obs')));
  line(S, 'Medicamentos em uso', state.semMeds ? 'Sem medicamentos de uso contínuo' : v('f-meds'));
  if (state.alergia === 'nega') S.push('Alergias: nega alergias conhecidas.');
  else if (state.alergia === 'sim') line(S, 'Alergias', v('f-alergia-txt') || 'refere alergia (especificar)');
  line(S, 'Fatores de risco/hábitos', list(state.chips.risco, v('f-risco-obs')));

  const sv = [];
  const add = (id, lab, un) => {
    if (v(id)) sv.push(`${lab} ${v(id)}${un}`);
  };
  add('sv-pa', 'PA', ' mmHg');
  add('sv-fc', 'FC', ' bpm');
  add('sv-fr', 'FR', ' irpm');
  add('sv-tax', 'Tax', ' °C');
  add('sv-spo2', 'SpO2', '%');
  add('sv-hgt', 'HGT', ' mg/dL');
  add('sv-peso', 'Peso', ' kg');
  add('sv-alt', 'Altura', ' m');
  const i = imc();
  if (i) sv.push(`IMC ${formatarNumero(i)} kg/m²`);
  add('sv-ca', 'CA', ' cm');
  if (sv.length) O.push('Sinais vitais: ' + sv.join(' | ') + '.');
  if (v('f-exame')) O.push('Exame físico: ' + v('f-exame').replace(/\n+/g, ' '));
  if (hdOn && state.hd.inc.pe) {
    const d = footDesc('d'),
      e = footDesc('e'),
      x = [];
    if (d) x.push(`PD – ${d}`);
    if (e) x.push(`PE – ${e}`);
    const extra = [];
    if (state.hd.deform) extra.push(state.hd.deform === '1' ? 'presença de deformidade' : 'sem deformidades');
    if (state.hd.ulcativa) extra.push(state.hd.ulcativa === '1' ? 'úlcera ativa' : 'sem úlceras ativas');
    if (x.length || extra.length)
      O.push('Avaliação dos pés: ' + finalizarFrase([x.join('; '), extra.join(', ')].filter(Boolean).join('. ')));
  }
  if (gOn) {
    const al = g.alarme,
      ch = g.choque;
    if (al.length) O.push(`Sinais de alarme: ${al.includes('Nenhum') ? 'ausentes' : 'PRESENTES – ' + L_(al)}.`);
    if (ch.length) O.push(`Sinais de choque: ${ch.includes('Nenhum') ? 'ausentes' : 'PRESENTES – ' + L_(ch)}.`);
    const t = [
      v('dg-teste-covid') ? `COVID – ${v('dg-teste-covid')}` : '',
      v('dg-teste-dengue') ? `dengue – ${v('dg-teste-dengue')}` : '',
    ].filter(Boolean);
    if (t.length) O.push(`Testes: ${t.join('; ')}.`);
  }
  if (!state.na.result) line(O, 'Exames complementares', v('f-result'));
  if (hdOn && state.hd.inc.tfg && R.tfg) {
    const t = R.tfg;
    O.push(
      `TFG (CKD-EPI 2021): ${formatarNumero(t.g, 0)} mL/min/1,73 m² – ${t.st} (creatinina ${formatarNumero(t.cr, 2).replace(/0$/, '')} mg/dL${v('hd-crdata') ? ' em ' + v('hd-crdata') : ''})${t.al ? `; RAC ${formatarNumero(t.rac, 0)} mg/g – ${t.al}` : ''}.`,
    );
  }

  line(A, 'Avaliação', v('f-aval'));
  line(A, 'Hipótese diagnóstica', v('f-hd'));
  const cr = chronic().map(c => (state.cron[c] ? `${c} – ${state.cron[c].toLowerCase()}` : c));
  line(A, 'Condições crônicas', [cr.join('; '), v('f-cron-obs')].filter(Boolean).join('. '));
  if (hdOn && state.hd.inc.rcv) {
    const pv = R.prev;
    if (!pv.dcv && pv.cvd != null && !pv.miss && !pv.out)
      A.push(
        `PREVENT (10 anos): DCV aterosclerótica ${formatarNumero(pv.ascvd)}%; DCV total ${formatarNumero(pv.cvd)}%${pv.hf != null ? `; insuficiência cardíaca ${formatarNumero(pv.hf)}%` : ''}.`,
      );
    const sb = R.sbc;
    if (!sb.miss) {
      const T = sbcTargets(sb);
      A.push(
        `Risco cardiovascular (Diretriz SBC 2025): ${T.c[0].toLowerCase()} – ${sb.why.join('; ')}. Metas: LDL-c < ${T.c[2]} mg/dL (redução ${T.c[3]}), não-HDL < ${T.c[4]} mg/dL${T.st.length ? `; ${T.st.map(([l, ok]) => `${l} ${ok ? 'na meta' : 'acima da meta'}`).join(', ')}` : ''}.`,
      );
    }
  }
  if (hdOn && state.hd.inc.tfg && R.tfg && (R.tfg.g < 60 || (R.tfg.al && R.tfg.al !== 'A1')))
    A.push(`Função renal: DRC ${R.tfg.st}${R.tfg.al ? ' ' + R.tfg.al : ''} (KDIGO).`);
  if (hdOn && state.hd.inc.pe && !R.pe.miss)
    A.push(
      `Pé diabético: categoria de risco ${R.pe.cat} (MS 2016) – ${R.pe.txt}${R.pe.ativa ? '; úlcera ativa' : ''}.`,
    );
  if (hdOn && state.hd.inc.fr && R.fr.p != null)
    A.push(
      `FINDRISC: ${R.fr.p} pontos – risco ${R.fr.c[0].toLowerCase()} de diabetes tipo 2 em 10 anos (${R.fr.c[1]}).`,
    );
  if (gOn && g.inc) {
    const r = dgGroup();
    if (!r.miss)
      A.push(`Dengue – classificação de risco (MS): grupo ${r.gr}${r.why.length ? ` (${r.why.join(', ')})` : ''}.`);
    if (r.resp.length) A.push(`Sinais de gravidade respiratória presentes: ${L_(r.resp)}.`);
  }
  line(A, 'Condições prioritárias', list(state.chips.prior, v('f-prior-obs')));

  if (state.na.exsol) P.push(NA_TEXT.exsol);
  else line(P, 'Exames solicitados', v('f-exsol'));
  line(P, 'Conduta', v('f-conduta'));
  if (state.na.presc) P.push(NA_TEXT.presc);
  else {
    const rows = state.presc.filter(r => r.m.trim());
    if (rows.length)
      P.push(
        'Prescrição:\n' +
          rows
            .map((r, k) => `${k + 1}. ${[r.m.trim(), r.p.trim(), r.d.trim()].filter(Boolean).join(' — ')}`)
            .join('\n'),
      );
  }
  line(P, 'Orientações', list(state.chips.orient, v('f-orient-obs')));
  if (gOn && g.orient.length) {
    const ls = DG_ORIENT.filter(([id]) => g.orient.includes(id)).map(
      ([id, , t]) => '→ ' + t.replace('{liq}', dgLiq() || '___').replace('{atest}', g.atest || '___'),
    );
    P.push('Orientações (síndrome febril / gripal):\n' + ls.join('\n'));
  }
  if (!state.na.alarme) {
    const al = list(state.chips.alarme, v('f-alarme-obs'));
    if (al)
      P.push(
        `Sinais de alarme orientados: ${finalizarFrase(al)} Orientado(a) a procurar atendimento imediato se presentes.`,
      );
  }
  if (state.na.enc) P.push(NA_TEXT.enc);
  else line(P, 'Encaminhamentos', v('f-enc'));
  if (!state.na.prev) line(P, 'Vacinação/prevenção', list(state.chips.prev, v('f-prev-obs')));
  if (hdOn && state.hd.inc.pe && !R.pe.miss) P.push(`Reavaliação dos pés: ${R.pe.fu}.`);
  line(P, 'Seguimento', [v('f-retorno'), v('f-seg')].filter(Boolean).join(' – '));
  return { historia, S: S.join('\n'), O: O.join('\n'), A: A.join('\n'), P: P.join('\n') };
}
