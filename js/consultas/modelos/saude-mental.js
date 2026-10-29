/**
 * Modelo de consulta: Saúde mental.
 * Seções S, O, A e P montadas com os construtores de ../motor/campos.js.
 * Para mudar perguntas, opções ou frases desta consulta, edite este arquivo.
 */
import { A, ALERG, CH, CK, G, GRID, SC_AUD, SC_GAD7, SC_PHQ9, SEG, stdP, SV, T, TRI } from '../motor/campos.js';

export const MODELO_SAUDE_MENTAL = {
  eye: 'Consulta de saúde mental',
  title: 'Saúde mental',
  sub: 'Acolhimento e segurança primeiro. O exame do estado mental é preenchido pela sua observação.',
  secs: [
    {
      k: 'S',
      title: 'Subjetivo',
      sub: 'Acolhimento, quadro atual, sintomas e história',
      f: [
        G('Acolhimento', [
          A('qp', 'Queixa principal, nas palavras da pessoa', { out: 'Queixa principal' }),
          T('expect', 'O que espera da consulta'),
          SEG('comp', 'Comparece', ['Sozinho(a)', 'Acompanhado(a)']),
          T('acomp', 'Acompanhante e vínculo'),
          CH('fonte', 'Fonte das informações', ['Própria pessoa', 'Acompanhante', 'Documentos']),
          SEG('indiv', 'Conversou individualmente', ['Sim', 'Não', 'Não necessário']),
          T('comunic', 'Dificuldades de comunicação, audição ou idioma'),
        ]),
        TRI(
          'alertas',
          'Alertas iniciais',
          [
            'Tentativa recente de suicídio',
            'Intenção suicida atual',
            'Agitação grave',
            'Ameaça concreta a terceiros',
            'Intoxicação ou abstinência grave',
            'Confusão aguda',
            'Incapacidade importante de autocuidado',
          ],
          { alarm: true, note: 'Alerta positivo: avaliação imediata, antes do restante do formulário.' },
        ),
        G('Quadro atual', [
          T('inicio', 'Início e evolução'),
          T('ctx', 'Contexto: eventos, perdas, conflitos'),
          A('sint', 'Sintomas principais: características, frequência, intensidade', { out: 'Sintomas principais' }),
          T('antes', 'Funcionamento anterior'),
          T('impacto', 'Impacto atual: trabalho, relações, sono, alimentação, higiene'),
          T('manejo', 'Manejo já tentado e resposta'),
          T('compr', 'Compreensão da pessoa sobre o sofrimento'),
        ]),
        G(
          'Sintomas depressivos',
          [
            TRI(
              'dep',
              'Sintomas depressivos',
              [
                'Tristeza',
                'Perda de interesse/prazer',
                'Fadiga',
                'Culpa',
                'Desesperança',
                'Dificuldade de concentração',
                'Alteração do sono',
                'Alteração do apetite',
                'Lentificação ou agitação',
                'Pensamentos de morte',
              ],
              { nr: true },
            ),
          ],
          { ask: 'Tristeza ou perda de interesse?', neg: 'Nega sintomas depressivos' },
        ),
        G(
          'Ansiedade',
          [
            TRI(
              'ans',
              'Sintomas ansiosos',
              [
                'Preocupação excessiva',
                'Dificuldade de controlar a preocupação',
                'Tensão',
                'Irritabilidade',
                'Inquietação',
                'Sintomas físicos',
                'Evitação',
                'Prejuízo funcional',
              ],
              { nr: true },
            ),
          ],
          { ask: 'Preocupação excessiva ou nervosismo?', neg: 'Nega sintomas ansiosos' },
        ),
        G(
          'Pânico',
          [
            TRI(
              'pan',
              'Crises de pânico',
              [
                'Crises abruptas',
                'Palpitações',
                'Falta de ar',
                'Tremor',
                'Sudorese',
                'Medo de morrer ou perder o controle',
                'Medo de novas crises',
              ],
              { nr: true },
            ),
          ],
          { ask: 'Crises súbitas de medo intenso?', neg: 'Nega crises de pânico' },
        ),
        G(
          'Mania / hipomania',
          [
            TRI(
              'man',
              'Mania/hipomania',
              [
                'Humor elevado ou irritável',
                'Aumento de energia',
                'Menor necessidade de sono',
                'Fala aumentada',
                'Pensamentos acelerados',
                'Grandiosidade',
                'Impulsividade ou comportamentos de risco',
              ],
              { nr: true },
            ),
            T('man_dur', 'Duração e mudança em relação ao habitual'),
          ],
          {
            ask: 'Períodos de energia excessiva com pouca necessidade de sono?',
            neg: 'Nega episódios de mania ou hipomania',
            note: 'Pesquise antes de atribuir o quadro à depressão unipolar.',
          },
        ),
        G(
          'Sintomas psicóticos',
          [
            TRI(
              'psic',
              'Sintomas psicóticos',
              [
                'Alucinações',
                'Crenças persecutórias ou incomuns',
                'Desorganização',
                'Retraimento',
                'Declínio funcional',
              ],
              { nr: true },
            ),
          ],
          {
            ask: 'Ouve vozes, vê coisas ou tem crenças incomuns?',
            neg: 'Nega sintomas psicóticos',
            note: 'Explore o contexto cultural e a relação com sono e substâncias.',
          },
        ),
        G(
          'Trauma',
          [
            TRI(
              'trau',
              'Sintomas pós-traumáticos',
              ['Revivências', 'Pesadelos', 'Evitação', 'Hipervigilância', 'Dissociação'],
              { nr: true },
            ),
          ],
          {
            ask: 'Experiência traumática com sintomas atuais?',
            neg: 'Nega sintomas pós-traumáticos',
            note: 'Pergunte com cuidado, sem exigir narrativa detalhada.',
          },
        ),
        G(
          'Obsessões / compulsões',
          [
            TRI(
              'toc',
              'Obsessões/compulsões',
              ['Pensamentos intrusivos', 'Rituais', 'Tempo gasto', 'Sofrimento', 'Interferência'],
              { nr: true },
            ),
          ],
          { ask: 'Pensamentos intrusivos ou rituais?', neg: 'Nega obsessões ou compulsões' },
        ),
        G(
          'Alimentação',
          [
            TRI(
              'alim',
              'Comportamento alimentar',
              [
                'Restrição',
                'Compulsão',
                'Vômitos provocados',
                'Uso de laxantes',
                'Preocupação com peso ou imagem',
                'Mudança de peso',
              ],
              { nr: true },
            ),
          ],
          {
            ask: 'Preocupação com alimentação, peso ou imagem corporal?',
            neg: 'Nega alterações do comportamento alimentar',
          },
        ),
        G(
          'Sono',
          [TRI('sono', 'Sono', ['Insônia', 'Hipersonia', 'Ronco ou apneias', 'Sonolência diurna', 'Pesadelos'])],
          { ask: 'Alteração do sono?', neg: 'Nega alterações do sono' },
        ),
        G(
          'Cognição e atenção',
          [
            TRI('cog', 'Cognição/atenção', [
              'Esquecimento',
              'Desorientação',
              'Dificuldade de organização',
              'Prejuízo funcional',
            ]),
          ],
          {
            ask: 'Esquecimento ou dificuldade de atenção?',
            neg: 'Nega queixas cognitivas',
            note: 'Se suspeita de TDAH, investigue a história desde a infância e em diferentes ambientes.',
          },
        ),
        G('Antecedentes psiquiátricos e familiares', [
          T('ep_prev', 'Episódios anteriores (idade de início, duração, recuperação)'),
          T('dx_prev', 'Diagnósticos prévios (quem diagnosticou, documentação)'),
          CH('acomp_serv', 'Acompanhamentos', ['Nenhum', 'APS', 'CAPS', 'Psiquiatria', 'Psicologia'], {
            none: 'Nenhum',
          }),
          T('intern', 'Internações e atendimentos de urgência'),
          T('autoles', 'Autolesões e tentativas anteriores: quando, contexto, consequências'),
          T('hf', 'História familiar: transtornos mentais, substâncias, suicídio'),
        ]),
        {
          t: 'medrows',
          id: 'psimed',
          l: 'Medicações psiquiátricas atuais e prévias',
          note: 'Não registre “falha terapêutica” sem conferir dose, duração, adesão e motivo da suspensão.',
        },
        A('meds', 'Outros medicamentos, automedicação, suplementos', { out: 'Outros medicamentos' }),
        ...ALERG,
        G('Álcool e outras substâncias', [
          SC_AUD(''),
          T('subs', 'Substâncias: quais, frequência, via, última utilização'),
          TRI('subs_crit', 'Padrão de uso', [
            'Tolerância',
            'Perda de controle',
            'Fissura',
            'Abstinência',
            'Uso para dormir ou aliviar sofrimento',
            'Consequências clínicas, familiares ou profissionais',
          ]),
          T('subs_int', 'Tratamentos prévios e interesse em reduzir ou parar'),
        ]),
        T(
          'organ',
          'Saúde física e possíveis causas orgânicas (doenças, TCE, convulsões, tireoide, gestação/puerpério, medicamentos)',
          { out: 'Saúde física' },
        ),
        G('Contexto social e funcionalidade', [
          GRID('soc', 'Contexto social', [
            ['moradia', 'Moradia (com quem vive)'],
            ['rel', 'Relações e conflitos'],
            ['rede', 'Rede de apoio'],
            ['trab', 'Trabalho/estudo'],
            ['renda', 'Renda e necessidades'],
            ['resp', 'Responsabilidades de cuidado'],
            ['viol', 'Violência e proteção'],
            ['discr', 'Discriminação'],
            ['recursos', 'Recursos pessoais'],
            ['espir', 'Cultura/espiritualidade'],
            ['rede_serv', 'Acesso à rede'],
          ]),
          T('func', 'Funcionalidade: habitual, atual e ajuda necessária'),
        ]),
      ],
    },
    {
      k: 'O',
      title: 'Objetivo',
      sub: 'Sinais vitais, escalas e exame do estado mental',
      f: [
        SV(),
        G('Escalas', [SC_PHQ9, SC_GAD7]),
        {
          t: 'mse',
          id: 'eem',
          l: 'Exame do estado mental',
          note: 'Preencha pela observação. O botão “sem alteração” só insere o texto quando você clica.',
          rows: [
            ['ap', 'Aparência e autocuidado', 'Vestes adequadas, higiene preservada'],
            ['at', 'Atitude e contato', 'Colaborativo(a), bom contato'],
            ['cons', 'Consciência', 'Vigil'],
            ['ori', 'Orientação', 'Orientado(a) em tempo, espaço e pessoa'],
            ['aten', 'Atenção', 'Atenção preservada'],
            ['psm', 'Psicomotricidade', 'Sem alterações'],
            ['fala', 'Fala', 'Velocidade, volume e quantidade normais'],
            ['hum', 'Humor (referido pela pessoa)', ''],
            ['afe', 'Afeto (observado)', 'Modulado e congruente'],
            ['pcf', 'Pensamento – curso e forma', 'Lógico, linear e organizado'],
            ['pcc', 'Pensamento – conteúdo', ''],
            ['sens', 'Sensopercepção', 'Sem alterações sensoperceptivas'],
            ['mem', 'Memória e cognição', 'Preservadas à avaliação clínica'],
            ['ins', 'Insight', 'Presente'],
            ['jul', 'Julgamento crítico', 'Preservado'],
          ],
        },
      ],
    },
    {
      k: 'A',
      title: 'Avaliação',
      sub: 'Segurança e formulação clínica',
      f: [
        G(
          'Avaliação de segurança',
          [
            TRI(
              'seg_sui',
              'Suicídio e autolesão',
              [
                'Pensamentos de morte',
                'Desejo de não viver',
                'Ideação suicida atual ou recente',
                'Intenção',
                'Plano',
                'Preparativos',
                'Acesso a meios',
                'Tentativas ou autolesões anteriores',
                'Intoxicação, impulsividade ou agitação',
                'Vozes de comando',
              ],
              { alarm: true },
            ),
            TRI(
              'seg_out',
              'Outros riscos',
              [
                'Violência contra terceiros',
                'Vulnerabilidade a abuso ou exploração',
                'Autonegligência',
                'Dependentes desassistidos',
                'Direção ou trabalho inseguros',
              ],
              { alarm: true },
            ),
            T('seg_apoio', 'Apoios reais disponíveis'),
            T('seg_med', 'Medidas adotadas'),
          ],
          {
            note: 'Registre os riscos identificados, os apoios reais e as medidas adotadas. Classificações baixo/médio/alto não preveem suicídio.',
          },
        ),
        G('Formulação clínica', [
          T('hip', 'Síndrome / hipóteses e diagnósticos diferenciais'),
          T('pred', 'Fatores predisponentes'),
          T('prec', 'Fatores precipitantes'),
          T('mant', 'Fatores mantenedores'),
          T('prot', 'Recursos pessoais e fatores protetores'),
          T('prej', 'Prejuízo funcional'),
        ]),
        A('aval', 'Avaliação clínica', { out: 'Avaliação' }),
        T('hd', 'Hipótese diagnóstica / CID-10 ou CIAP-2', { out: 'Hipótese diagnóstica' }),
      ],
    },
    stdP([
      T('obj', 'Objetivos acordados com a pessoa'),
      T('psi', 'Intervenções psicossociais e apoio social'),
      CH('artic', 'Articulação com a rede', ['Psicologia', 'CAPS', 'Psiquiatria', 'Assistência social', 'eMulti']),
      CK('plano_seg', 'Plano de segurança', [
        'Combinados os sinais de piora e as estratégias de enfrentamento.',
        'Combinados contatos de apoio e pessoa de confiança.',
        'Orientada redução do acesso a meios (medicamentos, armas e outros).',
        'Orientado(a) a procurar serviço de urgência ou SAMU (192) em caso de crise.',
        'Informado o CVV (188), disponível 24 horas.',
      ]),
    ]),
  ],
};
