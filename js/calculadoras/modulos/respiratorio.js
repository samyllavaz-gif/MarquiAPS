/**
 * Calculadora 07. RESPIRATÓRIO (expandido)
 */
import { avisar } from '../../componentes/aviso.js';
import { classeMmrc, classificarAct, classificarCat, classificarCriseAsma } from '../regras/respiratorio.js';
import {
  campo,
  campoSelecao,
  criarElemento,
  estaMarcado,
  listaDeMarcacao,
  montarQuestionario,
  mostrarAlerta,
  mostrarResultado,
  numeroDe,
  pontuarQuestionario,
} from '../ui.js';

export const moduloRespiratorio = {
  id: 'resp',
  rotulo: 'Respiratório',
  numero: '07',
  montar(sec) {
    sec.appendChild(criarElemento('h2', {}, [document.createTextNode('Respiratório')]));
    sec.appendChild(
      criarElemento('p', { class: 'desc' }, [
        document.createTextNode('mMRC, CAT (DPOC), ACT (asma) e gravidade da crise asmática.'),
      ]),
    );

    /* --- mMRC (original) --- */
    const card = criarElemento('div', { class: 'card' });
    card.appendChild(criarElemento('h3', {}, [document.createTextNode('mMRC — Dispneia')]));

    card.appendChild(
      campoSelecao('Grau', 'mmrc_grau', [
        { value: '0', label: '0 — Dispneia apenas com exercício intenso' },
        { value: '1', label: '1 — Falta de ar ao andar rápido ou subir aclive' },
        { value: '2', label: '2 — Anda mais lento que pessoas da idade' },
        { value: '3', label: '3 — Para para respirar após ~100m' },
        { value: '4', label: '4 — Muito dispneico para sair de casa' },
      ]),
    );

    const btn = criarElemento('button', { class: 'calc' }, [document.createTextNode('Classificar')]);
    card.appendChild(btn);
    card.appendChild(criarElemento('div', { class: 'result', id: 'mmrc_result' }));

    sec.appendChild(card);

    btn.addEventListener('click', () => {
      const g = numeroDe('mmrc_grau');
      const cls = classeMmrc(g);

      mostrarResultado(
        'mmrc_result',
        `
        <div class="label">mMRC</div>
        <div class="big">Grau ${g}</div>
      `,
        cls,
      );
    });

    /* --- CAT (DPOC) --- */
    const catItems = [
      'Tosse',
      'Catarro/secreção no peito',
      'Aperto no peito',
      'Falta de ar ao subir escada/aclive',
      'Limitação em atividades domésticas',
      'Confiança para saída de casa',
      'Qualidade do sono',
      'Nível de energia',
    ];

    const catOpts = [0, 1, 2, 3, 4, 5].map(v => ({ label: String(v), value: v }));

    const cCat = criarElemento('div', { class: 'card' });
    cCat.appendChild(
      criarElemento('h3', {}, [
        document.createTextNode('CAT — Impacto da DPOC (0 = nenhum impacto, 5 = impacto máximo)'),
      ]),
    );
    montarQuestionario(
      cCat,
      catItems.map(l => ({ label: l, options: catOpts })),
      'cat',
    );

    const btnCat = criarElemento('button', { class: 'calc' }, [document.createTextNode('Calcular CAT')]);
    cCat.appendChild(btnCat);
    cCat.appendChild(criarElemento('div', { class: 'result', id: 'cat_result' }));
    sec.appendChild(cCat);

    btnCat.addEventListener('click', () => {
      const { total, complete } = pontuarQuestionario('cat', catItems.length);

      if (!complete) {
        avisar('Responda todos os itens.');
        return;
      }

      const { rotulo: label, cls } = classificarCat(total);

      mostrarResultado(
        'cat_result',
        `
        <div class="label">CAT</div>
        <div class="big">${total} / 40</div>
        <div class="note">${label}</div>
      `,
        cls,
      );
    });

    /* --- ACT (asma) --- */
    const actItems = [
      {
        label: 'Quanto a asma interferiu em suas atividades (trabalho/escola/casa) nas últimas 4 semanas?',
        options: [
          { label: 'Sempre', value: 1 },
          { label: 'Muitas vezes', value: 2 },
          { label: 'Algumas vezes', value: 3 },
          { label: 'Raramente', value: 4 },
          { label: 'Nunca', value: 5 },
        ],
      },
      {
        label: 'Com que frequência sentiu falta de ar nas últimas 4 semanas?',
        options: [
          { label: 'Mais de uma vez por dia', value: 1 },
          { label: 'Uma vez por dia', value: 2 },
          { label: '3–6x/semana', value: 3 },
          { label: '1–2x/semana', value: 4 },
          { label: 'Nenhuma vez', value: 5 },
        ],
      },
      {
        label:
          'Com que frequência os sintomas (chiado, tosse, falta de ar, aperto no peito) o despertaram à noite ou mais cedo que o normal?',
        options: [
          { label: '≥4 noites/semana', value: 1 },
          { label: '2–3 noites/semana', value: 2 },
          { label: '1x/semana', value: 3 },
          { label: '1–2x no total', value: 4 },
          { label: 'Nenhuma vez', value: 5 },
        ],
      },
      {
        label: 'Com que frequência usou medicação de alívio (broncodilatador de resgate)?',
        options: [
          { label: '≥3x/dia', value: 1 },
          { label: '1–2x/dia', value: 2 },
          { label: '2–3x/semana', value: 3 },
          { label: '≤1x/semana', value: 4 },
          { label: 'Nenhuma vez', value: 5 },
        ],
      },
      {
        label: 'Como você avaliaria o controle da sua asma nas últimas 4 semanas?',
        options: [
          { label: 'Não controlada', value: 1 },
          { label: 'Pouco controlada', value: 2 },
          { label: 'Razoavelmente controlada', value: 3 },
          { label: 'Bem controlada', value: 4 },
          { label: 'Totalmente controlada', value: 5 },
        ],
      },
    ];

    const cAct = criarElemento('div', { class: 'card' });
    cAct.appendChild(criarElemento('h3', {}, [document.createTextNode('ACT — Controle da asma')]));
    montarQuestionario(cAct, actItems, 'act');

    const btnAct = criarElemento('button', { class: 'calc' }, [document.createTextNode('Calcular ACT')]);
    cAct.appendChild(btnAct);
    cAct.appendChild(criarElemento('div', { class: 'result', id: 'act_result' }));
    sec.appendChild(cAct);

    btnAct.addEventListener('click', () => {
      const { total, complete } = pontuarQuestionario('act', actItems.length);

      if (!complete) {
        avisar('Responda todos os itens.');
        return;
      }

      const { rotulo: label, cls } = classificarAct(total);

      mostrarResultado(
        'act_result',
        `
        <div class="label">ACT</div>
        <div class="big">${total} / 25</div>
        <div class="note">${label}</div>
      `,
        cls,
      );
    });

    /* --- Gravidade da crise asmática --- */
    const cCrise = criarElemento('div', { class: 'card' });
    cCrise.appendChild(criarElemento('h3', {}, [document.createTextNode('Gravidade da crise asmática aguda')]));

    const rCrise = criarElemento('div', { class: 'row' });
    rCrise.appendChild(campo('Saturação de O₂ (%) — se disponível', 'asma_sat'));
    rCrise.appendChild(campo('Frequência respiratória (irpm)', 'asma_fr'));
    cCrise.appendChild(rCrise);

    const chkCrise = listaDeMarcacao([
      ['asma_fala', 'Fala frases incompletas / dificuldade para falar'],
      ['asma_tiragem', 'Tiragem intercostal/uso de musculatura acessória'],
      ['asma_cianose', 'Cianose'],
      ['asma_silencio', 'Tórax silencioso / sibilos ausentes à auscultação'],
      ['asma_consciencia', 'Confusão mental, sonolência ou agitação importante'],
      ['asma_exaustao', 'Exaustão respiratória / esforço respiratório inadequado'],
    ]);
    cCrise.appendChild(chkCrise);

    const btnCrise = criarElemento('button', { class: 'calc' }, [document.createTextNode('Classificar gravidade')]);
    cCrise.appendChild(btnCrise);
    cCrise.appendChild(criarElemento('div', { class: 'result', id: 'asmaCrise_result' }));
    cCrise.appendChild(criarElemento('div', { class: 'alert-box', id: 'asmaCrise_alert' }));
    sec.appendChild(cCrise);

    btnCrise.addEventListener('click', () => {
      const sat = numeroDe('asma_sat');
      const fr = numeroDe('asma_fr');

      const {
        grave,
        rotulo: label,
        cls,
        conduta,
      } = classificarCriseAsma(
        {
          cianose: estaMarcado('asma_cianose'),
          silencioPulmonar: estaMarcado('asma_silencio'),
          alteracaoConsciencia: estaMarcado('asma_consciencia'),
          exaustao: estaMarcado('asma_exaustao'),
          falaEntrecortada: estaMarcado('asma_fala'),
          tiragem: estaMarcado('asma_tiragem'),
        },
        sat,
        fr,
      );

      mostrarResultado(
        'asmaCrise_result',
        `
        <div class="label">Classificação de gravidade</div>
        <div class="big" style="font-size:1.15rem">${label}</div>
        <div class="note">${conduta}</div>
      `,
        cls,
      );

      mostrarAlerta(
        'asmaCrise_alert',
        grave ? 'Sinais de gravidade extrema presentes — não retardar tratamento e remoção.' : '',
        false,
      );
    });
  },
};
