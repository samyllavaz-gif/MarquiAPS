/**
 * APAC · exames de alto custo — interface: linhas de exame com código SIGTAP,
 * confirmação de contraste, importação do laudo do e-SUS PEC, preenchimento e impressão do laudo.
 */
import { montarCabecalho, montarRodape } from '../../componentes/cabecalho.js';
import { CHAVES } from '../../config.js';
import { configurarLeitorPdf, extrairTrechosDoPdf, leitorPdfDisponivel } from '../../servicos/leitor-pdf.js';
import { hojeIso } from '../../utils/datas-iso.js';
import { $, $$ } from '../../utils/dom.js';
import {
  ativarCamposNumericos,
  lerUnidade,
  ligarImpressao,
  ligarNovaPaciente,
  ligarSalvarUnidade,
  limparPendencia,
  mostrarMensagem,
} from '../comum.js';
import { CATALOGO_SIGTAP, ESTABELECIMENTOS_SOLICITANTES, EXAMES_POR_ID } from './catalogo.js';
import { maiusculasPtBr, pintarFolhaApac } from './folha.js';
import { lerLaudoPec } from './importar-pec.js';
import { normalizarTexto } from '../../utils/texto.js';
import {
  avisoExcessoDeProcedimentos,
  codigoSigtapValido,
  formatarCodigoSigtap,
  pendenciasApac,
  procedimentosDoLaudo,
} from './regras.js';

const CAMPOS_UNIDADE_APAC = ['cnes', 'estout', 'mun', 'ibge', 'uf', 'prof', 'profdoc'];
const valorApac = chave => {
  const e = $(`[data-f="${chave}"]`);
  return e ? e.value.trim() : '';
};
let sequenciaExames = 0;

const OPCOES_EXAMES =
  '<option value="">Selecione o exame…</option>' +
  CATALOGO_SIGTAP.map(
    ([grupo, itens]) =>
      `<optgroup label="${grupo}">${itens.map(i => `<option value="${i[0]}">${i[1]}</option>`).join('')}</optgroup>`,
  ).join('') +
  '<optgroup label="Outro"><option value="manual">Outro exame (digitar código SIGTAP)</option></optgroup>';

/* ---------- estabelecimento ---------- */
function montarEstabelecimentos() {
  $('#estSel').innerHTML =
    '<option value="">Selecione…</option>' +
    ESTABELECIMENTOS_SOLICITANTES.map((e, i) => `<option value="${i}">${e[0]}</option>`).join('') +
    '<option value="out" id="estOut">Outro estabelecimento</option>';
  $('#estSel').addEventListener('change', () => {
    const v = $('#estSel').value;
    if (v !== '' && v !== 'out') $('#cnes').value = ESTABELECIMENTOS_SOLICITANTES[+v][1];
  });
}
const nomeDoEstabelecimento = () => {
  const v = $('#estSel').value;
  return v === 'out' ? valorApac('estout') : v === '' ? '' : ESTABELECIMENTOS_SOLICITANTES[+v][0];
};

