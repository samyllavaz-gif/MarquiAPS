/**
 * Calculadora 03. RISCO CARDIOVASCULAR (reorganizado)
 */
import {
  calcularPrevent,
  CONDUTA_SBC,
  CRITERIOS_SBC,
  estratificarSbc,
  METAS_SBC,
} from '../../regras/cardiovascular.js';
import { categoriaAlbuminuria, estagioTfg } from '../../regras/renal.js';
import { formatarNumero } from '../../utils/texto.js';
import { campo, campoSelecao, criarElemento, estaMarcado, listaDeMarcacao, mostrarResultado } from '../ui.js';

export const moduloCardiovascular = {
  id: 'cv',
  rotulo: 'Cardiovascular / HAS / DM',
  numero: '03',
  montar(sec) {
    sec.appendChild(criarElemento('h2', {}, [document.createTextNode('Risco Cardiovascular')]));

    sec.appendChild(
      criarElemento('p', { class: 'desc' }, [
        document.createTextNode(
          'Prevenção primária pelas equações PREVENT com a estratificação da Diretriz Brasileira de Dislipidemias 2025 (SBC), e prevenção secundária com metas atualizadas.',
        ),
      ]),
    );

    /* --- Prevenção primária: PREVENT + Diretriz SBC 2025 (Marqui) --- */
    const cPrim = criarElemento('div', { class: 'card' });
    cPrim.appendChild(
      criarElemento('h3', {}, [document.createTextNode('Risco cardiovascular — PREVENT e Diretriz SBC 2025')]),
    );
    cPrim.appendChild(
      criarElemento('p', { class: 'desc' }, [
        document.createTextNode(
          'Equações PREVENT (AHA) de risco em 10 anos e estratificação da Diretriz Brasileira de Dislipidemias e Prevenção da Aterosclerose 2025 (SBC), com metas de LDL-c, não-HDL e ApoB.',
        ),
      ]),
    );
    const cvR1 = criarElemento('div', { class: 'row' });
    cvR1.appendChild(
      campoSelecao('Sexo', 'cv_sexo', [
        { value: '', label: 'Selecione' },
        { value: 'F', label: 'Feminino' },
        { value: 'M', label: 'Masculino' },
      ]),
    );
    [
      ['Idade (anos)', 'cv_idade'],
      ['Colesterol total (mg/dL)', 'cv_ct'],
      ['HDL (mg/dL)', 'cv_hdl'],
      ['LDL-c (mg/dL)', 'cv_ldl'],
      ['PA sistólica (mmHg)', 'cv_pas'],
      ['IMC (kg/m²)', 'cv_imc'],
      ['TFG (mL/min/1,73 m²)', 'cv_tfg'],
      ['Albuminúria – RAC (mg/g), opcional', 'cv_rac'],
      ['Lp(a) (mg/dL), opcional', 'cv_lpa'],
      ['Escore de cálcio – CAC (UA), opcional', 'cv_cac'],
    ].forEach(([l, id]) => cvR1.appendChild(campo(l, id)));
    cPrim.appendChild(cvR1);
    const cvR2 = criarElemento('div', { class: 'row' });
    [
      ['Diabetes', 'cv_dm'],
      ['Tabagismo atual', 'cv_tab'],
      ['Hipertensão', 'cv_has'],
      ['Usa anti-hipertensivo', 'cv_antiht'],
      ['Usa estatina', 'cv_estat'],
    ].forEach(([l, id]) =>
      cvR2.appendChild(
        campoSelecao(l, id, [
          { value: '', label: 'Selecione' },
          { value: '1', label: 'Sim' },
          { value: '0', label: 'Não' },
        ]),
      ),
    );
    cvR2.appendChild(
      campoSelecao('Evento CV aterosclerótico prévio', 'cv_evento', [
        { value: '0', label: 'Não' },
        { value: '1', label: '1 evento' },
        { value: '2', label: '2 ou mais' },
      ]),
    );
    cPrim.appendChild(cvR2);
    const cvGroup = (titulo, lista, pref, nota) => {
      const g = criarElemento('div', {});
      g.appendChild(criarElemento('h4', { class: 'sub-h' }, [document.createTextNode(titulo)]));
      if (nota) g.appendChild(criarElemento('p', { class: 'desc' }, [document.createTextNode(nota)]));
      const cl = criarElemento('div', { class: 'chk-list' });
      lista.forEach((t, i) => {
        const c = criarElemento('label', { class: 'chk' });
        c.appendChild(criarElemento('input', { type: 'checkbox', id: pref + '_' + i }));
        c.appendChild(document.createTextNode(t));
        cl.appendChild(c);
      });
      g.appendChild(cl);
      cPrim.appendChild(g);
    };
    cvGroup('Doença aterosclerótica e exames de imagem', CRITERIOS_SBC.ath, 'cv_ath');
    cvGroup(
      'Condições de alto risco (se houve evento)',
      CRITERIOS_SBC.cond,
      'cv_cond',
      'Idade ≥ 65 anos, diabetes, hipertensão, DRC (TFG 15–59) e tabagismo entram automaticamente.',
    );
    cvGroup(
      'Estratificadores no diabetes',
      CRITERIOS_SBC.ear.concat(CRITERIOS_SBC.emar.map(x => 'Muito alto: ' + x)),
      'cv_dmx',
      'Hipertensão, tabagismo, rim, história familiar, síndrome metabólica e imagem entram automaticamente.',
    );
    cvGroup('Fatores agravantes de risco', CRITERIOS_SBC.agr, 'cv_agr', 'Reclassificam a categoria para cima.');
    const cvBtn = criarElemento('button', { class: 'calc' }, [document.createTextNode('Calcular risco e metas')]);
    cPrim.appendChild(cvBtn);
    cPrim.appendChild(criarElemento('div', { class: 'result', id: 'cv_result' }));
    cPrim.appendChild(criarElemento('div', { class: 'alert-box', id: 'cv_alert' }));
    cPrim.appendChild(
      criarElemento('div', { class: 'foot-disclaimer' }, [
        document.createTextNode(
          'PREVENT: 30 a 79 anos, sem doença cardiovascular prévia; desenvolvido em população norte-americana. A SBC 2025 adota o risco de DCV aterosclerótica (baixo < 5%, intermediário 5 a < 20%, alto ≥ 20%), reclassificado por diabetes, aterosclerose subclínica, LDL-c, Lp(a) e agravantes.',
        ),
      ]),
    );
    sec.appendChild(cPrim);
    cvBtn.addEventListener('click', () => calcularRiscoCardiovascular());

    /* --- Prevenção secundária --- */
    const cSec = criarElemento('div', { class: 'card' });
    cSec.appendChild(
      criarElemento('h3', {}, [document.createTextNode('Prevenção secundária — Doença cardiovascular estabelecida')]),
    );
    cSec.appendChild(
      criarElemento('p', { class: 'desc' }, [
        document.createTextNode('Para pacientes com evento ou doença aterosclerótica já confirmada.'),
      ]),
    );

    const chkSec = listaDeMarcacao([
      ['sec_iam', 'IAM ou síndrome coronariana aguda prévia'],
      ['sec_avc', 'AVC isquêmico ou AIT prévio'],
      ['sec_revasc', 'Revascularização miocárdica ou periférica prévia'],
      ['sec_dap', 'Doença arterial periférica sintomática'],
      ['sec_multivaso', '2 ou mais eventos, ou 1 evento + 2 condições de alto risco (risco extremo)'],
    ]);
    cSec.appendChild(chkSec);

    const btnSec = criarElemento('button', { class: 'calc' }, [document.createTextNode('Definir meta e conduta')]);
    cSec.appendChild(btnSec);
    cSec.appendChild(criarElemento('div', { class: 'result', id: 'sec_result' }));
    cSec.appendChild(
      criarElemento('div', { class: 'foot-disclaimer' }, [
        document.createTextNode(
          'Qualquer item marcado caracteriza prevenção secundária: risco muito alto (1 evento) ou extremo (2 ou mais eventos, ou 1 evento com 2 condições de alto risco como DM, HAS, DRC, tabagismo, idade ≥ 65 anos, HF ou evento há menos de 2 anos) — SBC 2025.',
        ),
      ]),
    );
    sec.appendChild(cSec);

    btnSec.addEventListener('click', () => {
      const algumEvento = ['sec_iam', 'sec_avc', 'sec_revasc', 'sec_dap', 'sec_multivaso'].some(estaMarcado);
      const extremo = estaMarcado('sec_multivaso');

      if (!algumEvento) {
        mostrarResultado(
          'sec_result',
          `
          <div class="note">Nenhum critério de doença cardiovascular estabelecida marcado — utilizar o módulo de prevenção primária acima.</div>
        `,
          'risk-info',
        );
        return;
      }

      const cls = extremo ? 'risk-vhigh' : 'risk-high';
      const metaLDL = extremo ? '< 40 mg/dL (não-HDL < 70; ApoB < 45)' : '< 50 mg/dL (não-HDL < 80; ApoB < 55)';

      mostrarResultado(
        'sec_result',
        `
        <table class="mini-table">
          <tr><th>Categoria de risco</th><td>${extremo ? 'Risco extremo' : 'Risco muito alto'} — prevenção secundária (SBC 2025)</td></tr>
          <tr><th>Meta de LDL</th><td>${metaLDL}</td></tr>
          <tr><th>Meta de PA</th><td>&lt;130/80 mmHg, se tolerado</td></tr>
          <tr><th>Estatina</th><td>Alta potência indicada, associar ezetimiba se LDL não atingido</td></tr>
          <tr><th>Antiplaquetário</th><td>Indicado, salvo contraindicação</td></tr>
        </table>
      `,
        cls,
      );
    });
  },
};

