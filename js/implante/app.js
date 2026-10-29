/**
 * Roteiro de consulta — inserção do implante subdérmico (interface).
 * Lê o formulário, mostra progresso e alertas e gera o SOAP com as regras de js/implante/regras.js.
 */
import { montarCabecalho, montarRodape } from '../componentes/cabecalho.js';
import { copiarTexto } from '../utils/area-transferencia.js';
import {
  avaliarAlertasImplante,
  avaliarRiscoGravidez,
  calcularImcImplante,
  dataRetiradaPrevista,
  idadeEmAnosTexto,
  montarSoapImplante,
  soapImplanteCompleto,
} from './regras.js';

const porId = id => document.getElementById(id);
const todos = seletor => Array.from(document.querySelectorAll(seletor));
const valorRadio = nome => {
  const e = document.querySelector('input[name="' + nome + '"]:checked');
  return e ? e.value : '';
};
const marcados = seletor => todos(seletor).filter(c => c.checked);
/** Rótulos (texto do <span> ao lado) das caixas marcadas. */
const rotulosMarcados = seletor =>
  marcados(seletor).map(c => {
    const sp = c.parentElement.querySelector('span');
    return sp ? sp.textContent.trim() : c.value;
  });

/** Aviso próprio desta página (balão #toast). */
function mostrarAvisoImplante(mensagem) {
  const balao = porId('toast');
  balao.textContent = mensagem || 'Copiado';
  balao.classList.add('show');
  clearTimeout(mostrarAvisoImplante.temporizador);
  mostrarAvisoImplante.temporizador = setTimeout(() => balao.classList.remove('show'), 1600);
}

/* ---------- campos calculados ---------- */
function atualizarImc() {
  const imc = calcularImcImplante(porId('f_peso').value, porId('f_altura').value);
  porId('imcOut').textContent = imc ? imc.valor : '—';
  porId('imcClass').textContent = imc ? imc.classe : '—';
}

function atualizarRisco() {
  const risco = avaliarRiscoGravidez({
    testeFeito: valorRadio('testerapido'),
    resultado: valorRadio('testeresultado'),
    menstruada: porId('c_menstruada').checked,
    menstruou7: porId('c_menstruou7').checked,
    usoCorreto: porId('c_usoucorreto').checked,
    relacaoDesprotegida: porId('c_relacaodesp').checked,
    posParto: porId('c_posparto').checked,
    amenorreia: porId('c_amenorreia').checked,
  });
  const caixa = porId('riskBox');
  caixa.classList.remove('ok', 'warn', 'danger');
  caixa.classList.add(risco.nivel);
  porId('riskPct').textContent = risco.percentual;
  porId('riskDesc').textContent = risco.descricao;
}

function atualizarAlertas() {
  const alerta = avaliarAlertasImplante({
    testeresultado: valorRadio('testeresultado'),
    temabsoluta: valorRadio('temabsoluta'),
    temrelativa: valorRadio('temrelativa'),
    usaindutor: valorRadio('usaindutor'),
    palpavel: valorRadio('palpavel'),
    inseridosucesso: valorRadio('inseridosucesso'),
    absolutas: marcados('.ci-absoluta').length,
    relativas: marcados('.ci-relativa').length,
    indutores: marcados('.med-indutor').length,
  });
  porId('alertGravidez').classList.toggle('show', alerta.gravidez);
  atualizarRisco();
  porId('alertAbsoluta').classList.toggle('show', alerta.absoluta);
  porId('alertRelativa').classList.toggle('show', alerta.relativa);
  porId('alertElegivel').classList.toggle('show', alerta.elegivel);
  porId('alertIndutor').classList.toggle('show', alerta.indutor);
  porId('alertNaoInserido').classList.toggle('show', alerta.naoInserido);
}

/* ---------- progresso das 12 seções ---------- */
const SECOES = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11', 's12'];
const preenchido = campo =>
  campo.type === 'checkbox' || campo.type === 'radio'
    ? campo.checked
    : !!(campo.value && campo.value.trim().length > 0);

function atualizarProgresso() {
  let total = 0,
    feitos = 0;
  SECOES.forEach(id => {
    const secao = porId(id);
    if (!secao) return;
    const campos = Array.from(secao.querySelectorAll('input[data-track], textarea[data-track], select[data-track]'));
    const radiosVistos = {};
    let totalSecao = 0,
      feitosSecao = 0;
    campos.forEach(campo => {
      if (campo.type === 'radio') {
        if (radiosVistos[campo.name]) return;
        radiosVistos[campo.name] = true;
        if (campo.name === 'testeresultado' && valorRadio('testerapido') !== 'sim') return; // só exigido se o teste foi feito
        totalSecao++;
        if (document.querySelector('input[name="' + campo.name + '"]:checked')) feitosSecao++;
      } else {
        totalSecao++;
        if (preenchido(campo)) feitosSecao++;
      }
    });
    total += totalSecao;
    feitos += feitosSecao;
    const link = document.querySelector('nav.jump a[href="#' + id + '"]');
    if (link) link.classList.toggle('done', totalSecao > 0 && feitosSecao === totalSecao);
  });
  const pct = total ? Math.round((100 * feitos) / total) : 0;
  porId('progressFill').style.width = pct + '%';
  porId('progressText').textContent = pct + '% preenchido';
  porId('filledCount').textContent = feitos;
  porId('totalCount').textContent = total;
  const completo = total > 0 && feitos === total;
  const botao = porId('gerarBtn');
  botao.disabled = !completo;
  botao.title = completo ? '' : 'Preencha todos os campos das 12 seções para liberar a geração da anamnese';
  porId('missingNote').hidden = completo;
  atualizarAlertas();
}