/* ---------- linhas de exame ---------- */
function adicionarExame(focar) {
  const n = ++sequenciaExames,
    linha = document.createElement('div');
  linha.className = 'ex';
  linha.dataset.n = n;
  linha.innerHTML = `<div class="ex-h"><span class="tag"></span><span class="sp"></span><button type="button" class="ghost rm" aria-label="Remover exame">Remover</button></div>
   <div class="ex-row">
     <label class="f"><b>Exame</b><select class="sel" id="exsel${n}">${OPCOES_EXAMES}</select></label>
     <label class="f"><b>Código SIGTAP</b><div class="code empty">—</div></label>
     <label class="f"><b>Qtde.</b><input class="qt" type="number" min="1" max="9" value="1" id="exqt${n}"></label>
   </div>
   <div class="manual" hidden><label class="f"><b>Código SIGTAP (10 dígitos)</b><input class="mcode" data-num inputmode="numeric" maxlength="10" placeholder="0206010079" id="exmc${n}"></label><label class="f"><b>Nome do procedimento</b><input class="mname" id="exmn${n}"></label></div>
   <div class="bad mbad" hidden>Código inválido: confira os 10 dígitos no SIGTAP.</div>
   <p class="signame"></p>
   <div class="opts lat" hidden><span class="note">Lado:</span><label class="opt sm"><input type="radio" name="lat${n}" value="DIREITO">Direito</label><label class="opt sm"><input type="radio" name="lat${n}" value="ESQUERDO">Esquerdo</label></div>
   <div class="opts ctr" hidden><span class="note">Contraste:</span><label class="opt sm"><input type="radio" name="ctr${n}" value="sem" checked>Sem contraste</label><label class="opt sm contrast"><input type="radio" name="ctr${n}" value="com">Com contraste</label><label class="opt sm manualc" hidden><input type="radio" name="ctr${n}" value="na">Não se aplica</label></div>
   <div class="ctrnote" hidden></div>`;
  $('#exams').appendChild(linha);
  linha.state = { prev: '', ack: false };
  const seletor = linha.querySelector('.sel');
  seletor.addEventListener('change', () => aoEscolherExame(linha));
  linha.querySelector('.rm').onclick = () => {
    linha.remove();
    renumerarExames();
    atualizarApac();
  };
  linha.querySelectorAll(`input[name="ctr${n}"]`).forEach(r =>
    r.addEventListener('change', () => {
      if (r.checked && r.value === 'com' && !linha.state.ack) {
        confirmarNaoOfertado(
          linha,
          () => {
            linha.state.ack = true;
            mostrarLinhaExame(linha);
            atualizarApac();
          },
          () => {
            linha.querySelector(`input[name="ctr${n}"][value="sem"]`).checked = true;
            mostrarLinhaExame(linha);
            atualizarApac();
          },
        );
      } else mostrarLinhaExame(linha);
    }),
  );
  linha.querySelector('.mcode').addEventListener('input', () => mostrarLinhaExame(linha));
  renumerarExames();
  mostrarLinhaExame(linha);
  if (focar) seletor.focus();
  return linha;
}

function renumerarExames() {
  $$('#exams .ex').forEach((linha, i) => {
    linha.classList.toggle('main', i === 0);
    const etiqueta = linha.querySelector('.tag');
    etiqueta.textContent = i === 0 ? 'Procedimento principal' : 'Procedimento secundário';
    etiqueta.classList.toggle('sec', i > 0);
    linha.querySelector('.rm').hidden = $$('#exams .ex').length === 1;
  });
}

function exameDaLinha(linha) {
  const v = linha.querySelector('.sel').value;
  return v === 'manual' ? { id: 'manual', c: 'opt' } : EXAMES_POR_ID[v];
}

function aoEscolherExame(linha) {
  const item = exameDaLinha(linha);
  linha.state.ack = false;
  const n = linha.dataset.n;
  const sem = linha.querySelector(`input[name="ctr${n}"][value="sem"]`);
  if (sem) sem.checked = true;
  if (item && item.c === 'sim') {
    confirmarNaoOfertado(
      linha,
      () => {
        linha.state.ack = true;
        linha.state.prev = linha.querySelector('.sel').value;
        mostrarLinhaExame(linha);
        atualizarApac();
      },
      () => {
        linha.querySelector('.sel').value = linha.state.prev;
        mostrarLinhaExame(linha);
        atualizarApac();
      },
    );
  } else linha.state.prev = linha.querySelector('.sel').value;
  mostrarLinhaExame(linha);
}

/** Contraste efetivo da linha: 'com', 'sem', 'na' ou '' (exame só com contraste ainda não confirmado). */
function contrasteDaLinha(linha) {
  const item = exameDaLinha(linha);
  if (!item) return '';
  if (item.c === 'sim') return linha.state.ack ? 'com' : '';
  if (item.c === '') return 'na';
  const r = linha.querySelector(`input[name="ctr${linha.dataset.n}"]:checked`);
  return r ? r.value : 'sem';
}

