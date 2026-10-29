/**
 * Desenho das partes dinâmicas da base da consulta: chips, condições crônicas,
 * prescrição, pés, queixas frequentes, ficha de dengue e resultados das ferramentas do HiperDia.
 */
import { CRITERIOS_SBC } from '../../regras/cardiovascular.js';
import { $, $$ } from '../../utils/dom.js';
import { formatarNumero, lerNumero } from '../../utils/texto.js';
import { update } from './app.js';
import { dgDay, dgGroup, dgLiq, imc, sbcTargets } from './calculos.js';
import { CHIPS, CRON_STATUS, DG, DG_GROUPS, DG_ORIENT, FOOT_TESTS, NEG, Q, QG, QM } from './dados.js';
import { chronic, state, temTipo, v } from './estado.js';

export function renderChips() {
  $$('.chips[data-group]').forEach(box => {
    const g = box.dataset.group;
    const aberto = box.querySelector('details')?.open || false;
    box.innerHTML = '';
    let extras;
    if (['ant', 'risco'].includes(g)) {
      extras = document.createElement('details');
      extras.open = aberto;
      extras.className = 'opcoes-extras';
      const titulo = document.createElement('summary');
      titulo.textContent = 'Mais opções';
      extras.appendChild(titulo);
    }
    CHIPS[g].forEach((lbl, indice) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (Object.values(NEG).includes(lbl) ? ' neg' : '');
      b.textContent = lbl;
      b.setAttribute('aria-pressed', state.chips[g].includes(lbl));
      b.onclick = () => {
        const arr = state.chips[g],
          i = arr.indexOf(lbl),
          neg = NEG[g];
        if (i >= 0) arr.splice(i, 1);
        else {
          if (lbl === neg) arr.length = 0;
          else if (neg) {
            const k = arr.indexOf(neg);
            if (k >= 0) arr.splice(k, 1);
          }
          arr.push(lbl);
        }
        renderChips();
        if (g === 'ant') renderCron();
        update();
      };
      if (extras && indice >= 8 && !state.chips[g].includes(lbl)) extras.appendChild(b);
      else box.appendChild(b);
    });
    if (extras?.children.length > 1) box.appendChild(extras);
  });
}
export function renderCron() {
  const box = $('#cron-list');
  box.innerHTML = '';
  if (state.chips.ant.includes(NEG.ant)) {
    box.innerHTML = '<div class="empty">Paciente sem comorbidades.</div>';
    return;
  }
  const cr = chronic();
  if (!cr.length) {
    box.innerHTML =
      '<div class="empty">Marque os antecedentes em S para classificar o controle de cada condição crônica aqui.</div>';
    return;
  }
  cr.forEach(c => {
    const row = document.createElement('div');
    row.className = 'cron-row';
    row.innerHTML = '<b></b><div class="seg"></div>';
    row.querySelector('b').textContent = c;
    const seg = row.querySelector('.seg');
    CRON_STATUS.forEach(st => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = st;
      b.setAttribute('aria-pressed', state.cron[c] === st);
      b.onclick = () => {
        state.cron[c] = state.cron[c] === st ? '' : st;
        renderCron();
        update();
      };
      seg.appendChild(b);
    });
    box.appendChild(row);
  });
}
export function renderPresc() {
  const box = $('#presc');
  box.innerHTML = '';
  state.presc.forEach((r, i) => {
    const row = document.createElement('div');
    row.className = 'presc-row';
    row.innerHTML = `<span class="num">${i + 1}</span>
      <input type="text" id="pm-${i}" aria-label="Medicamento ${i + 1}" placeholder="Amoxicilina 500 mg">
      <input type="text" id="pp-${i}" aria-label="Posologia ${i + 1}" placeholder="1 cáps VO 8/8h">
      <input type="text" id="pd-${i}" aria-label="Duração ${i + 1}" placeholder="7 dias">
      <button type="button" class="del" aria-label="Remover medicamento ${i + 1}">×</button>`;
    const [m, p, d] = row.querySelectorAll('input');
    m.value = r.m;
    p.value = r.p;
    d.value = r.d;
    m.oninput = () => {
      r.m = m.value;
      update();
    };
    p.oninput = () => {
      r.p = p.value;
      update();
    };
    d.oninput = () => {
      r.d = d.value;
      update();
    };
    row.querySelector('.del').onclick = () => {
      state.presc.splice(i, 1);
      if (!state.presc.length) state.presc.push({ m: '', p: '', d: '' });
      renderPresc();
      update();
    };
    box.appendChild(row);
  });
}
export function renderFeet() {
  $$('.foot').forEach(box => {
    const s = box.dataset.foot;
    box.querySelectorAll('.r').forEach(n => n.remove());
    FOOT_TESTS.forEach(t => {
      const r = document.createElement('div');
      r.className = 'r';
      r.innerHTML = `<span>${t.t}</span><div class="seg">${t.o.map(([k, l]) => `<button type="button" data-v="${k}" aria-pressed="${state.hd.feet[s][t.k] === k}">${l}</button>`).join('')}</div>`;
      r.querySelectorAll('button').forEach(
        b =>
          (b.onclick = () => {
            const f = state.hd.feet[s];
            f[t.k] = f[t.k] === b.dataset.v ? '' : b.dataset.v;
            renderFeet();
            update();
          }),
      );
      box.appendChild(r);
    });
  });
}
function triBtn(label, cur, al, on) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'tri' + (al ? ' al' : '');
  b.textContent = label;
  b.dataset.s = cur || '';
  b.title = 'Clique: presente → ausente → não investigado';
  b.onclick = () => on(!cur ? '+' : cur === '+' ? '-' : '');
  return b;
}
export function renderPicker() {
  const box = $('#qgroups');
  box.innerHTML = '';
  QG.forEach((g, gi) => {
    const d = document.createElement('div');
    d.className = 'qgroup';
    d.innerHTML = `<h4>${g}</h4><div class="chips"></div>`;
    const c = d.querySelector('.chips');
    Q.filter(q => q.g === gi).forEach(q => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.textContent = q.n;
      const on = state.q.some(x => x.id === q.id);
      b.setAttribute('aria-pressed', on);
      b.onclick = () => {
        if (on) state.q = state.q.filter(x => x.id !== q.id);
        else state.q.push({ id: q.id, s: {}, dur: '', carac: '', intens: '', fat: '', trat: '' });
        renderPicker();
        renderQueixas();
        update();
      };
      c.appendChild(b);
    });
    box.appendChild(d);
  });
  $('#dg-toggle').setAttribute('aria-pressed', state.dg.on);
}
function qCard(it) {
  const q = QM[it.id],
    el = document.createElement('div');
  el.className = 'qcard';
  const inp = (k, lab, ph, w) =>
    `<label class="lbl"${w ? ` style="max-width:${w}"` : ''}>${lab}<input type="text" id="q-${q.id}-${k}" placeholder="${ph}"></label>`;
  el.innerHTML = `<div class="qcard-h"><h3>${q.n}</h3><button type="button" class="btn small x">Remover</button></div>
    <p class="ask">Pergunte: início e duração, evolução, intensidade, episódios anteriores, fatores de melhora e piora, impacto nas atividades e tratamentos tentados.</p>
    <div class="grid-in" style="grid-template-columns:repeat(auto-fill,minmax(190px,1fr))">
      ${inp('dur', 'Início / duração / evolução', 'há 5 dias, piorando')}
      ${inp('carac', q.dor ? 'Localização, tipo e irradiação' : 'Características', q.h || (q.dor ? 'occipital, em aperto, sem irradiação' : ''))}
      ${q.dor ? inp('intens', 'Intensidade (0–10)', '6') : ''}
      ${inp('fat', 'Fatores de melhora / piora', 'piora à noite')}
      ${inp('trat', 'Tratamentos tentados e resposta', 'dipirona, melhora parcial')}
    </div>
    <div class="blk alarm"><div class="blk-h">Sinais de alarme <button type="button" class="lnk" data-rest="al">marcar não assinalados como ausentes</button></div><div class="chips" data-k="al"></div></div>
    <div class="blk"><div class="blk-h">Sintomas associados <button type="button" class="lnk" data-rest="a">marcar não assinalados como ausentes</button></div><div class="chips" data-k="a"></div></div>
    ${q.note ? `<p class="qnote">${q.note}</p>` : ''}`;
  ['dur', 'carac', 'intens', 'fat', 'trat'].forEach(k => {
    const i = el.querySelector(`#q-${q.id}-${k}`);
    if (!i) return;
    i.value = it[k] || '';
    i.oninput = () => {
      it[k] = i.value;
      update();
    };
  });
  el.querySelector('.x').onclick = () => {
    state.q = state.q.filter(x => x !== it);
    renderPicker();
    renderQueixas();
    update();
  };
  const redraw = () => {
    const n = qCard(it);
    el.replaceWith(n);
    update();
  };
  ['al', 'a'].forEach(k => {
    const box = el.querySelector(`.chips[data-k="${k}"]`);
    q[k].forEach(s =>
      box.appendChild(
        triBtn(s, it.s[s], k === 'al', nx => {
          if (nx) it.s[s] = nx;
          else delete it.s[s];
          redraw();
        }),
      ),
    );
    el.querySelector(`[data-rest="${k}"]`).onclick = () => {
      q[k].forEach(s => {
        if (!it.s[s]) it.s[s] = '-';
      });
      redraw();
    };
  });
  if (q.al.some(s => it.s[s] === '+')) el.querySelector('.blk.alarm').classList.add('hit');
  return el;
}
export function renderQueixas() {
  const box = $('#qcards');
  box.innerHTML = '';
  state.q.forEach(it => {
    if (QM[it.id]) box.appendChild(qCard(it));
  });
}
export function renderDengue() {
  const g = state.dg;
  $('#dg-block').hidden = !g.on;
  $('#dg-orient-fld').hidden = !g.on || !temTipo('queixas');
  if (!g.on) return;
  const sb = $('#dg-sint');
  sb.innerHTML = '';
  DG.sint.forEach(s =>
    sb.appendChild(
      triBtn(s, g.sint[s], false, nx => {
        if (nx) g.sint[s] = nx;
        else delete g.sint[s];
        renderDengue();
        update();
      }),
    ),
  );
  $$('.chips[data-dg]').forEach(box => {
    const k = box.dataset.dg,
      none = k === 'prev' ? 'Nenhuma' : k === 'esp' ? null : 'Nenhum',
      al = k === 'alarme' || k === 'choque';
    box.innerHTML = '';
    DG[k].forEach(lbl => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (lbl === none ? ' neg' : '') + (al && lbl !== none ? ' al' : '');
      b.textContent = lbl;
      b.setAttribute('aria-pressed', g[k].includes(lbl));
      b.onclick = () => {
        const arr = g[k],
          i = arr.indexOf(lbl);
        if (i >= 0) arr.splice(i, 1);
        else {
          if (lbl === none) arr.length = 0;
          else if (none) {
            const j = arr.indexOf(none);
            if (j >= 0) arr.splice(j, 1);
          }
          arr.push(lbl);
        }
        renderDengue();
        update();
      };
      box.appendChild(b);
    });
  });
  $('#dg-alarm-blk').classList.toggle(
    'hit',
    g.alarme.some(x => x !== 'Nenhum'),
  );
  $('#dg-choque-blk').classList.toggle(
    'hit',
    g.choque.some(x => x !== 'Nenhum'),
  );
  $$('.seg[data-dgseg]').forEach(seg =>
    seg.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', g[seg.dataset.dgseg] === b.dataset.v)),
  );
  $('#dg-contato-txt').closest('label').hidden = g.contato !== 'sim';
  $('#dg-viagem-txt').closest('label').hidden = g.viagem !== 'sim';
  $('#inc-dg').checked = g.inc;
  renderDgOrient();
}
export function renderDgOrient() {
  const box = $('#dg-orient'),
    g = state.dg;
  box.innerHTML = '';
  DG_ORIENT.forEach(([id, kind, t]) => {
    const l = document.createElement('label');
    const on = g.orient.includes(id);
    let html = t
      .replace(
        '{liq}',
        `<input type="text" class="inl" id="dg-liq-in" inputmode="numeric" placeholder="${dgLiq() || 'mL'}">`,
      )
      .replace(
        '{atest}',
        `<input type="text" class="inl" id="dg-atest-in" inputmode="numeric" placeholder="3" style="width:60px">`,
      );
    l.innerHTML = `<input type="checkbox" ${on ? 'checked' : ''}><span>${html}</span><span class="tag2">${kind === 'ambos' ? 'Ambos' : kind === 'dengue' ? 'Dengue' : 'Gripal'}</span>`;
    l.querySelector('input[type=checkbox]').onchange = e => {
      const i = g.orient.indexOf(id);
      if (e.target.checked) {
        if (i < 0) g.orient.push(id);
      } else if (i >= 0) g.orient.splice(i, 1);
      update();
    };
    box.appendChild(l);
  });
  const li = $('#dg-liq-in');
  if (li) {
    li.value = g.liq;
    li.oninput = () => {
      g.liq = li.value.trim();
      if (!g.orient.includes('liq')) {
        g.orient.push('liq');
        li.closest('label').querySelector('input[type=checkbox]').checked = true;
      }
      update();
    };
    li.onclick = e => e.preventDefault();
  }
  const at = $('#dg-atest-in');
  if (at) {
    at.value = g.atest;
    at.oninput = () => {
      g.atest = at.value.trim();
      if (!g.orient.includes('atest')) {
        g.orient.push('atest');
        at.closest('label').querySelector('input[type=checkbox]').checked = true;
      }
      update();
    };
    at.onclick = e => e.preventDefault();
  }
}
export function renderHdChips() {
  $$('.chips[data-hdchips]').forEach(box => {
    const k = box.dataset.hdchips,
      arr = (state.hd[k] = state.hd[k] || []);
    box.innerHTML = '';
    CRITERIOS_SBC[k].forEach(lbl => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (k === 'emar' ? ' al' : '');
      b.textContent = (k === 'emar' ? 'Muito alto: ' : '') + lbl;
      b.setAttribute('aria-pressed', arr.includes(lbl));
      b.onclick = () => {
        const i = arr.indexOf(lbl);
        if (i >= 0) arr.splice(i, 1);
        else arr.push(lbl);
        b.setAttribute('aria-pressed', arr.includes(lbl));
        update();
      };
      box.appendChild(b);
    });
  });
}
export function renderToggles() {
  $$('.na-btn').forEach(b => {
    const on = !!state.na[b.dataset.na];
    b.setAttribute('aria-pressed', on);
    b.closest('.field').classList.toggle('is-na', on);
  });
  $('#flag-semmeds').setAttribute('aria-pressed', state.semMeds);
  $$('#seg-alergia button').forEach(b => b.setAttribute('aria-pressed', state.alergia === b.dataset.v));
  $('#f-alergia-txt').hidden = state.alergia !== 'sim';
  $$('.seg[data-hd]').forEach(seg =>
    seg
      .querySelectorAll('button')
      .forEach(b => b.setAttribute('aria-pressed', state.hd[seg.dataset.hd] === b.dataset.v)),
  );
  $$('.seg[data-fr]').forEach(seg =>
    seg
      .querySelectorAll('button')
      .forEach(b => b.setAttribute('aria-pressed', state.hd.fr[seg.dataset.fr] === b.dataset.v)),
  );
  ['rcv', 'tfg', 'pe', 'fr'].forEach(k => ($('#inc-' + k).checked = state.hd.inc[k]));
  $$('.tool-tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === state.hd.tab_));
  $$('.tool').forEach(p => (p.hidden = p.dataset.panel !== state.hd.tab_));
}

/* ---------- resultados HiperDia ---------- */
const bar = (p, color) =>
  `<span class="rb"><i style="width:${Math.min(100, p * 2.5)}%;background:${color}"></i></span>`;
export function renderResults(R) {
  const t = R.tfg,
    pv = R.prev,
    p = R.pe;
  // TFG
  $('#res-tfg').innerHTML = !t
    ? '<p class="note">Informe sexo, idade (≥ 18 anos) e creatinina.</p>'
    : `<div><div class="big">${formatarNumero(t.g, 0)}<small>mL/min/1,73 m²</small></div></div>
     <div class="stages">${['G1', 'G2', 'G3a', 'G3b', 'G4', 'G5'].map(s => `<span class="${s === t.st ? 'on' : ''}">${s}</span>`).join('')}</div>
     <p style="margin:0"><b>${t.st}</b> – TFG ${t.desc}${t.al ? ` · <b>${t.al}</b> (RAC ${formatarNumero(t.rac, 0)} mg/g)` : ''}</p>
     ${t.g < 30 ? '<p class="badmsg">TFG &lt; 30: revisar doses de medicamentos e avaliar encaminhamento à nefrologia.</p>' : t.g < 60 ? '<p class="warnmsg">TFG &lt; 60: confirmar em 3 meses e revisar doses (ex.: metformina).</p>' : ''}`;
  $('#dot-tfg').classList.toggle('on', !!t);
  // PREVENT
  const el = $('#res-rcv');
  if (pv.dcv)
    el.innerHTML =
      '<p class="badmsg">Evento cardiovascular prévio: o PREVENT não se aplica. Categoria muito alto ou extremo pela diretriz (veja abaixo).</p>';
  else if (pv.miss) el.innerHTML = `<p class="note">Falta informar: ${pv.miss.join(', ')}.</p>`;
  else if (pv.out)
    el.innerHTML = `<p class="warnmsg">${pv.out.join('<br>')}. O cálculo não é válido fora dessas faixas.</p>`;
  else {
    const row = (l, x) =>
      `<div class="risk"><span class="rl">${l}</span><span class="rv">${x == null ? '—' : formatarNumero(x) + '%'}</span>${x == null ? '' : bar(x, 'var(--hd)')}</div>`;
    const src = [];
    if (!v('hd-pas')) src.push('PA da consulta');
    if (!v('hd-imc') && pv.inp.bmi) src.push('IMC da consulta');
    if (!v('hd-tfg')) src.push('TFG da aba renal');
    el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><h4>PREVENT · risco em 10 anos</h4><span class="cat ${pv.cat[1]}">Calculado: ${pv.cat[0].toLowerCase()}</span></div>
      ${row('DCV aterosclerótica (IAM, AVC) – usada pela SBC', pv.ascvd)}${row('Doença cardiovascular total', pv.cvd)}${row('Insuficiência cardíaca', pv.hf)}
      ${pv.bmiNote ? `<p class="note">${pv.bmiNote}</p>` : ''}
      <p class="note">Faixas da SBC 2025 pelo risco de DCV aterosclerótica: baixo &lt; 5%, intermediário 5 a &lt; 20%, alto ≥ 20%. A categoria final, com agravantes e diabetes, aparece abaixo.${src.length ? ` Usado: ${src.join(', ')}.` : ''}</p>`;
  }
  $('#dot-rcv').classList.toggle('on', !!(pv.dcv || (pv.cvd != null && !pv.miss && !pv.out)));
  const sb = R.sbc,
    se = $('#res-sbc');
  $('#fld-cond').hidden = state.hd.dcv !== '1';
  $('#fld-dmstrat').hidden = state.hd.dm !== '1';
  const im = imc(),
    ca = lerNumero(v('sv-ca'));
  $('#agr-hint').textContent =
    im >= 30 || (ca > 0 && ((state.hd.sexo === 'M' && ca >= 94) || (state.hd.sexo === 'F' && ca >= 80)))
      ? `IMC ${im ? formatarNumero(im) : '—'}${ca > 0 ? ` e CA ${formatarNumero(ca, 0)} cm` : ''}: adiposidade é IMC elevado com circunferência abdominal (ou outra medida antropométrica) elevada.`
      : '';
  if (sb.miss) se.innerHTML = `<p class="note">${sb.miss}</p>`;
  else {
    const T = sbcTargets(sb);
    se.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><h4>Categoria de risco cardiovascular</h4><span class="cat ${T.c[1]}">Risco ${T.c[0].toLowerCase()}</span></div>
      <p style="margin:0">Critério: ${sb.why.join('; ')}.</p>
      <div class="risk"><span class="rl">Meta de LDL-c</span><span class="rv" style="font-size:18px">&lt; ${T.c[2]} mg/dL</span></div>
      <p class="note">Redução do LDL-c ${T.c[3]} em relação ao basal · não-HDL &lt; ${T.c[4]} mg/dL · ApoB &lt; ${T.c[5]} mg/dL.${sb.k === 'baixo' ? ' Em risco baixo, terapia hipolipemiante se LDL-c ≥ 145 mg/dL apesar de mudança de estilo de vida, afastadas causas secundárias.' : ''}</p>
      ${T.st.map(([l, ok]) => `<p class="${ok ? 'okmsg' : 'warnmsg'}">${l}: ${ok ? 'na meta' : 'acima da meta'}.</p>`).join('')}`;
  }
  // Pé
  const pel = $('#res-pe');
  if (p.miss) pel.innerHTML = '<p class="note">Preencha pelo menos monofilamento e pulsos dos dois pés.</p>';
  else {
    const k = ['k-ok', 'k-warn', 'k-mid', 'k-bad'][p.cat];
    pel.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><div class="big">Categoria ${p.cat}</div><span class="cat ${k}">${['Baixo risco', 'Risco moderado', 'Alto risco', 'Muito alto risco'][p.cat]}</span></div>
      <p style="margin:0">${p.txt[0].toUpperCase() + p.txt.slice(1)}. Reavaliar os pés <b>${p.fu}</b>.</p>
      ${p.ativa ? '<p class="badmsg">Úlcera ativa: avaliar e tratar hoje, independentemente da categoria.</p>' : ''}`;
  }
  $('#dot-pe').classList.toggle('on', !p.miss);
  // FINDRISC
  const fr = R.fr,
    fel = $('#res-fr');
  if (fr.dm) fel.innerHTML = '<p class="note">Paciente com diabetes: o FINDRISC não se aplica.</p>';
  else if (fr.miss) fel.innerHTML = `<p class="note">Falta informar: ${fr.miss.join(', ')}.</p>`;
  else
    fel.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><div class="big">${fr.p}<small>de 26 pontos</small></div><span class="cat ${fr.c[2]}">Risco ${fr.c[0].toLowerCase()}</span></div>
     <p style="margin:0">Chance estimada de desenvolver diabetes tipo 2 em 10 anos: <b>${fr.c[1]}</b>.</p>
     ${fr.p >= 12 ? '<p class="warnmsg">Pontuação ≥ 12: considere solicitar glicemia de jejum e/ou HbA1c.</p>' : ''}
     <p class="note">Faixas: &lt; 7 baixo · 7–11 levemente elevado · 12–14 moderado · 15–20 alto · &gt; 20 muito alto.</p>`;
  $('#dot-fr').classList.toggle('on', !fr.miss);
}
export function renderDgResult() {
  const el = $('#dg-res');
  if (!state.dg.on) return;
  const d = dgDay();
  $('#dg-day').textContent = d ? `${d}º dia de doença` : '';
  const r = dgGroup();
  let h = '';
  if (r.miss)
    h =
      '<p class="note">Assinale os sinais de alarme e de choque (ou “Nenhum”) para ver a classificação de risco da dengue.</p>';
  else {
    const [k, txt] = DG_GROUPS[r.gr];
    h = `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><h4>Classificação de risco da dengue</h4><span class="cat ${k}">Grupo ${r.gr}</span></div>
      <p style="margin:0">${txt}</p>${r.why.length ? `<p class="note">Motivo: ${r.why.join(', ')}.</p>` : ''}`;
    if (r.gr === 'A' || r.gr === 'B') {
      const l = dgLiq();
      if (l)
        h += `<p class="note">Hidratação oral do adulto: 60 mL/kg/dia ≈ ${l} mL/dia (1/3 com sais de reidratação oral).</p>`;
    }
  }
  if (r.resp.length)
    h += `<p class="badmsg">Sinal de gravidade respiratória (${r.resp.join(', ').toLowerCase()}): avaliar síndrome respiratória aguda grave e encaminhar ao pronto atendimento.</p>`;
  el.innerHTML = h;
}
