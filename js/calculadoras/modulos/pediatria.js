/**
 * Calculadora 11. PEDIATRIA (expandido)
 */
import { avisar } from '../../componentes/aviso.js';
import {
  avaliarMedidasOms,
  CLASSIFICACOES_OMS,
  formatarEscoreZ,
  percentilDoEscore,
} from '../../regras/crescimento-oms.js';
import { lerDataBr } from '../../utils/datas.js';
import { formatarNumero } from '../../utils/texto.js';
import {
  avaliarSinaisDePerigo,
  classificarDesidratacao,
  marcosParaIdade,
  vacinasParaIdade,
} from '../regras/pediatria.js';
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

export const moduloPediatria = {
  id: 'ped',
  rotulo: 'Pediatria',
  numero: '11',
  montar(sec) {
    sec.appendChild(criarElemento('h2', {}, [document.createTextNode('Pediatria')]));
    sec.appendChild(
      criarElemento('p', { class: 'desc' }, [
        document.createTextNode(
          'Crescimento pelas curvas da OMS, sinais de gravidade, desidratação, calendário vacinal básico e marcos do desenvolvimento.',
        ),
      ]),
    );

    /* --- Crescimento pelas curvas da OMS (Marqui) --- */
    const card = criarElemento('div', { class: 'card' });
    card.appendChild(criarElemento('h3', {}, [document.createTextNode('Crescimento — curvas da OMS (0 a 5 anos)')]));
    card.appendChild(
      criarElemento('p', { class: 'desc' }, [
        document.createTextNode(
          'Escore-z, percentil e classificação do Ministério da Saúde para peso, comprimento/altura, perímetro cefálico e IMC por idade, com idade corrigida para prematuros até 2 anos.',
        ),
      ]),
    );
    const r = criarElemento('div', { class: 'row' });
    r.appendChild(
      campoSelecao('Sexo', 'ped_sexo', [
        { value: '', label: 'Selecione' },
        { value: 'F', label: 'Feminino' },
        { value: 'M', label: 'Masculino' },
      ]),
    );
    r.appendChild(campo('Data de nascimento (dd/mm/aaaa)', 'ped_dn', 'text', { placeholder: 'dd/mm/aaaa' }));
    r.appendChild(campo('ou idade em meses', 'ped_idade_meses'));
    r.appendChild(campo('IG ao nascer (semanas), se prematuro', 'ped_ig'));
    r.appendChild(campo('Peso (kg)', 'ped_peso', 'text', { inputmode: 'decimal' }));
    r.appendChild(campo('Comprimento/altura (cm)', 'ped_altura', 'text', { inputmode: 'decimal' }));
    r.appendChild(campo('Perímetro cefálico (cm)', 'ped_pc', 'text', { inputmode: 'decimal' }));
    card.appendChild(r);
    const btn = criarElemento('button', { class: 'calc' }, [document.createTextNode('Avaliar nas curvas da OMS')]);
    card.appendChild(btn);
    card.appendChild(criarElemento('div', { class: 'result', id: 'ped_imc_result' }));
    card.appendChild(
      criarElemento('div', { class: 'foot-disclaimer' }, [
        document.createTextNode(
          'Padrões de crescimento infantil da OMS (2006), método LMS. Antes de 40 semanas de idade corrigida, usar curvas Intergrowth-21st.',
        ),
      ]),
    );
    sec.appendChild(card);
    btn.addEventListener('click', () => avaliarCrescimentoPediatrico());

    /* --- Sinais de gravidade --- */
    const cGrav = criarElemento('div', { class: 'card' });
    cGrav.appendChild(criarElemento('h3', {}, [document.createTextNode('Sinais de gravidade (AIDPI)')]));

    const chkGrav = listaDeMarcacao([
      ['g_beber', 'Não consegue beber ou mamar'],
      ['g_vomita', 'Vomita tudo o que ingere'],
      ['g_convulsao', 'Convulsões (atuais ou na doença atual)'],
      ['g_letargia', 'Letárgico, inconsciente ou muito sonolento'],
      ['g_estridor', 'Estridor / dificuldade respiratória grave'],
      ['g_tiragem', 'Tiragem subcostal'],
      ['g_cianose', 'Cianose central'],
      ['g_desnutricao_grave', 'Sinais de desnutrição grave / edema bilateral de pés'],
    ]);
    cGrav.appendChild(chkGrav);

    const btnGrav = criarElemento('button', { class: 'calc' }, [
      document.createTextNode('Avaliar sinais de gravidade'),
    ]);
    cGrav.appendChild(btnGrav);
    cGrav.appendChild(criarElemento('div', { class: 'result', id: 'grav_result' }));
    cGrav.appendChild(criarElemento('div', { class: 'alert-box', id: 'grav_alert' }));
    sec.appendChild(cGrav);

    btnGrav.addEventListener('click', () => {
      const ids = [
        'g_beber',
        'g_vomita',
        'g_convulsao',
        'g_letargia',
        'g_estridor',
        'g_tiragem',
        'g_cianose',
        'g_desnutricao_grave',
      ];
      const n = ids.filter(estaMarcado).length;

      const { rotulo: label, cls, alerta } = avaliarSinaisDePerigo(n);

      mostrarResultado('grav_result', `<div class="note"><strong>${label}</strong></div>`, cls);
      mostrarAlerta('grav_alert', alerta, false);
    });

    /* --- Desidratação --- */
    const cDesid = criarElemento('div', { class: 'card' });
    cDesid.appendChild(criarElemento('h3', {}, [document.createTextNode('Avaliação de desidratação (diarreia)')]));

    const chkDesid = listaDeMarcacao([
      ['d_consciencia', 'Letárgico ou inconsciente'],
      ['d_olhos', 'Olhos fundos/encovados'],
      ['d_bebe', 'Não consegue beber ou bebe muito mal'],
      ['d_sinal_prega', 'Sinal da prega cutânea — desaparece muito lentamente (>2s)'],
      ['d_sede', 'Sede intensa, bebe avidamente quando oferecido'],
      ['d_irritado', 'Irritado/inquieto'],
    ]);
    cDesid.appendChild(chkDesid);

    const btnDesid = criarElemento('button', { class: 'calc' }, [document.createTextNode('Classificar desidratação')]);
    cDesid.appendChild(btnDesid);
    cDesid.appendChild(criarElemento('div', { class: 'result', id: 'desid_result' }));
    cDesid.appendChild(
      criarElemento('div', { class: 'foot-disclaimer' }, [
        document.createTextNode(
          'Baseado nos critérios simplificados AIDPI/OMS para classificação de desidratação em diarreia aguda.',
        ),
      ]),
    );
    sec.appendChild(cDesid);

    btnDesid.addEventListener('click', () => {
      const {
        rotulo: label,
        cls,
        plano,
      } = classificarDesidratacao({
        consciencia: estaMarcado('d_consciencia'),
        olhosFundos: estaMarcado('d_olhos'),
        bebeMal: estaMarcado('d_bebe'),
        sinalDaPrega: estaMarcado('d_sinal_prega'),
        sede: estaMarcado('d_sede'),
        irritado: estaMarcado('d_irritado'),
      });

      mostrarResultado(
        'desid_result',
        `
        <div class="label">${label}</div>
        <div class="note">${plano}</div>
      `,
        cls,
      );
    });

    /* --- Marcos do desenvolvimento --- */
    const cMarcos = criarElemento('div', { class: 'card' });
    cMarcos.appendChild(criarElemento('h3', {}, [document.createTextNode('Marcos do desenvolvimento por idade')]));

    const rMarcos = criarElemento('div', { class: 'row' });
    rMarcos.appendChild(campo('Idade da criança (meses)', 'marcos_idade'));
    cMarcos.appendChild(rMarcos);

    const btnMarcos = criarElemento('button', { class: 'calc' }, [document.createTextNode('Mostrar marcos esperados')]);
    cMarcos.appendChild(btnMarcos);
    cMarcos.appendChild(criarElemento('div', { class: 'result', id: 'marcos_result' }));
    cMarcos.appendChild(
      criarElemento('div', { class: 'foot-disclaimer' }, [
        document.createTextNode(
          'Marcos de referência geral (Caderneta da Criança/MS). Variações individuais existem; sinais de alerta de atraso devem ser investigados independentemente da idade exata.',
        ),
      ]),
    );
    sec.appendChild(cMarcos);

    btnMarcos.addEventListener('click', () => {
      const meses = numeroDe('marcos_idade');

      if (meses === null) {
        avisar('Informe a idade em meses.');
        return;
      }

      const { faixa, marcos } = marcosParaIdade(meses);

      mostrarResultado(
        'marcos_result',
        `
        <table class="mini-table">
          <tr><th>Faixa etária</th><td>${faixa}</td></tr>
          <tr><th>Marcos esperados</th><td>${marcos}</td></tr>
        </table>
      `,
        'risk-info',
      );
    });

    /* --- Calendário vacinal básico --- */
    const cVac = criarElemento('div', { class: 'card' });
    cVac.appendChild(criarElemento('h3', {}, [document.createTextNode('Calendário vacinal básico por idade')]));

    const rVac = criarElemento('div', { class: 'row' });
    rVac.appendChild(campo('Idade da criança (meses)', 'vac_idade'));
    cVac.appendChild(rVac);

    const btnVac = criarElemento('button', { class: 'calc' }, [document.createTextNode('Mostrar vacinas previstas')]);
    cVac.appendChild(btnVac);
    cVac.appendChild(criarElemento('div', { class: 'result', id: 'vac_result' }));
    cVac.appendChild(
      criarElemento('div', { class: 'foot-disclaimer' }, [
        document.createTextNode(
          'Referência simplificada do calendário PNI. Sempre confirmar no calendário vacinal vigente do Ministério da Saúde e na caderneta da criança.',
        ),
      ]),
    );
    sec.appendChild(cVac);

    btnVac.addEventListener('click', () => {
      const meses = numeroDe('vac_idade');

      if (meses === null) {
        avisar('Informe a idade em meses.');
        return;
      }

      const bloco = vacinasParaIdade(meses);

      mostrarResultado('vac_result', `<div class="note">${bloco}</div>`, 'risk-info');
    });
  },
};