function mostrarLinhaExame(linha) {
  const item = exameDaLinha(linha),
    codigo = linha.querySelector('.code'),
    manual = linha.querySelector('.manual');
  manual.hidden = !(item && item.id === 'manual');
  let c = '';
  if (item) c = item.id === 'manual' ? linha.querySelector('.mcode').value : item.code;
  const invalido = item && item.id === 'manual' && c.length === 10 && !codigoSigtapValido(c);
  linha.querySelector('.mbad').hidden = !invalido;
  codigo.textContent = c ? formatarCodigoSigtap(c) : '—';
  codigo.classList.toggle('empty', !c);
  const nomeSigtap = linha.querySelector('.signame');
  nomeSigtap.textContent =
    item && item.id !== 'manual' ? 'SIGTAP: ' + item.name + (item.par ? ' + ' + EXAMES_POR_ID[item.par].name : '') : '';
  nomeSigtap.hidden = !nomeSigtap.textContent;
  linha.querySelector('.lat').hidden = !(item && item.lat);
  linha.querySelector('.ctr').hidden = !(item && item.c === 'opt');
  linha.querySelector('.manualc').hidden = !(item && item.id === 'manual');
  const contraste = contrasteDaLinha(linha),
    nota = linha.querySelector('.ctrnote');
  if ((item && item.c === 'sim' && linha.state.ack) || contraste === 'com') {
    nota.hidden = false;
    nota.className = 'ctrnote';
    nota.innerHTML = '<span class="badge">Com contraste · não ofertado pelo município · prosseguir confirmado</span>';
  } else if (item && item.c === '' && item.id !== 'manual') {
    nota.hidden = false;
    nota.className = 'ctrnote';
    nota.innerHTML = '<span class="badge ok">Contraste não se aplica</span>';
  } else nota.hidden = true;
}

/** Dados das linhas para as regras. */
function linhasDeExame() {
  return $$('#exams .ex').map(linha => {
    const lado = linha.querySelector(`input[name="lat${linha.dataset.n}"]:checked`);
    return {
      item: exameDaLinha(linha),
      contraste: contrasteDaLinha(linha),
      lado: lado ? lado.value : '',
      quantidade: linha.querySelector('.qt').value,
      codigoManual: linha.querySelector('.mcode').value,
      nomeManual: linha.querySelector('.mname').value,
    };
  });
}

/* ---------- janela "não ofertado pelo município" ---------- */
let aoConfirmar = null,
  aoCancelar = null;
function confirmarNaoOfertado(linha, sim, nao) {
  const item = exameDaLinha(linha);
  $('#mExam').textContent = item && item.label ? 'Exame: ' + item.label : '';
  aoConfirmar = sim;
  aoCancelar = nao;
  $('#modal').hidden = false;
  $('#mNo').focus();
}
function fecharJanela(acao) {
  $('#modal').hidden = true;
  const f = acao;
  aoConfirmar = aoCancelar = null;
  if (f) f();
}

/* ---------- folha ---------- */
function dadosDaFolhaApac() {
  const v = {};
  [
    'cnes',
    'nome',
    'pront',
    'cns',
    'mae',
    'ddd',
    'tel',
    'end',
    'mun',
    'ibge',
    'uf',
    'cep',
    'diag',
    'cid1',
    'cid2',
    'cid3',
    'obs',
    'prof',
    'profdoc',
    'exec',
    'execcnes',
  ].forEach(k => {
    v[k] = valorApac(k);
  });
  return {
    v,
    estabelecimento: nomeDoEstabelecimento(),
    nasc: $('#nasc').value,
    sexoM: $('#sM').checked,
    sexoF: $('#sF').checked,
    dsol: $('#dsol').value,
    documentoCns: $('#dCNS').checked,
    documentoCpf: $('#dCPF').checked,
    procedimentos: procedimentosDoLaudo(linhasDeExame()),
  };
}
const pintarApac = () => pintarFolhaApac($('#sh'), dadosDaFolhaApac());

