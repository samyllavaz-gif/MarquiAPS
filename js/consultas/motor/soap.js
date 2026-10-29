/**
 * Montagem do texto SOAP dos módulos marcados e atualização dos cálculos, escores e gráficos.
 * O texto vai para soap (estado.js); quem junta com a base e mostra é js/consultas/consulta.js.
 */
import { avisoRapido } from '../../componentes/aviso.js';
import { CLASSIFICACOES_OMS, formatarEscoreZ, percentilDoEscore } from '../../regras/crescimento-oms.js';
import { LABCHK } from '../../regras/exames-gestante.js';
import { $, $$ } from '../../utils/dom.js';
import {
  escaparHtml,
  finalizarTexto,
  formatarNumero,
  lerNumero,
  listaEmMinusculas,
  minusculaInicial,
} from '../../utils/texto.js';
import { CALCS, gridChecks } from './calculos.js';
import { ageTx, chartSVG, growth, growthEval, ZC } from './crescimento.js';
import { estado, S_, soap, st, V } from './estado.js';
import { drawMarcos, MARCOS } from './marcos.js';
import { ortLinesO, ortLinesS } from './ortopedia.js';
import { jointSum } from './reumatologia.js';
import { sifCalc } from './sifilis.js';

function pairs(f) {
  switch (f.t) {
    case 'text':
    case 'area': {
      const x = S_(f.id);
      return x ? [[f.out || f.l, x + (f.unit || '')]] : [];
    }
    case 'seg': {
      const x = S_(f.id);
      return x ? [[f.out || f.l, minusculaInicial(x)]] : [];
    }
    case 'chips': {
      const a = V(f.id) || [];
      if (!a.length) return [];
      return [[f.out || f.l, a.includes(f.none) ? minusculaInicial(f.none) : listaEmMinusculas(a)]];
    }
    case 'grid': {
      const o = V(f.id) || {};
      const p = f.f
        .filter(([k, , , , no]) => !no && String(o[k] || '').trim())
        .map(([k, l, , u]) => [l, String(o[k]).trim() + (u || '')]);
      if (f.imc) {
        const pe = lerNumero(o.peso);
        let al = lerNumero(o.alt);
        if (al > 3) al /= 100;
        if (pe > 0 && al > 0) {
          const r = pe / (al * al);
          if (r > 8 && r < 90) p.push(['IMC', formatarNumero(r) + ' kg/m²']);
        }
      }
      return p;
    }
  }
  return null;
}
function lines(f, B) {
  const push = (x, b = f.b) => {
    if (x) B[b].push(x);
  };
  switch (f.t) {
    case 'text':
    case 'area':
    case 'seg':
    case 'chips':
      pairs(f).forEach(([l, v]) => push(`${l}: ${finalizarTexto(v)}`));
      break;
    case 'grid': {
      const p = pairs(f);
      if (p.length) push(`${f.out || f.l}: ${p.map(([l, v]) => `${l}: ${v}`).join(' | ')}.`);
      if (f.chk) {
        const c = gridChecks(f);
        if (c.length)
          push(`Alterações (${(f.out || f.l).replace(/^Laboratoriais /, '')}): ${c.map(x => x.t).join('; ')}.`);
      }
      break;
    }
    case 'tri': {
      const o = V(f.id) || {},
        P = f.opts.filter(s => o[s] === '+'),
        N = f.opts.filter(s => o[s] === '-'),
        Q = f.opts.filter(s => o[s] === '?'),
        L = f.out || f.l;
      if (f.alarm) {
        if (P.length) push(`SINAL DE ALARME – ${L}: ${listaEmMinusculas(P)}.`);
        if (N.length) push(`${L} pesquisados e ausentes: ${listaEmMinusculas(N)}.`);
        if (Q.length) push(`${L} – prefere não responder: ${listaEmMinusculas(Q)}.`);
      } else {
        const x = [];
        if (P.length) x.push(`refere ${listaEmMinusculas(P)}`);
        if (N.length) x.push(`nega ${listaEmMinusculas(N)}`);
        if (Q.length) x.push(`prefere não responder sobre ${listaEmMinusculas(Q)}`);
        if (x.length) push(`${L}: ${x.join('; ')}.`);
      }
      break;
    }
    case 'exam': {
      const x = S_(f.id);
      if (x) push(`${f.out || 'Exame físico'}: ${x.replace(/\n+/g, ' ')}`);
      break;
    }
    case 'checks': {
      const a = (V(f.id) || []).slice().sort((x, y) => x - y);
      if (a.length) push(`${f.out || f.l}:\n` + a.map(i => '→ ' + f.lines[i]).join('\n'));
      break;
    }
    case 'calc': {
      const r = CALCS[f.k]();
      (r.lines || []).forEach(([b, x]) => push(x, b));
      break;
    }
    case 'score': {
      const a = V(f.id) || {},
        n = f.items.length,
        k = Object.keys(a).length;
      if (k === n) {
        const p = Object.values(a).reduce((x, y) => x + y, 0),
          bd = f.band(p),
          al = f.alert ? f.alert(Object.assign([], a)) : '';
        push(`${f.name}: ${p} pontos – ${bd[0]}.${al ? ' ' + al : ''}`);
      }
      break;
    }
    case 'presc': {
      const rows = (V('presc') || []).filter(r => r.m && r.m.trim());
      if (rows.length)
        push(
          'Prescrição:\n' +
            rows
              .map(
                (r, k) =>
                  `${k + 1}. ${[r.m, r.p, r.d]
                    .map(x => (x || '').trim())
                    .filter(Boolean)
                    .join(' — ')}`,
              )
              .join('\n'),
        );
      break;
    }
    case 'medrows': {
      const rows = (V(f.id) || []).filter(r => Object.values(r).some(x => String(x).trim()));
      const C = f._C || [];
      if (rows.length)
        push(
          `${f.l}:\n` +
            rows
              .map(
                r =>
                  '- ' +
                  C.map(([k, l]) =>
                    r[k] && r[k].trim() ? (k === 'med' ? r[k].trim() : `${minusculaInicial(l)}: ${r[k].trim()}`) : '',
                  )
                    .filter(Boolean)
                    .join('; '),
              )
              .join('\n'),
        );
      break;
    }
    case 'vac': {
      const o = V(f.id) || {};
      const r = f.rows.filter(([ag]) => o[ag]).map(([ag, vs]) => `${ag} (${vs}) – ${minusculaInicial(o[ag])}`);
      if (r.length) push(`Vacinas: ${r.join('; ')}.`);
      break;
    }
    case 'mse': {
      const o = V(f.id) || {};
      const r = f.rows
        .filter(([k]) => String(o[k] || '').trim())
        .map(([k, l]) => `${l.replace(/ \(.*\)/, '')}: ${o[k].trim()}`);
      if (r.length) push(`Exame do estado mental: ${r.join('; ')}.`);
      break;
    }
    case 'ret': {
      const o = V('ret') || {};
      const x = [o.r, (o.t || '').trim()].filter(Boolean).join(' – ');
      if (x) push(`Seguimento: ${finalizarTexto(x)}`);
      break;
    }
    case 'sif': {
      const r = sifCalc(f);
      r.A.forEach(x => push(x, 'A'));
      r.P.forEach(x => push(x, 'P'));
      break;
    }
    case 'growth': {
      growthEval(growth()).lines.forEach(([b, x]) => push(x, b));
      break;
    }
    case 'rows': {
      if (f.noOut) break;
      const rows = (V(f.id) || []).filter(r => f.cols.some(([k]) => (r[k] || '').trim()));
      if (rows.length)
        push(
          `${f.out || f.l}:\n` +
            rows
              .map(
                r =>
                  '- ' +
                  f.cols
                    .filter(([k]) => (r[k] || '').trim())
                    .map(([k, l]) => `${minusculaInicial(l)}: ${r[k].trim().replace(/\n+/g, ' ')}`)
                    .join('; '),
              )
              .join('\n'),
        );
      break;
    }
    case 'marcos': {
      const o = V('marcos') || {};
      MARCOS.forEach(([fx, , its]) => {
        const g = {};
        its.forEach(([t, k]) => {
          if (o[k]) (g[o[k]] = g[o[k]] || []).push(minusculaInicial(t));
        });
        const ks = ['Presente', 'Ausente', 'Em aquisição', 'Não avaliado'].filter(x => g[x]);
        if (ks.length)
          push(
            `Marcos do desenvolvimento (${fx}): ${ks.map(x => `${{ Presente: 'presentes', Ausente: 'ausentes', 'Em aquisição': 'em aquisição', 'Não avaliado': 'não avaliados' }[x]} – ${g[x].join(', ')}`).join('; ')}.`,
          );
      });
      break;
    }
    case 'orthoS':
      ortLinesS().forEach(x => push(x));
      break;
    case 'orthoO':
      ortLinesO().forEach(x => push(x));
      break;
    case 'joints': {
      const J = jointSum();
      if (J.inv.length) {
        push(
          `Mapa articular: ${J.d.length} dolorosa(s)${J.grpD ? ` (${J.grpD})` : ''}; ${J.i.length ? `${J.i.length} com sinovite/edema (${J.grpI})` : 'sem sinovite objetiva'}; padrão ${J.pat}${J.sym ? ', ' + J.sym : ''}.`,
        );
      }
      break;
    }
    case 'group': {
      if (f.ask) {
        const a = V(f.gid);
        if (a === 'Não') {
          if (f.neg) push(finalizarTexto(f.neg));
          return;
        }
        if (a !== 'Sim') return;
      }
      if (f.join) {
        const p = [];
        f.f.forEach(c => {
          const x = pairs(c);
          if (x) x.forEach(y => p.push(y));
        });
        if (p.length) push(`${f.out || f.l}: ${p.map(([l, v]) => `${l} ${v}`).join('; ')}.`);
      } else f.f.forEach(c => lines(c, B));
      break;
    }
  }
}
function build() {
  const B = { S: [], O: [], A: [], P: [] };
  st._ig = null;
  st._mo = null;
  // calcs que outros campos usam rodam antes
  estado.modelo.secs.forEach(s => s.f.forEach(f => lines(f, B)));
  return B;
}
export function upd() {
  if (!estado.modelo) return;
  st._ig = null;
  st._mo = null;
  st._dpp = null;
  st._moc = null;
  $$('#form [data-calc]').forEach(el => {
    el.innerHTML = CALCS[el.dataset.calc]().html;
  });
  $$('#form [data-scoreid]').forEach(el => {
    const f = findF(el.dataset.scoreid);
    const a = V(f.id) || {},
      n = f.items.length,
      k = Object.keys(a).length,
      box = el.querySelector('[data-score]');
    if (k < n) {
      box.innerHTML = `<p class="note">${k} de ${n} itens respondidos.</p>`;
      return;
    }
    const p = Object.values(a).reduce((x, y) => x + y, 0),
      bd = f.band(p),
      al = f.alert ? f.alert(Object.assign([], a)) : '';
    box.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><div class="big">${p}<small>pontos</small></div><span class="cat ${bd[1]}">${bd[0]}</span></div>${al ? `<p class="badmsg">${al}</p>` : ''}`;
  });
  $$('#form [data-gchk]').forEach(box => {
    const f = findF(box.dataset.gchk);
    const c = gridChecks(f);
    const ins = box.parentElement.querySelectorAll('.grid-in input');
    ins.forEach(i => i.classList.remove('v-bad', 'v-warn', 'v-info'));
    c.forEach(x => {
      const i = box.parentElement.querySelector(`#m-${f.id}-${x.k}`);
      if (i) i.classList.add('v-' + x.lvl);
    });
    box.hidden = !c.length;
    box.innerHTML = c.length
      ? '<h4>O que está alterado</h4><div class="chk-list">' +
        c
          .map(
            x =>
              `<div class="chk"><span class="cat ${x.lvl === 'bad' ? 'k-bad' : x.lvl === 'warn' ? 'k-warn' : 'k-mid'}">${x.lvl === 'bad' ? 'Alterado' : x.lvl === 'warn' ? 'Atenção' : 'Nota'}</span><span>${escaparHtml(x.t)}</span>${x.o ? `<small>${escaparHtml(x.o)}</small>` : ''}</div>`,
          )
          .join('') +
        '</div>'
      : '';
  });
  $$('#form [data-tchk]').forEach(p => {
    const f = findF(p.dataset.tchk);
    const x = LABCHK[f.chk](S_(f.id));
    p.textContent = x ? `${x[1]}: ${x[2]}` : '';
  });
  $$('#form [data-sif]').forEach(box => {
    const f = findF(box.dataset.sif);
    const r = sifCalc(f);
    box.innerHTML =
      r.html.join('') ||
      '<p class="note">Preencha o estágio, as doses e os VDRL para ver a avaliação do seguimento.</p>';
  });
  $$('#form [data-growth]').forEach(box => {
    const G = growth(),
      E = growthEval(G),
      L = G.pts.filter(p => !p.preterm).slice(-1)[0];
    let h = '';
    if (!G.sx || !G.dn) h = '<p class="note">Informe o sexo e a data de nascimento no início da consulta.</p>';
    else if (!L)
      h = G.pts.some(p => p.preterm)
        ? '<p class="warnmsg">Medidas antes de 40 semanas de idade corrigida: as curvas da OMS começam no termo. Use as curvas Intergrowth-21st para esse período.</p>'
        : '<p class="note">Digite a data e as medidas para calcular escores-z e percentis.</p>';
    else {
      const rw = [
        ['wfa', 'Peso', L.p > 0 ? Math.round(L.p * 1000).toLocaleString('pt-BR') + ' g' : ''],
        ['lhfa', 'Comprimento/altura', L.e > 0 ? formatarNumero(L.e) + ' cm' : ''],
        ['hcfa', 'Perímetro cefálico', L.h > 0 ? formatarNumero(L.h) + ' cm' : ''],
        ['bmifa', 'IMC', L.bmi ? formatarNumero(L.bmi) : ''],
      ].filter(r => r[2]);
      h =
        `<p style="margin:0">Última medida em <b>${L.dt}</b> · idade ${ageTx(L.age)}${L.useC ? ` · <b>idade corrigida ${ageTx(L.a)}</b>` : ''}</p><div style="overflow-x:auto"><table class="gtable"><thead><tr><th>Medida</th><th>Valor</th><th>Escore-z</th><th>Percentil</th><th>Classificação</th></tr></thead><tbody>${rw
          .map(([k, l, val]) => {
            const z = L.z[k];
            return `<tr><td>${l}</td><td>${val}</td><td>${z == null ? '—' : formatarEscoreZ(z)}</td><td>${z == null ? '—' : percentilDoEscore(z)}</td><td>${z == null ? '—' : `<span class="cat ${ZC(z)}">${CLASSIFICACOES_OMS[k](z)}</span>`}</td></tr>`;
          })
          .join('')}</tbody></table></div>` +
        E.msg.map(([c, t]) => `<p class="${c}" style="margin:0">${t}</p>`).join('') +
        (E.nut || E.cres
          ? '<div><button type="button" class="btn small" data-fillav>Preencher avaliação nutricional e de crescimento</button></div>'
          : '');
    }
    box.innerHTML = h;
    const fb = box.querySelector('[data-fillav]');
    if (fb)
      fb.onclick = () => {
        st.v.av_nut = E.nut;
        st.v.av_cresc = E.cres;
        const a = $('#m-av_nut'),
          b = $('#m-av_cresc');
        if (a) a.value = E.nut;
        if (b) b.value = E.cres;
        upd();
        avisoRapido('Avaliação preenchida. Confira o texto.');
      };
    const ch = box.parentElement.querySelector('[data-gchart]');
    ch.innerHTML = G.sx && G.dn ? chartSVG(st.v.gr_tab || 'wfa', G) : '';
  });
  $$('#form [data-marcos]').forEach(el => {
    const a = st._moc != null ? st._moc : st._mo;
    if (el._age !== a) {
      el._age = a;
      drawMarcos(el);
    }
  });
  $$('#form [data-jsum]').forEach(b => {
    const J = jointSum();
    b.innerHTML = J.inv.length
      ? `<p style="margin:0"><b>${J.d.length}</b> dolorosas · <b>${J.i.length}</b> inchadas (${J.swS} pequenas) · padrão <b>${J.pat}</b>${J.sym ? ', ' + J.sym : ''}</p>${J.i.length && J.swS ? '<p class="warnmsg">Sinovite em pequenas articulações: se persistente, precisa de avaliação especializada prioritária, mesmo com PCR/VHS normais e FR/anti-CCP negativos.</p>' : ''}`
      : '<p class="note">Nenhuma articulação marcada.</p>';
  });
  $$('#form [data-imc]').forEach(o => {
    const g = o.closest('.field');
    const ins = g.querySelectorAll('input');
    const id = ins[0].id.split('-')[1];
    const v = V(id) || {};
    const pe = lerNumero(v.peso);
    let al = lerNumero(v.alt);
    if (al > 3) al /= 100;
    o.textContent = pe > 0 && al > 0 ? formatarNumero(pe / (al * al)) : '—';
  });
  const B = build();
  Object.assign(soap, { S: B.S.join('\n'), O: B.O.join('\n'), A: B.A.join('\n'), P: B.P.join('\n') });
  aoAtualizar();
}

let aoAtualizar = () => {};
/** Função chamada sempre que o texto dos módulos muda (a consulta junta com a base e salva). */
export function definirAoAtualizarModulos(fn) {
  aoAtualizar = fn;
}
function findF(id) {
  let r = null;
  const w = fs =>
    fs.forEach(f => {
      if (f.id === id) r = f;
      if (f.f && f.t === 'group') w(f.f);
    });
  estado.modelo.secs.forEach(s => w(s.f));
  return r;
}
