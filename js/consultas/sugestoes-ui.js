import { avisoRapido } from '../componentes/aviso.js';
import { irParaFerramenta } from './fluxo.js';
import { selecionarSugestoes } from './sugestoes.js';
import { TIPOS_DE_CONSULTA } from './tipos.js';

let prepararEnvio = null;
export function configurarEnvioCalculadoras(fn) { prepararEnvio = fn; }
const rotulos = Object.fromEntries(TIPOS_DE_CONSULTA.map(t => [t.id, t.rotulo]));
export function desenharSugestoes(tipos) {
  const sugestoes = selecionarSugestoes(tipos);
  const principais = document.getElementById('sugestoes-principais');
  const adicionais = document.getElementById('sugestoes-adicionais');
  principais.replaceChildren();
  adicionais.replaceChildren();
  document.getElementById('sugestoes-contagem').textContent = `${sugestoes.length} disponível(is)`;
  document.getElementById('sugestoes-vazio').hidden = !!sugestoes.length;
  document.getElementById('sugestoes-mais').hidden = sugestoes.length <= 3;
  document.getElementById('sugestoes-mais-titulo').textContent = `Ver mais ${Math.max(0, sugestoes.length - 3)} ferramenta(s)`;
  sugestoes.forEach((f, indice) => {
    const linha = document.createElement('div');
    linha.className = 'sugestao-item';
    const conteudo = document.createElement('div');
    const nome = document.createElement('strong');
    nome.textContent = f.nome;
    const descricao = document.createElement('p');
    descricao.textContent = f.detalhe;
    const categorias = document.createElement('small');
    categorias.textContent = f.categorias.map(c => rotulos[c]).join(' · ');
    conteudo.append(nome, descricao, categorias);
    const acao = document.createElement(f.naConsulta ? 'button' : 'a');
    acao.className = 'btn small';
    acao.setAttribute('aria-label', `${f.naConsulta ? 'Abrir na consulta' : 'Abrir em outra aba'}: ${f.nome}`);
    if (f.naConsulta) {
      acao.type = 'button';
      acao.textContent = 'Na consulta';
      acao.onclick = () => {
        if (!irParaFerramenta(f.local)) avisoRapido('Selecione novamente a categoria para abrir esta ferramenta.');
      };
    } else {
      acao.textContent = 'Outra aba ↗';
      acao.href = f.href;
      acao.target = '_blank';
      acao.rel = 'noopener';
      acao.addEventListener('click', e => {
        const url = prepararEnvio?.(f.href);
        if (!url) { e.preventDefault(); avisoRapido('Não foi possível preparar os dados. Tente novamente.'); }
        else acao.href = url;
      });
    }
    linha.append(conteudo, acao);
    (indice < 3 ? principais : adicionais).appendChild(linha);
  });
}
