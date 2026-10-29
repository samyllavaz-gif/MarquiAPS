/**
 * Modelo de consulta: Reumatologia na APS.
 * Seções S, O, A e P montadas com os construtores de ../motor/campos.js.
 * Para mudar perguntas, opções ou frases desta consulta, edite este arquivo.
 */
import { A, ALERG, CALC, CH, CK, EX, G, GRID, PRESC, RET, SEG, SV, T, TRI } from '../motor/campos.js';

export const MODELO_REUMATOLOGIA = {
  eye: 'Avaliação de suspeita de doença reumática',
  title: 'Reumatologia na APS',
  sub: 'Urgência primeiro, depois o padrão, a investigação pertinente e o resumo para a regulação.',
  secs: [
    {
      k: 'S',
      title: 'Subjetivo',
      sub: 'Alertas, história, manifestações sistêmicas e padrões',
      f: [
        CH('manif', 'Manifestação principal', [
          'Dor articular',
          'Articulação inchada',
          'Dor lombar',
          'Dor muscular',
          'Fraqueza',
          'Dor generalizada',
          'Alteração de pele',
          'Exame alterado',
        ]),
        TRI(
          'alertas',
          'Alertas antes de continuar',
          [
            'Articulação quente, inchada e muito dolorosa',
            'Cefaleia nova após os 50 anos, dor ao mastigar ou couro cabeludo sensível',
            'Olho vermelho doloroso, fotofobia ou alteração visual',
            'Dispneia, hemoptise, dor torácica ou queda da saturação',
            'Redução da urina, edema ou alteração urinária relevante',
            'Fraqueza progressiva com dificuldade para engolir ou respirar',
            'Déficit neurológico, retenção urinária ou anestesia perineal',
          ],
          {
            alarm: true,
            act: {
              'Articulação quente, inchada e muito dolorosa':
                'Considerar artrite séptica, mesmo sem febre: avaliação urgente, com punção quando indicada. Cristais também entram no diferencial.',
              'Cefaleia nova após os 50 anos, dor ao mastigar ou couro cabeludo sensível':
                'Investigar arterite de células gigantes com urgência. Alteração visual exige atendimento no mesmo dia; a investigação não deve atrasar o tratamento.',
              'Olho vermelho doloroso, fotofobia ou alteração visual':
                'Avaliação oftalmológica urgente: possível uveíte ou outra doença ocular grave.',
              'Dispneia, hemoptise, dor torácica ou queda da saturação':
                'Investigar comprometimento cardiopulmonar agudo.',
              'Redução da urina, edema ou alteração urinária relevante':
                'Avaliar comprometimento renal, especialmente com manifestações sistêmicas.',
              'Fraqueza progressiva com dificuldade para engolir ou respirar':
                'Avaliação urgente por possível doença muscular ou neurológica.',
              'Déficit neurológico, retenção urinária ou anestesia perineal':
                'Atendimento de urgência; não atribuir automaticamente à doença reumática.',
            },
          },
        ),
        G(
          'História do quadro',
          [
            T('inicio', 'Início e duração', { ph: 'gradual há 8 semanas, primeiro episódio', out: 'Início e duração' }),
            SEG('evol', 'Evolução', ['Persistente', 'Recorrente', 'Migratória', 'Aditiva']),
            T('local', 'Localização, lado e simetria', { ph: 'punhos e mãos, bilateral e simétrica' }),
            SEG('dist', 'Distribuição', [
              'Monoarticular',
              'Oligoarticular (2 a 4)',
              'Poliarticular (5 ou mais)',
              'Axial',
            ]),
            TRI('infl', 'Inflamação percebida', ['Inchaço', 'Calor', 'Vermelhidão']),
            T('rig', 'Rigidez ao acordar ou após repouso', { ph: '90 minutos, melhora com movimento', out: 'Rigidez' }),
            T('dor_comp', 'Comportamento da dor', { ph: 'piora ao repouso, desperta à noite, melhora com movimento' }),
            CH('impacto', 'Dificuldade para', [
              'Caminhar',
              'Vestir-se',
              'Abrir recipientes',
              'Levantar-se',
              'Trabalhar',
              'Dormir',
            ]),
            A('trat', 'Tratamentos tentados: medicamento, dose, duração, resposta e efeitos', {
              out: 'Tratamentos tentados',
            }),
          ],
          { note: 'Dor articular referida não é sinovite: a sinovite é registrada no mapa de articulações, no exame.' },
        ),
        G(
          'Manifestações fora das articulações',
          [
            TRI('x_const', 'Constitucionais', ['Febre', 'Fadiga', 'Perda de peso involuntária', 'Sudorese noturna']),
            TRI('x_pele', 'Pele e mucosas', [
              'Fotossensibilidade',
              'Erupções',
              'Psoríase',
              'Úlceras orais ou nasais',
              'Alopecia',
              'Púrpura',
              'Úlceras cutâneas',
            ]),
            TRI('x_vasc', 'Vascular', ['Fenômeno de Raynaud', 'Feridas ou necrose digital', 'Trombose prévia']),
            TRI('x_olho', 'Olhos e boca', [
              'Olhos secos',
              'Boca seca',
              'Aumento de parótidas',
              'Olho vermelho doloroso',
              'Uveíte prévia',
            ]),
            TRI('x_resp', 'Respiratório e cardiovascular', [
              'Dispneia',
              'Tosse persistente',
              'Dor ao respirar',
              'Dor torácica',
              'Edema',
            ]),
            TRI('x_renal', 'Renal', ['Urina espumosa', 'Urina com sangue', 'Redução da urina', 'Edema']),
            TRI('x_musc', 'Muscular', [
              'Dificuldade para levantar da cadeira',
              'Dificuldade para subir escadas',
              'Dificuldade para elevar os braços',
              'Dificuldade para engolir',
            ]),
            TRI('x_neuro', 'Neurológico', [
              'Perda de força ou sensibilidade',
              'Neuropatia assimétrica',
              'Convulsões',
              'Alteração cognitiva nova',
            ]),
            TRI('x_int', 'Intestinal', ['Diarreia persistente', 'Sangue nas fezes', 'Doença inflamatória intestinal']),
            TRI('x_obst', 'Obstétrico', ['Perdas gestacionais recorrentes', 'Complicações placentárias']),
            TRI('x_inf', 'Infecções recentes', ['Diarreia', 'Uretrite', 'Infecção viral', 'Chikungunya']),
          ],
          { note: 'A lesão renal pode ser assintomática.' },
        ),
        G(
          'Poliartrite inflamatória',
          [
            TRI('p_poli', 'Poliartrite', [
              'Inchaço persistente',
              'Rigidez prolongada (mais de 30 minutos)',
              'Mãos e pés acometidos',
              'Acometimento simétrico',
              'Dificuldade de fechar as mãos',
              'Progressão',
            ]),
          ],
          { ask: 'Padrão de poliartrite inflamatória?', key: 'poli' },
        ),
        G(
          'Lombalgia possivelmente inflamatória',
          [
            TRI('p_axial', 'Lombalgia inflamatória', [
              'Início antes dos 45 anos',
              'Duração maior que 3 meses',
              'Desperta na segunda metade da noite',
              'Dor glútea',
              'Melhora com movimento',
              'Psoríase',
              'Uveíte',
              'Doença inflamatória intestinal',
              'Entesite',
              'Familiar com espondiloartrite',
            ]),
          ],
          {
            ask: 'Lombalgia com características inflamatórias?',
            key: 'axial',
            note: 'PCR/VHS normais ou HLA-B27 negativo não excluem espondiloartrite.',
          },
        ),
        G(
          'Artrite associada à psoríase',
          [
            TRI('p_pso', 'Psoríase e artrite', [
              'Psoríase atual ou prévia (inclusive couro cabeludo)',
              'Alterações ungueais',
              'Dactilite (dedo inteiro inchado)',
              'Dor em inserções tendíneas',
              'Sintomas axiais',
            ]),
          ],
          { ask: 'Psoríase ou sinais de artrite psoriásica?', key: 'pso' },
        ),
        G(
          'Monoartrite / cristais',
          [
            TRI('p_mono', 'Monoartrite', [
              'Início abrupto',
              'Crises anteriores',
              'Primeiro dedo do pé',
              'Tofos',
              'Doença renal',
              'Uso de diuréticos',
              'Febre',
              'Fatores de risco para infecção',
            ]),
          ],
          {
            ask: 'Monoartrite ou suspeita de gota?',
            key: 'mono',
            note: 'Articulação quente e inchada: considerar artrite séptica. Uricemia normal durante a crise não exclui gota.',
          },
        ),
        G(
          'Doença autoimune sistêmica',
          [
            TRI('p_sist', 'Doença sistêmica', [
              'Várias manifestações extra-articulares',
              'Relação temporal entre elas',
              'Alterações hematológicas prévias',
              'Alterações urinárias ou renais prévias',
            ]),
          ],
          { ask: 'Suspeita de doença autoimune sistêmica?', key: 'sist' },
        ),
        G(
          'Fraqueza muscular',
          [
            TRI('p_fraq', 'Fraqueza muscular', [
              'Distribuição proximal',
              'Progressiva',
              'Disfagia',
              'Lesões de pele',
              'Uso de estatina',
              'Outros medicamentos suspeitos',
              'Exercício intenso recente',
            ]),
          ],
          {
            ask: 'Fraqueza muscular?',
            key: 'fraq',
            note: 'Distinga fraqueza objetiva de movimento limitado pela dor.',
          },
        ),
        G(
          'Dor e rigidez de cinturas após os 50 anos',
          [
            TRI('p_cint', 'Cinturas', [
              'Ombros',
              'Quadris',
              'Rigidez matinal',
              'Limitação',
              'Sintomas constitucionais',
            ]),
            TRI(
              'p_acg',
              'Sinais de arterite de células gigantes',
              ['Cefaleia nova', 'Dor ao mastigar', 'Sensibilidade do couro cabeludo', 'Alteração visual'],
              { alarm: true },
            ),
          ],
          { ask: 'Dor e rigidez de ombros/quadris após os 50 anos?', key: 'cint' },
        ),
        G(
          'Dor mecânica / localizada',
          [
            TRI('p_mec', 'Dor mecânica', [
              'Relação com carga',
              'Trauma',
              'Sobreuso',
              'Rigidez breve (menos de 30 minutos)',
              'Limitação',
              'Sintomas de tendão ou bursa',
              'Sintomas de compressão nervosa',
            ]),
          ],
          { ask: 'Padrão mecânico ou localizado?', key: 'mec' },
        ),
        G(
          'Dor generalizada persistente',
          [
            TRI('p_gen', 'Dor generalizada', [
              'Duração maior que 3 meses',
              'Fadiga',
              'Sono não reparador',
              'Dificuldades cognitivas',
              'Alteração do humor',
              'Impacto funcional',
              'Sinais de doença inflamatória concomitante',
            ]),
          ],
          { ask: 'Dor generalizada persistente?', key: 'gen' },
        ),
        G('Antecedentes, medicamentos e contexto', [
          CH('ant', 'Antecedentes', [
            'Doença autoimune',
            'Psoríase',
            'Uveíte',
            'Doença inflamatória intestinal',
            'Gota',
            'Osteoporose',
            'Infecção crônica',
            'Câncer',
            'Doença renal',
            'Doença hepática',
            'Doença cardiovascular',
          ]),
          T('hf', 'História familiar (autoimunes, psoríase, uveíte, DII, gota)'),
          {
            t: 'medrows',
            id: 'rmed',
            l: 'Tratamentos atuais e prévios (corticoides, anti-inflamatórios, imunossupressores)',
            note: 'Resposta a corticoide, isoladamente, não confirma doença inflamatória.',
          },
          ...ALERG,
          T('trab', 'Trabalho, esforço repetitivo, afastamento, renda e acesso'),
          T('apoio', 'Rede de apoio, ajuda nas atividades, condições para exercício'),
          T('sono_sm', 'Sono, saúde mental e enfrentamento'),
        ]),
      ],
    },
    {
      k: 'O',
      title: 'Objetivo',
      sub: 'Exame dirigido, mapa de articulações e exames',
      f: [
        SV(),
        EX('exame', 'Exame físico', {
          Geral: 'BEG, corado(a), hidratado(a), acianótico(a), anictérico(a), afebril, eupneico(a).',
          Articulações:
            'Articulações sem sinais de sinovite, sem calor ou derrame, mobilidade ativa e passiva preservada, sem deformidades.',
          Coluna:
            'Coluna sem alterações posturais, mobilidade preservada, sem dor à palpação de sacroilíacas. Força e reflexos de MMII preservados.',
          Força: 'Força muscular grau V proximal e distal, simétrica.',
          'Pele e unhas': 'Pele sem lesões, sem psoríase ou alterações ungueais, sem úlceras orais.',
          Vascular: 'Pulsos periféricos presentes e simétricos, boa perfusão, sem lesões digitais.',
        }),
        { t: 'joints', id: 'art', l: 'Mapa de articulações' },
        G('Tendões, enteses, coluna e músculos', [
          TRI('ent', 'Achados', [
            'Tenossinovite',
            'Entesite',
            'Dactilite',
            'Limitação da coluna',
            'Fraqueza proximal objetiva',
            'Fraqueza distal objetiva',
          ]),
          T('forca', 'Força (grau) e testes dirigidos'),
        ]),
        GRID(
          'lab',
          'Exames (resultado e data)',
          [
            ['hmg', 'Hemograma'],
            ['pcr', 'PCR'],
            ['vhs', 'VHS'],
            ['cr', 'Creatinina'],
            ['hep', 'TGO/TGP'],
            ['eas', 'EAS'],
            ['fr', 'Fator reumatoide'],
            ['accp', 'Anti-CCP'],
            ['fan', 'FAN (título e padrão)'],
            ['ck', 'CK'],
            ['au', 'Ácido úrico'],
            ['b27', 'HLA-B27'],
            ['img', 'Imagem'],
          ],
          {
            note: 'FAN positivo isolado não diagnostica lúpus e FR positivo não confirma artrite reumatoide. A coleta de exames não deve atrasar o encaminhamento de sinovite persistente.',
          },
        ),
        CALC('exsug'),
      ],
    },
    {
      k: 'A',
      title: 'Avaliação',
      sub: 'Hipótese, incerteza e critérios de classificação',
      f: [
        G(
          'Critérios ACR/EULAR 2010 para artrite reumatoide',
          [
            SEG('acr_sero', 'Sorologia (FR e anti-CCP)', [
              'Ambos negativos',
              'Positivo baixo (até 3× o limite)',
              'Positivo alto (mais de 3× o limite)',
            ]),
            SEG('acr_apr', 'PCR e VHS', ['Normais', 'Alterados']),
            SEG('acr_dur', 'Duração dos sintomas', ['Menos de 6 semanas', '6 semanas ou mais']),
            CALC('acr'),
          ],
          {
            ask: 'Há sinovite em pelo menos uma articulação, sem outra explicação?',
            note: 'Critério de classificação, não de diagnóstico. A contagem de articulações vem do mapa.',
          },
        ),
        T('hip', 'Hipótese principal e diferenciais'),
        SEG('incert', 'Grau de incerteza', ['Alto', 'Moderado', 'Baixo']),
        A('aval', 'Avaliação clínica', { out: 'Avaliação' }),
        T('hd', 'Hipótese diagnóstica / CID-10 ou CIAP-2', { out: 'Hipótese diagnóstica' }),
      ],
    },
    {
      k: 'P',
      title: 'Plano',
      sub: 'Enquanto aguarda acesso: reavaliação com data, prioridade e resumo',
      f: [
        SEG('enc_tipo', 'Encaminhamento', [
          'Reumatologia – prioritário',
          'Reumatologia – eletivo',
          'Teleconsultoria',
          'Urgência',
          'Não necessário no momento',
        ]),
        T('prior', 'Justificativa da prioridade', { ph: 'sinovite persistente em pequenas articulações há 8 semanas' }),
        T('reav', 'Data de reavaliação', {
          ph: 'dd/mm/aaaa (antecipar se progredir)',
          w: '260px',
          out: 'Reavaliação em',
        }),
        T('pend', 'Investigação pendente e responsável pelos resultados'),
        CK('orient_re', 'Orientações', [
          'Oriento atividade física e exercícios conforme tolerância.',
          'Oriento proteção articular e reabilitação.',
          'Oriento sinais de alarme: articulação quente e muito dolorosa, febre, alteração visual, falta de ar, fraqueza progressiva ou dificuldade para engolir; procurar atendimento imediato.',
          'Oriento uso correto da analgesia e riscos dos anti-inflamatórios.',
          'Oriento retorno antecipado se houver piora.',
        ]),
        A('exsol', 'Exames solicitados'),
        A('conduta', 'Conduta', {
          ph: 'Analgesia não substitui tratamento modificador da doença. Se corticoide: objetivo, duração e monitoramento.',
        }),
        PRESC,
        A('enc', 'Encaminhamentos'),
        RET,
        CALC('regul'),
      ],
    },
  ],
};
