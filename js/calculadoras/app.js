/**
 * Calculadoras APS — monta o menu lateral e os módulos (um arquivo por área em ./modulos).
 * Para incluir um módulo novo: crie o arquivo em ./modulos e acrescente-o em MODULOS_CALCULADORA.
 * O endereço calculadoras.html#<id> abre direto no módulo (ex.: #dose).
 */
import { iniciarIntegracaoConsulta } from './consulta-integracao.js';
import { montarCabecalho, montarRodape } from '../componentes/cabecalho.js';
import { moduloAnticoagulacao } from './modulos/anticoagulacao.js';
import { moduloCardiovascular } from './modulos/cardiovascular.js';
import { moduloDiabetes } from './modulos/diabetes.js';
import { moduloDor } from './modulos/dor.js';
import { moduloDosePediatrica } from './modulos/dose-pediatrica.js';
import { moduloHipertensao } from './modulos/hipertensao.js';
import { moduloIdoso } from './modulos/idoso.js';
import { moduloPediatria } from './modulos/pediatria.js';
import { moduloPreNatal } from './modulos/pre-natal.js';
import { moduloRenal } from './modulos/renal.js';
import { moduloRespiratorio } from './modulos/respiratorio.js';
import { moduloSaudeMental } from './modulos/saude-mental.js';
import { criarElemento } from './ui.js';

const MODULOS_CALCULADORA = [
  moduloHipertensao,
  moduloDiabetes,
  moduloCardiovascular,
  moduloRenal,
  moduloIdoso,
  moduloSaudeMental,
  moduloRespiratorio,
  moduloPreNatal,
  moduloAnticoagulacao,
  moduloDor,
  moduloPediatria,
  moduloDosePediatrica,
];

function montarCalculadoras() {
  const menu = document.getElementById('navlist');
  const area = document.getElementById('main');
  MODULOS_CALCULADORA.forEach((modulo, i) => {
    const botao = criarElemento('button', { class: 'navbtn' + (i === 0 ? ' active' : ''), id: 'nav-' + modulo.id });
    botao.appendChild(criarElemento('span', { class: 'n' }, [document.createTextNode(modulo.numero)]));
    botao.appendChild(document.createTextNode(modulo.rotulo));
    botao.addEventListener('click', () => mostrarModulo(modulo.id));
    menu.appendChild(botao);
    const secao = criarElemento('div', { class: 'module' + (i === 0 ? ' active' : ''), id: 'mod-' + modulo.id });
    area.appendChild(secao);
    modulo.montar(secao);
  });
}

function mostrarModulo(id) {
  MODULOS_CALCULADORA.forEach(modulo => {
    document.getElementById('mod-' + modulo.id).classList.toggle('active', modulo.id === id);
    document.getElementById('nav-' + modulo.id).classList.toggle('active', modulo.id === id);
  });
  window.scrollTo(0, 0);
}

function abrirModuloDoEndereco() {
  const [id, resultado] = (location.hash || '').slice(1).split('?')[0].split('/');
  const modulo = MODULOS_CALCULADORA.find(m => m.id === id);
  if (!modulo) return;
  mostrarModulo(id);
  if (!resultado) return;
  const alvo = document.getElementById(resultado);
  const secao = document.getElementById('mod-' + id);
  if (!alvo || !secao.contains(alvo)) return;
  const cartao = alvo.closest('.card');
  if (cartao) {
    const destino = location.hash.includes('?consulta=') ? document.querySelector('.consulta-conexao') || cartao : cartao;
    destino.scrollIntoView({ block: 'start' });
    const titulo = destino.querySelector('h3');
    if (titulo) {
      titulo.tabIndex = -1;
      titulo.focus({ preventScroll: true });
    }
  }
}

function iniciarCalculadoras() {
  montarCabecalho({ pagina: 'calculadoras.html' });
  montarRodape();
  montarCalculadoras();
  iniciarIntegracaoConsulta();
  abrirModuloDoEndereco();
  window.addEventListener('hashchange', abrirModuloDoEndereco);
}

iniciarCalculadoras();
