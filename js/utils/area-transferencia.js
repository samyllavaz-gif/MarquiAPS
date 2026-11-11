/**
 * Cópia de texto para a área de transferência, com alternativa para
 * navegadores ou contextos (iframes) em que a API moderna é bloqueada.
 */
import { avisar } from '../componentes/aviso.js';

/** Copia pelo método antigo (textarea + execCommand). Retorna true se deu certo. */
function copiarPorSelecao(texto) {
  const campo = document.createElement('textarea');
  campo.value = texto;
  campo.style.position = 'fixed';
  campo.style.opacity = '0';
  document.body.appendChild(campo);
  campo.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch (erro) {
    ok = false;
  }
  campo.remove();
  return ok;
}

/**
 * Copia o texto. Resolve true quando a cópia foi feita.
 * @param {string} texto
 * @param {{seguro?: boolean}} [opcoes] seguro=true exige contexto seguro para usar a API moderna
 */
export async function copiarTexto(texto, { seguro = false } = {}) {
  const apiDisponivel = navigator.clipboard && navigator.clipboard.writeText && (!seguro || window.isSecureContext);
  if (apiDisponivel) {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch (erro) {
      /* tenta a alternativa */
    }
  }
  return copiarPorSelecao(texto);
}

/** Atalho usado pelas páginas de sistemas: copia e mostra o aviso Marqui. */
export async function copiarComAviso(texto) {
  const ok = await copiarTexto(texto, { seguro: true });
  avisar(ok ? 'Texto copiado.' : 'Não foi possível copiar: selecione e copie manualmente.');
  return ok;
}