/* ---------- tela ---------- */
function aplicarVisibilidadeApac() {
  $$('[data-when]').forEach(e => {
    const regra = e.dataset.when;
    const campo = document.getElementById(regra);
    e.hidden = regra === 'estOut' ? $('#estSel').value !== 'out' : !(campo && campo.checked);
  });
}
function avisarExcesso() {
  const aviso = avisoExcessoDeProcedimentos(procedimentosDoLaudo(linhasDeExame()).length),
    caixa = $('#tooMany');
  caixa.hidden = !aviso;
  if (aviso) caixa.textContent = aviso;
}
function atualizarApac() {
  aplicarVisibilidadeApac();
  avisarExcesso();
  $$('#exams .ex').forEach(mostrarLinhaExame);
  pintarApac();
}

/* ---------- importação do laudo do e-SUS PEC ---------- */
function preencherCampo(chave, valor) {
  const e = $(`[data-f="${chave}"]`);
  if (e && valor != null && valor !== '') {
    e.value = valor;
    return true;
  }
  return false;
}

function aplicarLaudoPec(r) {
  const obtidos = [],
    faltando = [];
  const marcar = (ok, rotulo) => (ok ? obtidos : faltando).push(rotulo);
  marcar(preencherCampo('nome', r.nome), 'Nome');
  marcar(preencherCampo('mae', r.mae), 'Nome da mãe');
  if (r.cns && r.cns.length === 15) marcar(preencherCampo('cns', r.cns), 'CNS');
  else faltando.push('CNS');
  const d = (r.nasc || '').match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (d) {
    $('#nasc').value = `${d[3]}-${d[2]}-${d[1]}`;
    obtidos.push('Data de nascimento');
  } else faltando.push('Data de nascimento');
  if (/^fem/.test(r.sexo)) {
    $('#sF').checked = true;
    obtidos.push('Sexo');
  } else if (/^masc/.test(r.sexo)) {
    $('#sM').checked = true;
    obtidos.push('Sexo');
  } else faltando.push('Sexo');
  const t = (r.tel || '').replace(/\D/g, '');
  if (t.length >= 10) {
    preencherCampo('ddd', t.slice(0, 2));
    preencherCampo('tel', t.slice(2));
    obtidos.push('Telefone');
  }
  if (r.endLines && r.endLines.length) {
    let rua = r.endLines[0],
      bairro = '';
    const ultima = r.endLines[r.endLines.length - 1];
    const m = ultima.match(/^(.*?)\s*-\s*(\d{5}-?\d{3})\s*-\s*(.+?)\s*-\s*([A-Z]{2})$/);
    if (m) {
      bairro = m[1];
      preencherCampo('cep', m[2].replace(/\D/g, ''));
      preencherCampo('mun', m[3]);
      preencherCampo('uf', m[4]);
      if (r.endLines.length > 1) rua = r.endLines.slice(0, -1).join(', ');
    } else rua = r.endLines.join(', ');
    marcar(preencherCampo('end', [rua, bairro].filter(Boolean).join(', ')), 'Endereço');
  } else faltando.push('Endereço');
  if (preencherCampo('ibge', r.ibge)) obtidos.push('Código IBGE');
  if (preencherCampo('pront', r.pront)) obtidos.push('Prontuário');
  if (r.uni || r.cnes) {
    const i = ESTABELECIMENTOS_SOLICITANTES.findIndex(e => e[1] === r.cnes);
    if (i >= 0) $('#estSel').value = String(i);
    else {
      $('#estSel').value = 'out';
      preencherCampo('estout', maiusculasPtBr(r.uni));
    }
    preencherCampo('cnes', r.cnes);
    obtidos.push('Estabelecimento e CNES');
  }
  if (r.prof) {
    preencherCampo('prof', r.prof);
    if (r.profcpf) {
      $('#dCPF').checked = true;
      $('#profdoc').maxLength = 11;
      preencherCampo('profdoc', r.profcpf);
    }
    obtidos.push('Profissional solicitante');
  }
  if (r.dsol) {
    $('#dsol').value = r.dsol;
    obtidos.push('Data da solicitação');
  }
  if (r.cids[0]) {
    preencherCampo('diag', r.cids[0].desc);
    preencherCampo('cid1', r.cids[0].cid);
    obtidos.push('Diagnóstico e CID');
  } else faltando.push('CID-10');
  if (r.cids[1]) preencherCampo('cid2', r.cids[1].cid);
  const obs = [r.jus, r.obs].filter(s => s && !/^nao informado$/.test(normalizarTexto(s))).join('\n');
  if (obs) {
    preencherCampo('obs', obs);
    obtidos.push('Justificativa');
  } else faltando.push('Observações');
  const notas = [];
  if (r.procs.length) {
    $('#exams').innerHTML = '';
    r.procs.forEach(p => {
      const linha = adicionarExame();
      const candidatos = Object.values(EXAMES_POR_ID).filter(i => i.code === p.code);
      const item = candidatos.find(i => i.c !== 'sim' && !i.par) || candidatos.find(i => !i.par);
      const seletor = linha.querySelector('.sel');
      if (item && item.c !== 'sim') {
        seletor.value = item.id;
        linha.state.prev = item.id;
      } else {
        seletor.value = 'manual';
        linha.querySelector('.mcode').value = p.code;
        linha.querySelector('.mname').value = p.name;
      }
      mostrarLinhaExame(linha);
      if (item && item.c === 'opt')
        notas.push(`${item.label}: confira se é <b>com ou sem contraste</b> (o PDF não informa).`);
      if (item && item.lat) notas.push(`${item.label}: escolha o <b>lado</b>.`);
    });
    obtidos.push(r.procs.length === 1 ? 'Exame' : 'Exames (' + r.procs.length + ')');
  } else faltando.push('Exame');
  atualizarApac();
  $$('.miss').forEach(e => e.classList.remove('miss'));
  if (faltando.includes('CNS')) $('[data-f="cns"]').classList.add('miss');
  const caixa = $('#impRes');
  caixa.hidden = false;
  caixa.innerHTML =
    `<div class="okbox"><b>Dados importados:</b> ${obtidos.join(', ')}.</div>` +
    (faltando.length
      ? `<div class="warn"><b>Preencha à mão:</b> ${faltando.join(', ')}.${faltando.includes('CNS') ? ' O laudo do PEC não traz o Cartão SUS.' : ''}</div>`
      : '') +
    (notas.length ? `<div class="warn">${notas.join('<br>')}</div>` : '');
}

