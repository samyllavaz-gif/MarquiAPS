/**
 * Acesso seguro ao armazenamento local do navegador (localStorage).
 * Em janelas privadas ou com o armazenamento bloqueado, as funções
 * não geram erro: a leitura devolve o valor padrão e a gravação devolve false.
 * Os dados ficam somente neste navegador e não são transmitidos.
 */
export function lerArmazenado(chave, padrao = null) {
  try {
    const bruto = localStorage.getItem(chave);
    if (bruto == null) return padrao;
    const valor = JSON.parse(bruto);
    return valor == null ? padrao : valor;
  } catch (erro) {
    return padrao;
  }
}

export function gravarArmazenado(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
    return true;
  } catch (erro) {
    return false;
  }
}
