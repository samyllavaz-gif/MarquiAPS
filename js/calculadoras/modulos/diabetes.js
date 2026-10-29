/**
 * Calculadora 02. DIABETES (expandido)
 */
import { avisar } from '../../componentes/aviso.js';
import {
  avaliarControleGlicemico,
  calcularImc,
  classificarHipoglicemia,
  classificarImcAdulto,
  doseInsulinaBasal,
  rastreiosPendentesDiabetes,
  titularNph,
} from '../regras/diabetes.js';
import {
  campo,
  campoSelecao,
  criarElemento,
  estaMarcado,
  listaDeMarcacao,
  mostrarAlerta,
  mostrarResultado,
  numeroDe,
  valorDe,
} from '../ui.js';

export const moduloDiabetes = {
  id: 'dm',
  rotulo: 'Diabetes',
  numero: '02',
  montar(sec) {
    sec.appendChild(criarElemento('h2', {}, [document.createTextNode('Diabetes')]));

    sec.appendChild(
      criarElemento('p', { class: 'desc' }, [
        document.createTextNode(
          'IMC, controle glicêmico, ajuste de NPH, dose basal por peso, correção de hipoglicemia, metas por perfil e rastreios anuais.',
        ),
      ]),
    );

    /* --- IMC e controle glicêmico (original) --- */
    const card = criarElemento('div', { class: 'card' });
    card.appendChild(criarElemento('h3', {}, [document.createTextNode('IMC e controle glicêmico')]));

    const r = criarElemento('div', { class: 'row' });
    r.appendChild(campo('Peso (kg)', 'dm_peso'));
    r.appendChild(campo('Altura (cm)', 'dm_altura'));
    r.appendChild(campo('HbA1c (%)', 'dm_hba1c', 'number', { step: '0.1' }));
    r.appendChild(campo('Idade (anos)', 'dm_idade'));

    card.appendChild(r);

    const chk = listaDeMarcacao([
      ['dm_idoso_fragil', 'Idoso frágil / baixa expectativa de vida'],
      ['dm_hipo_historico', 'Histórico de hipoglicemia grave'],
      ['dm_drc_avancada', 'DRC avançada'],
    ]);

    card.appendChild(chk);

    const btn = criarElemento('button', { class: 'calc' }, [document.createTextNode('Calcular')]);
    card.appendChild(btn);
    card.appendChild(criarElemento('div', { class: 'result', id: 'dm_result' }));

    sec.appendChild(card);

    btn.addEventListener('click', () => {
      const peso = numeroDe('dm_peso');
      const altura = numeroDe('dm_altura');
      const hba1c = numeroDe('dm_hba1c');

      if (peso === null || altura === null) {
        avisar('Informe peso e altura.');
        return;
      }

      const imc = calcularImc(peso, altura);
      const imcClass = classificarImcAdulto(imc);
      const fragil = estaMarcado('dm_idoso_fragil') || estaMarcado('dm_drc_avancada');
      const { meta, texto: hba1cTxt, cls } = avaliarControleGlicemico(hba1c, fragil);

      mostrarResultado(
        'dm_result',
        `
        <table class="mini-table">
          <tr><th>IMC</th><td>${imc.toFixed(1)} kg/m² — ${imcClass}</td></tr>
          <tr><th>HbA1c</th><td>${hba1c !== null ? hba1c + '%' : 'Não informada'} — ${hba1cTxt}</td></tr>
          <tr><th>Meta sugerida</th><td>${meta}%</td></tr>
        </table>
      `,
        cls,
      );
    });

    /* --- Dose basal de insulina por peso --- */
    const cBasal = criarElemento('div', { class: 'card' });
    cBasal.appendChild(
      criarElemento('h3', {}, [document.createTextNode('Estimativa de dose basal de insulina por peso')]),
    );

    const rb = criarElemento('div', { class: 'row' });
    rb.appendChild(campo('Peso (kg)', 'basal_peso'));
    rb.appendChild(
      campoSelecao('Perfil', 'basal_perfil', [
        { value: '0.2', label: 'Início de insulinização / DM2 (0,2 UI/kg/dia)' },
        { value: '0.3', label: 'DM2 com necessidade moderada (0,3 UI/kg/dia)' },
        { value: '0.5', label: 'DM1 / necessidade usual (0,5 UI/kg/dia total — basal ~50%)' },
      ]),
    );
    cBasal.appendChild(rb);

    const btnBasal = criarElemento('button', { class: 'calc' }, [document.createTextNode('Calcular dose')]);
    cBasal.appendChild(btnBasal);
    cBasal.appendChild(criarElemento('div', { class: 'result', id: 'basal_result' }));
    cBasal.appendChild(
      criarElemento('div', { class: 'foot-disclaimer' }, [
        document.createTextNode(
          'Estimativa inicial. Sempre individualizar e titular conforme glicemias de jejum, evitando hipoglicemia.',
        ),
      ]),
    );
    sec.appendChild(cBasal);

    btnBasal.addEventListener('click', () => {
      const peso = numeroDe('basal_peso');
      const fator = parseFloat(valorDe('basal_perfil'));

      if (peso === null) {
        avisar('Informe o peso.');
        return;
      }

      const { doseTotal, ehDm1: isDM1, doseBasal } = doseInsulinaBasal(peso, fator);

      mostrarResultado(
        'basal_result',
        `
        <table class="mini-table">
          ${isDM1 ? `<tr><th>Dose total estimada/dia</th><td>${doseTotal.toFixed(1)} UI</td></tr>` : ''}
          <tr><th>Dose basal inicial estimada</th><td>${doseBasal.toFixed(1)} UI/dia</td></tr>
        </table>
      `,
        'risk-info',
      );
    });

    /* --- Ajuste de NPH --- */
    const cNPH = criarElemento('div', { class: 'card' });
    cNPH.appendChild(criarElemento('h3', {}, [document.createTextNode('Ajuste de NPH conforme glicemia de jejum')]));

    const rn = criarElemento('div', { class: 'row' });
    rn.appendChild(campo('Dose atual de NPH noturna (UI)', 'nph_dose'));
    rn.appendChild(campo('Glicemia de jejum média recente (mg/dL)', 'nph_glic'));
    rn.appendChild(
      campoSelecao('Hipoglicemias na última semana', 'nph_hipo', [
        { value: '0', label: 'Não' },
        { value: '1', label: 'Sim' },
      ]),
    );
    cNPH.appendChild(rn);

    const btnNPH = criarElemento('button', { class: 'calc' }, [document.createTextNode('Sugerir ajuste')]);
    cNPH.appendChild(btnNPH);
    cNPH.appendChild(criarElemento('div', { class: 'result', id: 'nph_result' }));
    cNPH.appendChild(
      criarElemento('div', { class: 'foot-disclaimer' }, [
        document.createTextNode(
          'Ajuste orientativo baseado em glicemia de jejum (reflete a NPH da noite anterior). Reavaliar em 3–4 dias após cada ajuste.',
        ),
      ]),
    );
    sec.appendChild(cNPH);

    btnNPH.addEventListener('click', () => {
      const dose = numeroDe('nph_dose');
      const glic = numeroDe('nph_glic');
      const hipo = valorDe('nph_hipo') === '1';

      if (dose === null || glic === null) {
        avisar('Informe dose atual e glicemia de jejum.');
        return;
      }

      const { novaDose, nota, cls } = titularNph(dose, glic, hipo);

      mostrarResultado(
        'nph_result',
        `
        <table class="mini-table">
          <tr><th>Dose atual</th><td>${dose} UI</td></tr>
          <tr><th>Sugestão de nova dose</th><td>${novaDose} UI</td></tr>
          <tr><th>Justificativa</th><td>${nota}</td></tr>
        </table>
      `,
        cls,
      );
    });

    /* --- Correção de hipoglicemia --- */
    const cHipo = criarElemento('div', { class: 'card' });
    cHipo.appendChild(criarElemento('h3', {}, [document.createTextNode('Correção de hipoglicemia')]));

    const rh = criarElemento('div', { class: 'row' });
    rh.appendChild(campo('Glicemia capilar (mg/dL)', 'hipo_glic'));
    rh.appendChild(
      campoSelecao('Paciente consciente e capaz de deglutir?', 'hipo_consciente', [
        { value: '1', label: 'Sim' },
        { value: '0', label: 'Não' },
      ]),
    );
    cHipo.appendChild(rh);

    const btnHipo = criarElemento('button', { class: 'calc' }, [document.createTextNode('Conduta')]);
    cHipo.appendChild(btnHipo);
    cHipo.appendChild(criarElemento('div', { class: 'result', id: 'hipo_result' }));
    cHipo.appendChild(criarElemento('div', { class: 'alert-box', id: 'hipo_alert' }));
    sec.appendChild(cHipo);

    btnHipo.addEventListener('click', () => {
      const glic = numeroDe('hipo_glic');
      const consciente = valorDe('hipo_consciente') === '1';

      if (glic === null) {
        avisar('Informe a glicemia capilar.');
        return;
      }

      const { rotulo: label, cls, conduta, emergencia } = classificarHipoglicemia(glic, consciente);

      mostrarResultado(
        'hipo_result',
        `
        <div class="label">Classificação</div>
        <div class="big" style="font-size:1.2rem">${label}</div>
        <div class="note">${conduta}</div>
      `,
        cls,
      );

      mostrarAlerta(
        'hipo_alert',
        emergencia ? 'Emergência — não ofertar via oral. Priorizar glucagon/glicose IV e suporte avançado.' : '',
        false,
      );
    });

    /* --- Rastreio anual --- */
    const cRast = criarElemento('div', { class: 'card' });
    cRast.appendChild(criarElemento('h3', {}, [document.createTextNode('Checklist de rastreio anual')]));
    cRast.appendChild(
      criarElemento('p', { class: 'desc' }, [
        document.createTextNode(
          'Pé diabético, função renal e retinopatia — marcar o que já foi realizado nos últimos 12 meses.',
        ),
      ]),
    );

    const chkRast = listaDeMarcacao([
      ['rast_pe', 'Exame do pé (inspeção, monofilamento/sensibilidade, pulsos) no último ano'],
      ['rast_renal', 'Creatinina/eTFG e relação albumina/creatinina urinária no último ano'],
      ['rast_retina', 'Fundoscopia/retinografia (rastreio de retinopatia) no último ano'],
    ]);
    cRast.appendChild(chkRast);

    const btnRast = criarElemento('button', { class: 'calc' }, [document.createTextNode('Verificar pendências')]);
    cRast.appendChild(btnRast);
    cRast.appendChild(criarElemento('div', { class: 'result', id: 'rast_result' }));
    sec.appendChild(cRast);

    btnRast.addEventListener('click', () => {
      const { pendentes, cls } = rastreiosPendentesDiabetes({
        pe: estaMarcado('rast_pe'),
        renal: estaMarcado('rast_renal'),
        retina: estaMarcado('rast_retina'),
      });

      mostrarResultado(
        'rast_result',
        `
        <div class="label">Rastreios pendentes</div>
        <div class="big" style="font-size:1.2rem">${pendentes.length === 0 ? 'Nenhum — rastreio em dia' : pendentes.join(', ')}</div>
      `,
        cls,
      );
    });
  },
};
