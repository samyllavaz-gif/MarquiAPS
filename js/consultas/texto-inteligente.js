/** Elimina apenas linhas equivalentes completas, sem interpretar o conteúdo clínico. */
const chave = texto => texto.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');
export function unirTextoSOAP(...blocos) {
  const vistas = new Set();
  return blocos.filter(Boolean).flatMap(b => b.split('\n')).filter(linha => {
    const k = chave(linha);
    if (!k) return false;
    // Itens de listas e prescrições mantêm sua posição e contexto.
    if (/:$/.test(linha.trim()) || /^(?:\d+[.)]|[-→])\s/.test(linha.trim())) return true;
    if (vistas.has(k)) return false;
    vistas.add(k);
    return true;
  }).join('\n');
}
export function inserirTrechoUnico(atual, trecho) {
  const linhas = new Set(atual.split('\n').map(chave));
  if (linhas.has(chave(trecho))) return atual;
  return [atual.trim(), trecho].filter(Boolean).join('\n');
}

/** Só considera o mesmo relato quando o texto inteiro coincide (sem inferência clínica). */
export function mesmoRelato(a, b) {
  const normalizar = t => chave(t).replace(/[.!?]+$/, '');
  return !!normalizar(a) && normalizar(a) === normalizar(b);
}
