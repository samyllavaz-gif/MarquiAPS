/**
 * Calculadora 08. PRÉ-NATAL (expandido)
 */
import { avisar } from '../../componentes/aviso.js';
import {
  avaliarGanhoPesoGestacional,
  classificarRiscoGestacional,
  examesDaIdadeGestacional,
  FATORES_ALTO_RISCO_DIRETO,
  idadeGestacionalPelaDum,
  interpretarTotg,
} from '../regras/pre-natal.js';
import { campo, criarElemento, estaMarcado, listaDeMarcacao, mostrarResultado, numeroDe, valorDe } from '../ui.js';

export const moduloPreNatal = {
  id: 'prenatal',
  rotulo: 'Pré-natal',
  numero: '08',
  montar(sec) {
    sec.appendChild(criarElemento('h2', {}, [document.createTextNode('Pré-natal')]));

    sec.appendChild(
      criarElemento('p', { class: 'desc' }, [
        document.createTextNode(
          'Idade gestacional, DPP, ganho de peso gestacional, risco gestacional, calendário de exames/vacinas e interpretação do TOTG.',
        ),
      ]),
    );

    /* --- IG/DPP (original) --- */
    const card = criarElemento('div', { class: 'card' });
    card.appendChild(criarElemento('h3', {}, [document.createTextNode('Idade gestacional e DPP')]));

    const r = criarElemento('div', { class: 'row' });
    r.appendChild(campo('Data da última menstruação (DUM)', 'pn_dum', 'date'));
    r.appendChild(campo('Data de hoje, se diferente', 'pn_hoje', 'date'));

    card.appendChild(r);

    const btn = criarElemento('button', { class: 'calc' }, [document.createTextNode('Calcular')]);
    card.appendChild(btn);
    card.appendChild(criarElemento('div', { class: 'result', id: 'pn_result' }));

    sec.appendChild(card);

    btn.addEventListener('click', () => {
      const dumStr = valorDe('pn_dum');

      if (!dumStr) {
        avisar('Informe a DUM.');
        return;
      }

      const dum = new Date(dumStr + 'T00:00:00');
      const hojeStr = valorDe('pn_hoje');
      const hoje = hojeStr ? new Date(hojeStr + 'T00:00:00') : new Date();

      const { semanas, dias, dpp, trimestre } = idadeGestacionalPelaDum(dum, hoje);

      document.getElementById('peso_ig').value = semanas;

      mostrarResultado(
        'pn_result',
        `
        <table class="mini-table">
          <tr><th>Idade gestacional</th><td>${semanas} semanas e ${dias} dia(s)</td></tr>
          <tr><th>Trimestre</th><td>${trimestre}</td></tr>
          <tr><th>DPP</th><td>${dpp.toLocaleDateString('pt-BR')}</td></tr>
        </table>
      `,
        'risk-info',
      );
    });

    /* --- Ganho de peso gestacional --- */
    const cPeso = criarElemento('div', { class: 'card' });
    cPeso.appendChild(criarElemento('h3', {}, [document.createTextNode('Ganho de peso gestacional')]));

    const rPeso = criarElemento('div', { class: 'row' });
    rPeso.appendChild(campo('Peso pré-gestacional (kg)', 'peso_pre'));
    rPeso.appendChild(campo('Altura (cm)', 'peso_altura'));
    rPeso.appendChild(campo('Peso atual (kg)', 'peso_atual'));
    rPeso.appendChild(campo('Idade gestacional atual (semanas)', 'peso_ig'));
    cPeso.appendChild(rPeso);

    const btnPeso = criarElemento('button', { class: 'calc' }, [document.createTextNode('Avaliar ganho de peso')]);
    cPeso.appendChild(btnPeso);
    cPeso.appendChild(criarElemento('div', { class: 'result', id: 'peso_result' }));
    cPeso.appendChild(
      criarElemento('div', { class: 'foot-disclaimer' }, [
        document.createTextNode(
          'Faixas de ganho total recomendado pelo Ministério da Saúde (Caderneta da Gestante 2022, curvas brasileiras) por IMC pré-gestacional: baixo peso 9,7–12,2 kg; eutrofia 8–12 kg; sobrepeso 7–9 kg; obesidade 5–7,2 kg. Antes do termo, a estimativa é proporcional à IG: confira o ponto no gráfico da Caderneta.',
        ),
      ]),
    );
    sec.appendChild(cPeso);

    btnPeso.addEventListener('click', () => {
      const pesoPre = numeroDe('peso_pre');
      const altura = numeroDe('peso_altura');
      const pesoAtual = numeroDe('peso_atual');
      const ig = numeroDe('peso_ig');

      if (pesoPre === null || altura === null || pesoAtual === null) {
        avisar('Informe peso pré-gestacional, altura e peso atual.');
        return;
      }

      const { imcPre, ganho, categoria, faixaMin, faixaMax, avaliacao, cls } = avaliarGanhoPesoGestacional(
        pesoPre,
        altura,
        pesoAtual,
        ig,
      );

      mostrarResultado(
        'peso_result',
        `
        <table class="mini-table">
          <tr><th>IMC pré-gestacional</th><td>${imcPre.toFixed(1)} kg/m² — ${categoria}</td></tr>
          <tr><th>Ganho de peso atual</th><td>${ganho.toFixed(1)} kg</td></tr>
          <tr><th>Faixa recomendada até o termo (MS 2022)</th><td>${String(faixaMin).replace('.', ',')}–${String(faixaMax).replace('.', ',')} kg</td></tr>
          <tr><th>Avaliação</th><td><strong>${avaliacao}</strong></td></tr>
        </table>
      `,
        cls,
      );
    });

    /* --- Risco gestacional --- */
    const cRiscoGest = criarElemento('div', { class: 'card' });
    cRiscoGest.appendChild(criarElemento('h3', {}, [document.createTextNode('Triagem de risco gestacional')]));

    const chkRG = listaDeMarcacao([
      ['rg_idade', 'Idade <16 ou >35 anos'],
      ['rg_has', 'Hipertensão crônica / pré-eclâmpsia em gestação atual ou prévia'],
      ['rg_dm', 'Diabetes pré-gestacional ou gestacional'],
      ['rg_cardiopatia', 'Cardiopatia, nefropatia ou outra doença sistêmica grave'],
      ['rg_obito_perinatal', 'Óbito perinatal ou malformação fetal em gestação anterior'],
      ['rg_cirurgia_uterina', 'Cirurgia uterina prévia (cesárea, miomectomia)'],
      ['rg_sangramento', 'Sangramento vaginal na gestação atual'],
      ['rg_crescimento', 'Suspeita de restrição de crescimento fetal ou alteração de líquido amniótico'],
      ['rg_gemelar', 'Gestação múltipla'],
      ['rg_infeccao', 'Infecção (sífilis, HIV, outra) não tratada/em tratamento na gestação atual'],
    ]);
    cRiscoGest.appendChild(chkRG);

    const btnRG = criarElemento('button', { class: 'calc' }, [
      document.createTextNode('Classificar risco gestacional'),
    ]);
    cRiscoGest.appendChild(btnRG);
    cRiscoGest.appendChild(criarElemento('div', { class: 'result', id: 'rg_result' }));
    sec.appendChild(cRiscoGest);

    btnRG.addEventListener('click', () => {
      const ids = [
        'rg_idade',
        'rg_has',
        'rg_dm',
        'rg_cardiopatia',
        'rg_obito_perinatal',
        'rg_cirurgia_uterina',
        'rg_sangramento',
        'rg_crescimento',
        'rg_gemelar',
        'rg_infeccao',
      ];
      const altoRiscoDireto = FATORES_ALTO_RISCO_DIRETO.some(estaMarcado);
      const n = ids.filter(estaMarcado).length;

      const { rotulo: label, cls } = classificarRiscoGestacional(n, altoRiscoDireto);

      mostrarResultado(
        'rg_result',
        `
        <div class="label">Fatores de risco identificados</div>
        <div class="big">${n}</div>
        <div class="note"><strong>${label}</strong></div>
      `,
        cls,
      );
    });

    /* --- Calendário de exames/vacinas --- */
    const cCalend = criarElemento('div', { class: 'card' });
    cCalend.appendChild(
      criarElemento('h3', {}, [document.createTextNode('Calendário de exames e vacinas por trimestre')]),
    );

    const rCal = criarElemento('div', { class: 'row' });
    rCal.appendChild(campo('Idade gestacional atual (semanas)', 'cal_ig'));
    cCalend.appendChild(rCal);

    const btnCal = criarElemento('button', { class: 'calc' }, [document.createTextNode('Mostrar calendário')]);
    cCalend.appendChild(btnCal);
    cCalend.appendChild(criarElemento('div', { class: 'result', id: 'cal_result' }));
    sec.appendChild(cCalend);

    btnCal.addEventListener('click', () => {
      const ig = numeroDe('cal_ig');

      if (ig === null) {
        avisar('Informe a idade gestacional.');
        return;
      }

      const bloco = examesDaIdadeGestacional(ig);

      mostrarResultado('cal_result', `<div class="note">${bloco}</div>`, 'risk-info');
    });

    /* --- TOTG --- */
    const cTotg = criarElemento('div', { class: 'card' });
    cTotg.appendChild(criarElemento('h3', {}, [document.createTextNode('Interpretação do TOTG 75g (24–28 semanas)')]));

    const rTotg = criarElemento('div', { class: 'row' });
    rTotg.appendChild(campo('Glicemia de jejum (mg/dL)', 'totg_jejum'));
    rTotg.appendChild(campo('Glicemia 1h (mg/dL)', 'totg_1h'));
    rTotg.appendChild(campo('Glicemia 2h (mg/dL)', 'totg_2h'));
    cTotg.appendChild(rTotg);

    const btnTotg = criarElemento('button', { class: 'calc' }, [document.createTextNode('Interpretar')]);
    cTotg.appendChild(btnTotg);
    cTotg.appendChild(criarElemento('div', { class: 'result', id: 'totg_result' }));
    cTotg.appendChild(
      criarElemento('div', { class: 'foot-disclaimer' }, [
        document.createTextNode(
          'Critérios IADPSG/OMS: diabetes gestacional se qualquer valor ≥ jejum 92, 1h 180, 2h 153 mg/dL.',
        ),
      ]),
    );
    sec.appendChild(cTotg);

    btnTotg.addEventListener('click', () => {
      const jejum = numeroDe('totg_jejum');
      const h1 = numeroDe('totg_1h');
      const h2 = numeroDe('totg_2h');

      if (jejum === null && h1 === null && h2 === null) {
        avisar('Informe ao menos um valor do TOTG.');
        return;
      }

      const { rotulo: label, cls } = interpretarTotg(jejum, h1, h2);

      mostrarResultado(
        'totg_result',
        `
        <table class="mini-table">
          <tr><th>Jejum</th><td>${jejum !== null ? jejum + ' mg/dL (corte ≥92)' : '—'}</td></tr>
          <tr><th>1 hora</th><td>${h1 !== null ? h1 + ' mg/dL (corte ≥180)' : '—'}</td></tr>
          <tr><th>2 horas</th><td>${h2 !== null ? h2 + ' mg/dL (corte ≥153)' : '—'}</td></tr>
          <tr><th>Interpretação</th><td><strong>${label}</strong></td></tr>
        </table>
      `,
        cls,
      );
    });
  },
};
