/**
 * Motor de modelos dentro da consulta única: abre os módulos marcados (modelos/*.js já
 * preparados por ../modulos.js) e cuida do botão "Copiar resumo" da reumatologia.
 * Salvar, limpar e copiar o SOAP ficam com js/consultas/consulta.js.
 */
import { avisoRapido } from '../../componentes/aviso.js';
import { copiarTexto } from '../../utils/area-transferencia.js';
import { estado, reiniciarConsulta, st } from './estado.js';
import { render } from './render.js';

/**
 * Desenha os módulos e carrega os valores.
 * @param {{ secs: Array, _k: object }} definicao definição montada por montarConsulta()
 * @param {object} valores valores salvos dos campos dos módulos
 * @param {object} rotulos nome de cada módulo (ex.: { mulher: 'Saúde da mulher' })
 */
export function abrirModulos(definicao, valores = {}, rotulos = {}) {
  estado.modelo = definicao;
  estado.rotulos = rotulos;
  reiniciarConsulta(valores);
  render();
}

document.addEventListener('click', async e => {
  if (!e.target.closest('[data-copyreg]')) return;
  const ok = await copiarTexto(st._reg || '');
  avisoRapido(ok ? 'Resumo copiado' : 'Não foi possível copiar; selecione o texto');
});
