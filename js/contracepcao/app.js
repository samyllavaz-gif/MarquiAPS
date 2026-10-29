/**
 * EscolhaSegura APS — interface da página de contracepção.
 * Lê o formulário, aplica as regras de js/contracepcao/regras.js e mostra o resultado.
 */
import { montarCabecalho, montarRodape } from '../componentes/cabecalho.js';
import { copiarComAviso } from '../utils/area-transferencia.js';
import { METODOS_SUS } from './metodos.js';
import { agruparMetodos, avaliarMetodos, montarSoapContracepcao, textoPrioridade } from './regras.js';

const elemento = id => document.getElementById(id);

/** Leitor do formulário no formato esperado pelas regras. */
const leitorContracepcao = {
  valor: id => {
    const el = elemento(id);
    return el ? el.value : '';
  },
  marcado: id => {
    const el = elemento(id);
    return el ? el.checked : false;
  },
};

const ROTULO_STATUS = { green: 'Verde', yellow: 'Amarelo', orange: 'Laranja', red: 'Vermelho' };

function abrirAba(idAba) {
  document.querySelectorAll('.contracepcao-app .tab').forEach(aba => aba.classList.remove('active'));
  document
    .querySelectorAll('.contracepcao-app .tab-button')
    .forEach(botao => botao.classList.toggle('active', botao.dataset.tab === idAba));
  elemento(idAba).classList.add('active');
}

function preencherTabelaSUS() {
  elemento('susTableBody').innerHTML = METODOS_SUS.map(
    m => `
        <tr>
          <td><strong>${m.nome}</strong></td>
          <td>${m.apresentacao}</td>
          <td>${m.tipo}</td>
          <td>${m.acesso}</td>
          <td>${m.obs}</td>
        </tr>
      `,
  ).join('');
}

function mostrarResumo(risco, avaliados) {
  const { elegiveisUBS, encaminhamento, contraindicados } = agruparMetodos(avaliados);
  elemento('painelResumo').innerHTML = `
        <span class="pill ${risco.gravidezPossivel ? 'orange' : 'green'}">Gravidez possível: ${risco.gravidezPossivel ? 'sim/incerta' : 'não identificada'}</span>
        <span class="pill ${risco.estrogenioContraindicado ? 'red' : risco.estrogenioCautela ? 'yellow' : 'green'}">Pode estrogênio: ${risco.estrogenioContraindicado ? 'não' : risco.estrogenioCautela ? 'cautela' : 'sim'}</span>
        <span class="pill ${risco.progestagenioContraindicado ? 'red' : risco.progestagenioCautela ? 'yellow' : 'green'}">Pode progestagênio: ${risco.progestagenioContraindicado ? 'não' : risco.progestagenioCautela ? 'cautela' : 'sim'}</span>
        <span class="pill ${risco.diuContraindicado ? 'red' : risco.diuCautela ? 'orange' : 'green'}">DIU: ${risco.diuContraindicado ? 'não/adiar' : risco.diuCautela ? 'avaliar' : 'possível'}</span>
        <span class="pill ${risco.precisaMedico ? 'orange' : 'green'}">Discutir/encaminhar: ${risco.precisaMedico ? 'sim' : 'não obrigatório'}</span>
      `;
  elemento('resumoRapido').innerHTML = `
        <p><strong>Elegíveis e disponíveis na UBS:</strong><br>
        ${elegiveisUBS.length ? elegiveisUBS.map(m => '• ' + m.nome).join('<br>') : 'Nenhum método direto liberado pelos dados preenchidos.'}</p>

        <p><strong>Elegíveis com encaminhamento:</strong><br>
        ${encaminhamento.length ? encaminhamento.map(m => '• ' + m.nome + ' — ' + m.acesso).join('<br>') : 'Nenhum.'}</p>

        <p><strong>Contraindicados/evitar:</strong><br>
        ${contraindicados.length ? contraindicados.map(m => '• ' + m.nome).join('<br>') : 'Nenhum método classificado como vermelho.'}</p>
      `;
  elemento('prioridade').innerHTML = textoPrioridade(leitorContracepcao.valor('preferencia'));
}

function mostrarAlertas(risco) {
  elemento('alertas').innerHTML = risco.alertas.length
    ? risco.alertas.map(a => `<div class="warning"><strong>Alerta:</strong> ${a}</div>`).join('')
    : `<div class="info">Nenhum alerta crítico identificado com os dados preenchidos. Manter aconselhamento, preservativo e registro adequado.</div>`;
}

function mostrarMetodos(avaliados) {
  elemento('metodosResultado').innerHTML = avaliados
    .map(
      m => `
        <div class="method-card ${m.avaliacao.status}">
          <div class="method-title">${m.nome}</div>
          <div class="method-sub">${m.apresentacao} — ${m.tipo}</div>

          <span class="pill ${m.avaliacao.status}">
            ${ROTULO_STATUS[m.avaliacao.status]}: ${m.avaliacao.tituloStatus}
          </span>

          <span class="pill pink">${m.acesso}</span>

          <ul class="method-reasons">
            ${m.avaliacao.motivos.map(r => `<li>${r}</li>`).join('')}
          </ul>
        </div>
      `,
    )
    .join('');
}

function calcularResultado() {
  const { risco, avaliados } = avaliarMetodos(leitorContracepcao);
  mostrarResumo(risco, avaliados);
  mostrarAlertas(risco);
  mostrarMetodos(avaliados);
  elemento('soap').innerText = montarSoapContracepcao(leitorContracepcao, risco, avaliados);
  abrirAba('resultado');
}

function limparFormularioContracepcao() {
  document
    .querySelectorAll('.contracepcao-app input, .contracepcao-app select, .contracepcao-app textarea')
    .forEach(el => {
      if (el.type === 'checkbox') el.checked = false;
      else el.value = '';
    });
  elemento('painelResumo').innerHTML = 'Preencha a consulta e clique em “Gerar resultado”.';
  elemento('alertas').innerHTML = '';
  elemento('metodosResultado').innerHTML = '';
  elemento('resumoRapido').innerHTML = 'Nenhum resultado gerado ainda.';
  elemento('prioridade').innerHTML = 'Aguardando preenchimento.';
  elemento('soap').innerText = 'Preencha os dados e gere o resultado.';
  abrirAba('consulta');
}

function iniciarContracepcao() {
  montarCabecalho({ pagina: 'contracepcao.html' });
  montarRodape();
  document
    .querySelectorAll('.contracepcao-app [data-tab]')
    .forEach(botao => botao.addEventListener('click', () => abrirAba(botao.dataset.tab)));
  const acoes = {
    gerar: calcularResultado,
    limpar: limparFormularioContracepcao,
    copiar: () => copiarComAviso(elemento('soap').innerText),
  };
  document
    .querySelectorAll('.contracepcao-app [data-acao]')
    .forEach(botao => botao.addEventListener('click', () => acoes[botao.dataset.acao]()));
  preencherTabelaSUS();
}

iniciarContracepcao();