/* ---------- crescimento pelas curvas da OMS: leitura e resultado ---------- */
function avaliarCrescimentoPediatrico() {
  const fmt = formatarNumero;
  const numero = id => {
    const e = document.getElementById(id);
    const x = parseFloat(String(e ? e.value : '').replace(',', '.'));
    return isFinite(x) ? x : NaN;
  };
  const ig = numero('ped_ig');
  const r = avaliarMedidasOms({
    sexo: valorDe('ped_sexo'),
    nascimento: lerDataBr(valorDe('ped_dn')),
    idadeMeses: numero('ped_idade_meses'),
    igSemanas: ig,
    peso: numero('ped_peso'),
    comprimento: numero('ped_altura'),
    pc: numero('ped_pc'),
    hoje: new Date(),
  });
  if (r.erro) {
    avisar(r.erro);
    return;
  }
  if (r.nota) {
    mostrarResultado('ped_imc_result', `<div class="note">${r.nota}</div>`, 'risk-info');
    return;
  }
  const textoMedida = {
    wfa: m => `${fmt(m, 2)} kg`,
    lhfa: m => `${fmt(m)} cm`,
    hcfa: m => `${fmt(m)} cm`,
    bmifa: m => fmt(m),
  };
  const linhas = r.medidas
    .map(({ indicador, rotulo, medida, z }) => {
      const valor = textoMedida[indicador](medida);
      if (z == null) return `<tr><th>${rotulo}</th><td>${valor} — fora da faixa</td></tr>`;
      return `<tr><th>${rotulo}</th><td>${valor} · z ${formatarEscoreZ(z)} · ${percentilDoEscore(z)} — <b>${CLASSIFICACOES_OMS[indicador](z)}</b></td></tr>`;
    })
    .join('');
  const mi = Math.floor(r.meses),
    di = Math.round(r.idadeUsada - mi * 30.4375);
  const idade = `${mi} meses e ${di} dias${r.corrigida ? ` (cronológica ${Math.floor(r.dias / 30.4375)} meses; IG ao nascer ${fmt(ig, 1).replace(',0', '')} semanas)` : ''}`;
  mostrarResultado(
    'ped_imc_result',
    `<table class="mini-table"><tr><th>Idade ${r.corrigida ? 'corrigida' : 'usada'}</th><td>${idade}</td></tr>${linhas}</table>${r.notaPrematuro ? `<div class="note">${r.notaPrematuro}</div>` : ''}`,
    r.gravidade === 2 ? 'risk-high' : r.gravidade === 1 ? 'risk-mod' : 'risk-low',
  );
}