async function importarArquivoPec(arquivo) {
  if (!arquivo) return;
  const resultado = $('#impRes');
  resultado.hidden = false;
  resultado.innerHTML = '<div class="note">Lendo o PDF…</div>';
  try {
    if (!leitorPdfDisponivel()) throw new Error('leitor');
    const trechos = await extrairTrechosDoPdf(await arquivo.arrayBuffer());
    if (!trechos.length) {
      resultado.innerHTML =
        '<div class="bad">Este PDF não tem texto (parece uma imagem escaneada). Use o laudo gerado pelo e-SUS PEC.</div>';
      return;
    }
    const laudo = lerLaudoPec(trechos);
    if (!laudo.nome && !laudo.procs.length) {
      resultado.innerHTML =
        '<div class="bad">Não reconheci este PDF como um laudo de APAC do e-SUS PEC. Confira o arquivo.</div>';
      return;
    }
    aplicarLaudoPec(laudo);
    mostrarMensagem('Laudo importado');
  } catch (erro) {
    resultado.innerHTML =
      '<div class="bad">Não consegui ler este PDF. Confira se é o laudo de APAC gerado pelo e-SUS PEC.</div>';
    console.error(erro);
  } finally {
    $('#pdfIn').value = '';
  }
}

function ligarImportacao() {
  configurarLeitorPdf();
  $('#pdfIn').addEventListener('change', e => importarArquivoPec(e.target.files[0]));
  const area = $('#drop');
  ['dragenter', 'dragover'].forEach(t =>
    area.addEventListener(t, e => {
      e.preventDefault();
      area.classList.add('over');
    }),
  );
  ['dragleave', 'drop'].forEach(t =>
    area.addEventListener(t, e => {
      e.preventDefault();
      area.classList.remove('over');
    }),
  );
  area.addEventListener('drop', e => {
    const f = e.dataTransfer.files[0];
    if (f) importarArquivoPec(f);
  });
  $('[data-f="cns"]').addEventListener('input', e => e.target.classList.remove('miss'));
}