/* ---------- risco cardiovascular (PREVENT + SBC 2025): leitura do formulário e resultado ---------- */
const CLASSE_RISCO_SBC = {
  baixo: 'risk-low',
  inter: 'risk-mod',
  alto: 'risk-high',
  mu: 'risk-vhigh',
  ext: 'risk-vhigh',
};

/** Lê o cartão cardiovascular. */
function lerFormularioCardiovascular() {
  const numero = id => {
    const e = document.getElementById(id);
    const x = parseFloat(String(e ? e.value : '').replace(',', '.'));
    return isFinite(x) ? x : NaN;
  };
  const texto = id => {
    const e = document.getElementById(id);
    return e ? e.value : '';
  };
  const marcados = (prefixo, lista) =>
    lista.filter((_, i) => {
      const e = document.getElementById(prefixo + '_' + i);
      return e && e.checked;
    });
  const diabetes = marcados('cv_dmx', CRITERIOS_SBC.ear.concat(CRITERIOS_SBC.emar.map(x => 'Muito alto: ' + x)));
  return {
    sx: texto('cv_sexo'),
    age: numero('cv_idade'),
    tc: numero('cv_ct'),
    hdl: numero('cv_hdl'),
    ldl: numero('cv_ldl'),
    sbp: numero('cv_pas'),
    bmi: numero('cv_imc'),
    egfr: numero('cv_tfg'),
    rac: numero('cv_rac'),
    lpa: numero('cv_lpa'),
    cac: numero('cv_cac'),
    dm: texto('cv_dm'),
    smk: texto('cv_tab'),
    has: texto('cv_has'),
    bptx: texto('cv_antiht'),
    st: texto('cv_estat'),
    ev: texto('cv_evento') || '0',
    ath: marcados('cv_ath', CRITERIOS_SBC.ath),
    cond: marcados('cv_cond', CRITERIOS_SBC.cond),
    ear: diabetes.filter(x => !x.startsWith('Muito alto: ')),
    emar: diabetes.filter(x => x.startsWith('Muito alto: ')).map(x => x.slice(12)),
    agr: marcados('cv_agr', CRITERIOS_SBC.agr),
  };
}

