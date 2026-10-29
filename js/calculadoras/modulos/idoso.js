/**
 * Calculadora 05. IDOSO (expandido)
 */
import { avisar } from '../../componentes/aviso.js';
import {
  avaliarVes13,
  classificarFragilidade,
  classificarKatz,
  classificarLawton,
  classificarPolifarmacia,
  classificarRiscoQueda,
} from '../regras/idoso.js';
import {
  campo,
  criarElemento,
  estaMarcado,
  listaDeMarcacao,
  montarQuestionario,
  mostrarResultado,
  numeroDe,
  pontuarQuestionario,
} from '../ui.js';

export const moduloIdoso = {
  id: 'idoso',
  rotulo: 'Idoso',
  numero: '05',
  montar(sec) {
    sec.appendChild(criarElemento('h2', {}, [document.createTextNode('Avaliação do Idoso')]));

    sec.appendChild(
      criarElemento('p', { class: 'desc' }, [
        document.createTextNode(
          'VES-13, Katz (AVDs), Lawton (AIVDs), risco de queda, polifarmácia e rastreio de fragilidade clínica.',
        ),
      ]),
    );

    /* --- VES-13 completo (13 itens) --- */
    const ves13Items = [
      {
        label: 'Idade',
        options: [
          { label: '60–74', value: 0 },
          { label: '75–84', value: 1 },
          { label: '≥85', value: 3 },
        ],
      },
      {
        label: 'Autoavaliação de saúde',
        options: [
          { label: 'Boa/muito boa/excelente', value: 0 },
          { label: 'Regular/ruim', value: 1 },
        ],
      },
      {
        label: 'Dificuldade para abaixar/agachar',
        options: [
          { label: 'Não', value: 0 },
          { label: 'Sim, alguma/muita dificuldade', value: 1 },
        ],
      },
      {
        label: 'Dificuldade para caminhar 400m (vários quarteirões)',
        options: [
          { label: 'Não', value: 0 },
          { label: 'Sim, alguma/muita dificuldade', value: 1 },
        ],
      },
      {
        label: 'Dificuldade para carregar 5kg',
        options: [
          { label: 'Não', value: 0 },
          { label: 'Sim, alguma/muita dificuldade', value: 1 },
        ],
      },
      {
        label: 'Dificuldade para alcançar/levantar objetos acima da cabeça',
        options: [
          { label: 'Não', value: 0 },
          { label: 'Sim, alguma/muita dificuldade', value: 1 },
        ],
      },
      {
        label: 'Dificuldade para tarefas domésticas pesadas',
        options: [
          { label: 'Não / não faz por preferência', value: 0 },
          { label: 'Sim, ou não faz por dificuldade', value: 1 },
        ],
      },
      {
        label: 'Dificuldade para fazer compras',
        options: [
          { label: 'Não / não faz por preferência', value: 0 },
          { label: 'Sim, ou não faz por dificuldade', value: 1 },
        ],
      },
      {
        label: 'Dificuldade para administrar finanças',
        options: [
          { label: 'Não / não faz por preferência', value: 0 },
          { label: 'Sim, ou não faz por dificuldade', value: 1 },
        ],
      },
    ];

    const card = criarElemento('div', { class: 'card' });
    card.appendChild(criarElemento('h3', {}, [document.createTextNode('VES-13 — Vulnerabilidade (versão completa)')]));

    montarQuestionario(card, ves13Items, 'ves13');

    const btn = criarElemento('button', { class: 'calc' }, [document.createTextNode('Calcular VES-13')]);
    card.appendChild(btn);
    card.appendChild(criarElemento('div', { class: 'result', id: 'ves13_result' }));
    card.appendChild(
      criarElemento('div', { class: 'foot-disclaimer' }, [
        document.createTextNode(
          'Versão simplificada com itens centrais do VES-13. Pontuação máxima ajustada ao número de itens utilizados aqui.',
        ),
      ]),
    );

    sec.appendChild(card);

    btn.addEventListener('click', () => {
      const { total, complete } = pontuarQuestionario('ves13', ves13Items.length);

      if (!complete) {
        avisar('Responda todos os itens.');
        return;
      }

      const { nota, cls } = avaliarVes13(total);

      mostrarResultado(
        'ves13_result',
        `
        <div class="label">Escore VES-13</div>
        <div class="big">${total}</div>
        <div class="note">${nota}</div>
      `,
        cls,
      );
    });

    /* --- Katz --- */
    const cKatz = criarElemento('div', { class: 'card' });
    cKatz.appendChild(
      criarElemento('h3', {}, [document.createTextNode('Índice de Katz — Atividades Básicas de Vida Diária (AVDs)')]),
    );

    const katzItems = [
      'Banho',
      'Vestir-se',
      'Higiene pessoal/uso do banheiro',
      'Transferência (sentar/levantar)',
      'Continência',
      'Alimentação',
    ];

    const chkKatz = criarElemento('div', { class: 'chk-list' });
    katzItems.forEach((label, idx) => {
      const id = 'katz_' + idx;
      const c = criarElemento('label', { class: 'chk' });
      c.appendChild(criarElemento('input', { type: 'checkbox', id }));
      c.appendChild(document.createTextNode(label + ' — independente'));
      chkKatz.appendChild(c);
    });
    cKatz.appendChild(chkKatz);

    const btnKatz = criarElemento('button', { class: 'calc' }, [document.createTextNode('Calcular Katz')]);
    cKatz.appendChild(btnKatz);
    cKatz.appendChild(criarElemento('div', { class: 'result', id: 'katz_result' }));
    sec.appendChild(cKatz);

    btnKatz.addEventListener('click', () => {
      let independentes = 0;
      katzItems.forEach((_, idx) => {
        if (estaMarcado('katz_' + idx)) independentes++;
      });

      const { rotulo: label, cls } = classificarKatz(independentes);

      mostrarResultado(
        'katz_result',
        `
        <div class="label">Katz — itens independentes</div>
        <div class="big">${independentes} / 6</div>
        <div class="note">${label}</div>
      `,
        cls,
      );
    });

    /* --- Lawton --- */
    const cLawton = criarElemento('div', { class: 'card' });
    cLawton.appendChild(
      criarElemento('h3', {}, [
        document.createTextNode('Escala de Lawton — Atividades Instrumentais de Vida Diária (AIVDs)'),
      ]),
    );

    const lawtonItems = [
      'Usar o telefone',
      'Fazer compras',
      'Preparar refeições',
      'Cuidar da casa',
      'Lavar roupas',
      'Usar meios de transporte',
      'Responsabilizar-se pelos medicamentos',
      'Cuidar das finanças',
    ];

    const lawtonOpts = [
      { label: 'Sem ajuda', value: 3 },
      { label: 'Com alguma ajuda', value: 2 },
      { label: 'Incapaz / não realiza', value: 1 },
    ];

    const cardLawton = criarElemento('div', {});
    montarQuestionario(
      cardLawton,
      lawtonItems.map(l => ({ label: l, options: lawtonOpts })),
      'lawton',
    );
    cLawton.appendChild(cardLawton);

    const btnLawton = criarElemento('button', { class: 'calc' }, [document.createTextNode('Calcular Lawton')]);
    cLawton.appendChild(btnLawton);
    cLawton.appendChild(criarElemento('div', { class: 'result', id: 'lawton_result' }));
    sec.appendChild(cLawton);

    btnLawton.addEventListener('click', () => {
      const { total, complete } = pontuarQuestionario('lawton', lawtonItems.length);

      if (!complete) {
        avisar('Responda todos os itens.');
        return;
      }

      const { rotulo: label, cls } = classificarLawton(total);

      mostrarResultado(
        'lawton_result',
        `
        <div class="label">Escore de Lawton</div>
        <div class="big">${total} / 24</div>
        <div class="note">${label}</div>
      `,
        cls,
      );
    });

    /* --- Risco de queda --- */
    const cQueda = criarElemento('div', { class: 'card' });
    cQueda.appendChild(criarElemento('h3', {}, [document.createTextNode('Triagem de risco de queda')]));

    const chkQueda = listaDeMarcacao([
      ['q_historico', 'Queda no último ano'],
      ['q_marcha', 'Alteração de marcha/equilíbrio observada'],
      ['q_medicamentos', 'Uso de ≥4 medicamentos ou psicotrópicos/sedativos'],
      ['q_visao', 'Déficit visual não corrigido'],
      ['q_ambiente', 'Risco ambiental no domicílio (tapetes, iluminação, escadas)'],
      ['q_hipotensao', 'Hipotensão postural'],
    ]);
    cQueda.appendChild(chkQueda);

    const btnQueda = criarElemento('button', { class: 'calc' }, [document.createTextNode('Avaliar risco de queda')]);
    cQueda.appendChild(btnQueda);
    cQueda.appendChild(criarElemento('div', { class: 'result', id: 'queda_result' }));
    sec.appendChild(cQueda);

    btnQueda.addEventListener('click', () => {
      const ids = ['q_historico', 'q_marcha', 'q_medicamentos', 'q_visao', 'q_ambiente', 'q_hipotensao'];
      const n = ids.filter(estaMarcado).length;
      const historico = estaMarcado('q_historico');

      const { rotulo: label, cls } = classificarRiscoQueda(n, historico);

      mostrarResultado(
        'queda_result',
        `
        <div class="label">Fatores de risco presentes</div>
        <div class="big">${n}</div>
        <div class="note">${label}</div>
      `,
        cls,
      );
    });

    /* --- Polifarmácia --- */
    const cPoli = criarElemento('div', { class: 'card' });
    cPoli.appendChild(criarElemento('h3', {}, [document.createTextNode('Triagem de polifarmácia')]));

    const rPoli = criarElemento('div', { class: 'row' });
    rPoli.appendChild(campo('Número de medicamentos de uso contínuo', 'poli_n'));
    cPoli.appendChild(rPoli);

    const chkPoli = listaDeMarcacao([
      ['poli_psico', 'Uso de benzodiazepínico ou outro psicotrópico sedativo'],
      ['poli_anticol', 'Uso de fármaco(s) com efeito anticolinérgico relevante'],
      ['poli_duplicidade', 'Suspeita de duplicidade terapêutica (mesma classe)'],
      ['poli_revisao', 'Sem revisão da lista de medicamentos no último ano'],
    ]);
    cPoli.appendChild(chkPoli);

    const btnPoli = criarElemento('button', { class: 'calc' }, [document.createTextNode('Avaliar')]);
    cPoli.appendChild(btnPoli);
    cPoli.appendChild(criarElemento('div', { class: 'result', id: 'poli_result' }));
    sec.appendChild(cPoli);

    btnPoli.addEventListener('click', () => {
      const n = numeroDe('poli_n');

      if (n === null) {
        avisar('Informe o número de medicamentos.');
        return;
      }

      const fatores = ['poli_psico', 'poli_anticol', 'poli_duplicidade', 'poli_revisao'].filter(estaMarcado).length;

      const { rotulo: label, cls } = classificarPolifarmacia(n, fatores);

      mostrarResultado(
        'poli_result',
        `
        <table class="mini-table">
          <tr><th>Nº de medicamentos</th><td>${n}</td></tr>
          <tr><th>Fatores de risco adicionais</th><td>${fatores}</td></tr>
          <tr><th>Classificação</th><td><strong>${label}</strong></td></tr>
        </table>
        <div class="note">Considerar revisão farmacoterapêutica e desprescrição quando indicado.</div>
      `,
        cls,
      );
    });

    /* --- Fragilidade clínica --- */
    const cFrag = criarElemento('div', { class: 'card' });
    cFrag.appendChild(
      criarElemento('h3', {}, [document.createTextNode('Rastreio de fragilidade clínica (fenótipo simplificado)')]),
    );

    const chkFrag = listaDeMarcacao([
      ['frag_perda_peso', 'Perda de peso não intencional (≥4,5kg ou ≥5% no último ano)'],
      ['frag_exaustao', 'Exaustão/fadiga autorreferida frequente'],
      ['frag_forca', 'Diminuição da força de preensão / dificuldade para levantar-se da cadeira'],
      ['frag_lentidao', 'Lentidão na marcha observada'],
      ['frag_sedentarismo', 'Baixo nível de atividade física'],
    ]);
    cFrag.appendChild(chkFrag);

    const btnFrag = criarElemento('button', { class: 'calc' }, [
      document.createTextNode('Calcular fenótipo de fragilidade'),
    ]);
    cFrag.appendChild(btnFrag);
    cFrag.appendChild(criarElemento('div', { class: 'result', id: 'frag_result' }));
    cFrag.appendChild(
      criarElemento('div', { class: 'foot-disclaimer' }, [
        document.createTextNode(
          'Inspirado no fenótipo de fragilidade de Fried, em versão simplificada e autorreferida — não substitui avaliação multidimensional completa.',
        ),
      ]),
    );
    sec.appendChild(cFrag);

    btnFrag.addEventListener('click', () => {
      const ids = ['frag_perda_peso', 'frag_exaustao', 'frag_forca', 'frag_lentidao', 'frag_sedentarismo'];
      const n = ids.filter(estaMarcado).length;

      const { rotulo: label, cls } = classificarFragilidade(n);

      mostrarResultado(
        'frag_result',
        `
        <div class="label">Critérios presentes</div>
        <div class="big">${n} / 5</div>
        <div class="note">${label}</div>
      `,
        cls,
      );
    });
  },
};
