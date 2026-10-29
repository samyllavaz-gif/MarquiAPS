/**
 * Base da consulta (dados comuns, queixas do dia e HiperDia): atualização do SOAP, cópia, eventos,
 * exemplo e leitura/escrita do rascunho. Quem junta com os módulos, salva e limpa é ../consulta.js.
 */
import { inserirTrechoUnico } from '../texto-inteligente.js';
import { $, $$ } from '../../utils/dom.js';
import { formatarNumero } from '../../utils/texto.js';
import { dgLiq, findrisc, imc, pasConsulta, pe, prevent, sbc, tfgCalc } from './calculos.js';
import { DG, DG_ORIENT, EF, NEG, TEXT_IDS } from './dados.js';
import { blank, blankDg, soap, soapBase, state, substituirEstado, temTipo, v } from './estado.js';
import { EX_BASE, EX_HD } from './exemplos.js';
import {
  renderChips,
  renderCron,
  renderDengue,
  renderDgOrient,
  renderDgResult,
  renderFeet,
  renderHdChips,
  renderPicker,
  renderPresc,
  renderQueixas,
  renderResults,
  renderToggles,
} from './render.js';
import { buildSOAP } from './soap.js';

export function update() {
  const i = imc();
  $('#sv-imc').textContent = i ? formatarNumero(i) : '—';
  const pa = pasConsulta();
  $('#hd-pas').placeholder = isNaN(pa) ? '—' : `${pa} (consulta)`;
  $('#hd-imc').placeholder = i ? `${formatarNumero(i)} (consulta)` : '—';
  renderToggles();
  const R = { tfg: tfgCalc(), prev: prevent(), pe: pe(), fr: findrisc() };
  R.sbc = sbc(R.prev, R.tfg);
  renderDgResult();
  const li = $('#dg-liq-in');
  if (li) li.placeholder = dgLiq() || 'mL';
  $('#hd-tfg').placeholder = R.tfg ? `${formatarNumero(R.tfg.g, 0)} (aba TFG)` : '—';
  if (temTipo('hiperdia')) renderResults(R);
  Object.assign(soapBase, buildSOAP(R));
  aoAtualizar();
}

let aoAtualizar = () => {};
/** Função chamada sempre que o texto da base muda (a consulta junta com os módulos, mostra e salva). */
export function definirAoAtualizarBase(fn) {
  aoAtualizar = fn;
}

/* ---------- copiar e navegar ---------- */
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1800);
}
function selectText(el) {
  const r = document.createRange();
  r.selectNodeContents(el);
  const s = getSelection();
  s.removeAllRanges();
  s.addRange(r);
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-copy]');
  if (!b) return;
  const k = b.dataset.copy;
  const txt =
    k === 'all'
      ? ['S', 'O', 'A', 'P']
          .filter(x => soap[x])
          .map(x => `${x}:\n${soap[x]}`)
          .join('\n\n')
      : soap[k];
  if (!txt) {
    toast('Esse bloco ainda está vazio');
    return;
  }
  const fallback = () => {
    selectText(k === 'all' ? $('#saida') : $('#out-' + k));
    toast('Texto selecionado: use Ctrl+C');
  };
  try {
    navigator.clipboard
      .writeText(txt)
      .then(() => toast(k === 'all' ? 'SOAP completo copiado' : `Bloco ${k} copiado`), fallback);
  } catch (err) {
    fallback();
  }
});

