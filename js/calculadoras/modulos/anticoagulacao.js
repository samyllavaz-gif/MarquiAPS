/**
 * Calculadora 09. ANTICOAGULAÇÃO / FA (expandido)
 */
import { interpretarChadsVasc, interpretarHasBled } from '../regras/anticoagulacao.js';
import { campoSelecao, criarElemento, estaMarcado, listaDeMarcacao, mostrarResultado, numeroDe } from '../ui.js';

export const moduloAnticoagulacao = {
  id: 'fa',
  rotulo: 'Anticoagulação / FA',
  numero: '09',
  montar(sec) {
    sec.appendChild(criarElemento('h2', {}, [document.createTextNode('Fibrilação Atrial')]));
    sec.appendChild(
      criarElemento('p', { class: 'desc' }, [
        document.createTextNode('CHA₂DS₂-VASc (risco tromboembólico) e HAS-BLED (risco de sangramento).'),
      ]),
    );

    const card = criarElemento('div', { class: 'card' });
    card.appendChild(criarElemento('h3', {}, [document.createTextNode('CHA₂DS₂-VASc')]));

    const chk = criarElemento('div', { class: 'chk-list' });

    [
      ['c_ic', 'Insuficiência cardíaca', 1],
      ['c_has', 'Hipertensão', 1],
      ['c_dm', 'Diabetes', 1],
      ['c_avc', 'AVC/AIT prévio', 2],
      ['c_vasc', 'Doença vascular', 1],
      ['c_sexo', 'Sexo feminino', 1],
    ].forEach(([id, label, pts]) => {
      const c = criarElemento('label', { class: 'chk' });
      c.appendChild(criarElemento('input', { type: 'checkbox', id, 'data-pts': pts }));
      c.appendChild(document.createTextNode(label));
      chk.appendChild(c);
    });

    card.appendChild(chk);

    card.appendChild(
      campoSelecao('Idade', 'c_idade', [
        { value: '0', label: '<65 anos' },
        { value: '1', label: '65–74 anos' },
        { value: '2', label: '≥75 anos' },
      ]),
    );

    const btn = criarElemento('button', { class: 'calc' }, [document.createTextNode('Calcular')]);
    card.appendChild(btn);
    card.appendChild(criarElemento('div', { class: 'result', id: 'cha_result' }));

    sec.appendChild(card);

    btn.addEventListener('click', () => {
      let total = numeroDe('c_idade') || 0;

      ['c_ic', 'c_has', 'c_dm', 'c_avc', 'c_vasc', 'c_sexo'].forEach(id => {
        if (estaMarcado(id)) total += parseInt(document.getElementById(id).dataset.pts);
      });

      const { recomendacao: rec, cls } = interpretarChadsVasc(total);

      mostrarResultado(
        'cha_result',
        `
        <div class="label">CHA₂DS₂-VASc</div>
        <div class="big">${total}</div>
        <div class="note">${rec}</div>
      `,
        cls,
      );
    });

    /* --- HAS-BLED --- */
    const cBled = criarElemento('div', { class: 'card' });
    cBled.appendChild(criarElemento('h3', {}, [document.createTextNode('HAS-BLED — Risco de sangramento')]));

    const chkBled = listaDeMarcacao([
      ['b_has', 'Hipertensão não controlada (PAS >160 mmHg)'],
      ['b_renal', 'Função renal anormal (diálise, transplante, creatinina >2,26 mg/dL)'],
      ['b_hepatica', 'Função hepática anormal (cirrose, bilirrubina >2x ou TGO/TGP/FA >3x)'],
      ['b_avc', 'AVC prévio'],
      ['b_sangramento', 'História de sangramento maior ou predisposição a sangramento'],
      ['b_inr', 'INR instável/lábil (se em uso de antagonista de vitamina K)'],
      ['b_idade', 'Idade >65 anos'],
      ['b_drogas', 'Uso de antiplaquetários/AINEs concomitantes'],
      ['b_alcool', 'Uso abusivo de álcool (≥8 doses/semana)'],
    ]);
    cBled.appendChild(chkBled);

    const btnBled = criarElemento('button', { class: 'calc' }, [document.createTextNode('Calcular HAS-BLED')]);
    cBled.appendChild(btnBled);
    cBled.appendChild(criarElemento('div', { class: 'result', id: 'bled_result' }));
    cBled.appendChild(
      criarElemento('div', { class: 'foot-disclaimer' }, [
        document.createTextNode(
          'HAS-BLED não contraindica anticoagulação; serve para identificar e corrigir fatores de risco modificáveis de sangramento (ex.: controlar PA, evitar AINE, reduzir álcool).',
        ),
      ]),
    );
    sec.appendChild(cBled);

    btnBled.addEventListener('click', () => {
      const ids = [
        'b_has',
        'b_renal',
        'b_hepatica',
        'b_avc',
        'b_sangramento',
        'b_inr',
        'b_idade',
        'b_drogas',
        'b_alcool',
      ];
      const total = ids.filter(estaMarcado).length;

      const { rotulo: label, cls } = interpretarHasBled(total);

      mostrarResultado(
        'bled_result',
        `
        <div class="label">HAS-BLED</div>
        <div class="big">${total}</div>
        <div class="note">${label}. Avaliar e corrigir fatores modificáveis presentes.</div>
      `,
        cls,
      );
    });
  },
};
