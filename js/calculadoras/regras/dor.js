/**
 * Regras da calculadora de dor: sinais de alarme (red flags) da lombalgia. Função pura.
 */
/** quantidade = red flags marcadas; emergencia = sinal de emergência presente (ex.: cauda equina). */
export function avaliarRedFlags(quantidade, emergencia) {
  if (emergencia) return { rotulo: 'Red flag de emergência — encaminhamento imediato.', cls: 'risk-vhigh' };
  if (quantidade > 0) return { rotulo: `${quantidade} red flag(s) presente(s) — investigar.`, cls: 'risk-high' };
  return { rotulo: 'Sem red flags.', cls: 'risk-low' };
}
