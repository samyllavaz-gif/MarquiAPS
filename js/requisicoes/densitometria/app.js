/**
 * Pedido de densitometria — interface: formulário, preenchimento das folhas e impressão.
 * Regras em ./regras.js, posições nas folhas em ./mapa.js, comportamentos comuns em ../comum.js.
 */
import { montarCabecalho, montarRodape } from '../../componentes/cabecalho.js';
import { CHAVES } from '../../config.js';
import { hojeIso, idadeEmAnosIso, partesDaDataIso } from '../../utils/datas-iso.js';
import { $, $$ } from '../../utils/dom.js';
import {
  ajustarBlocoNaFolha,
  ajustarLinhaNaFolha,
  aplicarVisibilidadeCondicional,
  ativarCamposNumericos,
  lerUnidade,
  ligarImpressao,
  ligarNovaPaciente,
  ligarSalvarUnidade,
  limparPendencia,
} from '../comum.js';
import { ESCALA_FOLHAS_DENSITOMETRIA, MAPA_DENSITOMETRIA } from './mapa.js';
import {
  cidDaHipotese,
  FATORES_RISCO_DENSITOMETRIA,
  fatoresPorIdadeESexo,
  formatarCpf,
  hipoteseDoCid,
  HIPOTESES_DENSITOMETRIA,
  pendenciasDensitometria,
  resumoClinicoDensitometria,
} from './regras.js';

const TOTAL_LINHAS_EXAME = 10;
const CAMPOS_UNIDADE_DENSITOMETRIA = ['clinica', 'servico', 'medico', 'cpfmed', 'municipio', 'uf'];
let linhasVisiveis = 3;
let idadeAutomatica = true;
let fatoresTocados = false;

const valorCampo = chave => {
  const e = $(`[data-f="${chave}"]`);
  return e ? e.value.trim() : '';
};
const maiusculas = s => s.toLocaleUpperCase('pt-BR');

/* ---------- montagem inicial ---------- */
function montarFormularioDensitometria() {
  $('#shB').style.transform = ESCALA_FOLHAS_DENSITOMETRIA.B;
  $('#shH').style.transform = ESCALA_FOLHAS_DENSITOMETRIA.H;
  $('#hipList').innerHTML = HIPOTESES_DENSITOMETRIA.map(h => `<option value="${h[0]}">${h[1]}</option>`).join('');
  $('#cidList').innerHTML = HIPOTESES_DENSITOMETRIA.map(h => `<option value="${h[1]}">${h[0]}</option>`).join('');
  $('#riskOpts').innerHTML = FATORES_RISCO_DENSITOMETRIA.map(
    (r, i) => `<label class="opt sm"><input type="checkbox" data-risk="${i}">${r}</label>`,
  ).join('');
  $('#riskOpts').addEventListener('change', () => {
    fatoresTocados = true;
  });
  $('#exBody').innerHTML = Array.from(
    { length: TOTAL_LINHAS_EXAME },
    (_, i) =>
      `<tr data-row="${i}"><td><input data-f="ex_t${i}" aria-label="Tipo de exame, linha ${i + 1}"></td><td><input data-f="ex_m${i}" aria-label="Material colhido, linha ${i + 1}"></td><td><input data-f="ex_o${i}" aria-label="Topografia do exame, linha ${i + 1}"></td></tr>`,
  ).join('');
  $('[data-f="ex_t0"]').value = $('[data-f="ex_t0"]').defaultValue = 'Densitometria óssea duoenergética';
  $('[data-f="ex_o0"]').value = $('[data-f="ex_o0"]').defaultValue = 'Coluna lombar e colo de fêmur';
  $('#moreRows').onclick = () => {
    linhasVisiveis = TOTAL_LINHAS_EXAME;
    mostrarLinhasExame();
  };
  $$('[data-f]').forEach(campo => {
    campo.id = campo.id || 'f_' + campo.dataset.f;
    campo.autocomplete = 'off';
  });
  ativarCamposNumericos();
  $('#idade').addEventListener('input', () => {
    idadeAutomatica = !$('#idade').value;
  });
  $('#f_hipotese').addEventListener('change', () => {
    const cid = cidDaHipotese(valorCampo('hipotese'));
    if (cid && !valorCampo('cid')) $('#f_cid').value = cid;
  });
  $('#f_cid').addEventListener('change', () => {
    const hip = hipoteseDoCid(valorCampo('cid'));
    if (hip && !valorCampo('hipotese')) $('#f_hipotese').value = hip;
  });
}

function mostrarLinhasExame() {
  $$('#exBody tr').forEach((linha, i) => {
    linha.hidden = i >= linhasVisiveis;
  });
  $('#moreRows').hidden = linhasVisiveis >= TOTAL_LINHAS_EXAME;
}

