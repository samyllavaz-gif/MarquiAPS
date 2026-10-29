/**
 * Calculadora 04. DRC (expandido)
 */
import { avisar } from '../../componentes/aviso.js';
import {
  ajusteRenalAntidiabeticos,
  avaliarEncaminhamentoNefrologia,
  estadiarFuncaoRenal,
  riscoKdigo,
} from '../regras/renal.js';
import {
  campo,
  campoSelecao,
  criarElemento,
  estaMarcado,
  listaDeMarcacao,
  mostrarResultado,
  numeroDe,
  valorDe,
} from '../ui.js';

export const moduloRenal = {
  id: 'drc',
  rotulo: 'Rim / DRC',
  numero: '04',
  montar(sec) {
    sec.appendChild(criarElemento('h2', {}, [document.createTextNode('Doença Renal Crônica')]));

    sec.appendChild(
      criarElemento('p', { class: 'desc' }, [
        document.createTextNode(
          'eTFG por CKD-EPI 2021, classificação G/A combinada, critérios de encaminhamento à nefrologia e ajuste de metformina/dapagliflozina por eTFG.',
        ),
      ]),
    );

    const card = criarElemento('div', { class: 'card' });
    card.appendChild(criarElemento('h3', {}, [document.createTextNode('eTFG e classificação G')]));

    const r = criarElemento('div', { class: 'row' });
    r.appendChild(campo('Idade (anos)', 'drc_idade'));
    r.appendChild(
      campoSelecao('Sexo', 'drc_sexo', [
        { value: 'F', label: 'Feminino' },
        { value: 'M', label: 'Masculino' },
      ]),
    );
    r.appendChild(campo('Creatinina sérica (mg/dL)', 'drc_creat', 'number', { step: '0.01' }));

    card.appendChild(r);

    const btn = criarElemento('button', { class: 'calc' }, [document.createTextNode('Calcular eTFG')]);
    card.appendChild(btn);
    card.appendChild(criarElemento('div', { class: 'result', id: 'drc_result' }));

    sec.appendChild(card);

    btn.addEventListener('click', () => {
      const idade = numeroDe('drc_idade');
      const sexo = valorDe('drc_sexo');
      const creat = numeroDe('drc_creat');

      if (idade === null || creat === null) {
        avisar('Informe idade e creatinina.');
        return;
      }

      const { etfg, estagio: stage, cls } = estadiarFuncaoRenal(creat, idade, sexo);

      mostrarResultado(
        'drc_result',
        `
        <table class="mini-table">
          <tr><th>eTFG</th><td>${etfg} mL/min/1,73m²</td></tr>
          <tr><th>Estágio G</th><td>${stage}</td></tr>
        </table>
      `,
        cls,
      );

      document.getElementById('classGA_etfg').value = etfg;
    });

    /* --- Classificação G/A combinada --- */
    const cGA = criarElemento('div', { class: 'card' });
    cGA.appendChild(
      criarElemento('h3', {}, [document.createTextNode('Classificação combinada G/A (risco prognóstico)')]),
    );

    const rGA = criarElemento('div', { class: 'row' });
    rGA.appendChild(campo('eTFG (mL/min/1,73m²)', 'classGA_etfg'));
    rGA.appendChild(
      campoSelecao('Relação albumina/creatinina urinária (RAC)', 'classGA_rac', [
        { value: 'A1', label: 'A1 — <30 mg/g (normal a levemente aumentada)' },
        { value: 'A2', label: 'A2 — 30–300 mg/g (moderadamente aumentada)' },
        { value: 'A3', label: 'A3 — >300 mg/g (acentuadamente aumentada)' },
      ]),
    );
    cGA.appendChild(rGA);

    const btnGA = criarElemento('button', { class: 'calc' }, [document.createTextNode('Classificar risco KDIGO')]);
    cGA.appendChild(btnGA);
    cGA.appendChild(criarElemento('div', { class: 'result', id: 'classGA_result' }));
    sec.appendChild(cGA);

    btnGA.addEventListener('click', () => {
      const etfg = numeroDe('classGA_etfg');
      const rac = valorDe('classGA_rac');

      if (etfg === null) {
        avisar('Informe a eTFG (ou calcule acima).');
        return;
      }

      const { classificacao, rotulo: label, cls } = riscoKdigo(etfg, rac);

      mostrarResultado(
        'classGA_result',
        `
        <table class="mini-table">
          <tr><th>Classificação KDIGO</th><td>${classificacao}</td></tr>
          <tr><th>Risco de progressão/eventos</th><td><strong>${label}</strong></td></tr>
        </table>
      `,
        cls,
      );
    });

    /* --- Encaminhamento à nefrologia --- */
    const cNefro = criarElemento('div', { class: 'card' });
    cNefro.appendChild(criarElemento('h3', {}, [document.createTextNode('Critérios de encaminhamento à nefrologia')]));

    const chkNefro = listaDeMarcacao([
      ['nefro_g4g5', 'eTFG <30 mL/min/1,73m² (G4/G5)'],
      ['nefro_rac_alta', 'RAC >300 mg/g (A3) persistente'],
      ['nefro_queda', 'Queda sustentada da eTFG ≥25% em 12 meses, ou queda rápida (>5 mL/min/ano)'],
      ['nefro_hematuria', 'Hematúria persistente não urológica associada à DRC'],
      ['nefro_has_resistente', 'HAS resistente apesar de 4 ou mais anti-hipertensivos'],
      ['nefro_potassio', 'Distúrbios persistentes de potássio'],
      ['nefro_litiase', 'Nefrolitíase recorrente ou DRC hereditária suspeita'],
      ['nefro_incerteza', 'Causa da DRC incerta'],
    ]);
    cNefro.appendChild(chkNefro);

    const btnNefro = criarElemento('button', { class: 'calc' }, [document.createTextNode('Avaliar encaminhamento')]);
    cNefro.appendChild(btnNefro);
    cNefro.appendChild(criarElemento('div', { class: 'result', id: 'nefro_result' }));
    sec.appendChild(cNefro);

    btnNefro.addEventListener('click', () => {
      const ids = [
        'nefro_g4g5',
        'nefro_rac_alta',
        'nefro_queda',
        'nefro_hematuria',
        'nefro_has_resistente',
        'nefro_potassio',
        'nefro_litiase',
        'nefro_incerteza',
      ];
      const marcados = ids.filter(estaMarcado);

      const { cls, rotulo: label } = avaliarEncaminhamentoNefrologia(marcados.length);

      mostrarResultado('nefro_result', `<div class="note"><strong>${label}</strong></div>`, cls);
    });

    /* --- Ajuste de metformina/dapagliflozina por eTFG --- */
    const cAjuste = criarElemento('div', { class: 'card' });
    cAjuste.appendChild(
      criarElemento('h3', {}, [document.createTextNode('Ajuste de metformina e dapagliflozina por eTFG')]),
    );

    const rAj = criarElemento('div', { class: 'row' });
    rAj.appendChild(campo('eTFG (mL/min/1,73m²)', 'ajuste_etfg'));
    cAjuste.appendChild(rAj);

    const btnAj = criarElemento('button', { class: 'calc' }, [document.createTextNode('Verificar ajuste')]);
    cAjuste.appendChild(btnAj);
    cAjuste.appendChild(criarElemento('div', { class: 'result', id: 'ajuste_result' }));
    cAjuste.appendChild(
      criarElemento('div', { class: 'foot-disclaimer' }, [
        document.createTextNode(
          'Orientação geral; checar bula vigente e contexto clínico individual (ex.: insuficiência cardíaca, proteção renal podem manter indicação de iSGLT2 mesmo com eTFG mais baixa).',
        ),
      ]),
    );
    sec.appendChild(cAjuste);

    btnAj.addEventListener('click', () => {
      const etfg = numeroDe('ajuste_etfg');

      if (etfg === null) {
        avisar('Informe a eTFG.');
        return;
      }

      const { metformina, dapagliflozina: dapa, cls } = ajusteRenalAntidiabeticos(etfg);

      mostrarResultado(
        'ajuste_result',
        `
        <table class="mini-table">
          <tr><th>Metformina</th><td>${metformina}</td></tr>
          <tr><th>Dapagliflozina (iSGLT2)</th><td>${dapa}</td></tr>
        </table>
      `,
        cls,
      );
    });
  },
};
