/**
 * Consulta única: junta a base (dados comuns, queixas do dia e HiperDia) com os módulos
 * dos tipos marcados (saúde da mulher, pré-natal…), num SOAP só.
 *
 * - Tipos: botões no topo do formulário (lista em ./tipos.js).
 * - Dados comuns: preenchidos uma vez na base; idade, sexo e sinais vitais seguem para os
 *   cálculos dos módulos (ver compartilharComModulos).
 * - Texto: soap = linhas da base + linhas dos módulos, letra por letra.
 * - Rascunho: um só, neste navegador, até "Nova consulta".
 */
import { avisoRapido } from '../componentes/aviso.js';
import { CHAVES } from '../config.js';
import { gravarArmazenado, lerArmazenado } from '../utils/armazenamento.js';
import { $ } from '../utils/dom.js';
import {
  aplicarRascunhoBase,
  carregarExemploBase,
  definirAoAtualizarBase,
  limparBase,
  rascunhoDaBase,
  renderAll,
} from './base/app.js';
import { sessao, soap, soapBase, state, temTipo, v } from './base/estado.js';
import { abrirModulos } from './motor/app.js';
import { soap as soapModulos, st } from './motor/estado.js';
import { definirAoAtualizarModulos, upd } from './motor/soap.js';
import { OBJETIVOS, resolverRevisao } from './revisao.js';
import { iniciarRevisao, mostrarObjetivo } from './revisao-ui.js';
import { PREFIXO_ENVIO, idConsultaAtual, mapearDados, limparTransferencias } from '../integracoes/consulta-calculadoras.js';
import { iniciarResultadosCalculadoras, atualizarResultadosCalculadoras } from './resultados-calculadoras.js';
import { configurarEnvioCalculadoras, desenharSugestoes } from './sugestoes-ui.js';
import { iniciarFluxo, atualizarFluxo, reiniciarFluxo } from './fluxo.js';
import { unirTextoSOAP, inserirTrechoUnico } from './texto-inteligente.js';
import { MODULOS, compartilharDum, migrarCamposCompartilhados, montarConsulta, valoresCompartilhados } from './modulos.js';
import { ordenarTipos, TIPOS_DE_CONSULTA, TIPOS_INICIAIS } from './tipos.js';

let idConsulta = '';
let resultados = [];
let revisoes = {};
let objetivo = '';
const gerado = { S: '', O: '', A: '', P: '' };
const LETRAS = ['S', 'O', 'A', 'P'];
const ROTULOS = Object.fromEntries(TIPOS_DE_CONSULTA.map(t => [t.id, t.rotulo]));

/* ---------- tipos marcados ---------- */

function desenharTipos() {
  const caixa = $('#tipos');
  caixa.innerHTML = '';
  TIPOS_DE_CONSULTA.forEach(t => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tipo';
    b.dataset.tipo = t.id;
    b.setAttribute('aria-pressed', String(temTipo(t.id)));
    b.textContent = t.rotulo;
    if (t.resumo) b.title = t.resumo;
    b.addEventListener('click', () => alternarTipo(t.id));
    caixa.appendChild(b);
  });
}

/** Mostra as partes da base dos tipos marcados e redesenha os módulos (os valores preenchidos ficam guardados). */
function aplicarTipos() {
  $('.qpick').hidden = !temTipo('queixas');
  if (state.q.length || state.dg.on) $('.qpick').open = true;
  $('#sec-hd').hidden = !temTipo('hiperdia');
  $('#v-consulta').classList.toggle('mode-hiperdia', temTipo('hiperdia'));
  $('#legenda-modulos').hidden = !sessao.tipos.some(id => MODULOS[id]);
  document
    .querySelectorAll('#tipos .tipo')
    .forEach(b => b.setAttribute('aria-pressed', String(temTipo(b.dataset.tipo))));
  const definicao = compartilharDum(montarConsulta(sessao.tipos), st.v || {});
  $('#aviso-dum').hidden = !definicao.conflitoDum;
  $('#form').dataset.dumCompartilhada = String(!!definicao.dumCompartilhada);
  desenharInsercoesDeExame(definicao.exame);
  abrirModulos(definicao, st.v || {}, ROTULOS);
  renderAll();
  desenharSugestoes(sessao.tipos);
}