/* ---------- geração do SOAP ---------- */
function lerFormularioImplante() {
  const valores = {};
  todos('input[id], textarea[id], select[id]').forEach(campo => {
    if (campo.type !== 'checkbox' && campo.type !== 'radio') valores[campo.id] = campo.value.trim();
  });
  const radios = {};
  todos('input[type=radio]').forEach(campo => {
    if (!(campo.name in radios)) radios[campo.name] = valorRadio(campo.name);
  });
  const caixas = {};
  todos('input[type=checkbox][id]').forEach(campo => {
    caixas[campo.id] = campo.checked;
  });
  const imcTexto = porId('imcOut').textContent;
  return {
    valores,
    radios,
    marcados: caixas,
    imc: imcTexto && imcTexto !== '—' ? { valor: imcTexto, classe: porId('imcClass').textContent } : null,
    listas: {
      anteriores: rotulosMarcados('#s3 .chk input[type=checkbox]'),
      indutores: rotulosMarcados('.med-indutor'),
      braco: rotulosMarcados('#s7 .chk input[type=checkbox]'),
      absolutas: rotulosMarcados('.ci-absoluta'),
      relativas: rotulosMarcados('.ci-relativa'),
      orientacoes: rotulosMarcados('.orient'),
      posProcedimento: rotulosMarcados('.pos'),
    },
  };
}

function gerarSoap() {
  if (porId('gerarBtn').disabled) {
    mostrarAvisoImplante('Complete todos os campos antes de gerar');
    return;
  }
  const soap = montarSoapImplante(lerFormularioImplante());
  porId('ta_s').value = soap.S;
  porId('ta_o').value = soap.O;
  porId('ta_a').value = soap.A;
  porId('ta_p').value = soap.P;
  porId('resultado').hidden = false;
  porId('resultado').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function copiarComAvisoImplante(texto, rotulo) {
  const ok = await copiarTexto(texto);
  mostrarAvisoImplante(ok ? rotulo || 'Copiado' : 'Não foi possível copiar');
}

/* ---------- limpar (dois cliques para confirmar) ---------- */
let confirmacaoLimpeza = null;
function restaurarBotaoLimpar(botao) {
  botao.textContent = 'Limpar formulário';
  botao.style.borderColor = '';
  botao.style.color = '';
}
function limparFormulario() {
  const botao = porId('clearBtn');
  if (!confirmacaoLimpeza) {
    botao.textContent = 'Confirmar limpeza';
    botao.style.borderColor = 'var(--danger)';
    botao.style.color = 'var(--danger)';
    confirmacaoLimpeza = setTimeout(() => {
      confirmacaoLimpeza = null;
      restaurarBotaoLimpar(botao);
    }, 4000);
    return;
  }
  clearTimeout(confirmacaoLimpeza);
  confirmacaoLimpeza = null;
  restaurarBotaoLimpar(botao);
  todos('input[type=text],input[type=date],input[type=number],input[type=time],textarea').forEach(e => {
    e.value = '';
  });
  todos('input[type=checkbox],input[type=radio]').forEach(e => {
    e.checked = false;
  });
  porId('imcOut').textContent = '—';
  porId('imcClass').textContent = '—';
  porId('f_idade').value = '';
  porId('resultado').hidden = true;
  atualizarProgresso();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------- ligação dos eventos ---------- */
function iniciarImplante() {
  montarCabecalho({ pagina: 'implante.html' });
  montarRodape();
  porId('f_nasc').addEventListener('input', function () {
    porId('f_idade').value = idadeEmAnosTexto(this.value);
  });
  porId('f_peso').addEventListener('input', atualizarImc);
  porId('f_altura').addEventListener('input', atualizarImc);
  porId('f_datainsercao').addEventListener('input', function () {
    if (this.value) porId('f_dataretirada').value = dataRetiradaPrevista(this.value);
  });
  document.addEventListener('input', atualizarProgresso);
  document.addEventListener('change', atualizarProgresso);
  porId('gerarBtn').addEventListener('click', gerarSoap);
  porId('regenBtn').addEventListener('click', gerarSoap);
  porId('clearBtn').addEventListener('click', limparFormulario);
  document.addEventListener('click', e => {
    const botao = e.target.closest('.copybtn');
    if (botao) copiarComAvisoImplante(porId(botao.getAttribute('data-copy')).value, 'Bloco copiado');
  });
  porId('copyAllBtn').addEventListener('click', () => {
    copiarComAvisoImplante(
      soapImplanteCompleto({
        S: porId('ta_s').value,
        O: porId('ta_o').value,
        A: porId('ta_a').value,
        P: porId('ta_p').value,
      }),
      'SOAP completo copiado',
    );
  });
  atualizarProgresso();
}

iniciarImplante();
