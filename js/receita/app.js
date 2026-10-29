/**
 * Página "Receita sem data": recebe os PDFs do Receituário de Controle Especial do e-SUS PEC,
 * tira a data abaixo da assinatura (e do rodapé) e devolve o PDF pronto para imprimir.
 */
import { montarCabecalho, montarRodape } from '../componentes/cabecalho.js';
import { configurarLeitorPdf, leitorPdfDisponivel } from '../servicos/leitor-pdf.js';
import { entregarArquivo, estaDentroDeMoldura } from '../servicos/exportar-pdf.js';
import { $ } from '../utils/dom.js';
import { escaparHtml } from '../utils/texto.js';
import { desenharPrevia, removerDataDaReceita } from './processar.js';
import { nomeSemData } from './regras.js';

function criar(tag, classe, html) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (html != null) e.innerHTML = html;
  return e;
}

async function tratarArquivos(arquivos) {
  const opcoes = { emBranco: $('#optBlank').checked, rodape: $('#optFooter').checked };
  for (const arquivo of arquivos) {
    if (!/\.pdf$/i.test(arquivo.name) && arquivo.type !== 'application/pdf') continue;
    const cartao = criar('div', 'item');
    const topo = criar('div', 'item-head');
    topo.append(criar('span', 'fname', escaparHtml(arquivo.name)));
    const selo = criar('span', 'pill', 'Processando…');
    topo.append(selo);
    cartao.append(topo);
    $('#list').prepend(cartao);
    try {
      if (!leitorPdfDisponivel()) throw new Error('pdf.js indisponível');
      const original = new Uint8Array(await arquivo.arrayBuffer());
      const { bytes, encontrados } = await removerDataDaReceita(original, opcoes);
      const datas = encontrados.filter(x => x.tipo === 'data');
      if (!datas.length) {
        selo.className = 'pill warn';
        selo.textContent = 'Nenhuma data encontrada';
      } else {
        selo.className = 'pill ok';
        selo.textContent = datas.length === 1 ? '1 data removida' : datas.length + ' datas removidas';
      }
      if (encontrados.length) {
        const lista = criar('ul', 'found');
        [...new Set(encontrados.map(x => x.texto))].forEach(t =>
          lista.append(criar('li', null, '<s>' + escaparHtml(t) + '</s>')),
        );
        cartao.append(lista);
      }
      const previa = criar('div', 'prev');
      const tela = document.createElement('canvas');
      previa.append(tela);
      cartao.append(previa);
      desenharPrevia(bytes, tela).catch(() => {});

      const blob = new Blob([bytes], { type: 'application/pdf' });
      const nome = nomeSemData(arquivo.name);
      const acoes = criar('div', 'actions');
      const baixar = criar('button', 'pri', 'Baixar PDF sem data');
      baixar.type = 'button';
      baixar.addEventListener('click', () => entregarArquivo(blob, nome));
      acoes.append(baixar);
      // Fora do visualizador do Claude, também dá para abrir o PDF numa aba e imprimir direto.
      if (!estaDentroDeMoldura()) {
        const abrir = criar('a', 'btn ghost', 'Abrir para imprimir');
        abrir.href = URL.createObjectURL(blob);
        abrir.target = '_blank';
        abrir.rel = 'noopener';
        acoes.append(abrir);
      }
      cartao.append(acoes);
    } catch (erro) {
      selo.className = 'pill warn';
      selo.textContent = 'Erro';
      cartao.append(
        criar(
          'p',
          'err',
          'Não consegui ler este PDF. Confira se é a receita gerada pelo PEC (e não uma foto ou digitalização).',
        ),
      );
      console.error(erro);
    }
  }
}

function iniciarReceita() {
  montarCabecalho({ pagina: 'receita.html' });
  montarRodape();
  configurarLeitorPdf();
  const area = $('#drop');
  const entrada = $('#file');
  area.addEventListener('click', () => entrada.click());
  area.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      entrada.click();
    }
  });
  entrada.addEventListener('change', () => {
    tratarArquivos([...entrada.files]);
    entrada.value = '';
  });
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
  area.addEventListener('drop', e => tratarArquivos([...e.dataTransfer.files]));
  window.addEventListener('dragover', e => e.preventDefault());
  window.addEventListener('drop', e => e.preventDefault());
}

iniciarReceita();
