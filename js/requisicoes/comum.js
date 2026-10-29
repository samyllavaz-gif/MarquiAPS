/**
 * Comportamentos comuns às requisições (mamografia/citopatológico, densitometria e APAC):
 * barra de ações (salvar dados da unidade, nova paciente, imprimir, baixar PDF),
 * aviso de campos obrigatórios, campos só de números e ajuste de texto nas folhas.
 * Os dados da paciente nunca são gravados: só os dados da unidade, e só quando o usuário clica em salvar.
 */
import { gerarPdfDasFolhas, imprimirOuGerarPdf } from '../servicos/exportar-pdf.js';
import { gravarArmazenado, lerArmazenado } from '../utils/armazenamento.js';
import { $$ } from '../utils/dom.js';

/** Mensagem curta na barra superior (#msg), some em 3,5 s. */
export function mostrarMensagem(texto) {
  const alvo = document.getElementById('msg');
  alvo.textContent = texto;
  clearTimeout(mostrarMensagem.temporizador);
  mostrarMensagem.temporizador = setTimeout(() => {
    alvo.textContent = '';
  }, 3500);
}

/** Mantém apenas dígitos nos campos marcados com data-num. */
export function ativarCamposNumericos(raiz = document) {
  raiz.querySelectorAll('[data-num]').forEach(campo =>
    campo.addEventListener('input', () => {
      const digitos = campo.value.replace(/\D/g, '');
      if (digitos !== campo.value) campo.value = digitos;
    }),
  );
}

/** Liga o botão "Salvar dados da unidade". `coletar` devolve o objeto a gravar. */
export function ligarSalvarUnidade(chave, coletar) {
  document.getElementById('bSave').onclick = () => {
    const ok = gravarArmazenado(chave, coletar());
    mostrarMensagem(ok ? 'Dados da unidade salvos' : 'Este navegador não permitiu salvar');
  };
}

/** Lê os dados da unidade gravados anteriormente (ou null). */
export function lerUnidade(chave) {
  return lerArmazenado(chave, null);
}

/** Botão "Nova paciente": o primeiro clique pede confirmação; o segundo executa `limpar`. */
export function ligarNovaPaciente(limpar) {
  let armado = false;
  document.getElementById('bNew').onclick = evento => {
    const botao = evento.currentTarget;
    if (!armado) {
      armado = true;
      botao.textContent = 'Clique de novo para apagar';
      setTimeout(() => {
        armado = false;
        botao.textContent = 'Nova paciente';
      }, 3500);
      return;
    }
    armado = false;
    botao.textContent = 'Nova paciente';
    limpar();
    mostrarMensagem('Pronto para nova paciente');
  };
}

/** Faixa de aviso fixa no rodapé (#pending). `botoes` = [[id, rótulo, ação]]. */
function mostrarPendencia(htmlMensagem, botoes) {
  const alvo = document.getElementById('pending');
  alvo.innerHTML = `<div class="pend"><div class="warn"><span>${htmlMensagem}</span><span class="sp"></span>${botoes.map(([id, rotulo]) => `<button id="${id}">${rotulo}</button>`).join('')}</div></div>`;
  botoes.forEach(([id, , acao]) => {
    document.getElementById(id).onclick = acao;
  });
}

export function limparPendencia() {
  document.getElementById('pending').innerHTML = '';
}

/**
 * Liga os botões "Imprimir" e "Baixar PDF".
 * @param {object} o
 * @param {string} o.documento nome usado no arquivo PDF
 * @param {() => void} o.pintar redesenha as folhas com os dados atuais
 * @param {() => string|null} [o.semDocumento] mensagem (HTML) quando nenhum documento está marcado
 * @param {() => string[]} o.pendencias campos obrigatórios em branco
 * @param {string} [o.separador] separador da lista de pendências
 */
export function ligarImpressao({ documento, pintar, semDocumento, pendencias, separador = ', ' }) {
  let querPdf = false;
  const imprimir = () => {
    limparPendencia();
    pintar();
    if (querPdf) {
      querPdf = false;
      gerarPdfDasFolhas(documento);
    } else imprimirOuGerarPdf(documento);
  };
  const botaoImprimir = document.getElementById('bPrint');
  const aoImprimir = () => {
    const aviso = semDocumento && semDocumento();
    if (aviso) {
      mostrarPendencia(aviso, [['pX', 'Entendi', limparPendencia]]);
      return;
    }
    const faltando = pendencias();
    if (!faltando.length) {
      imprimir();
      return;
    }
    mostrarPendencia(`<b>Campos obrigatórios em branco:</b> ${faltando.join(separador)}.`, [
      ['pGo', 'Imprimir mesmo assim', imprimir],
      ['pX', 'Voltar e completar', limparPendencia],
    ]);
  };
  botaoImprimir.addEventListener('click', evento => {
    if (evento.isTrusted) querPdf = false;
    aoImprimir();
  });
  document.getElementById('bPdf').addEventListener('click', () => {
    querPdf = true;
    aoImprimir();
  });
  window.addEventListener('beforeprint', pintar);
}

/* ---------- ajuste de texto nas folhas ---------- */
const PX_POR_PT = 96 / 72;

/** Reduz a fonte (em pt) até o texto caber na largura, sem passar do mínimo. */
export function ajustarLinhaNaFolha(elemento, larguraPt, tamanhoPt, minimoPt = 5.5) {
  let tamanho = tamanhoPt;
  elemento.style.fontSize = tamanho + 'pt';
  while (elemento.scrollWidth > larguraPt * PX_POR_PT + 0.5 && tamanho > minimoPt) {
    tamanho -= 0.25;
    elemento.style.fontSize = tamanho + 'pt';
  }
  return tamanho;
}

/** Reduz fonte e entrelinha até o bloco caber na altura disponível. */
export function ajustarBlocoNaFolha(elemento, alturaPt, tamanhoPt, entrelinhaPt) {
  let tamanho = tamanhoPt,
    entrelinha = entrelinhaPt;
  const aplicar = () => {
    elemento.style.fontSize = tamanho + 'pt';
    elemento.style.lineHeight = entrelinha + 'pt';
  };
  aplicar();
  while (elemento.scrollHeight > alturaPt * PX_POR_PT + 0.5 && tamanho > 5.5) {
    tamanho -= 0.25;
    entrelinha = tamanho * 1.2;
    aplicar();
  }
}

/** Mostra/oculta elementos com data-when="idDoCampo" (ou "!idDoCampo") conforme o campo marcado. */
export function aplicarVisibilidadeCondicional() {
  $$('[data-when]').forEach(e => {
    const regra = e.dataset.when,
      negado = regra[0] === '!';
    const campo = document.getElementById(negado ? regra.slice(1) : regra);
    e.hidden = negado ? campo.checked : !campo.checked;
  });
}
