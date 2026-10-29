/**
 * Modelo de consulta: Saúde da mulher.
 * Seções S, O, A e P montadas com os construtores de ../motor/campos.js.
 * Para mudar perguntas, opções ou frases desta consulta, edite este arquivo.
 */
import { A, ALERG, CALC, CH, CK, EX, G, GRID, SEG, stdA, stdP, SV, T, TRI } from '../motor/campos.js';

export const MODELO_SAUDE_MULHER = {
  eye: 'Consulta de saúde da mulher',
  title: 'Saúde da mulher',
  sub: 'Módulos abrem com a pergunta inicial. Nada em branco vira negativa no texto.',
  secs: [
    {
      k: 'S',
      title: 'Subjetivo',
      sub: 'Motivo, alertas, histórias e módulos por queixa',
      f: [
        GRID('ident', 'Identificação', [['idade', 'Idade', '35', ' anos']]),
        CH('motivo', 'Motivo da consulta', [
          'Rotina/prevenção',
          'Queixa ginecológica',
          'Contracepção',
          'Planejamento gestacional',
          'Climatério',
          'Queixa mamária',
          'Outro',
        ]),
        A('resolver', 'O que gostaria de resolver hoje'),
        A('queixas', 'Queixas: início, duração, evolução, impacto e tratamentos tentados', { out: 'Queixas' }),
        TRI(
          'alertas',
          'Alertas',
          [
            'Sangramento intenso com tontura ou desmaio',
            'Dor pélvica intensa com possível gestação',
            'Febre com dor pélvica',
            'Violência recente ou risco atual',
            'Ideação suicida',
          ],
          { alarm: true, nr: true },
        ),
        G(
          'História menstrual e possibilidade de gestação',
          [
            GRID('menst', 'História menstrual', [
              ['dum', 'DUM', 'dd/mm/aaaa'],
              ['certeza', 'Certeza da DUM', 'sim'],
              ['padrao', 'Padrão', 'regular, 28/5 dias, fluxo moderado'],
              ['amen', 'Amenorreia', 'desde / motivo'],
            ]),
            TRI('menst_alt', 'Alterações do ciclo', [
              'Sangramento entre ciclos',
              'Sangramento após relação',
              'Sangramento após menopausa',
              'Mudança recente do padrão',
              'Cólica',
              'Coágulos',
              'Tontura ou cansaço',
            ]),
            SEG('gest_poss', 'Possibilidade de gestação', ['Não', 'Sim', 'Incerta']),
            T('gest_teste', 'Teste de gravidez – resultado e data'),
          ],
          { note: 'Amenorreia em uso de contraceptivo hormonal não indica menopausa.' },
        ),
        G('História ginecológica e obstétrica', [
          T('gpa', 'G/P/A e tipos de parto', { ph: 'G2P2A0 – 2 vaginais' }),
          T('comp_obst', 'Complicações obstétricas', { ph: 'HAS, DMG, hemorragia, prematuridade' }),
          CH('ant_gin', 'Antecedentes ginecológicos', [
            'Endometriose',
            'Miomas',
            'SOP',
            'IST prévia',
            'Doença inflamatória pélvica',
            'Infertilidade',
          ]),
          T('cir_gin', 'Cirurgias ginecológicas (útero, colo, ovários)'),
          T('prev_hist', 'Preventivo/HPV: alterações, colposcopia, tratamentos'),
        ]),
        G(
          'Saúde sexual e planejamento reprodutivo',
          [
            SEG('desejo', 'Desejo reprodutivo', ['Deseja engravidar agora', 'Futuramente', 'Não deseja', 'Em dúvida']),
            SEG('ativ_sex', 'Atividade sexual', ['Sim', 'Não', 'Prefere não responder']),
            SEG('preserv', 'Uso de preservativo', ['Sempre', 'Às vezes', 'Não usa']),
            TRI(
              'func_sex',
              'Função sexual',
              [
                'Dor na relação',
                'Ressecamento',
                'Dificuldade de excitação ou orgasmo',
                'Redução do desejo que incomoda',
              ],
              { nr: true },
            ),
            SEG('consent', 'Relações consentidas e seguras', ['Sim', 'Não', 'Prefere não responder']),
            TRI(
              'coer',
              'Coerção reprodutiva',
              ['Pressão para relações', 'Pressão para engravidar', 'Impedimento de usar contracepção'],
              { nr: true, alarm: true },
            ),
          ],
          {
            ask: 'Abordar saúde sexual e reprodutiva?',
            note: 'Abordar com privacidade, sem presumir práticas ou parceiros. Se deseja engravidar: avaliação pré-concepcional.',
          },
        ),
        G(
          'Contracepção',
          [
            T('met_atual', 'Método atual, início e satisfação'),
            TRI('met_prob', 'Problemas com o método', [
              'Esquecimentos ou atrasos',
              'Dificuldade de acesso',
              'Sangramento irregular',
              'Dor',
              'Outros efeitos adversos',
              'Deseja trocar ou suspender',
              'Necessidade de contracepção de emergência',
            ]),
            CH(
              'eleg',
              'Condições para elegibilidade de método hormonal',
              [
                'Hipertensão',
                'Tabagismo (≥ 35 anos)',
                'Enxaqueca com aura',
                'Trombose/trombofilia',
                'Doença cardiovascular',
                'Doença hepática',
                'Câncer de mama',
                'Puerpério/amamentação',
              ],
              { note: 'Avalie a elegibilidade de cada método separadamente (critérios da OMS).' },
            ),
            {
              t: 'link',
              href: 'contracepcao.html',
              l: 'Abrir Contracepção · EscolhaSegura APS →',
              note: 'Triagem de segurança e métodos disponíveis no município, com SOAP próprio.',
            },
            { t: 'link', href: 'implante.html', l: 'Abrir roteiro de inserção do implante →' },
          ],
          { ask: 'Usa ou deseja método contraceptivo?' },
        ),
        G(
          'Corrimento / prurido',
          [
            TRI('sx_corr', 'Corrimento/prurido', [
              'Corrimento diferente',
              'Prurido',
              'Ardor',
              'Odor',
              'Disúria',
              'Dor na relação',
              'Febre',
              'Dor pélvica',
              'Lesões',
            ]),
          ],
          { ask: 'Corrimento diferente, coceira, ardor ou odor?', neg: 'Nega corrimento, prurido ou odor vaginal' },
        ),
        G(
          'Dor pélvica',
          [
            T('dp_carac', 'Localização, intensidade e relação com o ciclo'),
            TRI('sx_dp', 'Dor pélvica', [
              'Dor na relação',
              'Sangramento',
              'Sintomas urinários',
              'Sintomas intestinais',
              'Possível gestação',
            ]),
          ],
          { ask: 'Dor no baixo ventre ou durante a relação?', neg: 'Nega dor pélvica' },
        ),
        G(
          'Sangramento anormal',
          [
            T('sa_carac', 'Quantidade, duração e coágulos'),
            TRI('sx_sa', 'Sangramento anormal', ['Dor', 'Tontura', 'Uso de método hormonal', 'Possível gestação']),
          ],
          { ask: 'Sangramento fora do habitual, após relação ou após a menopausa?', neg: 'Nega sangramento anormal' },
        ),
        G(
          'Sintomas urinários',
          [
            TRI('sx_ur', 'Sintomas urinários', [
              'Ardor',
              'Urgência',
              'Aumento da frequência',
              'Perda de urina aos esforços',
              'Perda de urina por urgência',
              'Dificuldade para esvaziar',
              'Febre',
              'Dor lombar',
              'Sangue na urina',
            ]),
          ],
          { ask: 'Ardor, urgência, perda de urina ou dificuldade para esvaziar?', neg: 'Nega sintomas urinários' },
        ),
        G(
          'Assoalho pélvico',
          [
            TRI('sx_ap', 'Assoalho pélvico', [
              'Sensação de peso',
              'Sensação de “bola” vaginal',
              'Perda de fezes',
              'Piora aos esforços',
              'Dificuldade evacuatória',
            ]),
          ],
          { ask: 'Sensação de peso, “bola” vaginal ou perda de fezes?', neg: 'Nega queixas de assoalho pélvico' },
        ),
        G(
          'Lesões genitais',
          [
            TRI('sx_les', 'Lesões genitais', [
              'Feridas',
              'Bolhas',
              'Verrugas',
              'Dor',
              'Prurido',
              'Recorrência',
              'Exposição sexual de risco',
            ]),
          ],
          { ask: 'Feridas, bolhas, verrugas ou alteração na vulva?', neg: 'Nega lesões genitais' },
        ),
        G(
          'Mamas',
          [
            TRI('sx_mama', 'Mamas', [
              'Nódulo',
              'Dor focal ou persistente',
              'Secreção pelo mamilo',
              'Retração do mamilo ou da pele',
              'Ferida',
              'Vermelhidão',
              'Mudança de formato',
            ]),
            T('mama_sec', 'Secreção: espontânea/provocada, uni/bilateral, aspecto'),
            T('mama_ex', 'Exames anteriores (datas e resultados) e biópsias'),
            T('mama_fam', 'História familiar de câncer de mama/ovário (parentesco e idade)'),
          ],
          {
            ask: 'Alguma queixa nas mamas?',
            neg: 'Nega queixas mamárias',
            note: 'Queixa mamária abre investigação diagnóstica, independentemente da idade de rastreamento.',
          },
        ),
        G(
          'Climatério',
          [
            TRI('sx_clim', 'Climatério', [
              'Ondas de calor',
              'Sudorese',
              'Alteração do sono',
              'Alteração do humor ou ansiedade',
              'Dificuldade de concentração',
              'Ressecamento vaginal',
              'Dor na relação',
              'Sintomas urinários',
              'Sangramento após a menopausa',
              'Fratura por baixo impacto',
            ]),
            T('clim_trat', 'Tratamentos utilizados, incluindo terapia hormonal'),
          ],
          { ask: 'Sintomas de climatério ou menopausa estabelecida?', neg: 'Sem sintomas climatéricos' },
        ),
        G('Saúde geral e contexto', [
          CH(
            'ant',
            'Antecedentes',
            ['Nega comorbidades', 'HAS', 'Diabetes', 'Dislipidemia', 'Doença cardiovascular', 'Doença tireoidiana'],
            { none: 'Nega comorbidades' },
          ),
          A('meds', 'Medicamentos, automedicação, fitoterápicos e suplementos', { out: 'Medicamentos em uso' }),
          ...ALERG,
          CH('hab', 'Hábitos', [
            'Tabagismo',
            'Álcool',
            'Outras substâncias',
            'Sedentarismo',
            'Alimentação inadequada',
            'Sono ruim',
          ]),
          TRI(
            'sm',
            'Saúde mental',
            ['Tristeza', 'Perda de interesse', 'Ansiedade', 'Sobrecarga', 'Prejuízo funcional'],
            { nr: true, note: 'Se positivo, aprofunde e avalie risco de suicídio (consulta de saúde mental).' },
          ),
          T('contexto', 'Rede de apoio, trabalho, cuidados e acesso'),
          SEG('viol', 'Violência (abordada em privado)', ['Nega', 'Refere', 'Prefere não responder', 'Não abordado']),
          T('viol_txt', 'Detalhe da violência'),
        ]),
        G('Prevenção e rastreamentos', [
          CALC('rastreio'),
          SEG('colo', 'Tem colo do útero', ['Sim', 'Não (histerectomia total)']),
          T('colo_ult', 'Último rastreio do colo: método, data e resultado'),
          T('mamo_ult', 'Última mamografia: data e BI-RADS'),
          T('ist_test', 'Testagem para IST'),
          T('vac', 'Vacinação (HPV, hepatite B, dT)'),
          T('osso', 'Saúde óssea: fraturas, fatores de risco, densitometria'),
        ]),
      ],
    },
    {
      k: 'O',
      title: 'Objetivo',
      sub: 'Exame físico direcionado, com consentimento',
      f: [
        SV(),
        EX('exame', 'Exame físico', {
          Geral: 'BEG, corada, hidratada, acianótica, anictérica, afebril, eupneica.',
          Mamas:
            'Mamas: simétricas, sem nódulos palpáveis, sem retrações ou abaulamentos, expressão negativa, axilas livres.',
          Abdome: 'Abdome: plano, flácido, indolor à palpação, sem massas ou visceromegalias.',
          OGE: 'OGE: sem alterações. Pilificação e higiene adequadas.',
          Especular:
            'Especular: paredes vaginais tróficas, conteúdo fisiológico, colo epitelizado, sem lesões visíveis.',
          'Toque vaginal':
            'Toque vaginal: colo fibroelástico, indolor à mobilização, útero de volume normal, anexos não palpáveis.',
        }),
        T('nao_real', 'Exame não realizado e motivo'),
      ],
    },
    stdA(),
    stdP([
      G('Seguimento de sífilis', [{ t: 'sif', id: 'sif', mode: 'adulto' }], {
        ask: 'Sífilis em tratamento ou seguimento?',
      }),
      CK('orient_mu', 'Orientações', [
        'Oriento sobre métodos contraceptivos, com escolha compartilhada.',
        'Oriento uso de preservativo e prevenção de IST.',
        'Oriento rastreamentos indicados para a idade.',
        'Oriento autocuidado e sinais de alarme.',
      ]),
    ]),
  ],
};
