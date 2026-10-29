/**
 * Modelo de consulta: Ortopedia.
 * Seções S, O, A e P montadas com os construtores de ../motor/campos.js.
 * Para mudar perguntas, opções ou frases desta consulta, edite este arquivo.
 */
import { A, ALERG, CH, CK, G, SEG, stdP, SV, T, TRI } from '../motor/campos.js';

export const MODELO_ORTOPEDIA = {
  eye: 'Consulta musculoesquelética guiada',
  title: 'Ortopedia',
  sub: 'A clínica seleciona as manobras, os achados orientam o próximo passo e você valida a conclusão.',
  secs: [
    {
      k: 'S',
      title: 'Subjetivo',
      sub: 'Região, história e segurança',
      f: [
        TRI(
          'seguranca',
          'Segurança antes das manobras',
          [
            'Trauma com deformidade ou suspeita de fratura/luxação',
            'Membro frio ou pálido, pulso reduzido ou déficit neurológico novo',
            'Dor desproporcional, edema tenso e dor ao alongamento passivo',
            'Articulação quente e inchada com dor intensa, especialmente com febre',
            'Retenção urinária nova, anestesia perineal ou fraqueza progressiva',
            'Dor com sintomas sistêmicos ou antecedente de câncer',
            'Dor torácica, dispneia ou sintomas abdominais associados',
          ],
          {
            alarm: true,
            act: {
              'Trauma com deformidade ou suspeita de fratura/luxação':
                'Priorizar avaliação neurovascular, proteger o membro e seguir o fluxo de trauma. Manobras de estresse ficam suspensas.',
              'Membro frio ou pálido, pulso reduzido ou déficit neurológico novo': 'Avaliação urgente.',
              'Dor desproporcional, edema tenso e dor ao alongamento passivo':
                'Possível síndrome compartimental: avaliação de urgência.',
              'Articulação quente e inchada com dor intensa, especialmente com febre':
                'Considerar infecção (artrite séptica) e priorizar avaliação urgente.',
              'Retenção urinária nova, anestesia perineal ou fraqueza progressiva':
                'Possível compressão neurológica grave (síndrome da cauda equina ou mielopatia): urgência.',
              'Dor com sintomas sistêmicos ou antecedente de câncer':
                'Ampliar a investigação; não atribuir automaticamente a causa mecânica.',
              'Dor torácica, dispneia ou sintomas abdominais associados':
                'Considerar dor referida e causas fora do aparelho musculoesquelético.',
            },
          },
        ),
        { t: 'orthoS', id: 'orts' },
        T('inicio', 'Início, duração, evolução e intensidade (0 a 10)', { out: 'Início e evolução' }),
        G(
          'Trauma',
          [
            T('mec', 'Mecanismo, momento e posição do membro'),
            SEG('estalo', 'Estalo', ['Sim', 'Não']),
            SEG('cont', 'Conseguiu continuar a atividade', ['Sim', 'Não']),
            T('edema_t', 'Tempo até o edema aparecer', { ph: 'imediato / em horas' }),
          ],
          { ask: 'Houve trauma?', neg: 'Nega trauma' },
        ),
        CH('relacao', 'Dor relacionada a', ['Movimento', 'Carga', 'Repouso', 'Período noturno']),
        TRI('sinais', 'Sinais locais', [
          'Inchaço',
          'Calor',
          'Vermelhidão',
          'Rigidez matinal',
          'Travamento',
          'Falseio',
          'Sensação de deslocamento',
          'Perda de força',
        ]),
        G('Formigamento / dormência', [T('parest', 'Distribuição (dedos, dermátomo, face do membro)')], {
          ask: 'Formigamento ou dormência?',
          neg: 'Nega parestesias',
        }),
        CH('limit', 'Limitação para', [
          'Caminhar',
          'Apoiar',
          'Elevar o braço',
          'Segurar objetos',
          'Trabalhar',
          'Dormir',
        ]),
        T('previos', 'Episódios anteriores, cirurgias, tratamentos e resposta'),
        T('ocup', 'Trabalho, esporte, movimentos repetitivos, mudança recente de carga'),
        CH('comorb', 'Condições relevantes', [
          'Anticoagulação',
          'Uso de corticoide',
          'Antecedente de câncer',
          'Osteoporose',
          'Diabetes',
          'Doença reumatológica',
        ]),
        A('meds', 'Medicamentos em uso'),
        ...ALERG,
      ],
    },
    {
      k: 'O',
      title: 'Objetivo',
      sub: 'Exame básico da região e manobras sugeridas',
      f: [SV(), { t: 'orthoO', id: 'orto' }],
    },
    {
      k: 'A',
      title: 'Avaliação',
      sub: 'Síntese, hipóteses e incertezas',
      f: [
        T('achados', 'Síntese dos achados'),
        T('hip', 'Hipóteses e diagnósticos diferenciais'),
        SEG('incert', 'Grau de incerteza', ['Alto', 'Moderado', 'Baixo']),
        A('aval', 'Avaliação clínica', { out: 'Avaliação' }),
        T('hd', 'Hipótese diagnóstica / CID-10 ou CIAP-2', { out: 'Hipótese diagnóstica' }),
      ],
    },
    stdP([
      SEG('enc_tipo', 'Encaminhamento', [
        'Ortopedia – prioritário',
        'Ortopedia – eletivo',
        'Fisioterapia',
        'Urgência / pronto-socorro',
        'Não necessário no momento',
      ]),
      T('prior', 'Justificativa da prioridade'),
      T('reab', 'Reabilitação e exercícios'),
      CK('orient_or', 'Orientações', [
        'Oriento repouso relativo e retorno gradual às atividades.',
        'Oriento gelo nas primeiras 48 a 72 horas após trauma agudo.',
        'Oriento exercícios domiciliares conforme orientado.',
        'Oriento sinais de alarme: piora importante da dor, deformidade, membro frio ou pálido, perda de força ou de sensibilidade, febre; procurar atendimento imediato.',
        'Oriento uso correto da analgesia e riscos dos anti-inflamatórios.',
      ]),
    ]),
  ],
};
