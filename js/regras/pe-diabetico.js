/**
 * Pé diabético: categoria de risco pela avaliação de sensibilidade e pulsos (Ministério da Saúde, 2016).
 * Função pura.
 */
/**
 * @param {{d:object, e:object}} pes testes de cada pé: mono, diap, refl, dor ('n' normal | 'a' alterado), pulso ('n' presente | outro)
 * @param {object} historia ulcprev, amput, deform, ulcativa ('1' sim | '0' não | '')
 * @returns {{miss:true}|{cat:number, txt:string, fu:string, pspD:boolean, pspE:boolean, dap:boolean, ativa:boolean}}
 */
export function classificarPeDiabetico(pes, historia) {
  const completo = ['d', 'e'].every(lado => pes[lado].mono && pes[lado].pulso);
  if (!completo) return { miss: true };
  const perdaSensibilidade = lado =>
    pes[lado].mono === 'a' || ['diap', 'refl', 'dor'].filter(k => pes[lado][k] === 'a').length >= 2;
  const pspD = perdaSensibilidade('d'),
    pspE = perdaSensibilidade('e'),
    algumaPerda = pspD || pspE;
  const dap = ['d', 'e'].some(lado => pes[lado].pulso !== 'n');
  let cat, txt, fu;
  if (historia.ulcprev === '1' || historia.amput === '1') {
    cat = 3;
    txt = 'história de úlcera e/ou amputação';
    fu = 'a cada 1 a 2 meses, com acompanhamento na atenção básica ou especializada';
  } else if (dap) {
    cat = 2;
    txt = 'doença arterial periférica' + (algumaPerda ? ' com perda da sensibilidade protetora' : '');
    fu = 'a cada 2 a 3 meses, com encaminhamento à atenção especializada';
  } else if (algumaPerda) {
    cat = 1;
    txt = 'perda da sensibilidade protetora' + (historia.deform === '1' ? ' com deformidade' : '');
    fu = 'a cada 3 a 6 meses';
  } else {
    cat = 0;
    txt = 'sensibilidade protetora preservada e sem doença arterial periférica';
    fu = 'anual';
  }
  return { cat, txt, fu, pspD, pspE, dap, ativa: historia.ulcativa === '1' };
}
