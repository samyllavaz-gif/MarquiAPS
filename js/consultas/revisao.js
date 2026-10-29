/** Revisões manuais são válidas somente para a versão dos dados que foi revisada. */
export const BLOCOS_SOAP = ['S', 'O', 'A', 'P'];
export function resolverRevisao(gerado, revisoes = {}) {
  const texto = {};
  const desatualizados = [];
  for (const k of BLOCOS_SOAP) {
    const r = revisoes[k];
    const atual = gerado[k] || '';
    if (r && typeof r.texto === 'string' && r.origem === atual) texto[k] = r.texto;
    else {
      texto[k] = atual;
      if (r && typeof r.texto === 'string') desatualizados.push(k);
    }
  }
  return { texto, desatualizados };
}
export function registrarRevisao(gerado, editado) {
  const revisoes = {};
  for (const k of BLOCOS_SOAP) {
    const texto = String(editado[k] ?? gerado[k] ?? '').trim();
    if (texto !== (gerado[k] || '').trim()) revisoes[k] = { texto, origem: gerado[k] || '' };
  }
  return revisoes;
}
export const OBJETIVOS = {
  queixa: { rotulo: 'Queixa nova', ajuda: 'Comece pela história de hoje. Use o roteiro de queixas se precisar e complemente apenas o que não foi registrado.', campo: '#f-hda' },
  acompanhamento: { rotulo: 'Acompanhamento', ajuda: 'Comece pela evolução desde a última consulta. Revise os medicamentos e antecedentes já informados e registre o que mudou hoje.', campo: '#f-cont' },
  prevencao: { rotulo: 'Prevenção', ajuda: 'Registre a demanda da pessoa e escolha as categorias que vai abordar. Os rastreamentos e ações de prevenção ficam disponíveis nos respectivos roteiros.', campo: '#f-motivo' },
};