/* ---------- unidade, nova paciente e inicialização ---------- */
const preencherDataDeHojeApac = () => {
  $('#dsol').value = hojeIso();
};

function novaPacienteApac() {
  const unidade = {};
  CAMPOS_UNIDADE_APAC.forEach(k => {
    unidade[k] = valorApac(k);
  });
  const estabelecimento = $('#estSel').value,
    cpf = $('#dCPF').checked;
  $('#form')
    .querySelectorAll('input,textarea')
    .forEach(i => {
      if (i.type === 'radio' || i.type === 'checkbox') i.checked = i.defaultChecked;
      else i.value = i.defaultValue;
    });
  CAMPOS_UNIDADE_APAC.forEach(k => {
    $(`[data-f="${k}"]`).value = unidade[k];
  });
  $('#estSel').value = estabelecimento;
  if (cpf) $('#dCPF').checked = true;
  $('#exams').innerHTML = '';
  adicionarExame();
  preencherDataDeHojeApac();
  atualizarApac();
  limparPendencia();
  $('#impRes').hidden = true;
  $$('.miss').forEach(e => e.classList.remove('miss'));
  window.scrollTo(0, 0);
  $('[data-f="nome"]').focus();
}

function iniciarApac() {
  montarCabecalho({ pagina: 'apac.html', rotaAtiva: 'requisicoes' });
  montarRodape();
  $('#sh').style.transform = `scale(${594 / 595},${840 / 842})`;
  montarEstabelecimentos();
  $('#mYes').onclick = () => fecharJanela(aoConfirmar);
  $('#mNo').onclick = () => fecharJanela(aoCancelar);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !$('#modal').hidden) fecharJanela(aoCancelar);
  });
  document.addEventListener('input', e => {
    if (e.target.closest('#modal')) return;
    atualizarApac();
  });
  document.addEventListener('change', e => {
    if (e.target.closest('#modal')) return;
    atualizarApac();
  });
  ativarCamposNumericos();
  $('#exams').addEventListener('input', e => {
    if (e.target.matches('[data-num]')) {
      const s = e.target.value.replace(/\D/g, '');
      if (s !== e.target.value) e.target.value = s;
    }
  });
  $('#addEx').onclick = () => {
    adicionarExame(true);
    atualizarApac();
  };
  $('#dCPF').addEventListener('change', () => {
    $('#profdoc').maxLength = 11;
  });
  $('#dCNS').addEventListener('change', () => {
    $('#profdoc').maxLength = 15;
  });
  ligarSalvarUnidade(CHAVES.unidadeApac, () => {
    const o = {};
    CAMPOS_UNIDADE_APAC.forEach(k => {
      o[k] = valorApac(k);
    });
    o.est = $('#estSel').value;
    o.doc = $('#dCPF').checked ? 'CPF' : 'CNS';
    return o;
  });
  ligarNovaPaciente(novaPacienteApac);
  ligarImpressao({
    documento: 'APAC',
    pintar: pintarApac,
    pendencias: () => pendenciasApac({ ...dadosDaFolhaApac(), dsol: $('#dsol').value, linhas: linhasDeExame() }),
  });
  ligarImportacao();
  adicionarExame();
  const unidade = lerUnidade(CHAVES.unidadeApac);
  if (unidade) {
    CAMPOS_UNIDADE_APAC.forEach(k => {
      if (unidade[k] != null) $(`[data-f="${k}"]`).value = unidade[k];
    });
    if (unidade.est != null) $('#estSel').value = unidade.est;
    if (unidade.doc === 'CPF') $('#dCPF').checked = true;
  }
  preencherDataDeHojeApac();
  atualizarApac();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(pintarApac);
}

iniciarApac();
