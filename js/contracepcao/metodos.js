/**
 * Métodos contraceptivos disponíveis na rede municipal (EscolhaSegura APS).
 * Para incluir, retirar ou mudar o acesso de um método, edite esta lista.
 * disponibilidade: "ubs" (direto na unidade) ou "encaminhamento".
 */
export const METODOS_SUS = [
  {
    id: 'preservativo',
    nome: 'Preservativo masculino',
    apresentacao: 'Preservativo masculino',
    tipo: 'Barreira',
    acesso: 'Disponível na UBS / livre demanda',
    obs: 'Ofertar para todos, especialmente para prevenção de IST. Pode ser associado a qualquer outro método.',
    disponibilidade: 'ubs',
  },
  {
    id: 'levonorgestrel',
    nome: 'Levonorgestrel 0,75 mg',
    apresentacao: 'Levonorgestrel 0,75 mg',
    tipo: 'Contracepção de emergência',
    acesso: 'Disponível na UBS / farmácia, conforme fluxo local',
    obs: 'Usar após relação desprotegida ou falha do método. Não é método de rotina.',
    disponibilidade: 'ubs',
  },
  {
    id: 'aco',
    nome: 'Etinilestradiol + levonorgestrel',
    apresentacao: '0,03 mg + 0,15 mg, cartela com 21 comprimidos',
    tipo: 'Hormonal combinado com estrogênio',
    acesso: 'Disponível na UBS / farmácia',
    obs: 'Exige triagem de contraindicações ao estrogênio.',
    disponibilidade: 'ubs',
  },
  {
    id: 'pop',
    nome: 'Noretisterona 0,35 mg',
    apresentacao: 'Comprimidos',
    tipo: 'Progestagênio isolado',
    acesso: 'Disponível na UBS / farmácia',
    obs: 'Boa opção quando não pode usar estrogênio. Orientar tomada no mesmo horário.',
    disponibilidade: 'ubs',
  },
  {
    id: 'mensal',
    nome: 'Noretisterona enantato + estradiol valerato',
    apresentacao: '50 mg + 5 mg/mL, ampola 1 mL',
    tipo: 'Injetável mensal combinado com estrogênio',
    acesso: 'Disponível na UBS / sala de medicação',
    obs: 'Exige triagem de contraindicações ao estrogênio. Aplicação mensal.',
    disponibilidade: 'ubs',
  },
  {
    id: 'trimestral',
    nome: 'Medroxiprogesterona acetato',
    apresentacao: '150 mg/mL, ampola 1 mL',
    tipo: 'Injetável trimestral, progestagênio isolado',
    acesso: 'Disponível na UBS / sala de medicação',
    obs: 'Aplicação a cada 3 meses. Orientar sangramento irregular, amenorreia e possível atraso no retorno da fertilidade.',
    disponibilidade: 'ubs',
  },
  {
    id: 'diu',
    nome: 'DIU de cobre',
    apresentacao: 'DIU cobre',
    tipo: 'Longa duração, não hormonal',
    acesso: 'Encaminhar para GO',
    obs: 'Checar gravidez, sangramento anormal, IST/DIP atual e dor pélvica antes do encaminhamento.',
    disponibilidade: 'encaminhamento',
  },
  {
    id: 'implanon',
    nome: 'Implanon',
    apresentacao: 'Implante subdérmico de etonogestrel',
    tipo: 'Longa duração, progestagênio isolado',
    acesso: 'Precisa encaminhar',
    obs: 'Aplicar critérios de prioridade municipal, se houver. Orientar sangramento irregular/amenorreia.',
    disponibilidade: 'encaminhamento',
  },
];