/* ---------- eventos ---------- */
TEXT_IDS.forEach(id => {
  const e = document.getElementById(id);
  e.addEventListener('input', update);
  e.addEventListener('change', update);
});
$$('.na-btn').forEach(
  b =>
    (b.onclick = () => {
      state.na[b.dataset.na] = !state.na[b.dataset.na];
      update();
    }),
);
$('#flag-semmeds').onclick = () => {
  state.semMeds = !state.semMeds;
  update();
};
$$('#seg-alergia button').forEach(
  b =>
    (b.onclick = () => {
      state.alergia = state.alergia === b.dataset.v ? '' : b.dataset.v;
      update();
      if (state.alergia === 'sim') $('#f-alergia-txt').focus();
    }),
);
$$('.seg[data-hd]').forEach(seg =>
  seg.querySelectorAll('button').forEach(
    b =>
      (b.onclick = () => {
        const k = seg.dataset.hd;
        state.hd[k] = state.hd[k] === b.dataset.v ? '' : b.dataset.v;
        update();
      }),
  ),
);
$$('.tool-tabs button').forEach(
  b =>
    (b.onclick = () => {
      state.hd.tab_ = b.dataset.tab;
      update();
    }),
);
['rcv', 'tfg', 'pe', 'fr'].forEach(
  k =>
    ($('#inc-' + k).onchange = e => {
      state.hd.inc[k] = e.target.checked;
      update();
    }),
);
$$('.seg[data-fr]').forEach(seg =>
  seg.querySelectorAll('button').forEach(
    b =>
      (b.onclick = () => {
        const k = seg.dataset.fr;
        state.hd.fr[k] = state.hd.fr[k] === b.dataset.v ? '' : b.dataset.v;
        update();
      }),
  ),
);
$('#dg-toggle').onclick = () => {
  state.dg.on = !state.dg.on;
  renderPicker();
  renderDengue();
  update();
  if (state.dg.on) $('#dg-inicio').focus();
};
$('#dg-close').onclick = () => {
  state.dg.on = false;
  renderPicker();
  renderDengue();
  update();
};
$$('.seg[data-dgseg]').forEach(seg =>
  seg.querySelectorAll('button').forEach(
    b =>
      (b.onclick = () => {
        const k = seg.dataset.dgseg;
        state.dg[k] = state.dg[k] === b.dataset.v ? '' : b.dataset.v;
        renderDengue();
        update();
      }),
  ),
);
$('[data-dgrest="sint"]').onclick = () => {
  DG.sint.forEach(s => {
    if (!state.dg.sint[s]) state.dg.sint[s] = '-';
  });
  renderDengue();
  update();
};
$('#inc-dg').onchange = e => {
  state.dg.inc = e.target.checked;
  update();
};
$$('[data-pack]').forEach(
  b =>
    (b.onclick = () => {
      const k = b.dataset.pack;
      if (k === 'none') state.dg.orient = [];
      else
        DG_ORIENT.forEach(([id, kind]) => {
          if ((kind === k || kind === 'ambos') && !state.dg.orient.includes(id)) state.dg.orient.push(id);
        });
      renderDgOrient();
      update();
    }),
);
$('#presc-add').onclick = () => {
  state.presc.push({ m: '', p: '', d: '' });
  renderPresc();
  document.getElementById('pm-' + (state.presc.length - 1)).focus();
};
const qef = $('#quick-ef');
Object.entries(EF).forEach(([k, t]) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = k;
  b.onclick = () => {
    const ta = $('#f-exame');
    ta.value = inserirTrechoUnico(ta.value, t);
    update();
    ta.focus();
  };
  qef.appendChild(b);
});
$('#hd-puxar').onclick = () => {
  const a = state.chips.ant,
    r = state.chips.risco,
    pr = state.chips.prior;
  state.hd.dm = a.includes('DM2') || pr.includes('Diabetes') ? '1' : '0';
  state.hd.tab = r.includes('Tabagismo') ? '1' : '0';
  state.hd.antiht = a.includes('HAS') || pr.includes('Hipertensão') ? state.hd.antiht || '1' : state.hd.antiht || '0';
  state.hd.dcv = a.includes('DAC / IAM prévio') || a.includes('AVC prévio') ? '1' : '0';
  if (/estatina|sinva|atorva|rosuva|prava/i.test(v('f-meds'))) state.hd.estatina = '1';
  update();
  toast('Diabetes, tabagismo, anti-hipertensivo e DCV preenchidos a partir da consulta. Confira.');
};

