/**
 * Marcos do desenvolvimento por faixa etária (Caderneta da Criança) e seu painel na puericultura.
 */
import { escaparHtml } from '../../utils/texto.js';
import { st } from './estado.js';
import { upd } from './soap.js';

export const MARCOS = [
  [
    '1 mês',
    1,
    [
      ['Fixa o olhar em rosto', 'm1a'],
      ['Reage ao som', 'm1b'],
      ['Movimentos simétricos dos membros', 'm1c'],
      ['Sucção vigorosa', 'm1d'],
    ],
  ],
  [
    '2 meses',
    2,
    [
      ['Sorriso social', 'm2a'],
      ['Segue objeto com o olhar', 'm2b'],
      ['Vocaliza sons guturais', 'm2c'],
      ['Sustenta a cabeça brevemente em prono', 'm2d'],
    ],
  ],
  [
    '4 meses',
    4,
    [
      ['Sustenta a cabeça a 90° em prono', 'm4a'],
      ['Gargalha / ri alto', 'm4b'],
      ['Alcança objetos', 'm4c'],
      ['Reconhece familiar', 'm4d'],
      ['Rola', 'm4e'],
    ],
  ],
  [
    '6 meses',
    6,
    [
      ['Senta com apoio', 'm6a'],
      ['Transfere objetos de mão a mão', 'm6b'],
      ['Balbucia', 'm6c'],
      ['Busca objeto parcialmente escondido', 'm6d'],
      ['Reação de paraquedas anterior', 'm6e'],
    ],
  ],
  [
    '9 meses',
    9,
    [
      ['Senta sem apoio', 'm9a'],
      ['Pinça polegar-digital', 'm9b'],
      ['Faz tchau / bate palmas', 'm9c'],
      ['Diz mamã/papá inespecífico', 'm9d'],
      ['Engatinha ou se arrasta', 'm9e'],
    ],
  ],
  [
    '12 meses',
    12,
    [
      ['Fica em pé com ou sem apoio', 'm12a'],
      ['Primeiros passos', 'm12b'],
      ['Pinça fina', 'm12c'],
      ['Diz 1 a 2 palavras com significado', 'm12d'],
      ['Entende “não”', 'm12e'],
    ],
  ],
  [
    '18 meses',
    18,
    [
      ['Anda com segurança', 'm18a'],
      ['Vocabulário de 5 ou mais palavras', 'm18b'],
      ['Aponta para objetos', 'm18c'],
      ['Jogo simbólico simples', 'm18d'],
      ['Sobe escadas com apoio', 'm18e'],
    ],
  ],
  [
    '24 meses',
    24,
    [
      ['Corre', 'm24a'],
      ['Frases de 2 palavras', 'm24b'],
      ['Usa colher / faz garranchos', 'm24c'],
      ['Jogo paralelo', 'm24d'],
      ['Nomeia partes do corpo', 'm24e'],
    ],
  ],
  [
    '3 anos',
    36,
    [
      ['Frases completas', 'm36a'],
      ['Pula com os dois pés', 'm36b'],
      ['Anda de triciclo', 'm36c'],
      ['Jogo cooperativo', 'm36d'],
      ['Controle esfincteriano diurno', 'm36e'],
    ],
  ],
  [
    '4 a 5 anos',
    48,
    [
      ['Copia círculo / quadrado', 'm48a'],
      ['Conta até 10', 'm48b'],
      ['Veste-se com pouca ajuda', 'm48c'],
      ['Jogo com regras simples', 'm48d'],
      ['Linguagem compreensível por estranhos', 'm48e'],
    ],
  ],
];
export function drawMarcos(el) {
  const o = (st.v.marcos = st.v.marcos || {}),
    age = st._moc != null ? st._moc : st._mo,
    all = !!st.v.marcos_all;
  let vis = MARCOS;
  if (age != null && !all) {
    const nx = MARCOS.findIndex(x => x[1] > age);
    vis = MARCOS.slice(0, nx < 0 ? MARCOS.length : nx + 1);
  }
  const miss = [];
  MARCOS.forEach(([fx, m, its]) => {
    if (age != null && m <= age)
      its.forEach(([t, k]) => {
        if (o[k] === 'Ausente') miss.push(`${t} (${fx})`);
      });
  });
  el.innerHTML = `<div class="lab">Marcos do desenvolvimento <span class="hint">${age == null ? 'informe a data de nascimento para mostrar as faixas da idade' : `faixas até a idade${st._moc != null && st._moc !== st._mo ? ' corrigida' : ''} (${age} ${age === 1 ? 'mês' : 'meses'}) e a próxima`}</span><button type="button" class="na-btn" data-mall aria-pressed="${all}">Mostrar todas</button></div>
    ${miss.length ? `<p class="warnmsg">Marco esperado para a idade ausente: ${escaparHtml(miss.join('; '))}. Estimular, reavaliar em curto prazo e considerar encaminhamento se persistir.</p>` : ''}
    <div class="marcos">${vis.map(([fx, m, its]) => `<div class="mfx"><h4>${fx}</h4>${its.map(([t, k]) => `<div class="mrow"><span>${escaparHtml(t)}</span><div class="seg">${['Presente', 'Ausente', 'Em aquisição', 'Não avaliado'].map(x => `<button type="button" data-mk="${k}" data-v="${x}" aria-pressed="${o[k] === x}">${x}</button>`).join('')}</div></div>`).join('')}</div>`).join('')}</div>`;
  el.querySelector('[data-mall]').onclick = () => {
    st.v.marcos_all = !st.v.marcos_all;
    drawMarcos(el);
    upd();
  };
  el.querySelectorAll('[data-mk]').forEach(
    b =>
      (b.onclick = () => {
        const k = b.dataset.mk;
        o[k] = o[k] === b.dataset.v ? '' : b.dataset.v;
        drawMarcos(el);
        upd();
      }),
  );
}
