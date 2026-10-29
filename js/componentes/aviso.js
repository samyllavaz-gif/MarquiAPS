/**
 * Avisos breves (toasts) exibidos na parte de baixo da tela.
 * - avisar(): balão da identidade Marqui, reutilizado (classe .mq-toast)
 * - avisoRapido(): balão das telas de consulta (classe .toast), some em 1,8 s
 */
export function avisar(mensagem, duracaoMs) {
  try {
    let balao = document.querySelector('.mq-toast');
    if (!balao) {
      balao = document.createElement('div');
      balao.className = 'mq-toast';
      balao.setAttribute('role', 'status');
      balao.setAttribute('aria-live', 'polite');
      document.body.appendChild(balao);
    }
    balao.textContent = String(mensagem);
    balao.hidden = false;
    clearTimeout(balao._temporizador);
    balao._temporizador = setTimeout(() => {
      balao.hidden = true;
    }, duracaoMs || 3200);
  } catch (erro) {
    /* o aviso é apenas informativo */
  }
}

export function avisoRapido(mensagem) {
  const balao = document.createElement('div');
  balao.className = 'toast';
  balao.textContent = mensagem;
  document.body.appendChild(balao);
  setTimeout(() => balao.remove(), 1800);
}
