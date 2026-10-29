/**
 * Requisições do SISCAN (mamografia e citopatológico) — interface:
 * dados da paciente digitados uma vez, preenchimento das folhas e impressão.
 * Regras em ./regras.js, posições em ./mapa.js, trechos montados em ./formulario.js.
 */
import { ligarImportacaoCidadaoPec, limparImportacaoCidadaoPec } from '../importar-cidadao-pec.js';
import { montarCabecalho, montarRodape } from '../../componentes/cabecalho.js';
import { CHAVES } from '../../config.js';
import { hojeIso, idadeEmAnosIso } from '../../utils/datas-iso.js';
import { $, $$ } from '../../utils/dom.js';
import {
  aplicarVisibilidadeCondicional,
  ativarCamposNumericos,
  lerUnidade,
  ligarImpressao,
  ligarNovaPaciente,
  ligarSalvarUnidade,
  limparPendencia,
} from '../comum.js';
import { montarIndicacoesClinicas, montarPerguntasSimNao, montarTabelaCirurgias } from './formulario.js';
import { FOLHAS_SISCAN } from './mapa.js';
import {
  avisoIdadeCitopatologico,
  avisoIdadeMamografia,
  distribuirTextoEmLinhas,
  examesDaSolicitacao,
  limiteDeCaracteres,
  pendenciasSiscan,
} from './regras.js';

const CAMPOS_UNIDADE_SISCAN = ['uf', 'cnes', 'unidade', 'codmun', 'municipio', 'resp'];
let idadeAutomaticaSiscan = true;
let folhasSiscan = null; // { m: [frente, verso], c: [frente, verso] }

const estaVisivel = e => !e.closest('[hidden]');

function prepararCampos() {
  $$('[data-f]').forEach(campo => {
    const n = limiteDeCaracteres(campo.dataset.f);
    const maximo = campo.dataset.f === 'tel' ? 9 : n;
    if (maximo) campo.maxLength = maximo;
    campo.autocomplete = 'off';
    campo.id = campo.id || 'f_' + campo.dataset.f;
    if (n > 12) {
      const contador = document.createElement('span');
      contador.className = 'cnt';
      campo.after(contador);
      campo._contador = contador;
    }
  });
}

function aplicarVisibilidadeSiscan() {
  $('#secM').hidden = $('#secM2').hidden = !$('#exM').checked;
  $('#secC').hidden = $('#secC2').hidden = !$('#exC').checked;
  $('#verso').disabled = !$('#exC').checked;
  aplicarVisibilidadeCondicional();
}

/** Opções exclusivas dentro de um grupo (data-grp/data-excl) e limpeza da tabela de cirurgias. */
function tratarExclusividades(evento) {
  const t = evento.target;
  if (t.dataset.grp && t.checked) {
    $$(`[data-grp="${t.dataset.grp}"]`).forEach(o => {
      if (o !== t && (t.hasAttribute('data-excl') || o.hasAttribute('data-excl'))) o.checked = false;
    });
  }
  if (t.id === 'msemCir' && t.checked)
    $$('#cirBody input').forEach(i => {
      i.value = '';
    });
}

function atualizarIdadeSiscan() {
  const idade = idadeEmAnosIso($('#nasc').value, $('#dt').value);
  if (idade != null && (idadeAutomaticaSiscan || !$('#idade').value)) $('#idade').value = idade;
}

/** Valores (em maiúsculas) e caixas marcadas, só dos campos visíveis. */
function coletarSiscan() {
  const v = {},
    on = new Set();
  $$('[data-f]').forEach(campo => {
    if (!estaVisivel(campo)) return;
    let x = campo.value.trim();
    if (campo.hasAttribute('data-num')) x = x.replace(/\D/g, '');
    v[campo.dataset.f] = x.toLocaleUpperCase('pt-BR');
  });
  if (v.idade) v.idade = v.idade.padStart(2, '0');
  const data = (id, prefixos) => {
    const el = $('#' + id);
    if (!estaVisivel(el) || !el.value) return;
    const [a, m, d] = el.value.split('-');
    prefixos.forEach(p => {
      v[p + '_d'] = d;
      v[p + '_m'] = m;
      v[p + '_a'] = a;
    });
  };
  data('nasc', ['nasc']);
  data('dt', ['sol', 'col']);
  data('dum', ['dum']);
  $$('[data-b]').forEach(caixa => {
    if (caixa.checked && estaVisivel(caixa)) caixa.dataset.b.split(' ').forEach(k => on.add(k));
  });
  on.add('m:1'); // sexo feminino
  return { v, on };
}

