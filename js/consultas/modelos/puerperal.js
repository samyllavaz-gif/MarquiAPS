/**
 * Modelo de consulta: Consulta puerperal.
 * Seções S, O, A e P montadas com os construtores de ../motor/campos.js.
 * Para mudar perguntas, opções ou frases desta consulta, edite este arquivo.
 */
import { A, ALERG, CALC, CH, CK, EX, G, SC_PHQ2, SEG, stdA, stdP, SV, T, TRI } from '../motor/campos.js';

export const MODELO_PUERPERAL = {
  eye: 'Retorno puerperal · Z39.2',
  title: 'Consulta puerperal',
  sub: 'Parto, recém-nascido, amamentação, contracepção e exame ginecológico.',
  secs: [
    {
      k: 'S',
      title: 'Subjetivo',
      sub: 'Parto, recém-nascido e queixas',
      f: [
        G('Parto', [
          SEG('via', 'Via de parto', ['Vaginal', 'Cesárea', 'Fórceps']),
          T('dataparto', 'Data do parto', { ph: 'dd/mm/aaaa', w: '190px', out: 'Data do parto' }),
          CALC('puerp'),
          T('local', 'Local do parto', { ph: 'Hospital / cidade' }),
          A('int_parto', 'Intercorrências no parto', { ph: 'Nega' }),
          A('int_pn', 'Intercorrências no pré-natal', { ph: 'Nega' }),
          A('int_puerp', 'Intercorrências puerperais', { ph: 'Nega' }),
        ]),
        G('Recém-nascido', [
          SEG('rn_sexo', 'RN do sexo', ['Feminino', 'Masculino']),
          T('rn_peso', 'Peso ao nascimento (g)', { ph: '3250', w: '190px', out: 'Peso ao nascimento', unit: ' g' }),
          T('rn_comorb', 'Comorbidades do RN', { ph: 'Não' }),
          SEG('am_exc', 'Amamentação exclusiva', ['Sim', 'Não']),
          SEG('am_dif', 'Dificuldade de amamentação', ['Não', 'Sim']),
          T('am_dif_txt', 'Qual dificuldade', { ph: 'pega, dor, fissura, baixa produção' }),
        ]),
        G('Contracepção', [
          SEG('contra', 'Desejo de contracepção', ['Sim', 'Não', 'Em dúvida']),
          CH(
            'contra_met',
            'Método de interesse',
            [
              'Progesterona isolada (desogestrel)',
              'DIU de cobre',
              'Implante subdérmico',
              'Injetável trimestral',
              'Laqueadura',
              'Preservativo',
            ],
            { note: 'Em amamentação: preferir progesterona isolada ou DIU.' },
          ),
          { t: 'link', href: 'contracepcao.html', l: 'Abrir Contracepção · EscolhaSegura APS →' },
          { t: 'link', href: 'implante.html', l: 'Abrir roteiro de inserção do implante →' },
        ]),
        TRI(
          'alarme',
          'Sinais de alarme',
          [
            'Sangramento vaginal intenso',
            'Febre ≥ 38 °C',
            'Lóquios com odor fétido',
            'Dor abdominal intensa',
            'Cefaleia intensa ou alteração visual',
            'Dor ou inchaço unilateral na perna',
            'Falta de ar',
            'Mama vermelha, quente e dolorosa',
            'Pensamentos de fazer mal a si ou ao bebê',
          ],
          { alarm: true },
        ),
        TRI('queixas', 'Queixas', [
          'Dor na ferida operatória ou no períneo',
          'Sangramento',
          'Dor mamária ou ingurgitamento',
          'Fissura mamilar',
          'Disúria',
          'Constipação',
          'Perda de urina',
          'Cefaleia',
          'Tristeza ou choro fácil',
          'Ansiedade',
          'Cansaço excessivo',
          'Dificuldade para dormir além do esperado',
        ]),
        A('queixas_txt', 'Outras queixas', { out: 'Outras queixas' }),
        G('Saúde emocional', [SC_PHQ2]),
        A('meds', 'Medicações em uso', { ph: 'Sulfato ferroso 40 mg 1 cp/dia' }),
        ...ALERG,
      ],
    },
    {
      k: 'O',
      title: 'Objetivo',
      sub: 'Sinais vitais e exame físico',
      f: [
        SV(),
        EX('exame', 'Exame físico', {
          Geral: 'BEG, corada, hidratada, acianótica, anictérica, afebril, orientada.',
          Mamas: 'Mamas: médio volume, simétricas, sem fissuras ou sinais flogísticos.',
          Abdome: 'Abdome: flácido, indolor à palpação, DB negativo, Giordano negativo. Útero intrapélvico.',
          'Ferida operatória': 'Ferida operatória: seca, limpa, sem sinais flogísticos ou deiscências.',
          MMII: 'MMII: sem edemas ou sinais de TVP.',
          OGE: 'OGE: sem alterações. Pilificação e higiene adequadas.',
          Especular:
            'Especular: vagina trófica, conteúdo claro sem odor (KOH ausente nesta unidade), colo com orifício em fenda, JEC 0, não friável.',
          'Toque vaginal': 'Toque vaginal: colo fibroelástico, indolor à mobilização, útero e anexos não palpáveis.',
        }),
      ],
    },
    stdA([], ['Puerpério fisiológico (Z39.2).']),
    stdP([
      CK('orient_pu', 'Orientações', [
        'Orientações gerais.',
        'Oriento sinais de alerta.',
        'Oriento amamentação exclusiva até o sexto mês de vida (ou conforme orientação pediátrica).',
        'Oriento possibilidades de contracepção.',
        'Oriento uso de preservativo.',
      ]),
      T('contra_sol', 'Contracepção solicitada / prescrita', { ph: 'Ex.: DIU de cobre – solicitada inserção' }),
    ]),
  ],
};