/** Botões "Inserir normal" dos módulos marcados, no exame físico da base. */
function desenharInsercoesDeExame(grupos) {
  const caixa = $('#quick-ef-mod');
  caixa.innerHTML = '';
  grupos.forEach(({ rotulo, ins }) => {
    const linha = document.createElement('div');
    linha.className = 'quick';
    const nome = document.createElement('span');
    nome.textContent = rotulo + ':';
    linha.appendChild(nome);
    Object.entries(ins).forEach(([k, texto]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = k;
      b.addEventListener('click', () => {
        const campo = $('#f-exame');
        campo.value = inserirTrechoUnico(campo.value, texto);
        campo.dispatchEvent(new Event('input', { bubbles: true }));
        campo.focus();
      });
      linha.appendChild(b);
    });
    caixa.appendChild(linha);
  });
}

export function alternarTipo(id) {
  sessao.tipos = temTipo(id) ? sessao.tipos.filter(t => t !== id) : ordenarTipos([...sessao.tipos, id]);
  aplicarTipos();
}

/** Marca um tipo (usado pelos atalhos index.html#prenatal…); não desmarca os outros. */
export function marcarTipo(id) {
  if (temTipo(id)) return;
  sessao.tipos = ordenarTipos([...sessao.tipos, id]);
  aplicarTipos();
  avisoRapido(`${ROTULOS[id]} incluído na consulta`);
}

$('#form').addEventListener('input', e => {
  if (e.target.id !== 'm-dt-dum' || $('#form').dataset.dumCompartilhada !== 'true') return;
  st.v.menst = { ...st.v.menst, dum: e.target.value };
  upd();
});

/* ---------- dados comuns → módulos ---------- */

function compartilharComModulos() {
  const c = valoresCompartilhados({
    idade: v('hd-idade'),
    sexo: state.hd.sexo,
    sinais: {
      pa: v('sv-pa'),
      fc: v('sv-fc'),
      fr: v('sv-fr'),
      tax: v('sv-tax'),
      spo2: v('sv-spo2'),
      hgt: v('sv-hgt'),
      peso: v('sv-peso'),
      alt: v('sv-alt'),
      ca: v('sv-ca'),
    },
  });
  // atualiza no próprio objeto: as grades do motor guardam a referência de st.v.sv
  st.v.ident = Object.assign(st.v.ident || {}, c.ident);
  st.v.sexo = c.sexo;
  st.v.sv = Object.assign(st.v.sv || {}, c.sv);
}

/* ---------- texto e rascunho ---------- */

function mostrarTexto() {
  LETRAS.forEach(k => { gerado[k] = unirTextoSOAP(soapBase[k], soapModulos[k], ...resultados.filter(r => r.bloco === k).map(r => r.texto)); });
  const resolvido = resolverRevisao(gerado, revisoes);
  Object.assign(soap, resolvido.texto);
  $('#historia-previa').textContent = soapBase.historia || 'Preencha a história ou use o roteiro de queixas para ver o texto reunido.';
  $('#estado-revisao').textContent = resolvido.desatualizados.length ? `Os dados dos blocos ${resolvido.desatualizados.join(', ')} mudaram. A prévia usa os campos atuais; sua edição anterior está guardada em “Revisar e editar SOAP”.` : Object.keys(revisoes).length ? 'Texto com revisão manual aplicada.' : 'Texto gerado a partir dos campos. Revise antes de copiar.';
  LETRAS.forEach(k => {
    const el = $('#out-' + k);
    el.textContent = soap[k] || 'Nada preenchido ainda.';
    el.classList.toggle('empty-out', !soap[k]);
  });
  atualizarFluxo();
  salvar();
}

let temporizador;
function salvarAgora(forcar = false) {
  const idSalvo = idConsultaAtual();
  if (!forcar && idSalvo && idSalvo !== idConsulta) { $('#aviso-outra-consulta').hidden = false; return false; }
  $('#aviso-outra-consulta').hidden = true;
  return gravarArmazenado(CHAVES.rascunhoConsulta, { tipos: sessao.tipos, base: rascunhoDaBase(), modulos: st.v, revisoes, objetivo, idConsulta, resultados });
}
function salvar() {
  if (!sessao.iniciada) return;
  clearTimeout(temporizador);
  temporizador = setTimeout(salvarAgora, 300);
}

