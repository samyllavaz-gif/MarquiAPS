/**
 * Calculadora 06. SAÚDE MENTAL (expandido)
 */
import { avisar } from '../../componentes/aviso.js';
import {
  ALERTA_ITEM9_PHQ9,
  ALERTA_RISCO_SUICIDA,
  classificarAuditC,
  classificarGad7,
  classificarInsonia,
  classificarPhq9,
  classificarRiscoSuicida,
} from '../regras/saude-mental.js';
import {
  criarElemento,
  estaMarcado,
  listaDeMarcacao,
  montarQuestionario,
  mostrarAlerta,
  mostrarResultado,
  pontuarQuestionario,
} from '../ui.js';

export const moduloSaudeMental = {
  id: 'mental',
  rotulo: 'Saúde Mental',
  numero: '06',
  montar(sec) {
    sec.appendChild(criarElemento('h2', {}, [document.createTextNode('Saúde Mental')]));

    sec.appendChild(
      criarElemento('p', { class: 'desc' }, [
        document.createTextNode('PHQ-9, GAD-7, AUDIT-C, triagem simplificada de risco suicida e avaliação de insônia.'),
      ]),
    );

    /* --- PHQ-9 (original) --- */
    const freqOpts = [
      { label: 'Nunca', value: 0 },
      { label: 'Vários dias', value: 1 },
      { label: 'Mais da metade dos dias', value: 2 },
      { label: 'Quase todos os dias', value: 3 },
    ];

    const phq9Items = [
      'Pouco interesse ou prazer',
      'Humor deprimido ou sem esperança',
      'Sono alterado',
      'Cansaço ou pouca energia',
      'Apetite alterado',
      'Sentir-se mal consigo mesmo',
      'Dificuldade de concentração',
      'Lentidão ou agitação',
      'Pensamentos de morte ou autolesão',
    ].map(l => ({ label: l, options: freqOpts }));

    const card = criarElemento('div', { class: 'card' });
    card.appendChild(criarElemento('h3', {}, [document.createTextNode('PHQ-9 — Depressão')]));

    montarQuestionario(card, phq9Items, 'phq9');

    const btn = criarElemento('button', { class: 'calc' }, [document.createTextNode('Calcular PHQ-9')]);
    card.appendChild(btn);
    card.appendChild(criarElemento('div', { class: 'result', id: 'phq9_result' }));
    card.appendChild(criarElemento('div', { class: 'alert-box', id: 'phq9_alert' }));

    sec.appendChild(card);

    btn.addEventListener('click', () => {
      const { total, complete } = pontuarQuestionario('phq9', phq9Items.length);

      if (!complete) {
        avisar('Responda todos os itens.');
        return;
      }

      const { rotulo: label, cls } = classificarPhq9(total);

      mostrarResultado(
        'phq9_result',
        `
        <div class="label">PHQ-9</div>
        <div class="big">${total} / 27</div>
        <div class="note">${label}</div>
      `,
        cls,
      );

      const item9 = document.querySelector('input[name="phq9_8"]:checked');

      mostrarAlerta('phq9_alert', item9 && parseFloat(item9.value) > 0 ? ALERTA_ITEM9_PHQ9 : '', false);
    });

    /* --- GAD-7 --- */
    const gadItems = [
      'Sentir-se nervoso, ansioso ou tenso',
      'Não conseguir parar ou controlar a preocupação',
      'Preocupar-se excessivamente com várias coisas',
      'Dificuldade para relaxar',
      'Inquietação, dificuldade para ficar parado',
      'Ficar facilmente irritado/irritável',
      'Sentir medo de que algo terrível possa acontecer',
    ].map(l => ({ label: l, options: freqOpts }));

    const cGad = criarElemento('div', { class: 'card' });
    cGad.appendChild(criarElemento('h3', {}, [document.createTextNode('GAD-7 — Ansiedade generalizada')]));
    montarQuestionario(cGad, gadItems, 'gad7');

    const btnGad = criarElemento('button', { class: 'calc' }, [document.createTextNode('Calcular GAD-7')]);
    cGad.appendChild(btnGad);
    cGad.appendChild(criarElemento('div', { class: 'result', id: 'gad7_result' }));
    sec.appendChild(cGad);

    btnGad.addEventListener('click', () => {
      const { total, complete } = pontuarQuestionario('gad7', gadItems.length);

      if (!complete) {
        avisar('Responda todos os itens.');
        return;
      }

      const { rotulo: label, cls } = classificarGad7(total);

      mostrarResultado(
        'gad7_result',
        `
        <div class="label">GAD-7</div>
        <div class="big">${total} / 21</div>
        <div class="note">${label}</div>
      `,
        cls,
      );
    });

    /* --- AUDIT-C --- */
    const cAudit = criarElemento('div', { class: 'card' });
    cAudit.appendChild(
      criarElemento('h3', {}, [document.createTextNode('AUDIT-C — Triagem de uso de risco de álcool')]),
    );

    const auditItems = [
      {
        label: 'Com que frequência você consome bebidas alcoólicas?',
        options: [
          { label: 'Nunca', value: 0 },
          { label: 'Mensalmente ou menos', value: 1 },
          { label: '2–4x/mês', value: 2 },
          { label: '2–3x/semana', value: 3 },
          { label: '≥4x/semana', value: 4 },
        ],
      },
      {
        label: 'Quantas doses você consome num dia típico em que bebe?',
        options: [
          { label: '1–2', value: 0 },
          { label: '3–4', value: 1 },
          { label: '5–6', value: 2 },
          { label: '7–9', value: 3 },
          { label: '≥10', value: 4 },
        ],
      },
      {
        label: 'Com que frequência consome ≥6 doses numa mesma ocasião?',
        options: [
          { label: 'Nunca', value: 0 },
          { label: 'Menos que mensalmente', value: 1 },
          { label: 'Mensalmente', value: 2 },
          { label: 'Semanalmente', value: 3 },
          { label: 'Quase diariamente', value: 4 },
        ],
      },
    ];

    montarQuestionario(cAudit, auditItems, 'auditc');

    const btnAudit = criarElemento('button', { class: 'calc' }, [document.createTextNode('Calcular AUDIT-C')]);
    cAudit.appendChild(btnAudit);
    cAudit.appendChild(criarElemento('div', { class: 'result', id: 'auditc_result' }));
    sec.appendChild(cAudit);

    btnAudit.addEventListener('click', () => {
      const { total, complete } = pontuarQuestionario('auditc', auditItems.length);

      if (!complete) {
        avisar('Responda todos os itens.');
        return;
      }

      const { rotulo: label, cls } = classificarAuditC(total);

      mostrarResultado(
        'auditc_result',
        `
        <div class="label">AUDIT-C</div>
        <div class="big">${total} / 12</div>
        <div class="note">${label}</div>
      `,
        cls,
      );
    });

    /* --- Risco suicida simplificado --- */
    const cSuic = criarElemento('div', { class: 'card' });
    cSuic.appendChild(criarElemento('h3', {}, [document.createTextNode('Triagem simplificada de risco suicida')]));

    const chkSuic = listaDeMarcacao([
      ['su_ideacao', 'Ideação suicida nas últimas 4 semanas'],
      ['su_plano', 'Existe um plano específico de como fazer'],
      ['su_meios', 'Tem acesso a meios para concretizar o plano'],
      ['su_tentativa_previa', 'Tentativa de suicídio prévia'],
      ['su_intencao', 'Expressa intenção de agir'],
      ['su_suporte', 'Pouco ou nenhum suporte social/familiar disponível'],
    ]);
    cSuic.appendChild(chkSuic);

    const btnSuic = criarElemento('button', { class: 'calc' }, [document.createTextNode('Avaliar risco')]);
    cSuic.appendChild(btnSuic);
    cSuic.appendChild(criarElemento('div', { class: 'result', id: 'suic_result' }));
    cSuic.appendChild(criarElemento('div', { class: 'alert-box', id: 'suic_alert' }));
    cSuic.appendChild(
      criarElemento('div', { class: 'foot-disclaimer' }, [
        document.createTextNode(
          'Triagem orientativa. Qualquer ideação suicida exige escuta ativa, acolhimento e avaliação especializada; plano + meios + intenção configura emergência psiquiátrica.',
        ),
      ]),
    );
    sec.appendChild(cSuic);

    btnSuic.addEventListener('click', () => {
      const {
        rotulo: label,
        cls,
        alerta,
      } = classificarRiscoSuicida({
        ideacao: estaMarcado('su_ideacao'),
        plano: estaMarcado('su_plano'),
        meios: estaMarcado('su_meios'),
        tentativaPrevia: estaMarcado('su_tentativa_previa'),
        intencao: estaMarcado('su_intencao'),
      });

      mostrarResultado(
        'suic_result',
        `
        <div class="label">Classificação de risco</div>
        <div class="big" style="font-size:1.2rem">${label}</div>
      `,
        cls,
      );

      mostrarAlerta('suic_alert', alerta ? ALERTA_RISCO_SUICIDA : '', false);
    });

    /* --- Insônia --- */
    const cIns = criarElemento('div', { class: 'card' });
    cIns.appendChild(criarElemento('h3', {}, [document.createTextNode('Avaliação de insônia')]));

    const insItems = [
      { label: 'Dificuldade para iniciar o sono', options: freqOpts },
      { label: 'Dificuldade para manter o sono (despertares noturnos)', options: freqOpts },
      { label: 'Despertar precoce, antes do desejado', options: freqOpts },
      { label: 'Insatisfação com a qualidade do sono', options: freqOpts },
      { label: 'Impacto perceptível no funcionamento diurno (cansaço, concentração, humor)', options: freqOpts },
    ];

    montarQuestionario(cIns, insItems, 'insonia');

    const btnIns = criarElemento('button', { class: 'calc' }, [document.createTextNode('Calcular')]);
    cIns.appendChild(btnIns);
    cIns.appendChild(criarElemento('div', { class: 'result', id: 'insonia_result' }));
    sec.appendChild(cIns);

    btnIns.addEventListener('click', () => {
      const { total, complete } = pontuarQuestionario('insonia', insItems.length);

      if (!complete) {
        avisar('Responda todos os itens.');
        return;
      }

      const { rotulo: label, cls } = classificarInsonia(total);

      mostrarResultado(
        'insonia_result',
        `
        <div class="label">Escore de insônia (itens simplificados)</div>
        <div class="big">${total} / 15</div>
        <div class="note">${label} — priorizar higiene do sono e, se indicado, TCC para insônia antes de hipnóticos.</div>
      `,
        cls,
      );
    });
  },
};
