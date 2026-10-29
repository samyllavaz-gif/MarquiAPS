import { avisoRapido } from '../componentes/aviso.js';
import { BLOCOS_SOAP, OBJETIVOS, registrarRevisao } from './revisao.js';
import { irParaFerramenta } from './fluxo.js';

export function iniciarRevisao({ ler, aplicar, descartar, escolherObjetivo }) {
  const dialogo = document.getElementById('dialogo-revisao');
  let fonteAberta;
  const abrir = () => {
    const { gerado, revisoes } = ler();
    fonteAberta = { ...gerado };
    BLOCOS_SOAP.forEach(k => {
      const anterior = revisoes[k];
      document.getElementById('revisar-' + k).value = anterior?.texto ?? gerado[k] ?? '';
      document.getElementById('fonte-' + k).textContent = gerado[k] || 'Sem registro neste bloco.';
      document.getElementById('revisao-divergente-' + k).hidden = !anterior || anterior.origem === gerado[k];
    });
    dialogo.showModal();
  };
  document.querySelectorAll('[data-revisar-soap]').forEach(b => b.addEventListener('click', abrir));
  document.getElementById('fechar-revisao').onclick = () => dialogo.close();
  document.getElementById('aplicar-revisao').onclick = () => {
    const atual = ler().gerado;
    if (BLOCOS_SOAP.some(k => atual[k] !== fonteAberta[k])) {
      avisoRapido('Os dados mudaram. Feche e abra a revisão novamente.');
      return;
    }
    const editado = Object.fromEntries(BLOCOS_SOAP.map(k => [k, document.getElementById('revisar-' + k).value]));
    aplicar(registrarRevisao(fonteAberta, editado));
    dialogo.close();
    avisoRapido('Texto revisado aplicado. Você já pode copiar o SOAP.');
  };
  document.getElementById('descartar-revisao').onclick = () => {
    descartar();
    dialogo.close();
    avisoRapido('Texto automático restaurado a partir dos campos da consulta.');
  };
  document.querySelectorAll('[data-objetivo]').forEach(b => b.addEventListener('click', () => escolherObjetivo(b.dataset.objetivo)));
  document.getElementById('comecar-objetivo').onclick = () => {
    const objetivo = document.getElementById('objetivos-consulta').dataset.atual;
    if (OBJETIVOS[objetivo]) irParaFerramenta(OBJETIVOS[objetivo].campo);
  };
}
export function mostrarObjetivo(objetivo) {
  const def = OBJETIVOS[objetivo];
  const historia = document.getElementById('f-hda').closest('.field');
  const evolucao = document.getElementById('f-cont').closest('.field');
  if (objetivo === 'acompanhamento') historia.parentElement.insertBefore(evolucao, historia);
  else evolucao.parentElement.insertBefore(historia, evolucao);
  document.getElementById('objetivos-consulta').dataset.atual = def ? objetivo : '';
  document.querySelectorAll('[data-objetivo]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.objetivo === objetivo)));
  document.getElementById('objetivo-ajuda').textContent = def?.ajuda || 'Escolha um ponto de partida. Você pode combinar categorias e mudar o objetivo sem apagar os registros.';
  document.getElementById('comecar-objetivo').hidden = !def;
}
