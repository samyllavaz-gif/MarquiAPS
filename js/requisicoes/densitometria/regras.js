/**
 * Regras do pedido de densitometria (BPA-I + pedido de exame do HC):
 * sugestões de hipótese/CID, fatores de risco, resumo clínico e campos obrigatórios.
 * Funções puras, sem acesso à página.
 */
/** Hipóteses diagnósticas sugeridas e seus CID-10. */
export const HIPOTESES_DENSITOMETRIA = [
  ['Osteoporose pós-menopáusica', 'M81.0'],
  ['Osteoporose não especificada', 'M81.9'],
  ['Osteopenia', 'M85.8'],
  ['Osteoporose pós-menopáusica com fratura patológica', 'M80.0'],
  ['Rastreamento de osteoporose', 'Z13.8'],
  ['Menopausa e climatério', 'N95.1'],
];

/** Fatores de risco e indicações que entram no início do resumo clínico (na ordem exibida). */
export const FATORES_RISCO_DENSITOMETRIA = [
  'Mulher com 65 anos ou mais',
  'Homem com 70 anos ou mais',
  'Pós-menopausa com fator de risco',
  'Menopausa precoce (antes dos 45 anos)',
  'Fratura por fragilidade prévia',
  'Uso de corticoide por 3 meses ou mais',
  'Baixo peso (IMC abaixo de 21)',
  'História familiar de fratura de quadril',
  'Tabagismo',
  'Etilismo',
  'Artrite reumatoide',
  'Hipogonadismo',
  'Hiperparatireoidismo',
  'Controle de tratamento de osteoporose',
];

/** CID sugerido para a hipótese digitada (ou ''). */
export function cidDaHipotese(hipotese) {
  const h = HIPOTESES_DENSITOMETRIA.find(item => item[0].toLowerCase() === hipotese.toLowerCase());
  return h ? h[1] : '';
}

/** Hipótese sugerida para o CID digitado (ou ''). */
export function hipoteseDoCid(cid) {
  const h = HIPOTESES_DENSITOMETRIA.find(item => item[1] === cid.toLocaleUpperCase('pt-BR'));
  return h ? h[0] : '';
}

/** Marcação automática dos dois primeiros fatores (idade e sexo). */
export function fatoresPorIdadeESexo(idadeTexto, feminino, masculino) {
  const idade = +idadeTexto,
    informada = idadeTexto !== '';
  return { mulher65: informada && feminino && idade >= 65, homem70: informada && masculino && idade >= 70 };
}

/** Resumo clínico final: fatores marcados + texto livre. */
export function resumoClinicoDensitometria(indicesMarcados, textoLivre) {
  const fatores = indicesMarcados.map(i => FATORES_RISCO_DENSITOMETRIA[i].toLowerCase());
  const prefixo = fatores.length ? 'Fatores de risco/indicação: ' + fatores.join('; ') + '.' : '';
  return [prefixo, textoLivre].filter(Boolean).join(' ');
}

/** 12345678901 → 123.456.789-01 */
export function formatarCpf(texto) {
  return texto.length === 11
    ? `${texto.slice(0, 3)}.${texto.slice(3, 6)}.${texto.slice(6, 9)}-${texto.slice(9)}`
    : texto;
}

/**
 * Campos obrigatórios em branco.
 * @param {object} d { v, on, nasc, dat, dlaudo } — valores das folhas, caixas marcadas e datas (aaaa-mm-dd)
 */
export function pendenciasDensitometria(d) {
  const { v, on } = d,
    m = [];
  if (!v.nome) m.push('Nome');
  if (v.cpf.length !== 11) m.push('CPF da paciente (11 dígitos)');
  if (!d.nasc) m.push('Data de nascimento');
  if (!on.sexF && !on.sexM) m.push('Sexo');
  if (!v.mae) m.push('Nome da mãe');
  if (!v.endereco) m.push('Endereço');
  if (!v.municipio) m.push('Município');
  if (!d.dat) m.push('Data de atendimento');
  if (!on.pDens && !on.pBio) m.push('Procedimento');
  if (!v.hipotese) m.push('Hipótese diagnóstica');
  if (!v.cid) m.push('CID-10');
  if (!v.medico) m.push('Nome do médico');
  if (v.cpfmed.length !== 11) m.push('CPF do médico (11 dígitos)');
  if (!d.dlaudo) m.push('Data do laudo');
  return m;
}