/** Abre a consulta com o rascunho salvo (ou vazia, com os tipos iniciais). Chamado uma vez. */
export function abrirConsulta() {
  if (sessao.iniciada) return;
  const rascunho = lerArmazenado(CHAVES.rascunhoConsulta, null);
  idConsulta = typeof rascunho?.idConsulta === 'string' ? rascunho.idConsulta : crypto.randomUUID();
  resultados = Array.isArray(rascunho?.resultados) ? rascunho.resultados.filter(r => typeof r?.texto === 'string' && typeof r.ferramenta === 'string' && ['O', 'A', 'P'].includes(r.bloco)) : [];
  sessao.tipos = ordenarTipos(Array.isArray(rascunho?.tipos) ? rascunho.tipos : TIPOS_INICIAIS);
  aplicarRascunhoBase(rascunho?.base);
  st.v = rascunho?.modulos && typeof rascunho.modulos === 'object' ? rascunho.modulos : {};
  revisoes = rascunho?.revisoes && typeof rascunho.revisoes === 'object' ? rascunho.revisoes : {};
  objetivo = OBJETIVOS[rascunho?.objetivo] ? rascunho.objetivo : '';
  mostrarObjetivo(objetivo);
  migrarCamposCompartilhados(st.v, state.chips);
  iniciarFluxo();
  desenharTipos();
  aplicarTipos();
  sessao.iniciada = true;
  salvarAgora();
  atualizarResultadosCalculadoras();
}

/** Grava já o rascunho (ao sair da consulta para o início). */
export function salvarConsulta() {
  if (sessao.iniciada) salvarAgora();
}

/* ---------- botões ---------- */

let confirmando = null;
$('#btn-limpar').onclick = function () {
  if (!confirmando) {
    this.textContent = 'Confirmar: apagar tudo';
    confirmando = setTimeout(() => {
      this.textContent = 'Nova consulta';
      confirmando = null;
    }, 4000);
    return;
  }
  clearTimeout(confirmando);
  confirmando = null;
  this.textContent = 'Nova consulta';
  limparTransferencias(idConsulta);
  idConsulta = crypto.randomUUID();
  resultados = [];
  sessao.tipos = [...TIPOS_INICIAIS];
  revisoes = {};
  objetivo = '';
  mostrarObjetivo(objetivo);
  reiniciarFluxo();
  limparBase();
  st.v = {};
  aplicarTipos();
  salvarAgora(true);
  atualizarResultadosCalculadoras();
  window.scrollTo({ top: 0 });
  avisoRapido('Consulta limpa');
};

$('#btn-exemplo').onclick = () => {
  limparTransferencias(idConsulta);
  idConsulta = crypto.randomUUID();
  resultados = [];
  atualizarResultadosCalculadoras();
  revisoes = {};
  st.v = {};
  aplicarTipos();
  carregarExemploBase();
  salvarAgora(true);
  atualizarResultadosCalculadoras();
  avisoRapido('Exemplo carregado. Use “Nova consulta” para limpar.');
};

definirAoAtualizarBase(() => {
  compartilharComModulos();
  upd();
});
definirAoAtualizarModulos(mostrarTexto);

iniciarRevisao({
  ler: () => ({ gerado, revisoes }),
  aplicar: novas => { revisoes = novas; mostrarTexto(); },
  descartar: () => { revisoes = {}; mostrarTexto(); },
  escolherObjetivo: id => {
    objetivo = OBJETIVOS[id] ? id : '';
    mostrarObjetivo(objetivo);
    salvar();
  },
});

configurarEnvioCalculadoras(href => {
  if (idConsultaAtual() && idConsultaAtual() !== idConsulta) { avisoRapido('Outra consulta foi iniciada neste navegador. Reabra o atendimento atual.'); return null; }
  if (!salvarAgora()) return null;
  const token = crypto.randomUUID();
  const campos = mapearDados({ base: rascunhoDaBase(), modulos: st.v });
  try {
    localStorage.setItem(PREFIXO_ENVIO + token, JSON.stringify({ idConsulta, criado: Date.now(), campos }));
    return `${href}?consulta=${token}`;
  } catch { return null; }
});
iniciarResultadosCalculadoras({
  ler: () => ({ idConsulta, resultados, campos: mapearDados({ base: rascunhoDaBase(), modulos: st.v }) }),
  aceitar: candidato => {
    resultados = [...resultados.filter(r => r.ferramenta !== candidato.ferramenta), candidato];
    mostrarTexto();
    salvarAgora();
    avisoRapido('Resultado incluído. Confira o texto final do SOAP.');
  },
  remover: ferramenta => {
    resultados = resultados.filter(r => r.ferramenta !== ferramenta);
    mostrarTexto();
    salvarAgora();
  },
});
