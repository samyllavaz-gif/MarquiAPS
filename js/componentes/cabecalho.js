/**
 * Componente de cabeçalho e rodapé comuns a todas as páginas.
 * Os itens do menu e a lista de consultas vêm de js/config.js.
 * Na página inicial (index.html) os links são rotas internas (#inicio…);
 * nas demais páginas apontam para "./#rota".
 */
import { MENU, SITE } from '../config.js';
import { TIPOS_DE_CONSULTA } from '../consultas/tipos.js';

function escaparAtributo(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

/**
 * Preenche o <header data-componente="cabecalho"> da página.
 * @param {object} opcoes
 * @param {string} opcoes.pagina  'inicio' para index.html, senão o nome do arquivo atual (ex.: 'calculadoras.html')
 * @param {string} [opcoes.rotaAtiva] rota marcada como atual quando a página não é a inicial (ex.: 'requisicoes')
 */
export function montarCabecalho({ pagina, rotaAtiva = '' }) {
  const alvo = document.querySelector('[data-componente="cabecalho"]');
  if (!alvo) return;
  const naInicial = pagina === 'inicio';
  const prefixo = naInicial ? '#' : './#';
  const links = MENU.map(item => {
    if (item.rota) {
      const atual = !naInicial && item.rota === rotaAtiva ? ' aria-current="page"' : '';
      const rota = naInicial ? ` data-route="${item.rota}"` : '';
      return `      <a href="${prefixo}${item.rota}"${rota}${atual}>${escaparAtributo(item.rotulo)}</a>`;
    }
    const atual = item.pagina === pagina ? ' aria-current="page"' : '';
    return `      <a href="${item.pagina}"${atual}>${escaparAtributo(item.rotulo)}</a>`;
  }).join('\n');
  const classeSeletor = naInicial ? 'top-sel' : 'mq-sel';
  const rotuloSeletor = 'Abrir a consulta com um tipo marcado';
  const opcoes = TIPOS_DE_CONSULTA.map(
    t => `        <option value="${t.id}">${escaparAtributo(t.rotulo)}</option>`,
  ).join('\n');
  alvo.innerHTML = `
  <div class="mq-top-in">
    <a class="mq-brand" href="${prefixo}inicio"><img src="${SITE.logoIcone}" alt="" width="46" height="40"><span><b>${SITE.nome}</b><small>${SITE.subtitulo}</small></span></a>
    <nav class="mq-nav" aria-label="Seções">
${links}
      <select class="${classeSeletor}" id="nav-sel" aria-label="${rotuloSeletor}">
        <option value="">Abrir consulta com…</option>
${opcoes}
      </select>
    </nav>
  </div>`;
  const seletor = alvo.querySelector('#nav-sel');
  seletor.addEventListener('change', () => {
    if (!seletor.value) return;
    const destino = seletor.value;
    seletor.value = '';
    if (naInicial) location.hash = destino;
    else location.href = './#' + destino;
  });
}

/** Preenche o <footer data-componente="rodape"> da página. */
export function montarRodape() {
  const alvo = document.querySelector('[data-componente="rodape"]');
  if (!alvo) return;
  alvo.innerHTML = `<img src="${SITE.logoIcone}" alt="" width="56" height="49"><strong>${SITE.credito}</strong><span>${SITE.copyright}</span>`;
}
