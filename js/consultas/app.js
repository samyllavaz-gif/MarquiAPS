/**
 * Página inicial do Marqui APS (index.html): início e consulta única.
 * Rotas (endereço após #):
 *   #inicio (e as âncoras #consultas, #requisicoes, #sobre) → início
 *   #consulta → consulta com os tipos já marcados
 *   #queixas, #hiperdia, #mulher, #prenatal… → consulta, marcando esse tipo
 *   #padrao (endereço antigo) → consulta com "Queixas do dia"
 */
import { montarCabecalho, montarRodape } from '../componentes/cabecalho.js';
import { $, $$ } from '../utils/dom.js';
import { abrirConsulta, marcarTipo, salvarConsulta } from './consulta.js';
import { ROTAS_ANTIGAS, tipoExiste } from './tipos.js';

const ANCORAS_DO_INICIO = ['consultas', 'sobre', 'requisicoes'];

function rota() {
  const pedido = (location.hash || '#inicio').slice(1);
  const tipo = ROTAS_ANTIGAS[pedido] || (tipoExiste(pedido) ? pedido : null);
  const naConsulta = pedido === 'consulta' || pedido === 'saida' || !!tipo;
  const ancora = ANCORAS_DO_INICIO.includes(pedido) ? pedido : null;

  $('#v-inicio').hidden = naConsulta;
  $('#v-consulta').hidden = !naConsulta;
  $('#mbar').hidden = !naConsulta;
  $$('.mq-nav a[data-route]').forEach(a => {
    const atual = ancora ? a.dataset.route === ancora : !naConsulta && a.dataset.route === 'inicio';
    if (atual) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });

  if (!naConsulta) {
    salvarConsulta();
    if (ancora)
      setTimeout(() => {
        const el = document.getElementById(ancora);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 30);
    else window.scrollTo({ top: 0 });
    return;
  }

  abrirConsulta();
  if (tipo) {
    marcarTipo(tipo);
    history.replaceState(null, '', '#consulta');
  }
  if (pedido === 'saida') setTimeout(() => $('#saida').scrollIntoView(), 0);
  else window.scrollTo({ top: 0 });
}

window.addEventListener('hashchange', rota);
$('#mbar-go').onclick = () => {
  const pendentes = $('#resultados-pendentes');
  (pendentes.hidden ? $('#saida') : pendentes).scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// O formulário nunca é enviado (nada sai do navegador): Enter não recarrega a página.
$('#form').addEventListener('submit', e => e.preventDefault());

montarCabecalho({ pagina: 'inicio' });
montarRodape();
rota();
