/**
 * Trechos do formulário do SISCAN montados por script: perguntas Sim/Não/Não sabe,
 * tabela de cirurgias da mama e indicações clínicas (7a a 7f) com as caixas de cada mama.
 */
import { $, $$ } from '../../utils/dom.js';
import {
  ACHADOS_RADIOLOGICOS,
  CAIXAS_ACHADOS,
  CAIXAS_CATEGORIAS,
  CAIXAS_EXAME_CLINICO,
  CIRURGIAS_MAMA,
  LOCALIZACOES_MAMA,
  NOMES_LOCALIZACOES_MAMA,
} from './mapa.js';

/** Perguntas de três opções do citopatológico (elementos com data-yn). */
export function montarPerguntasSimNao() {
  $$('[data-yn]').forEach(e => {
    const q = e.dataset.yn;
    e.innerHTML = ['sim', 'nao', 'ns']
      .map(
        (k, i) =>
          `<label class="opt"><input type="radio" name="c${q}" data-b="c:${q}_${k}">${['Sim', 'Não', 'Não sabe'][i]}</label>`,
      )
      .join('');
  });
}

/** Tabela de cirurgias da mama (ano por lado). */
export function montarTabelaCirurgias() {
  $('#cirBody').innerHTML = CIRURGIAS_MAMA.map(
    (n, i) =>
      `<tr><td>${n}</td><td><input data-f="cir_d${i}" data-num inputmode="numeric" placeholder="aaaa" aria-label="${n}, mama direita"></td><td><input data-f="cir_e${i}" data-num inputmode="numeric" placeholder="aaaa" aria-label="${n}, mama esquerda"></td></tr>`,
  ).join('');
}

const caixaMamografia = (b, t, cls = 'opt sm', extra = '') =>
  `<label class="${cls}"${extra}><input type="checkbox" data-b="m:${b}">${t}</label>`;
const ladoDaMama = (s, body) => `<div class="side"><h4>Mama ${s === 'D' ? 'direita' : 'esquerda'}</h4>${body}</div>`;
function achadosExameClinico(s) {
  const a = CAIXAS_EXAME_CLINICO[s];
  return ladoDaMama(
    s,
    `<div class="opts">${caixaMamografia(a.lp, 'Lesão papilar')}</div>
  <p class="mini">Descarga papilar</p><div class="opts">${caixaMamografia(a.cr, 'Cristalina')}${caixaMamografia(a.he, 'Hemorrágica')}</div>
  <p class="mini">Nódulo · localização</p><div class="opts">${a.nod.map((b, i) => caixaMamografia(b, LOCALIZACOES_MAMA[i], 'opt sm', ` title="${NOMES_LOCALIZACOES_MAMA[LOCALIZACOES_MAMA[i]]}"`)).join('')}</div>
  <p class="mini">Espessamento · localização</p><div class="opts">${a.esp.map((b, i) => caixaMamografia(b, LOCALIZACOES_MAMA[i], 'opt sm', ` title="${NOMES_LOCALIZACOES_MAMA[LOCALIZACOES_MAMA[i]]}"`)).join('')}</div>
  <p class="mini">Linfonodo palpável</p><div class="opts">${caixaMamografia(a.ax, 'Axilar')}${caixaMamografia(a.sc, 'Supraclavicular')}</div>`,
  );
}
const gradeDeAchados = k =>
  `<div class="two">${['D', 'E'].map(s => ladoDaMama(s, `<div class="opts">${CAIXAS_ACHADOS[k][s].map((b, i) => caixaMamografia(b, ACHADOS_RADIOLOGICOS[i])).join('')}</div>`)).join('')}</div>`;
const blocoIndicacao = (b, id, t, body) =>
  `<div class="q"><div class="opts"><label class="opt"><input type="checkbox" data-b="m:${b}" id="${id}">${t}</label></div>${body ? `<div class="sub" data-when="${id}">${body}</div>` : ''}</div>`;
export function montarIndicacoesClinicas() {
  $('#diag').innerHTML =
    blocoIndicacao(
      29,
      'mi7a',
      '7a. Achados no exame clínico',
      `<div class="two">${achadosExameClinico('D')}${achadosExameClinico('E')}</div>`,
    ) +
    blocoIndicacao(80, 'mi7b', '7b. Controle radiológico Categoria 3 (BI-RADS)', gradeDeAchados('b')) +
    blocoIndicacao(81, 'mi7c', '7c. Lesão com diagnóstico de câncer', gradeDeAchados('c')) +
    blocoIndicacao(
      82,
      'mi7d',
      '7d. Avaliação da resposta de QT neoadjuvante',
      `<div class="opts">${caixaMamografia(87, 'Mama direita', 'opt')}${caixaMamografia(92, 'Mama esquerda', 'opt')}</div>`,
    ) +
    blocoIndicacao(
      113,
      'mi7e',
      '7e. Revisão de mamografia com lesão, realizada em outra instituição',
      `<div class="two">${['D', 'E'].map(s => ladoDaMama(s, `<div class="opts">${CAIXAS_CATEGORIAS[s].map((b, i) => caixaMamografia(b, 'Categoria ' + [0, 3, 4, 5][i])).join('')}</div>`)).join('')}</div>`,
    ) +
    blocoIndicacao(
      114,
      'mi7f',
      '7f. Controle de lesão após biópsia de fragmento ou PAAF com resultado benigno',
      gradeDeAchados('f'),
    );
}
