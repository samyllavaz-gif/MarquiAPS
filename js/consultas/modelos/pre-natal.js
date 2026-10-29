/**
 * Modelo de consulta: Pré-natal.
 * Seções S, O, A e P montadas com os construtores de ../motor/campos.js.
 * Para mudar perguntas, opções ou frases desta consulta, edite este arquivo.
 */
import { A, ALERG, CALC, CK, EX, G, GRID, SEG, stdA, stdP, T, TR } from '../motor/campos.js';

export const MODELO_PRENATAL = {
  eye: 'Consulta de pré-natal',
  title: 'Pré-natal',
  sub: 'IG e DPP pela DUM e pela USG, prazos dos exames por trimestre, exames alterados destacados e ganho de peso pela Caderneta da Gestante.',
  secs: [
    {
      k: 'S',
      title: 'Subjetivo',
      sub: 'Identificação, histórias e acompanhamento',
      f: [
        GRID('ident', 'Identificação', [
          ['idade', 'Idade', '28', ' anos'],
          ['gpa', 'G/P/A', 'G2P1A0'],
          ['escol', 'Escolaridade', 'Ensino médio'],
          ['prof', 'Profissão', ''],
          ['civil', 'Estado civil', ''],
          ['fam', 'Situação familiar', ''],
          ['bebe', 'Bebê', 'planejado, sexo/nome'],
          ['genitor', 'Genitor', 'participa do pré-natal?'],
        ]),
        G('Idade gestacional', [
          GRID('dt', 'Datas', [
            ['dum', 'DUM', 'dd/mm/aaaa', '', 1],
            ['usgdata', 'Data da 1ª USG', 'dd/mm/aaaa', '', 1],
            ['usgsem', 'IG na USG – semanas', '11', '', 1],
            ['usgdia', 'IG na USG – dias', '3', '', 1],
          ]),
          CALC('ig'),
          T('ts', 'Tipagem sanguínea', { ph: 'O+', w: '190px', chk: 'ts' }),
        ]),
        A('qp', 'Queixa principal'),
        A('meds', 'Medicações em uso'),
        G('História obstétrica', [
          {
            t: 'rows',
            id: 'gest',
            l: 'Gestações anteriores',
            out: 'Gestações anteriores',
            add: '+ Adicionar gestação',
            cols: [
              ['ano', 'Ano', '2019'],
              ['ig', 'IG ao nascer', '39s'],
              ['via', 'Via de parto', 'vaginal / cesárea'],
              ['peso', 'Peso do RN', '3200 g'],
              ['int', 'Intercorrências', 'sem intercorrências / PE / macrossomia'],
            ],
          },
        ]),
        G('História ginecológica', [
          GRID('hg', 'História ginecológica', [
            ['menarca', 'Menarca', '12 anos'],
            ['ciclos', 'Ciclos menstruais', 'regulares'],
            ['aco', 'Anticoncepção prévia', 'ACO'],
            ['ist', 'Doenças ginecológicas/ISTs', 'nega'],
          ]),
        ]),
        G('História clínica pregressa', [
          T('cron', 'Doenças crônicas', { ph: 'Nega' }),
          T('cir', 'Cirurgias', { ph: 'Nega' }),
          ...ALERG,
        ]),
        G('Psicossocial e hábitos de vida', [
          GRID('ps', 'Psicossocial e hábitos', [
            ['apoio', 'Apoio familiar', ''],
            ['plan', 'Planejamento/reação à gestação', ''],
            ['emoc', 'Saúde emocional atual', ''],
            ['subs', 'Álcool, tabaco ou drogas', 'nega'],
            ['ativ', 'Atividade física', ''],
            ['sono', 'Sono', ''],
            ['sex', 'Vida sexual', ''],
          ]),
        ]),
        G(
          'Testes rápidos',
          [
            SEG('tr_hb', 'Hepatite B', TR),
            SEG('tr_hc', 'Hepatite C', TR),
            SEG('tr_hiv', 'HIV', TR),
            SEG('tr_sif', 'Sífilis', TR),
            T('tr_data', 'Data', { ph: 'dd/mm/aaaa', w: '190px' }),
          ],
          { join: true, out: 'Testes rápidos' },
        ),
        G(
          'Vacinas e odontologia',
          [
            T('vac_hb', 'Hepatite B – doses e datas', { ph: 'D1 02/03 | D2 … | D3 …' }),
            T('vac_dtpa', 'dTpa (20 a 36 semanas) – data'),
            SEG('vac_flu', 'Influenza', ['Aplicada', 'Pendente', 'Recusou']),
            SEG('vac_cov', 'COVID-19', ['Aplicada', 'Pendente', 'Recusou']),
            T('odonto', 'Odontologia – data'),
          ],
          { join: true, out: 'Vacinas' },
        ),
        T('contra_pp', 'Contracepção pós-parto pretendida', { out: 'Contracepção pós-parto' }),
        G('Peso na gestação', [
          GRID('pg', 'Peso', [
            ['pprev', 'Peso prévio à gestação', '60', ' kg', 1],
            ['alt', 'Altura', '1,62', ' m', 1],
          ]),
          {
            t: 'rows',
            id: 'pesos',
            l: 'Peso por consulta',
            noOut: true,
            add: '+ Registrar peso',
            cols: [
              ['d', 'Data', 'dd/mm/aaaa'],
              ['ig', 'IG', '24s'],
              ['p', 'Peso (kg)', '64'],
              ['obs', 'Observação', ''],
            ],
          },
          CALC('ganho'),
        ]),
        {
          t: 'rows',
          id: 'hist',
          l: 'Histórico de consultas',
          noOut: true,
          copy: true,
          add: '+ Adicionar consulta',
          note: 'Registro das consultas anteriores desta gestação. Não entra no texto do SOAP; use “Copiar” em cada uma.',
          cols: [
            ['d', 'Data', 'dd/mm/aaaa'],
            ['txt', 'Registro', 'IG, queixas, PA, AU, BCF, condutas…', 'area'],
          ],
        },
      ],
    },
    {
      k: 'O',
      title: 'Objetivo',
      sub: 'Exame obstétrico, laboratoriais e ultrassons',
      f: [
        GRID('sv', 'Sinais vitais e exame obstétrico', [
          ['pa', 'PA', '110/70', ' mmHg'],
          ['peso', 'Peso atual', '64', ' kg'],
          ['au', 'AU', '24', ' cm'],
          ['bcf', 'BCF', '140', ' bpm'],
          ['mf', 'Movimentos fetais', 'presentes'],
          ['edema', 'Edema', 'ausente'],
        ]),
        EX('exame', 'Exame físico', {
          Geral: 'BEG, corada, hidratada, acianótica, anictérica, afebril, eupneica.',
          Mamas: 'Mamas: simétricas, sem nódulos, mamilos protrusos.',
          Abdome: 'Abdome gravídico, indolor, dinâmica uterina ausente.',
          MMII: 'MMII: sem edemas, panturrilhas livres.',
          Especular: 'Especular: conteúdo vaginal fisiológico, colo sem lesões visíveis.',
        }),
        CALC('prazos'),
        G('Laboratoriais · 1º trimestre', [
          GRID(
            'l1',
            'Laboratoriais 1º trimestre',
            [
              ['sol', 'Solicitação'],
              ['real', 'Realizado em'],
              ['aval', 'Avaliado', 'aguardo resultado'],
              ['ts', 'TS'],
              ['tsh', 'TSH'],
              ['t4l', 'T4 livre'],
              ['eas', 'EAS'],
              ['glic', 'Glicemia'],
              ['hmg', 'Hemograma'],
              ['toxo', 'Toxoplasmose'],
              ['hbv', 'Hepatite B'],
              ['hcv', 'Hepatite C'],
              ['hiv', 'HIV'],
              ['sif', 'Sífilis'],
              ['coombs', 'Coombs'],
              ['a1c', 'HbA1c'],
              ['htlv', 'HTLV'],
            ],
            { chk: true },
          ),
        ]),
        G('Laboratoriais · 2º trimestre', [
          GRID(
            'l2',
            'Laboratoriais 2º trimestre',
            [
              ['sol', 'Solicitação'],
              ['real', 'Realizado em'],
              ['aval', 'Avaliado'],
              ['hmg', 'Hemograma'],
              ['totg', 'TOTG (24 a 28 semanas)'],
              ['vdrl', 'VDRL'],
              ['hiv', 'HIV'],
              ['hbsag', 'HBsAg'],
              ['uro', 'Urocultura'],
              ['toxo', 'Toxoplasmose (se suscetível)'],
              ['htlv', 'HTLV'],
            ],
            { chk: true },
          ),
        ]),
        G('Laboratoriais · 3º trimestre', [
          GRID(
            'l3',
            'Laboratoriais 3º trimestre',
            [
              ['sol', 'Solicitação'],
              ['real', 'Realizado em'],
              ['aval', 'Avaliado'],
              ['hmg', 'Hemograma'],
              ['vdrl', 'VDRL'],
              ['hiv', 'HIV'],
              ['hbsag', 'HBsAg'],
              ['uro', 'Urocultura'],
              ['coombs', 'Coombs'],
              ['toxo', 'Toxoplasmose (se suscetível)'],
              ['gbs', 'Estreptococo do grupo B (35 a 37 sem)'],
            ],
            { chk: true },
          ),
        ]),
        G('Ultrassonografias', [
          {
            t: 'rows',
            id: 'usgs',
            l: 'Ultrassonografias',
            out: 'Ultrassonografias',
            add: '+ Adicionar ultrassonografia',
            cols: [
              ['d', 'Data', 'dd/mm/aaaa'],
              ['ig', 'IG', '20s 3d'],
              ['plac', 'Placenta', 'anterior, grau I'],
              ['la', 'Líquido amniótico', 'normal'],
              ['peso', 'Peso fetal', '520 g'],
              ['conc', 'Conclusão', 'gestação única, BCF presente', 'area'],
            ],
          },
        ]),
      ],
    },
    stdA(
      [SEG('risco', 'Risco gestacional', ['Habitual', 'Alto risco']), T('risco_mot', 'Motivo do alto risco')],
      ['Gestação de risco habitual (Z34).', 'Supervisão de gravidez de alto risco (Z35).'],
    ),
    stdP([
      G('Seguimento de sífilis', [{ t: 'sif', id: 'sif', mode: 'gestante' }], {
        ask: 'Gestante com sífilis em tratamento ou seguimento?',
      }),
      CK('supl', 'Prescrição e suplementação', [
        'AAS 100 mg: 1 comp à noite (alto risco para pré-eclâmpsia).',
        'Carbonato de cálcio 500 mg: 1 comp 1 a 2 vezes ao dia, com as refeições.',
        'Sulfato ferroso 40 mg: 1 comp ao dia, preferencialmente em jejum, a partir de 20 semanas até 3 meses pós-parto.',
        'Ácido fólico 0,4 a 5 mg: 1 comp ao dia, até 20 semanas.',
        'Vitamina D 600 UI ao dia, se deficiência documentada ou risco.',
      ]),
      CK('orient_pn', 'Orientações', [
        'Oriento sinais de alarme: sangramento, perda de líquido, cefaleia intensa, alteração visual, dor abdominal, diminuição dos movimentos fetais, contrações regulares.',
        'Oriento alimentação saudável e ganho de peso adequado.',
        'Oriento atividade física regular, se não houver contraindicação.',
        'Oriento preparo para a amamentação.',
        'Oriento uso de preservativo.',
        'Oriento sobre o local de referência para o parto.',
      ]),
      CALC('retpn'),
    ]),
  ],
};