/* ---------- idade e fatores automáticos ---------- */
function atualizarIdade() {
  const idade = idadeEmAnosIso($('#nasc').value, $('#dat').value);
  if (idade != null && (idadeAutomatica || !$('#idade').value)) $('#idade').value = idade;
}

function marcarFatoresAutomaticos() {
  if (fatoresTocados) return;
  const f = fatoresPorIdadeESexo($('#idade').value, $('#sF').checked, $('#sM').checked);
  $('[data-risk="0"]').checked = f.mulher65;
  $('[data-risk="1"]').checked = f.homem70;
}

const resumoFinal = () =>
  resumoClinicoDensitometria(
    $$('[data-risk]:checked').map(i => +i.dataset.risk),
    valorCampo('resumo'),
  );

/* ---------- valores das folhas ---------- */
function valoresDasFolhas() {
  const v = {};
  [
    'nome',
    'rg',
    'idade',
    'clinica',
    'servico',
    'mae',
    'endereco',
    'tel',
    'municipio',
    'uf',
    'convnome',
    'medico',
    'hipotese',
    'cid',
    'enfermaria',
    'leito',
    'medicacao',
    'condobs',
    'hconvout',
  ].forEach(k => {
    v[k] = valorCampo(k);
  });
  for (let i = 0; i < TOTAL_LINHAS_EXAME; i++) {
    v['ex_t' + i] = valorCampo('ex_t' + i);
    v['ex_m' + i] = valorCampo('ex_m' + i);
    v['ex_o' + i] = valorCampo('ex_o' + i);
  }
  v.nome_h = v.nome;
  v.cpf = valorCampo('cpf');
  v.cep = valorCampo('cep');
  v.cpfmed = valorCampo('cpfmed');
  v.cpfmedf = formatarCpf(v.cpfmed);
  if (!$('#cvS').checked) v.convnome = '';
  if (!$('#hOut').checked) v.hconvout = '';
  [v.dat_d, v.dat_m, v.dat_a] = partesDaDataIso($('#dat').value);
  const nascimento = partesDaDataIso($('#nasc').value);
  v.nasc = nascimento[0] ? nascimento.join('/') : '';
  const laudo = partesDaDataIso($('#dlaudo').value);
  [v.dl_d, v.dl_m, v.dl_a] = laudo;
  v.hdata = laudo[0] ? laudo.join('/') : '';
  v.idade = v.idade ? v.idade + ' anos' : '';
  v.resumo = resumoFinal();
  v.exames = valorCampo('exames');
  v.resultados = v.exames.replace(/\s*\n\s*/g, '; ');
  const on = {
    sexF: $('#sF').checked,
    sexM: $('#sM').checked,
    convS: $('#cvS').checked,
    convN: $('#cvN').checked,
    pDens: $('#pDens').checked,
    pBio: $('#pBio').checked,
  };
  [
    'oAmb',
    'oTri',
    'oPS',
    'cAle',
    'cPro',
    'cRen',
    'cBio',
    'cGra',
    'hSUS',
    'hARE',
    'hCS',
    'kPre',
    'kRot',
    'kEme',
  ].forEach(k => {
    on[k] = $('#' + k).checked;
  });
  return { v, on };
}

