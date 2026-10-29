/**
 * Calculadora 01. HIPERTENSÃO (HAS) — NOVO MÓDULO
 */
import { avisar } from '../../componentes/aviso.js';
import {
  classificarCriseHipertensiva,
  classificarPressao,
  metaPressorica,
  triagemHasResistente,
} from '../regras/hipertensao.js';
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

export const moduloHipertensao = {
  id: 'has',
  rotulo: 'Hipertensão (HAS)',
  numero: '01',
  montar(sec) {
    sec.appendChild(criarElemento('h2', {}, [document.createTextNode('Hipertensão Arterial Sistêmica')]));
    sec.appendChild(
      criarElemento('p', { class: 'desc' }, [
        document.createTextNode(
          'Estadiamento pressórico, identificação de crise hipertensiva, meta pressórica individualizada e triagem de suspeita de HAS resistente.',
        ),
      ]),
    );

    /* --- Estadiamento --- */
    const c1 = criarElemento('div', { class: 'card' });
    c1.appendChild(criarElemento('h3', {}, [document.createTextNode('Estadiamento da PA (consultório)')]));

    const r1 = criarElemento('div', { class: 'row' });
    r1.appendChild(campo('PA sistólica (mmHg)', 'has_pas'));
    r1.appendChild(campo('PA diastólica (mmHg)', 'has_pad'));
    c1.appendChild(r1);

    const btn1 = criarElemento('button', { class: 'calc' }, [document.createTextNode('Classificar')]);
    c1.appendChild(btn1);
    c1.appendChild(criarElemento('div', { class: 'result', id: 'has_result' }));
    c1.appendChild(
      criarElemento('div', { class: 'foot-disclaimer' }, [
        document.createTextNode(
          'Classificação baseada na maior categoria entre PAS e PAD (Diretriz Brasileira de Hipertensão). Confirmar com medidas repetidas / MAPA / MRPA antes de diagnóstico definitivo.',
        ),
      ]),
    );
    sec.appendChild(c1);

    btn1.addEventListener('click', () => {
      const pas = numeroDe('has_pas');
      const pad = numeroDe('has_pad');

      if (pas === null || pad === null) {
        avisar('Informe PAS e PAD.');
        return;
      }

      const { estagio, cls } = classificarPressao(pas, pad);

      mostrarResultado(
        'has_result',
        `
        <div class="label">Classificação</div>
        <div class="big">${pas}/${pad} mmHg</div>
        <div class="note"><strong>${estagio}</strong></div>
      `,
        cls,
      );
    });

    /* --- Crise hipertensiva --- */
    const c2 = criarElemento('div', { class: 'card' });
    c2.appendChild(criarElemento('h3', {}, [document.createTextNode('Crise hipertensiva — Urgência vs. Emergência')]));

    const r2 = criarElemento('div', { class: 'row' });
    r2.appendChild(campo('PA sistólica (mmHg)', 'crise_pas'));
    r2.appendChild(campo('PA diastólica (mmHg)', 'crise_pad'));
    c2.appendChild(r2);

    c2.appendChild(
      criarElemento('div', { class: 'qlabel' }, [
        document.createTextNode('Sinais/sintomas de lesão de órgão-alvo aguda:'),
      ]),
    );

    const chk2 = listaDeMarcacao([
      ['crise_neuro', 'Cefaleia intensa, confusão, déficit focal, convulsão (encefalopatia/AVC)'],
      ['crise_card', 'Dor torácica, dispneia súbita, edema agudo de pulmão (IAM/ICC)'],
      ['crise_aorta', 'Dor torácica/dorsal lancinante (suspeita de dissecção de aorta)'],
      ['crise_renal', 'Lesão renal aguda / oligúria'],
      ['crise_visao', 'Turvação visual aguda / papiledema'],
      ['crise_eclampsia', 'Gestante com cefaleia, escotomas, epigastralgia (pré-eclâmpsia grave)'],
    ]);
    c2.appendChild(chk2);

    const btn2 = criarElemento('button', { class: 'calc' }, [document.createTextNode('Avaliar')]);
    c2.appendChild(btn2);
    c2.appendChild(criarElemento('div', { class: 'result', id: 'crise_result' }));
    c2.appendChild(criarElemento('div', { class: 'alert-box', id: 'crise_alert' }));
    c2.appendChild(
      criarElemento('div', { class: 'foot-disclaimer' }, [
        document.createTextNode(
          'Emergência hipertensiva = PA muito elevada + lesão de órgão-alvo aguda: reduzir PA com anti-hipertensivo IV em ambiente monitorado, encaminhar para urgência/UPA hospitalar. Urgência hipertensiva = PA muito elevada sem lesão aguda: ajuste/reintrodução de via oral, reavaliação em 24–72h, sem necessidade de redução abrupta.',
        ),
      ]),
    );
    sec.appendChild(c2);

    btn2.addEventListener('click', () => {
      const pas = numeroDe('crise_pas');
      const pad = numeroDe('crise_pad');

      if (pas === null || pad === null) {
        avisar('Informe a PA.');
        return;
      }

      const lod = ['crise_neuro', 'crise_card', 'crise_aorta', 'crise_renal', 'crise_visao', 'crise_eclampsia'].some(
        id => estaMarcado(id),
      );
      const { rotulo: label, cls, conduta } = classificarCriseHipertensiva(pas, pad, lod);

      mostrarResultado(
        'crise_result',
        `
        <div class="label">Classificação</div>
        <div class="big">${label}</div>
        <div class="note">${conduta}</div>
      `,
        cls,
      );

      mostrarAlerta(
        'crise_alert',
        lod ? 'Sinais de lesão de órgão-alvo presentes — não aguardar, priorizar avaliação/encaminhamento.' : '',
        false,
      );
    });

    /* --- Meta pressórica por perfil --- */
    const c3 = criarElemento('div', { class: 'card' });
    c3.appendChild(criarElemento('h3', {}, [document.createTextNode('Meta pressórica por perfil clínico')]));

    const r3 = criarElemento('div', { class: 'row' });
    r3.appendChild(campo('Idade (anos)', 'meta_idade'));
    r3.appendChild(
      campoSelecao('Perfil de risco / comorbidade predominante', 'meta_perfil', [
        { value: 'geral', label: 'Geral, baixo risco' },
        { value: 'dm', label: 'Diabetes' },
        { value: 'drc', label: 'DRC' },
        { value: 'drc_album', label: 'DRC com albuminúria' },
        { value: 'cv_alto', label: 'Doença cardiovascular estabelecida / risco alto' },
        { value: 'idoso_fragil', label: 'Idoso frágil / muito idoso (≥80a)' },
      ]),
    );
    c3.appendChild(r3);

    const btn3 = criarElemento('button', { class: 'calc' }, [document.createTextNode('Definir meta')]);
    c3.appendChild(btn3);
    c3.appendChild(criarElemento('div', { class: 'result', id: 'meta_result' }));
    sec.appendChild(c3);

    btn3.addEventListener('click', () => {
      const idade = numeroDe('meta_idade');
      const perfil = valorDe('meta_perfil');

      const { meta, obs } = metaPressorica(idade, perfil);

      mostrarResultado(
        'meta_result',
        `
        <table class="mini-table">
          <tr><th>Meta sugerida</th><td>${meta}</td></tr>
          <tr><th>Observação</th><td>${obs}</td></tr>
        </table>
      `,
        'risk-info',
      );
    });

    /* --- HAS resistente --- */
    const c4 = criarElemento('div', { class: 'card' });
    c4.appendChild(criarElemento('h3', {}, [document.createTextNode('Suspeita de HAS resistente')]));

    c4.appendChild(criarElemento('div', { class: 'qlabel' }, [document.createTextNode('Marque os itens presentes:')]));

    const chk4 = listaDeMarcacao([
      [
        'res_3classes',
        'PA não controlada em uso de ≥3 anti-hipertensivos de classes diferentes, em doses adequadas, incluindo diurético',
      ],
      ['res_4classes', 'PA controlada apenas com ≥4 classes de anti-hipertensivos'],
      ['res_adesao', 'Adesão medicamentosa confirmada (sem evidência de má adesão)'],
      ['res_tecnica', 'Técnica de aferição da PA adequada/confirmada'],
      ['res_mapa', 'PA elevada confirmada fora do consultório (MAPA/MRPA) — excluído efeito do avental branco'],
      ['res_secundaria', 'Triagem inicial para causas secundárias já realizada ou em andamento'],
    ]);
    c4.appendChild(chk4);

    const btn4 = criarElemento('button', { class: 'calc' }, [document.createTextNode('Avaliar suspeita')]);
    c4.appendChild(btn4);
    c4.appendChild(criarElemento('div', { class: 'result', id: 'res_result' }));
    c4.appendChild(
      criarElemento('div', { class: 'foot-disclaimer' }, [
        document.createTextNode(
          'Triagem orientativa, não substitui critérios diagnósticos formais de HAS resistente/refratária.',
        ),
      ]),
    );
    sec.appendChild(c4);

    btn4.addEventListener('click', () => {
      const {
        rotulo: label,
        cls,
        nota,
      } = triagemHasResistente({
        tresClasses: estaMarcado('res_3classes'),
        quatroClasses: estaMarcado('res_4classes'),
        adesao: estaMarcado('res_adesao'),
        tecnica: estaMarcado('res_tecnica'),
        mapa: estaMarcado('res_mapa'),
      });

      mostrarResultado(
        'res_result',
        `
        <div class="label">Resultado da triagem</div>
        <div class="big" style="font-size:1.15rem">${label}</div>
        <div class="note">${nota}</div>
      `,
        cls,
      );
    });
  },
};
