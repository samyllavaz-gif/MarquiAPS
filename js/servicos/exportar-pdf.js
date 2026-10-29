/**
 * Impressão das requisições.
 * - Página aberta sozinha numa aba: usa a impressão nativa do navegador.
 * - Dentro do visualizador do Claude (iframe, onde a janela de impressão é bloqueada):
 *   gera um PDF A4 das folhas visíveis em #print e oferece o arquivo para baixar.
 * O PDF é montado no próprio navegador; nenhum dado é enviado a servidores.
 * As bibliotecas html2canvas e jsPDF são carregadas sob demanda (ver BIBLIOTECAS_PDF em config.js).
 */
import { avisar } from '../componentes/aviso.js';
import { BIBLIOTECAS_PDF } from '../config.js';

let carregamentoBibliotecas = null;

function carregarBibliotecasPdf() {
  if (carregamentoBibliotecas) return carregamentoBibliotecas;
  carregamentoBibliotecas = BIBLIOTECAS_PDF.reduce(
    (anterior, endereco) =>
      anterior.then(
        () =>
          new Promise((ok, falha) => {
            const script = document.createElement('script');
            script.src = endereco;
            script.onload = ok;
            script.onerror = () => falha(new Error('Falha ao carregar ' + endereco));
            document.head.appendChild(script);
          }),
      ),
    Promise.resolve(),
  );
  carregamentoBibliotecas.catch(() => {
    carregamentoBibliotecas = null;
  });
  return carregamentoBibliotecas;
}

export function estaDentroDeMoldura() {
  try {
    return window.self !== window.top;
  } catch (erro) {
    return true;
  }
}

/** Nome do arquivo: "<documento> - <dois primeiros nomes> - dd-mm-aaaa.pdf". */
function nomeDoArquivo(documento) {
  let nome = '';
  try {
    const campo = document.querySelector('[data-f="nome"],#f_nome');
    nome = campo && campo.value ? campo.value.trim().split(/\s+/).slice(0, 2).join(' ') : '';
  } catch (erro) {
    nome = '';
  }
  const d = new Date();
  const data =
    String(d.getDate()).padStart(2, '0') + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + d.getFullYear();
  return (documento + (nome ? ' - ' + nome : '') + ' - ' + data).replace(/[\\/:*?"<>|]/g, '') + '.pdf';
}

/** Entrega o arquivo: pelo recurso de downloads do Claude, se houver; senão por link de download. */
export async function entregarArquivo(blob, nomeArquivo) {
  try {
    if (window.claude && typeof window.claude.use === 'function') {
      const downloads = await window.claude.use('downloads');
      if (downloads) {
        await downloads.save({ filename: nomeArquivo, data: blob });
        avisar('PDF pronto: abra o arquivo e imprima.');
        return true;
      }
    }
  } catch (erro) {
    if (erro && erro.code === 'declined') {
      avisar('Download cancelado.');
      return true;
    }
  }
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    avisar('PDF gerado: abra o arquivo baixado e imprima.', 4500);
    return true;
  } catch (erro) {
    avisar('Não foi possível baixar o PDF neste navegador.');
    return false;
  }
}

/** Gera o PDF A4 com as folhas visíveis de #print. */
export async function gerarPdfDasFolhas(documento) {
  const folhas = [...document.querySelectorAll('#print .page')].filter(folha => !folha.hidden);
  if (!folhas.length) {
    avisar('Nenhum documento marcado para imprimir.');
    return;
  }
  avisar('Gerando o PDF…', 20000);
  try {
    await carregarBibliotecasPdf();
  } catch (erro) {
    avisar('Sem conexão para gerar o PDF. Abra o site em uma aba própria e use Imprimir.', 6000);
    return;
  }
  const raiz = document.documentElement;
  raiz.classList.add('mq-cap');
  try {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    const JsPdf = window.jspdf.jsPDF;
    const pdf = new JsPdf({ unit: 'pt', format: 'a4', compress: true });
    const LARGURA_A4 = 595.28,
      ALTURA_A4 = 841.89;
    for (let i = 0; i < folhas.length; i++) {
      const folha = folhas[i];
      const caixa = folha.getBoundingClientRect();
      const tela = await window.html2canvas(folha, {
        scale: 2.5,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        windowWidth: Math.max(document.documentElement.clientWidth, caixa.width + 40),
      });
      const largura = caixa.width * 0.75,
        altura = caixa.height * 0.75;
      const x = Math.max(0, (LARGURA_A4 - largura) / 2),
        y = Math.max(0, (ALTURA_A4 - altura) / 2);
      if (i) pdf.addPage('a4', 'portrait');
      pdf.addImage(tela.toDataURL('image/jpeg', 0.92), 'JPEG', x, y, largura, altura, undefined, 'FAST');
    }
    raiz.classList.remove('mq-cap');
    await entregarArquivo(pdf.output('blob'), nomeDoArquivo(documento));
  } catch (erro) {
    raiz.classList.remove('mq-cap');
    console.error(erro);
    avisar('Erro ao gerar o PDF: ' + ((erro && erro.message) || erro), 6000);
  }
}

/** Botão "Imprimir": impressão nativa fora do Claude; PDF dentro do visualizador. */
export function imprimirOuGerarPdf(documento) {
  if (estaDentroDeMoldura()) return gerarPdfDasFolhas(documento);
  window.print();
}