/* ---------- desenho das folhas ---------- */
function pintarFolhasDensitometria() {
  const { v, on } = valoresDasFolhas();
  [
    ['B', '#shB'],
    ['H', '#shH'],
  ].forEach(([folha, seletor]) => {
    const fundo = $(seletor);
    fundo.querySelectorAll('.t,.mt,.xx,.bx').forEach(e => e.remove());
    const add = (classe, texto, estilo) => {
      const d = document.createElement('div');
      d.className = classe;
      d.textContent = texto;
      Object.assign(d.style, estilo);
      fundo.appendChild(d);
      return d;
    };
    const mapa = MAPA_DENSITOMETRIA[folha];
    mapa.t.forEach(([k, x, x1, base, o = {}]) => {
      let s = v[k];
      if (!s) return;
      if (o.upper !== 0) s = maiusculas(s);
      const F = 9,
        d = add('t' + (o.center ? ' tc' : ''), s, {
          left: x + 'pt',
          width: x1 - x + 'pt',
          top: base - 0.92 * F + 'pt',
        });
      ajustarLinhaNaFolha(d, x1 - x, F);
      const f = parseFloat(d.style.fontSize);
      d.style.top = base - 0.92 * f + 'pt';
    });
    mapa.c.forEach(([k, x, x1, n, base]) => {
      const s = v[k] || '';
      const w = (x1 - x) / n;
      for (let i = 0; i < n && i < s.length; i++)
        add('t tc', s[i], { left: x + i * w + 'pt', width: w + 'pt', top: base - 0.92 * 9 + 'pt' });
    });
    (mapa.box || []).forEach(([x, y, w, h]) =>
      add('bx', '', { left: x + 'pt', top: y + 'pt', width: w + 'pt', height: h + 'pt' }),
    );
    mapa.x.forEach(([k, x, y, w, h]) => {
      if (on[k]) add('xx', 'X', { left: x + 'pt', top: y + 'pt', width: w + 'pt', height: h + 'pt' });
    });
    mapa.m.forEach(([k, x, x1, b1, ind, lh, bottom]) => {
      const s = v[k];
      if (!s) return;
      const F = 9,
        top = b1 - ((lh - 1.117 * F) / 2 + 0.905 * F);
      const d = add('mt', s, { left: x + 'pt', width: x1 - x + 'pt', top: top + 'pt', textIndent: ind - x + 'pt' });
      ajustarBlocoNaFolha(d, bottom - top, F, lh);
    });
  });
  const visiveis = [];
  if ($('#docB').checked) visiveis.push($('#pgB'));
  if ($('#docH').checked) visiveis.push($('#pgH'));
  $$('#print .page').forEach(p => {
    p.hidden = !visiveis.includes(p);
    p.classList.remove('last');
  });
  if (visiveis.length) visiveis[visiveis.length - 1].classList.add('last');
}

/* ---------- tela ---------- */
function mostrarPreviaResumo() {
  const r = resumoFinal();
  $('#resPrev').innerHTML = r
    ? '<b>Vai sair no formulário assim:</b>\n' +
      r.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])
    : '';
  $('#resPrev').hidden = !r;
}

function atualizarDensitometria() {
  aplicarVisibilidadeCondicional();
  atualizarIdade();
  marcarFatoresAutomaticos();
  mostrarPreviaResumo();
  mostrarLinhasExame();
  pintarFolhasDensitometria();
}

const preencherDatasDeHoje = () => {
  const hoje = hojeIso();
  $('#dat').value = hoje;
  $('#dlaudo').value = hoje;
};

function novaPacienteDensitometria() {
  const unidade = {};
  CAMPOS_UNIDADE_DENSITOMETRIA.forEach(k => {
    unidade[k] = valorCampo(k);
  });
  const documentos = [$('#docB').checked, $('#docH').checked];
  $('#form')
    .querySelectorAll('input,textarea')
    .forEach(i => {
      if (i.type === 'radio' || i.type === 'checkbox') i.checked = i.defaultChecked;
      else i.value = i.defaultValue;
    });
  [$('#docB').checked, $('#docH').checked] = documentos;
  CAMPOS_UNIDADE_DENSITOMETRIA.forEach(k => {
    $(`[data-f="${k}"]`).value = unidade[k];
  });
  idadeAutomatica = true;
  fatoresTocados = false;
  linhasVisiveis = 3;
  preencherDatasDeHoje();
  atualizarDensitometria();
  limparPendencia();
  window.scrollTo(0, 0);
  $('#f_nome').focus();
}

function iniciarDensitometria() {
  montarCabecalho({ pagina: 'densitometria.html', rotaAtiva: 'requisicoes' });
  montarRodape();
  montarFormularioDensitometria();
  document.addEventListener('input', atualizarDensitometria);
  document.addEventListener('change', atualizarDensitometria);
  const unidade = lerUnidade(CHAVES.unidadeDensitometria);
  if (unidade)
    CAMPOS_UNIDADE_DENSITOMETRIA.forEach(k => {
      if (unidade[k] != null) $(`[data-f="${k}"]`).value = unidade[k];
    });
  ligarSalvarUnidade(CHAVES.unidadeDensitometria, () =>
    Object.fromEntries(CAMPOS_UNIDADE_DENSITOMETRIA.map(k => [k, valorCampo(k)])),
  );
  ligarNovaPaciente(novaPacienteDensitometria);
  ligarImpressao({
    documento: 'Densitometria',
    pintar: pintarFolhasDensitometria,
    semDocumento: () =>
      !$('#docB').checked && !$('#docH').checked
        ? '<b>Nenhum documento marcado.</b> Marque o BPA-I, o pedido do HC ou os dois no topo.'
        : null,
    pendencias: () =>
      pendenciasDensitometria({
        ...valoresDasFolhas(),
        nasc: $('#nasc').value,
        dat: $('#dat').value,
        dlaudo: $('#dlaudo').value,
      }),
  });
  preencherDatasDeHoje();
  atualizarDensitometria();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(pintarFolhasDensitometria);
}

iniciarDensitometria();