function pintarFolhasSiscan() {
  const { v, on } = coletarSiscan();
  $$('#print .ch,#print .xx').forEach(e => e.remove());
  ['m', 'c'].forEach(X => {
    const paginas = folhasSiscan[X];
    const put = (p, t, estilo, classe = 'ch') => {
      const d = document.createElement('div');
      d.className = classe;
      d.textContent = t;
      Object.assign(d.style, estilo);
      paginas[p].appendChild(d);
    };
    FOLHAS_SISCAN[X].fields.forEach(f => {
      let s = v[f.id] || '';
      if (!s) return;
      if (f.id === 'tel' && s.length === 9) {
        const c1 = f.combs[0],
          c2 = f.combs[1],
          y = c1[c1.length - 1];
        const w5 = (c1[c1.length - 2] - c1[0]) / 5;
        for (let i = 0; i < 5; i++)
          put(f.p, s[i], { left: c1[0] + i * w5 + 'pt', top: y - 10.2 + 'pt', width: w5 + 'pt', fontSize: '8.5pt' });
        for (let i = 0; i < 4; i++)
          put(f.p, s[5 + i], { left: c2[i] + 'pt', top: y - 10.2 + 'pt', width: c2[i + 1] - c2[i] + 'pt' });
        return;
      }
      s = distribuirTextoEmLinhas(s, f, X);
      let k = 0;
      f.combs.forEach(c => {
        const y = c[c.length - 1];
        for (let i = 0; i < c.length - 2; i++, k++) {
          const ch = s[k];
          if (!ch || ch === ' ') continue;
          put(f.p, ch, { left: c[i] + 'pt', top: y - 10.2 + 'pt', width: c[i + 1] - c[i] + 'pt' });
        }
      });
    });
    FOLHAS_SISCAN[X].lines.forEach(l => {
      const s = v[l.id];
      if (s)
        put(l.p, s, {
          left: l.x + 2 + 'pt',
          top: l.y - 10.5 + 'pt',
          width: l.x1 - l.x - 2 + 'pt',
          textAlign: 'left',
          fontSize: '9pt',
          overflow: 'hidden',
        });
    });
    on.forEach(k => {
      if (!k.startsWith(X + ':')) return;
      const b = FOLHAS_SISCAN[X].boxes[k.slice(2)];
      if (b) put(b[0], 'X', { left: b[1] + 'pt', top: b[2] + 'pt', width: b[3] + 'pt', height: b[4] + 'pt' }, 'xx');
    });
  });
  const visiveis = [];
  if ($('#exM').checked) visiveis.push(...folhasSiscan.m);
  if ($('#exC').checked) {
    visiveis.push(folhasSiscan.c[0]);
    if ($('#verso').checked) visiveis.push(folhasSiscan.c[1]);
  }
  $$('#print .page').forEach(p => {
    p.hidden = !visiveis.includes(p);
    p.classList.remove('last');
  });
  if (visiveis.length) visiveis[visiveis.length - 1].classList.add('last');
}

function mostrarAvisosDeIdade() {
  const idade = $('#idade').value;
  const avisoM = avisoIdadeMamografia(idade, $('#mr8a').checked),
    caixaM = $('#ageWarnM');
  caixaM.hidden = !avisoM;
  if (avisoM) caixaM.textContent = avisoM;
  const avisoC = avisoIdadeCitopatologico(idade, $('#cmRas').checked),
    caixaC = $('#ageWarnC');
  caixaC.hidden = !avisoC;
  if (avisoC) caixaC.textContent = avisoC;
}

function atualizarSiscan() {
  aplicarVisibilidadeSiscan();
  atualizarIdadeSiscan();
  mostrarAvisosDeIdade();
  $$('[data-f]').forEach(campo => {
    if (campo._contador) campo._contador.textContent = campo.value.length + '/' + campo.maxLength;
  });
  pintarFolhasSiscan();
}

const preencherDataDeHojeSiscan = () => {
  $('#dt').value = hojeIso();
};