function mostrarCaixaCardiovascular(id, html, classe) {
  const caixa = document.getElementById(id);
  if (!caixa) return;
  caixa.className =
    (id.endsWith('alert') ? 'alert-box' : 'result') + (html ? ' show' : '') + (classe ? ' ' + classe : '');
  caixa.innerHTML = html || '';
}

function calcularRiscoCardiovascular() {
  const fmt = formatarNumero;
  const o = lerFormularioCardiovascular();
  const pv = calcularPrevent({
    ...o,
    eventoPrevio: o.ev !== '0',
    mensagemSemImc: 'Informe o IMC para estimar o risco de insuficiência cardíaca.',
  });
  const linhas = [],
    alertas = [];
  if (pv.dcv) linhas.push(['PREVENT', 'Não se aplica: há evento cardiovascular prévio (prevenção secundária).']);
  else if (pv.miss) linhas.push(['PREVENT', `Faltam: ${pv.miss.join(', ')}.`]);
  else if (pv.out) linhas.push(['PREVENT', pv.out.join('; ') + '.']);
  else
    linhas.push(
      ['PREVENT — DCV aterosclerótica (10 anos)', `<b>${fmt(pv.ascvd)}%</b>`],
      ['PREVENT — DCV total (10 anos)', `${fmt(pv.cvd)}%`],
      ['PREVENT — insuficiência cardíaca (10 anos)', pv.hf != null ? `${fmt(pv.hf)}%` : pv.bmiNote],
    );
  const albuminuria = categoriaAlbuminuria(o.rac) || 'A1';
  const s = estratificarSbc(
    {
      idade: o.age,
      sexo: o.sx,
      ldl: o.ldl,
      lpa: o.lpa,
      cac: o.cac,
      ct: o.tc,
      tfg: o.egfr,
      hipertensao: o.has === '1' || o.bptx === '1',
      tabagismo: o.smk === '1',
      diabetes: o.dm === '1',
      albuminuria,
      estagioTexto: estagioTfg(o.egfr),
      eventos: o.ev,
      aterosclerose: o.ath,
      condicoes: o.cond,
      estratificadoresAlto: o.ear,
      estratificadoresMuitoAlto: o.emar,
      agravantes: o.agr,
      mensagemPreventIncompleto:
        'Complete os dados do PREVENT para estratificar (ou informe um critério direto de categoria).',
    },
    pv.ascvd != null ? pv : null,
  );
  const tabela = () =>
    `<table class="mini-table">${linhas.map(r => `<tr><th>${r[0]}</th><td>${r[1]}</td></tr>`).join('')}</table>`;
  if (s.miss) {
    linhas.push(['Categoria SBC 2025', s.miss]);
    mostrarCaixaCardiovascular('cv_result', tabela(), 'risk-info');
    mostrarCaixaCardiovascular('cv_alert', '');
    return;
  }
  const meta = METAS_SBC[s.k],
    naoHdl = o.tc > 0 && o.hdl > 0 ? o.tc - o.hdl : null;
  linhas.push(['Categoria de risco (SBC 2025)', `<b>${meta.nome}</b> — ${s.why.join('; ')}`]);
  const situacao = [];
  if (o.ldl > 0) situacao.push(`LDL-c ${o.ldl}: ${o.ldl < meta.ldl ? '<b>na meta</b>' : '<b>acima da meta</b>'}`);
  if (naoHdl != null) situacao.push(`não-HDL ${naoHdl}: ${naoHdl < meta.naoHdl ? 'na meta' : 'acima da meta'}`);
  linhas.push([
    'Metas',
    `LDL-c &lt; ${meta.ldl} mg/dL e redução ${meta.reducao} · não-HDL &lt; ${meta.naoHdl} mg/dL · ApoB &lt; ${meta.apoB} mg/dL${situacao.length ? '<br>' + situacao.join(' · ') : ''}`,
  ]);
  if (o.ldl > 0 && o.ldl >= meta.ldl) {
    const reducao = Math.ceil((1 - meta.ldl / o.ldl) * 100);
    linhas.push(['Redução necessária', `cerca de ${reducao}% do LDL-c atual para atingir a meta`]);
  }
  linhas.push(['Conduta sugerida', CONDUTA_SBC[s.k]]);
  mostrarCaixaCardiovascular('cv_result', tabela(), CLASSE_RISCO_SBC[s.k]);
  if (o.ldl >= 190) alertas.push('LDL-c ≥ 190 mg/dL: investigar hipercolesterolemia familiar e causas secundárias.');
  if (o.egfr < 60) alertas.push(`TFG ${fmt(o.egfr, 0)} (${estagioTfg(o.egfr)}): ajustar fármacos à função renal.`);
  if (o.rac >= 30) alertas.push('Albuminúria ≥ 30 mg/g: considerar IECA/BRA e, no diabetes, iSGLT2.');
  if (pv.hf != null && pv.hf >= 10)
    alertas.push('Risco de IC elevado: reforçar controle pressórico e de peso; no diabetes, considerar iSGLT2.');
  if (o.sbp >= 180) alertas.push('PAS ≥ 180 mmHg: avaliar urgência/emergência hipertensiva.');
  mostrarCaixaCardiovascular(
    'cv_alert',
    alertas.length ? '<strong>Alertas:</strong><br>' + alertas.join('<br>') : '',
    false,
  );
}
