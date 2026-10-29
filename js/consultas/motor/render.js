/**
 * Desenho dos módulos da consulta (modelos do motor): um elemento por campo, conforme o tipo.
 */
import { inserirTrechoUnico } from '../texto-inteligente.js';
import { avisoRapido } from '../../componentes/aviso.js';
import { formatarDataBr, hojeSemHora } from '../../utils/datas.js';
import { $$ } from '../../utils/dom.js';
import { escaparHtml } from '../../utils/texto.js';
import { IND } from './crescimento.js';
import { estado, st } from './estado.js';
import { drawMarcos } from './marcos.js';
import { drawO, rOrthoO, rOrthoS } from './ortopedia.js';
import { JOINTS } from './reumatologia.js';
import { upd } from './soap.js';

function lab(f, extra = '') {
  return `<div class="lab">${escaparHtml(f.l)}${extra}</div>`;
}
function triBtn(label, cur, al, nr, on) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'tri' + (al ? ' al' : '');
  b.textContent = label;
  b.dataset.s = cur || '';
  b.title = nr
    ? 'Clique: presente → ausente → prefere não responder → não investigado'
    : 'Clique: presente → ausente → não investigado';
  b.onclick = () => {
    const nx = !cur ? '+' : cur === '+' ? '-' : cur === '-' && nr ? '?' : '';
    on(nx);
  };
  return b;
}
function rField(f) {
  const el = document.createElement('div');
  el.className = 'field';
  const note = f.note ? `<p class="note">${escaparHtml(f.note)}</p>` : '';
  switch (f.t) {
    case 'text':
    case 'area': {
      const id = 'm-' + f.id;
      el.innerHTML =
        lab(f) +
        (f.t === 'area'
          ? `<textarea id="${id}" placeholder="${escaparHtml(f.ph || '')}"></textarea>`
          : `<input type="text" id="${id}" placeholder="${escaparHtml(f.ph || '')}"${f.w ? ` style="max-width:${f.w}"` : ''}>`) +
        (f.q && f.q.length
          ? `<div class="quick"><span>Inserir:</span>${f.q.map((x, i) => `<button type="button" data-q="${i}">${escaparHtml(x.length > 48 ? x.slice(0, 46) + '…' : x)}</button>`).join('')}</div>`
          : '') +
        note;
      const i = el.querySelector('#' + id);
      i.value = st.v[f.id] || '';
      i.oninput = () => {
        st.v[f.id] = i.value;
        upd();
      };
      if (f.chk) {
        const r = document.createElement('p');
        r.className = 'note';
        r.dataset.tchk = f.id;
        el.appendChild(r);
      }
      el.querySelectorAll('[data-q]').forEach(
        b =>
          (b.onclick = () => {
            const x = f.q[+b.dataset.q];
            i.value = i.value.trim() ? (f.t === 'area' ? i.value.trim() + '\n' + x : i.value.trim() + ' ' + x) : x;
            st.v[f.id] = i.value;
            upd();
            i.focus();
          }),
      );
      break;
    }
    case 'seg': {
      el.innerHTML =
        lab(f) +
        `<div class="seg">${f.opts.map(o => `<button type="button" data-v="${escaparHtml(o)}" aria-pressed="${st.v[f.id] === o}">${escaparHtml(o)}</button>`).join('')}</div>` +
        note;
      el.querySelectorAll('button').forEach(
        b =>
          (b.onclick = () => {
            st.v[f.id] = st.v[f.id] === b.dataset.v ? '' : b.dataset.v;
            el.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', st.v[f.id] === x.dataset.v));
            upd();
          }),
      );
      break;
    }
    case 'chips': {
      el.innerHTML = lab(f) + '<div class="chips"></div>' + note;
      const box = el.querySelector('.chips');
      const draw = () => {
        box.innerHTML = '';
        const arr = (st.v[f.id] = st.v[f.id] || []);
        f.opts.forEach(o => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'chip' + (o === f.none ? ' neg' : '');
          b.textContent = o;
          b.setAttribute('aria-pressed', arr.includes(o));
          b.onclick = () => {
            const i = arr.indexOf(o);
            if (i >= 0) arr.splice(i, 1);
            else {
              if (o === f.none) arr.length = 0;
              else if (f.none) {
                const j = arr.indexOf(f.none);
                if (j >= 0) arr.splice(j, 1);
              }
              arr.push(o);
            }
            draw();
            upd();
          };
          box.appendChild(b);
        });
      };
      draw();
      break;
    }
    case 'tri': {
      el.className = 'field blk' + (f.alarm ? ' alarm' : '');
      el.innerHTML =
        `<div class="blk-h">${escaparHtml(f.l)} <button type="button" class="lnk">marcar não assinalados como ausentes</button></div><div class="chips"></div>` +
        note;
      const box = el.querySelector('.chips');
      const draw = () => {
        box.innerHTML = '';
        const o = (st.v[f.id] = st.v[f.id] || {});
        f.opts.forEach(s =>
          box.appendChild(
            triBtn(s, o[s], f.alarm, f.nr, nx => {
              if (nx) o[s] = nx;
              else delete o[s];
              draw();
              upd();
            }),
          ),
        );
        if (f.alarm)
          el.classList.toggle(
            'hit',
            f.opts.some(s => o[s] === '+'),
          );
        if (f.id === 'seguranca') setTimeout(() => drawO(), 0);
        if (f.act) {
          let a = el.querySelector('.acts');
          if (!a) {
            a = document.createElement('div');
            a.className = 'acts chk-list';
            el.appendChild(a);
          }
          const P = f.opts.filter(s => o[s] === '+' && f.act[s]);
          a.innerHTML = P.map(
            s =>
              `<div class="chk"><span class="cat k-bad">Ação</span><span>${escaparHtml(s)}</span><small>${escaparHtml(f.act[s])}</small></div>`,
          ).join('');
        }
      };
      el.querySelector('.lnk').onclick = () => {
        const o = (st.v[f.id] = st.v[f.id] || {});
        f.opts.forEach(s => {
          if (!o[s]) o[s] = '-';
        });
        draw();
        upd();
      };
      draw();
      break;
    }
    case 'exam': {
      const id = 'm-' + f.id;
      el.innerHTML =
        lab(f) +
        `<div class="quick"><span>Inserir normal:</span>${Object.keys(f.ins)
          .map(k => `<button type="button" data-k="${escaparHtml(k)}">${escaparHtml(k)}</button>`)
          .join(
            '',
          )}</div><textarea id="${id}" class="tall" placeholder="Descreva o que foi examinado. Ajuste o texto inserido quando houver achado alterado."></textarea><p class="note">Use só os sistemas que você examinou.</p>`;
      const i = el.querySelector('#' + id);
      i.value = st.v[f.id] || '';
      i.oninput = () => {
        st.v[f.id] = i.value;
        upd();
      };
      el.querySelectorAll('[data-k]').forEach(
        b =>
          (b.onclick = () => {
            i.value = inserirTrechoUnico(i.value, f.ins[b.dataset.k]);
            st.v[f.id] = i.value;
            upd();
            i.focus();
          }),
      );
      break;
    }
    case 'checks': {
      el.innerHTML = lab(f) + '<div class="orient-list"></div>' + note;
      const box = el.querySelector('.orient-list');
      const arr = (st.v[f.id] = st.v[f.id] || []);
      f.lines.forEach((t, i) => {
        const l = document.createElement('label');
        l.innerHTML = `<input type="checkbox" ${arr.includes(i) ? 'checked' : ''}><span>${escaparHtml(t)}</span>`;
        l.querySelector('input').onchange = e => {
          const k = arr.indexOf(i);
          if (e.target.checked) {
            if (k < 0) arr.push(i);
          } else if (k >= 0) arr.splice(k, 1);
          upd();
        };
        box.appendChild(l);
      });
      break;
    }
    case 'grid': {
      el.innerHTML =
        lab(f) +
        `<div class="grid-in" style="grid-template-columns:repeat(auto-fill,minmax(${f.f.length > 6 ? 170 : 140}px,1fr))">${f.f.map(([k, l, ph, u]) => `<label>${escaparHtml(l)}${u ? ` <span style="font-weight:400">(${escaparHtml(u.trim())})</span>` : ''}<input type="text" id="m-${f.id}-${k}" placeholder="${escaparHtml(ph || '')}"></label>`).join('')}${f.imc ? '<div class="lbl">IMC (kg/m²)<output class="calc-out" data-imc></output></div>' : ''}</div>` +
        note;
      const o = (st.v[f.id] = st.v[f.id] || {});
      f.f.forEach(([k]) => {
        const i = el.querySelector(`#m-${f.id}-${k}`);
        i.value = o[k] || '';
        i.oninput = () => {
          o[k] = i.value;
          upd();
        };
      });
      if (f.chk) {
        const r = document.createElement('div');
        r.className = 'result';
        r.dataset.gchk = f.id;
        r.hidden = true;
        el.appendChild(r);
      }
      break;
    }
    case 'calc':
      el.className = 'result';
      el.dataset.calc = f.k;
      break;
    case 'score': {
      el.innerHTML = lab(f) + '<div class="sc"></div><div class="result" data-score></div>' + note;
      const box = el.querySelector('.sc');
      const a = (st.v[f.id] = st.v[f.id] || {});
      f.items.forEach(([t, sc], i) => {
        const r = document.createElement('div');
        r.className = 'sc-row';
        r.innerHTML = `<span>${i + 1}. ${escaparHtml(t)}</span><div class="seg">${sc.map(([l, v]) => `<button type="button" data-v="${v}" aria-pressed="${a[i] === v}">${escaparHtml(l)}</button>`).join('')}</div>`;
        r.querySelectorAll('button').forEach(
          b =>
            (b.onclick = () => {
              const v = +b.dataset.v;
              if (a[i] === v) delete a[i];
              else a[i] = v;
              r.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', a[i] === +x.dataset.v));
              upd();
            }),
        );
        box.appendChild(r);
      });
      el.dataset.scoreid = f.id;
      break;
    }
    case 'presc': {
      el.innerHTML =
        '<div class="lab">Prescrição <span class="hint">medicamento, dose, via, frequência e duração</span></div><div class="presc-head"><span></span><span>Medicamento e concentração</span><span>Posologia</span><span>Duração</span><span></span></div><div class="presc"></div><div><button type="button" class="btn small">+ Adicionar medicamento</button></div>';
      const box = el.querySelector('.presc');
      const rows = (st.v.presc = st.v.presc && st.v.presc.length ? st.v.presc : [{ m: '', p: '', d: '' }]);
      const draw = () => {
        box.innerHTML = '';
        rows.forEach((r, i) => {
          const row = document.createElement('div');
          row.className = 'presc-row';
          row.innerHTML = `<span class="num">${i + 1}</span><input type="text" aria-label="Medicamento ${i + 1}" placeholder="Medicamento"><input type="text" aria-label="Posologia ${i + 1}" placeholder="1 cp VO 12/12h"><input type="text" aria-label="Duração ${i + 1}" placeholder="7 dias"><button type="button" class="del" aria-label="Remover">×</button>`;
          const [m, p, d] = row.querySelectorAll('input');
          m.value = r.m;
          p.value = r.p;
          d.value = r.d;
          m.oninput = () => {
            r.m = m.value;
            upd();
          };
          p.oninput = () => {
            r.p = p.value;
            upd();
          };
          d.oninput = () => {
            r.d = d.value;
            upd();
          };
          row.querySelector('.del').onclick = () => {
            rows.splice(i, 1);
            if (!rows.length) rows.push({ m: '', p: '', d: '' });
            draw();
            upd();
          };
          box.appendChild(row);
        });
      };
      el.querySelector('.btn').onclick = () => {
        rows.push({ m: '', p: '', d: '' });
        draw();
      };
      draw();
      break;
    }
    case 'medrows': {
      const C = [
        ['med', 'Medicamento e indicação'],
        ['esq', 'Esquema (dose, horário)'],
        ['per', 'Período / tempo na dose'],
        ['uso', 'Uso efetivo (adesão)'],
        ['resp', 'Resposta'],
        ['ae', 'Efeitos adversos / ativação'],
        ['susp', 'Suspensão ou retirada: motivo'],
      ];
      el.innerHTML =
        lab(f) +
        '<div class="presc"></div><div><button type="button" class="btn small">+ Adicionar medicação</button></div>' +
        note;
      const box = el.querySelector('.presc');
      const rows = (st.v[f.id] = st.v[f.id] || []);
      const draw = () => {
        box.innerHTML = '';
        rows.forEach((r, i) => {
          const d = document.createElement('div');
          d.className = 'medrow';
          d.innerHTML = `<div class="medrow-h"><span>Medicação ${i + 1}</span><button type="button" class="btn small">Remover</button></div><div class="grid-in" style="grid-template-columns:repeat(auto-fill,minmax(190px,1fr))">${C.map(([k, l]) => `<label>${l}<input type="text" data-k="${k}"></label>`).join('')}</div>`;
          d.querySelectorAll('input').forEach(i => {
            i.value = r[i.dataset.k] || '';
            i.oninput = () => {
              r[i.dataset.k] = i.value;
              upd();
            };
          });
          d.querySelector('.btn').onclick = () => {
            rows.splice(i, 1);
            draw();
            upd();
          };
          box.appendChild(d);
        });
      };
      el.querySelector(':scope > div > .btn').onclick = () => {
        rows.push({});
        draw();
      };
      f._C = C;
      draw();
      break;
    }
    case 'vac': {
      el.innerHTML =
        lab(
          f,
          ' <button type="button" class="btn small" style="margin-left:auto">Marcar “aguardo idade” pelas idades futuras</button>',
        ) + '<div class="vac"></div>';
      const box = el.querySelector('.vac');
      const o = (st.v[f.id] = st.v[f.id] || {});
      const draw = () => {
        box.innerHTML = '';
        f.rows.forEach(([ag, vs]) => {
          const r = document.createElement('div');
          r.className = 'vac-row';
          r.innerHTML = `<b>${ag}</b><span class="v">${vs}</span><div class="seg">${['Aplicadas', 'Aguardo idade', 'Atrasadas'].map(x => `<button type="button" data-v="${x}" aria-pressed="${o[ag] === x}">${x}</button>`).join('')}</div>`;
          r.querySelectorAll('button').forEach(
            b =>
              (b.onclick = () => {
                o[ag] = o[ag] === b.dataset.v ? '' : b.dataset.v;
                draw();
                upd();
              }),
          );
          box.appendChild(r);
        });
      };
      el.querySelector('.lab .btn').onclick = () => {
        if (st._mo == null) {
          avisoRapido('Informe a data de nascimento primeiro');
          return;
        }
        f.rows.forEach(([ag, , mo]) => {
          if (mo > st._mo && !o[ag]) o[ag] = 'Aguardo idade';
        });
        draw();
        upd();
      };
      draw();
      break;
    }
    case 'mse': {
      el.innerHTML = lab(f) + '<div class="mse"></div>' + note;
      const box = el.querySelector('.mse');
      const o = (st.v[f.id] = st.v[f.id] || {});
      f.rows.forEach(([k, l, nl]) => {
        const r = document.createElement('div');
        r.className = 'mse-row';
        r.innerHTML = `<span>${escaparHtml(l)}</span><input type="text" aria-label="${escaparHtml(l)}">${nl ? '<button type="button" class="btn small">sem alteração</button>' : '<span></span>'}`;
        const i = r.querySelector('input');
        i.value = o[k] || '';
        i.oninput = () => {
          o[k] = i.value;
          upd();
        };
        const b = r.querySelector('button');
        if (b)
          b.onclick = () => {
            i.value = nl;
            o[k] = nl;
            upd();
          };
        box.appendChild(r);
      });
      break;
    }
    case 'ret': {
      el.innerHTML =
        '<div class="lab">Plano de seguimento</div><div class="two"><select aria-label="Retorno"><option value="">Retorno…</option>' +
        [
          'Retorno em 7 dias',
          'Retorno em 15 dias',
          'Retorno em 30 dias',
          'Retorno em 60 dias',
          'Retorno em 90 dias',
          'Retorno em 6 meses',
          'Retorno com resultados de exames',
          'Retorno conforme necessidade',
        ]
          .map(x => `<option>${x}</option>`)
          .join('') +
        '</select><input type="text" placeholder="Objetivo do retorno"></div>';
      const o = (st.v.ret = st.v.ret || {});
      const s = el.querySelector('select'),
        i = el.querySelector('input');
      s.value = o.r || '';
      i.value = o.t || '';
      s.onchange = () => {
        o.r = s.value;
        upd();
      };
      i.oninput = () => {
        o.t = i.value;
        upd();
      };
      break;
    }
    case 'sif': {
      const o = (st.v[f.id] = st.v[f.id] || {});
      const redraw = () => {
        const n = rField(f);
        el.replaceWith(n);
        upd();
      };
      const segH = (k, l, opts, re) => {
        const d = document.createElement('div');
        d.className = 'field';
        d.innerHTML = `<div class="lab">${escaparHtml(l)}</div><div class="seg">${opts.map(x => `<button type="button" data-v="${escaparHtml(x)}" aria-pressed="${o[k] === x}">${escaparHtml(x)}</button>`).join('')}</div>`;
        d.querySelectorAll('button').forEach(
          b =>
            (b.onclick = () => {
              o[k] = o[k] === b.dataset.v ? '' : b.dataset.v;
              if (re) redraw();
              else {
                d.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', o[k] === x.dataset.v));
                upd();
              }
            }),
        );
        return d;
      };
      const txtH = (k, l, ph) => {
        const d = document.createElement('label');
        d.className = 'lbl';
        d.innerHTML = `${escaparHtml(l)}<input type="text" placeholder="${escaparHtml(ph || '')}">`;
        const i = d.querySelector('input');
        i.value = o[k] || '';
        i.oninput = () => {
          o[k] = i.value;
          upd();
        };
        return d;
      };
      const rowsH = (k, l, cols, btn) => {
        const d = document.createElement('div');
        d.className = 'field';
        d.innerHTML = `<div class="lab">${escaparHtml(l)}</div><div class="subrows"></div><div><button type="button" class="btn small">${escaparHtml(btn)}</button></div>`;
        const box = d.querySelector('.subrows');
        const rows = (o[k] = o[k] || []);
        const draw = () => {
          box.innerHTML = '';
          rows.forEach((r, i) => {
            const row = document.createElement('div');
            row.className = 'subrow';
            row.innerHTML =
              cols
                .map(
                  ([c, cl, ph]) =>
                    `<label class="lbl">${escaparHtml(cl)}<input type="text" data-c="${c}" placeholder="${escaparHtml(ph)}"></label>`,
                )
                .join('') +
              '<button type="button" class="del" aria-label="Remover" style="border:1px solid var(--line);background:none;border-radius:6px;height:38px;cursor:pointer">×</button>';
            row.querySelectorAll('input').forEach(inp => {
              inp.value = r[inp.dataset.c] || '';
              inp.oninput = () => {
                r[inp.dataset.c] = inp.value;
                upd();
              };
            });
            row.querySelector('.del').onclick = () => {
              rows.splice(i, 1);
              draw();
              upd();
            };
            box.appendChild(row);
          });
        };
        d.querySelector('.btn').onclick = () => {
          rows.push({});
          draw();
        };
        draw();
        return d;
      };
      const grid = document.createElement('div');
      grid.className = 'grid-in';
      grid.style.gridTemplateColumns = 'repeat(auto-fill,minmax(200px,1fr))';
      el.className = 'field';
      el.style.gap = '14px';
      if (f.mode === 'crianca') {
        el.appendChild(
          segH('mae', 'Tratamento materno na gestação', ['Adequado', 'Não adequado', 'Não tratada', 'Ignorado']),
        );
        el.insertAdjacentHTML(
          'beforeend',
          '<p class="note">Adequado: penicilina benzatina, esquema completo para o estágio, iniciado até 30 dias antes do parto.</p>',
        );
        grid.append(
          txtH('vdrlMae', 'VDRL materno no parto', '1:8'),
          txtH('vdrlRN', 'VDRL do RN (sangue periférico)', '1:2 ou NR'),
          txtH('trep18', 'Teste treponêmico aos 18 meses', 'resultado e data'),
        );
        el.appendChild(grid);
        el.appendChild(segH('cls', 'Classificação', ['Criança exposta à sífilis', 'Sífilis congênita'], true));
        if (o.cls === 'Sífilis congênita') {
          el.appendChild(
            segH('trat', 'Tratamento realizado', [
              'Penicilina cristalina 10 dias',
              'Penicilina procaína 10 dias',
              'Penicilina benzatina dose única',
              'Não tratada',
            ]),
          );
          const g2 = document.createElement('div');
          g2.className = 'grid-in';
          g2.style.gridTemplateColumns = 'repeat(auto-fill,minmax(200px,1fr))';
          g2.append(txtH('tratData', 'Data/local do tratamento', 'dd/mm/aaaa – maternidade'));
          el.appendChild(g2);
          const av = document.createElement('div');
          av.className = 'field';
          av.innerHTML = '<div class="lab">Avaliações realizadas</div><div class="chips"></div>';
          const c = av.querySelector('.chips');
          const arr = (o.av = o.av || []);
          [
            'Oftalmológica',
            'Audiológica',
            'Neurológica',
            'Líquor (LCR)',
            'Radiografia de ossos longos',
            'Hemograma',
          ].forEach(x => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'chip';
            b.textContent = x;
            b.setAttribute('aria-pressed', arr.includes(x));
            b.onclick = () => {
              const i = arr.indexOf(x);
              if (i >= 0) arr.splice(i, 1);
              else arr.push(x);
              b.setAttribute('aria-pressed', arr.includes(x));
              upd();
            };
            c.appendChild(b);
          });
          el.appendChild(av);
        }
      } else {
        el.appendChild(
          segH('cls', 'Estágio clínico', [
            'Sífilis recente (até 1 ano)',
            'Sífilis tardia (mais de 1 ano ou duração ignorada)',
            'Neurossífilis',
          ]),
        );
        grid.append(txtH('trep', 'Teste treponêmico (resultado e data)', 'TR reagente em 02/09/2026'));
        el.appendChild(grid);
        el.appendChild(
          rowsH(
            'doses',
            'Doses de penicilina benzatina',
            [
              ['d', 'Data da administração', 'dd/mm/aaaa'],
              ['lote', 'Lote / observação', ''],
            ],
            '+ Adicionar dose',
          ),
        );
        el.appendChild(segH('parc', 'Parceria sexual', ['Tratada', 'Em tratamento', 'Não tratada', 'Sem informação']));
        const g3 = document.createElement('div');
        g3.className = 'grid-in';
        g3.style.gridTemplateColumns = 'repeat(auto-fill,minmax(200px,1fr))';
        g3.append(txtH('parcTxt', 'Detalhe da parceria', 'datas, testagem'));
        el.appendChild(g3);
        el.appendChild(segH('notif', 'Notificação compulsória', ['Realizada', 'Pendente']));
      }
      el.appendChild(
        rowsH(
          'ser',
          f.mode === 'crianca' ? 'VDRL de seguimento da criança' : 'VDRL seriado (inclua o VDRL do diagnóstico)',
          [
            ['d', 'Data da coleta', 'dd/mm/aaaa'],
            ['t', 'Titulação', '1:16 ou NR'],
          ],
          '+ Adicionar VDRL',
        ),
      );
      const res = document.createElement('div');
      res.className = 'result';
      res.dataset.sif = f.id;
      el.appendChild(res);
      el.insertAdjacentHTML(
        'beforeend',
        `<p class="ref">Protocolo Clínico e Diretrizes Terapêuticas para Atenção Integral às Pessoas com IST (Ministério da Saúde).${f.mode === 'crianca' ? ' Criança exposta: VDRL com 1, 3, 6, 12 e 18 meses; encerrar após dois não reagentes consecutivos.' : ' Seguimento com VDRL ' + (f.mode === 'gestante' ? 'mensal na gestação' : 'trimestral até 12 meses') + '.'}</p>`,
      );
      break;
    }
    case 'growth': {
      if (!st.v.gr) st.v.gr = [{ d: formatarDataBr(hojeSemHora()), p: '', e: '', pc: '' }];
      const rows = st.v.gr;
      el.innerHTML = `<div class="lab">Medidas de crescimento <span class="hint">a medida do nascimento entra automaticamente; peso em g ou kg</span></div><div class="grow-head"><span>Data</span><span>Peso</span><span>Comprimento/altura (cm)</span><span>PC (cm)</span><span></span></div><div class="subrows" data-grows></div><div><button type="button" class="btn small" data-addg>+ Adicionar medida</button></div><div class="result" data-growth></div><div class="tool-tabs" role="tablist" data-gtabs>${Object.entries(
        IND,
      )
        .map(
          ([k, [l]]) =>
            `<button type="button" role="tab" data-ind="${k}" aria-selected="${(st.v.gr_tab || 'wfa') === k}">${l.replace(' para a idade', '')}</button>`,
        )
        .join('')}</div><div data-gchart></div>`;
      const box = el.querySelector('[data-grows]');
      const draw = () => {
        box.innerHTML = '';
        rows.forEach((r, i) => {
          const row = document.createElement('div');
          row.className = 'grow-row';
          row.innerHTML = `<input type="text" data-c="d" aria-label="Data" placeholder="dd/mm/aaaa"><input type="text" data-c="p" inputmode="decimal" aria-label="Peso" placeholder="5200"><input type="text" data-c="e" inputmode="decimal" aria-label="Comprimento" placeholder="58"><input type="text" data-c="pc" inputmode="decimal" aria-label="PC" placeholder="39"><button type="button" class="del" aria-label="Remover" style="border:1px solid var(--line);background:none;border-radius:6px;height:38px;cursor:pointer">×</button>`;
          row.querySelectorAll('input').forEach(inp => {
            inp.value = r[inp.dataset.c] || '';
            inp.oninput = () => {
              r[inp.dataset.c] = inp.value;
              upd();
            };
          });
          row.querySelector('.del').onclick = () => {
            rows.splice(i, 1);
            draw();
            upd();
          };
          box.appendChild(row);
        });
      };
      el.querySelector('[data-addg]').onclick = () => {
        rows.push({ d: formatarDataBr(hojeSemHora()), p: '', e: '', pc: '' });
        draw();
        upd();
      };
      el.querySelectorAll('[data-ind]').forEach(
        b =>
          (b.onclick = () => {
            st.v.gr_tab = b.dataset.ind;
            el.querySelectorAll('[data-ind]').forEach(x => x.setAttribute('aria-selected', x === b));
            upd();
          }),
      );
      draw();
      break;
    }
    case 'rows': {
      const rows = (st.v[f.id] = st.v[f.id] || []);
      el.innerHTML =
        lab(f) +
        '<div class="presc"></div><div><button type="button" class="btn small" data-addrow>' +
        escaparHtml(f.add || '+ Adicionar') +
        '</button></div>' +
        note;
      const box = el.querySelector('.presc');
      const draw = () => {
        box.innerHTML = '';
        rows.forEach((r, i) => {
          const d = document.createElement('div');
          d.className = 'medrow';
          d.innerHTML = `<div class="medrow-h"><span>${escaparHtml(f.l.replace(/s$/, ''))} ${i + 1}</span><span style="display:flex;gap:6px">${f.copy ? '<button type="button" class="btn small" data-cp>Copiar</button>' : ''}<button type="button" class="btn small" data-rm>Remover</button></span></div><div class="grid-in" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr))">${f.cols.map(([k, l, ph, t]) => (t === 'area' ? `<label style="grid-column:1/-1">${escaparHtml(l)}<textarea data-k="${k}" placeholder="${escaparHtml(ph || '')}"></textarea></label>` : `<label>${escaparHtml(l)}<input type="text" data-k="${k}" placeholder="${escaparHtml(ph || '')}"></label>`)).join('')}</div>`;
          d.querySelectorAll('[data-k]').forEach(i => {
            i.value = r[i.dataset.k] || '';
            i.oninput = () => {
              r[i.dataset.k] = i.value;
              upd();
            };
          });
          d.querySelector('[data-rm]').onclick = () => {
            rows.splice(i, 1);
            draw();
            upd();
          };
          const cp = d.querySelector('[data-cp]');
          if (cp)
            cp.onclick = () => {
              const t = f.cols
                .map(([k]) => (r[k] || '').trim())
                .filter(Boolean)
                .join('\n');
              try {
                navigator.clipboard.writeText(t).then(
                  () => avisoRapido('Copiado'),
                  () => avisoRapido('Selecione o texto e copie'),
                );
              } catch (e) {
                avisoRapido('Selecione o texto e copie');
              }
            };
          box.appendChild(d);
        });
      };
      el.querySelector('[data-addrow]').onclick = () => {
        rows.push({});
        draw();
        const l = box.lastElementChild;
        if (l) {
          const i = l.querySelector('input,textarea');
          if (i) i.focus();
        }
      };
      draw();
      break;
    }
    case 'marcos': {
      el.dataset.marcos = '1';
      drawMarcos(el);
      break;
    }
    case 'link': {
      el.innerHTML = `<div><a class="btn small" href="${escaparHtml(f.href)}">${escaparHtml(f.l)}</a></div>` + note;
      break;
    }
    case 'orthoS':
      return rOrthoS(f);
    case 'orthoO':
      return rOrthoO(f);
    case 'joints': {
      const o = (st.v[f.id] = st.v[f.id] || {});
      el.innerHTML =
        lab(f, ' <span class="hint">marque dolorosa (D) e inchada/sinovite (I) por lado</span>') +
        '<div class="result" data-jsum></div><div style="overflow-x:auto"><table class="gtable jtab"><thead><tr><th>Articulação</th><th colspan="2">Direita</th><th colspan="2">Esquerda</th></tr></thead><tbody></tbody></table></div><div><button type="button" class="btn small" data-jclr>Limpar mapa</button></div>';
      const tb = el.querySelector('tbody');
      JOINTS.forEach(([n]) => {
        const tr = document.createElement('tr');
        tr.innerHTML =
          `<td>${n}</td>` +
          ['D', 'E']
            .map(sd =>
              ['d', 'i']
                .map(k => {
                  const on = !!(o[n + '|' + sd] || {})[k];
                  return `<td><button type="button" class="jb ${k}" data-j="${n}|${sd}" data-k="${k}" aria-pressed="${on}" aria-label="${n} ${sd === 'D' ? 'direita' : 'esquerda'} ${k === 'd' ? 'dolorosa' : 'inchada'}">${k === 'd' ? 'D' : 'I'}</button></td>`;
                })
                .join(''),
            )
            .join('');
        tb.appendChild(tr);
      });
      tb.querySelectorAll('.jb').forEach(
        b =>
          (b.onclick = () => {
            const j = (o[b.dataset.j] = o[b.dataset.j] || {});
            j[b.dataset.k] = !j[b.dataset.k];
            b.setAttribute('aria-pressed', !!j[b.dataset.k]);
            upd();
          }),
      );
      el.querySelector('[data-jclr]').onclick = () => {
        Object.keys(o).forEach(k => delete o[k]);
        tb.querySelectorAll('.jb').forEach(b => b.setAttribute('aria-pressed', 'false'));
        upd();
      };
      break;
    }
    case 'group': {
      el.className = 'mgrp';
      const a = st.v[f.gid];
      el.innerHTML = `<div class="mgrp-h"><h3>${escaparHtml(f.l)}</h3>${f.ask ? `<span class="ask">${escaparHtml(f.ask)}</span><div class="seg">${['Sim', 'Não', 'Não investigado'].map(x => `<button type="button" data-v="${x}" aria-pressed="${a === x}">${x}</button>`).join('')}</div>` : ''}</div>${f.note ? `<p class="note">${escaparHtml(f.note)}</p>` : ''}<div class="mgrp-b"></div>`;
      const body = el.querySelector('.mgrp-b');
      f.f.forEach(c => body.appendChild(rField(c)));
      if (f.ask) {
        body.hidden = a !== 'Sim';
        el.querySelectorAll('.mgrp-h .seg button').forEach(
          b =>
            (b.onclick = () => {
              st.v[f.gid] = st.v[f.gid] === b.dataset.v ? '' : b.dataset.v;
              el.querySelectorAll('.mgrp-h .seg button').forEach(x =>
                x.setAttribute('aria-pressed', st.v[f.gid] === x.dataset.v),
              );
              body.hidden = st.v[f.gid] !== 'Sim';
              upd();
            }),
        );
      }
      {
        const detalhe = document.createElement('details');
        detalhe.className = 'roteiro-detalhe';
        detalhe.open = !!f.ask && a === 'Sim';
        const resumo = document.createElement('summary');
        resumo.textContent = f.l;
        detalhe.appendChild(resumo);
        el.querySelector('.mgrp-h').hidden = !f.ask;
        while (el.firstChild) detalhe.appendChild(el.firstChild);
        el.appendChild(detalhe);
      }
      break;
    }
  }
  return el;
}
/**
 * Desenha os módulos marcados dentro das seções S, O, A e P da consulta:
 * cada seção tem um espaço [data-modulos="S"] (O, A, P) onde entra um bloco por módulo.
 */
export function render() {
  $$('[data-modulos]').forEach(espaco => (espaco.innerHTML = ''));
  const blocos = {};
  estado.modelo.secs.forEach(s => {
    const espaco = document.querySelector(`[data-modulos="${s.k}"]`);
    if (!espaco) return;
    const chave = s.k + ':' + s.modulo;
    let bloco = blocos[chave];
    if (!bloco) {
      bloco = blocos[chave] = document.createElement('div');
      bloco.className = 'mod-bloco';
      bloco.dataset.mod = s.modulo;
      bloco.innerHTML = `<div class="mod-h"><span class="mod-tag">${escaparHtml(estado.rotulos[s.modulo] || s.modulo)}</span></div>`;
      espaco.appendChild(bloco);
    }
    const parte = document.createElement('div');
    parte.className = 'mod-parte';
    parte.innerHTML = `<h3 class="mod-t">${escaparHtml(s.title)}${s.sub ? ` <span>${escaparHtml(s.sub)}</span>` : ''}</h3>`;
    s.f.forEach(f => parte.appendChild(rField(f)));
    bloco.appendChild(parte);
  });
  upd();
}