function novaPacienteSiscan() {
  const unidade = {};
  CAMPOS_UNIDADE_SISCAN.forEach(k => {
    unidade[k] = $('#f_' + k).value;
  });
  const exames = [$('#exM').checked, $('#exC').checked, $('#verso').checked];
  $('#form')
    .querySelectorAll('input')
    .forEach(i => {
      if (i.type === 'radio' || i.type === 'checkbox') i.checked = i.defaultChecked;
      else i.value = i.defaultValue;
    });
  [$('#exM').checked, $('#exC').checked, $('#verso').checked] = exames;
  CAMPOS_UNIDADE_SISCAN.forEach(k => {
    $('#f_' + k).value = unidade[k];
  });
  idadeAutomaticaSiscan = true;
  limparImportacaoCidadaoPec();
  preencherDataDeHojeSiscan();
  atualizarSiscan();
  limparPendencia();
  window.scrollTo(0, 0);
  $('#f_cns').focus();
}

function iniciarSiscan() {
  montarCabecalho({ pagina: 'mamografia.html', rotaAtiva: 'requisicoes' });
  montarRodape();
  folhasSiscan = { m: [$('#pm0'), $('#pm1')], c: [$('#pc0'), $('#pc1')] };
  montarPerguntasSimNao();
  montarTabelaCirurgias();
  montarIndicacoesClinicas();
  prepararCampos();
  document.addEventListener('change', tratarExclusividades);
  $('#idade').addEventListener('input', () => {
    idadeAutomaticaSiscan = !$('#idade').value;
  });
  document.addEventListener('input', atualizarSiscan);
  document.addEventListener('change', atualizarSiscan);
  ativarCamposNumericos();
  const unidade = lerUnidade(CHAVES.unidadeMamografia);
  if (unidade) {
    CAMPOS_UNIDADE_SISCAN.forEach(k => {
      if (unidade[k] != null) $('#f_' + k).value = unidade[k];
    });
    if (unidade.verso != null) $('#verso').checked = unidade.verso;
  }
  ligarSalvarUnidade(CHAVES.unidadeMamografia, () => {
    const o = {};
    CAMPOS_UNIDADE_SISCAN.forEach(k => {
      o[k] = $('#f_' + k).value;
    });
    o.verso = $('#verso').checked;
    return o;
  });
  ligarNovaPaciente(novaPacienteSiscan);
  ligarImpressao({
    documento: 'Mamografia e citopatologico',
    pintar: pintarFolhasSiscan,
    semDocumento: () =>
      !$('#exM').checked && !$('#exC').checked
        ? '<b>Nenhum exame marcado.</b> Marque Mamografia, Citopatológico ou os dois no topo do formulário.'
        : null,
    pendencias: () =>
      pendenciasSiscan({
        ...coletarSiscan(),
        mamografia: $('#exM').checked,
        citopatologico: $('#exC').checked,
        nasc: $('#nasc').value,
        dt: $('#dt').value,
        dum: $('#dum').value,
      }),
    separador: '; ',
  });
  ligarImportacaoCidadaoPec({
    dataSolicitacao: '#dt',
    campoFaltando: { 'Cartão SUS': '[data-f="cns"]', 'Raça/cor': 'input[name="raca"]' },
    aoLerProcedimentos: marcarExamesDaSolicitacao,
    depois() {
      idadeAutomaticaSiscan = true;
      atualizarSiscan();
    },
  });
  preencherDataDeHojeSiscan();
  atualizarSiscan();
}

/** Marca mamografia/citopatológico conforme os procedimentos da solicitação importada do PEC. */
function marcarExamesDaSolicitacao(procedimentos, notas, lidos) {
  const { mamografia, citopatologico, mamografiaDiagnostica } = examesDaSolicitacao(procedimentos);
  const exames = [];
  if (mamografia) {
    $('#exM').checked = true;
    exames.push('Mamografia');
    if (mamografiaDiagnostica) {
      $('#mtDia').checked = true;
      notas.push('A mamografia foi pedida como <b>diagnóstica</b> (02.04.03.003-0). Marque o item de 7a a 7f.');
    } else $('#mtRas').checked = true;
  }
  if (citopatologico) {
    $('#exC').checked = true;
    exames.push('Citopatológico');
  }
  if (exames.length) {
    lidos.push('Exame: ' + exames.join(' e '));
    if (!mamografia || !citopatologico)
      notas.push(
        'A solicitação traz só ' + exames.join(' e ') + '. Marque ou desmarque os exames no topo, se precisar.',
      );
  } else {
    notas.push(
      'A solicitação não traz mamografia nem citopatológico (' + procedimentos.map(p => p.name).join(', ') + ').',
    );
  }
}

iniciarSiscan();
