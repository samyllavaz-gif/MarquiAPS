/**
 * Calculadora 10. DOR / OSTEOMUSCULAR (mantido)
 */
import { avaliarRedFlags } from '../regras/dor.js';
import { criarElemento, estaMarcado, listaDeMarcacao, mostrarResultado } from '../ui.js';

export const moduloDor = {
  id: 'dor',
  rotulo: 'Dor / Osteomuscular',
  numero: '10',
  montar(sec) {
    sec.appendChild(criarElemento('h2', {}, [document.createTextNode('Dor / Osteomuscular')]));
    sec.appendChild(
      criarElemento('p', { class: 'desc' }, [document.createTextNode('Red flags em lombalgia e funcionalidade.')]),
    );

    const card = criarElemento('div', { class: 'card' });
    card.appendChild(criarElemento('h3', {}, [document.createTextNode('Red flags — Lombalgia')]));

    const chk = listaDeMarcacao([
      ['rf1', 'Trauma significativo recente'],
      ['rf2', 'Perda de peso inexplicada'],
      ['rf3', 'História de neoplasia'],
      ['rf4', 'Febre ou mal-estar sistêmico'],
      ['rf5', 'Déficit neurológico progressivo'],
      ['rf6', 'Disfunção esfincteriana / anestesia em sela'],
    ]);

    card.appendChild(chk);

    const btn = criarElemento('button', { class: 'calc' }, [document.createTextNode('Avaliar')]);
    card.appendChild(btn);
    card.appendChild(criarElemento('div', { class: 'result', id: 'rf_result' }));

    sec.appendChild(card);

    btn.addEventListener('click', () => {
      const emergencia = estaMarcado('rf6');
      const n = ['rf1', 'rf2', 'rf3', 'rf4', 'rf5', 'rf6'].filter(estaMarcado).length;
      const { rotulo: label, cls } = avaliarRedFlags(n, emergencia);

      mostrarResultado(
        'rf_result',
        `
        <div class="big" style="font-size:18px">${label}</div>
      `,
        cls,
      );
    });
  },
};