/** Preenche a base com o exemplo (o de HiperDia quando esse tipo está marcado). */
export function carregarExemploBase() {
  substituirEstado(blank());
  const hiperdia = temTipo('hiperdia');
  const ex = hiperdia ? EX_HD : EX_BASE;
  TEXT_IDS.forEach(id => (document.getElementById(id).value = ex[id] || ''));
  state.alergia = 'nega';
  if (hiperdia) {
    state.chips.ant = ['HAS', 'DM2', 'Dislipidemia'];
    state.cron = { HAS: 'Não controlada', DM2: 'Não controlada', Dislipidemia: 'Não controlada' };
    state.chips.risco = ['Ex-tabagista', 'Sedentarismo', 'Excesso de peso'];
    state.chips.prior = ['Pessoa idosa (≥ 60 anos)', 'Hipertensão', 'Diabetes'];
    state.chips.orient = [
      'Uso correto das medicações',
      'Redução do sal',
      'Atividade física regular',
      'Cuidados com os pés',
      'Monitorar PA domiciliar',
    ];
    state.chips.alarme = ['Dor no peito', 'Falta de ar', 'PA ≥ 180/110 com sintomas', 'Ferida ou mudança de cor no pé'];
    state.chips.prev = [
      'Caderneta de vacinação avaliada',
      'Vacinação em dia',
      'Avaliação dos pés (DM)',
      'Fundo de olho solicitado',
    ];
    state.na.enc = true;
    state.presc = [
      { m: 'Losartana 50 mg', p: '1 cp VO 12/12h', d: 'Uso contínuo' },
      { m: 'Anlodipino 5 mg', p: '1 cp VO pela manhã', d: 'Uso contínuo' },
      { m: 'Metformina 850 mg', p: '1 cp VO após almoço e jantar', d: 'Uso contínuo' },
      { m: 'Sinvastatina 40 mg', p: '1 cp VO à noite', d: 'Uso contínuo' },
    ];
    Object.assign(state.hd, {
      sexo: 'F',
      dm: '1',
      tab: '0',
      antiht: '1',
      estatina: '0',
      dcv: '0',
      deform: '0',
      ulcprev: '0',
      amput: '0',
      ulcativa: '0',
      feet: {
        d: { mono: 'n', diap: 'n', refl: 'n', dor: 'n', pulso: 'n' },
        e: { mono: 'a', diap: 'a', refl: 'n', dor: 'n', pulso: 'n' },
      },
    });
  } else {
    state.chips.ant = [NEG.ant];
    state.chips.risco = [NEG.risco];
    state.chips.prior = [NEG.prior];
    state.semMeds = true;
    state.na.enc = true;
    state.na.cont = true;
    state.na.result = true;
    state.na.prev = true;
    state.na.alarme = true;
    state.presc = [
      { m: 'Dipirona 500 mg', p: '1 cp VO 6/6h se dor ou febre', d: 'até 5 dias' },
      { m: 'Sais de reidratação oral', p: '1 envelope diluído em 1 L de água, beber ao longo do dia', d: '5 dias' },
    ];
    const t = new Date();
    t.setDate(t.getDate() - 2);
    document.getElementById('dg-inicio').value =
      `${String(t.getDate()).padStart(2, '0')}/${String(t.getMonth() + 1).padStart(2, '0')}/${t.getFullYear()}`;
    state.dg = Object.assign(blankDg(), {
      on: true,
      gest: 'na',
      contato: 'nao',
      viagem: 'nao',
      prev: ['Nenhuma'],
      alarme: ['Nenhum'],
      choque: ['Nenhum'],
      sint: {
        Febre: '+',
        Mialgia: '+',
        Cefaleia: '+',
        'Dor retro-orbitária': '+',
        Náuseas: '+',
        Vômito: '-',
        Tosse: '-',
        Dispneia: '-',
        Exantema: '-',
        Petéquias: '-',
        'Prova do laço positiva': '-',
        Diarreia: '-',
        'Dor abdominal': '-',
      },
      orient: ['cartao', 'pa', 'repel', 'aine', 'repouso', 'sintd', 'liq', 'atest'],
      atest: '3',
    });
  }
  renderAll();
}

/* ---------- rascunho ---------- */
/** Textos e marcações da base, para salvar no rascunho. */
export function rascunhoDaBase() {
  const t = {};
  TEXT_IDS.forEach(id => (t[id] = document.getElementById(id).value));
  return { t, state };
}

/** Esvazia a base (textos e marcações). */
export function limparBase() {
  substituirEstado(blank());
  TEXT_IDS.forEach(id => (document.getElementById(id).value = ''));
}

/** Carrega na base um rascunho salvo por rascunhoDaBase(). */
export function aplicarRascunhoBase(d) {
  limparBase();
  if (!d) return;
  try {
    Object.entries(d.t || {}).forEach(([id, val]) => {
      const e = document.getElementById(id);
      if (e) e.value = val;
    });
    const b = blank(),
      s = d.state || {};
    substituirEstado(Object.assign(b, s));
    state.chips = Object.assign(blank().chips, s.chips || {});
    state.hd = Object.assign(blank().hd, s.hd || {});
    ['ath', 'cond', 'ear', 'emar', 'agr'].forEach(k => {
      if (!Array.isArray(state.hd[k])) state.hd[k] = [];
    });
    state.hd.feet = Object.assign({ d: {}, e: {} }, state.hd.feet);
    state.hd.fr = state.hd.fr || {};
    state.hd.inc = Object.assign({ rcv: true, tfg: true, pe: true, fr: true }, state.hd.inc);
    state.dg = Object.assign(blankDg(), s.dg || {});
    state.q = Array.isArray(s.q) ? s.q : [];
    if (!state.presc || !state.presc.length) state.presc = [{ m: '', p: '', d: '' }];
  } catch (e) {}
}
export function renderAll() {
  renderHdChips();
  renderChips();
  renderCron();
  renderPresc();
  renderFeet();
  renderPicker();
  renderQueixas();
  renderDengue();
  update();
}
