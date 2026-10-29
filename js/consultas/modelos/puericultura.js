/**
 * Modelo de consulta: Puericultura.
 * Seções S, O, A e P montadas com os construtores de ../motor/campos.js.
 * Para mudar perguntas, opções ou frases desta consulta, edite este arquivo.
 */
import { A, CALC, CK, EX, G, GRID, SEG, stdP, T, TRI3 } from '../motor/campos.js';

export const MODELO_PUERICULTURA = {
  eye: 'Consulta de puericultura',
  title: 'Puericultura',
  sub: 'Idade e idade corrigida calculadas pela data de nascimento; crescimento avaliado nas curvas da OMS.',
  secs: [
    {
      k: 'S',
      title: 'Subjetivo',
      sub: 'Histórico, alimentação, rotina e vacinas',
      f: [
        SEG('sexo', 'Sexo', ['Feminino', 'Masculino']),
        GRID('nasc', 'Nascimento e consulta', [
          ['dn', 'Data de nascimento', 'dd/mm/aaaa', '', 1],
          ['igs', 'IG ao nascer – semanas', '39', '', 1],
          ['igd', 'IG ao nascer – dias', '0', '', 1],
          ['cons', 'Consulta', '1ª consulta / 2º mês'],
        ]),
        CALC('idade'),
        G('Histórico pré-natal', [
          GRID('hpn', 'Histórico pré-natal', [
            ['idmat', 'Idade materna', '', ' anos'],
            ['ngest', 'Gestação nº', ''],
            ['dmat', 'Doenças maternas prévias', ''],
            ['inf', 'Infecções/ISTs no pré-natal', ''],
            ['has', 'HAS, PE ou DMG', ''],
            ['hemo', 'Hemorragia, oligo ou polidrâmnio', ''],
            ['vicios', 'Vícios maternos', ''],
            ['npn', 'Consultas de pré-natal', ''],
            ['supl', 'Ácido fólico e ferro', ''],
          ]),
        ]),
        G('Parto', [
          GRID('parto', 'Parto', [
            ['tipo', 'Tipo de parto', ''],
            ['motces', 'Motivo da cesárea', ''],
            ['la', 'Líquido amniótico', ''],
            ['int', 'Intercorrências', ''],
            ['local', 'Local', ''],
          ]),
        ]),
        G('Recém-nascido', [
          GRID('rn', 'Recém-nascido', [
            ['peso', 'Peso ao nascer', '3250', ' g'],
            ['comp', 'Comprimento', '49', ' cm'],
            ['pc', 'Perímetro cefálico', '34', ' cm'],
            ['ap1', 'Apgar 1º min', '9'],
            ['ap5', 'Apgar 5º min', '10'],
            ['intneo', 'Intercorrências neonatais', 'nega'],
            ['tempo', 'Tempo de internação', '2 dias'],
            ['palta', 'Peso na alta', '3100', ' g'],
          ]),
          SEG('class', 'Classificação', ['PIG', 'AIG', 'GIG']),
          SEG('termo', 'Idade gestacional', ['Pré-termo', 'A termo', 'Pós-termo']),
          SEG('uti', 'UTI neonatal', ['Não', 'Sim']),
          SEG('altac', 'Alta conjunta com a mãe', ['Sim', 'Não']),
        ]),
        G(
          'Triagens neonatais',
          [
            SEG('tpe', 'Pezinho', TRI3),
            SEG('tol', 'Olhinho', TRI3),
            SEG('tco', 'Coraçãozinho', TRI3),
            SEG('tor', 'Orelhinha', TRI3),
            T('tri_obs', 'Observações'),
          ],
          { join: true, out: 'Triagens neonatais' },
        ),
        A('queixas', 'Queixas e rotina desta consulta', { out: 'Queixas e rotina' }),
        G('Alimentação, sono e eliminações', [
          SEG('alim', 'Alimentação', [
            'Aleitamento materno exclusivo',
            'Aleitamento misto',
            'Fórmula',
            'Introdução alimentar',
          ]),
          SEG('adtil', 'Vitamina A+D (Adtil)', ['Em uso', 'Não usa'], {
            note: 'De 1 semana até 2 anos: 1 gota ao dia.',
          }),
          SEG('ferro', 'Ferro', ['Em uso', 'Não usa', 'Não indicado'], {
            note: 'Prematuros: 2 mg/kg/dia a partir de 1 mês. Bebês de risco ou com alimentação inadequada: 1 mg/kg/dia entre 6 e 12 meses.',
          }),
          T('sono', 'Sono', { ph: 'Bom padrão' }),
          T('elim', 'Eliminações', { ph: 'Urina e fezes sem alterações' }),
        ]),
        {
          t: 'vac',
          id: 'vac',
          l: 'Vacinas',
          rows: [
            ['Ao nascer', 'BCG, hepatite B', 0],
            ['2 meses', 'Penta (1ª), VIP (1ª), Pneumo 10 (1ª), Rotavírus (1ª)', 2],
            ['3 meses', 'Meningocócica C (1ª)', 3],
            ['4 meses', 'Penta (2ª), VIP (2ª), Pneumo 10 (2ª), Rotavírus (2ª)', 4],
            ['5 meses', 'Meningocócica C (2ª)', 5],
            ['6 meses', 'Penta (3ª), VIP (3ª), Influenza (1ª), COVID-19 (1ª)', 6],
            ['7 meses', 'COVID-19 (2ª), Influenza (2ª, se 1ª dose antes dos 9 anos)', 7],
            ['9 meses', 'COVID-19 (3ª), Febre amarela (1ª)', 9],
            ['12 meses', 'Pneumo 10 (reforço), Meningocócica C (reforço), SCR (1ª), Varicela (1ª)', 12],
            ['15 meses', 'DTP (1º reforço), VIP (1º reforço), Hepatite A (1ª), Tetraviral (ou SCR + Varicela 2ª)', 15],
            ['4 anos', 'DTP (2º reforço), VIP (2º reforço), Febre amarela (reforço), Varicela (2ª)', 48],
          ],
        },
        {
          t: 'rows',
          id: 'hist',
          l: 'Histórico de consultas',
          noOut: true,
          copy: true,
          add: '+ Adicionar consulta',
          note: 'Registro das consultas anteriores. Não entra no texto do SOAP; use “Copiar” em cada uma.',
          cols: [
            ['d', 'Data', 'dd/mm/aaaa'],
            ['txt', 'Registro', 'queixas, rotina, achados, orientações…', 'area'],
          ],
        },
      ],
    },
    {
      k: 'O',
      title: 'Objetivo',
      sub: 'Crescimento e exame físico',
      f: [
        GRID('sv', 'Sinais vitais', [
          ['fc', 'FC', '', ' bpm'],
          ['fr', 'FR', '', ' irpm'],
          ['tax', 'Tax', '', ' °C'],
        ]),
        { t: 'growth', id: 'growth' },
        { t: 'marcos', id: 'marcos', l: 'Marcos do desenvolvimento' },
        EX('exame', 'Exame físico', {
          'Estado geral':
            'Estado geral: lactente em bom estado geral, ativo, reativo à manipulação, corado, hidratado, afebril, bem nutrido, sem sinais de sofrimento ou desconforto.',
          'Cabeça e pescoço':
            'Cabeça e pescoço: fontanela anterior normotensa, suturas sem cavalgamento, crânio normocefálico, olhos sem secreção e com reflexo vermelho presente bilateralmente, nariz pérvio, orelhas bem implantadas, boca e orofaringe sem alterações, pescoço sem massas.',
          'Tórax e respiratório': 'Tórax: simétrico, sem tiragens. AR: MV+ bilateralmente, sem ruídos adventícios.',
          Cardiovascular: 'ACV: RCR em 2T, BNF, sem sopros. Pulsos periféricos palpáveis e simétricos. TEC < 2 s.',
          Abdome: 'Abdome: plano, flácido, indolor, RHA+, sem massas ou visceromegalias. Coto umbilical: ___.',
          'Genitália masc.':
            'Genitália: bolsa escrotal bem formada, testículos tópicos e de consistência normal, meato uretral central. Região perineal íntegra, sem assaduras.',
          'Genitália fem.':
            'Genitália: grandes lábios desenvolvidos, pequenos lábios discretos, leucorreia fisiológica discreta, sem secreções anormais. Região perineal íntegra, sem assaduras.',
          'Coluna e membros':
            'Coluna retilínea, sem deformidades. Membros com movimentação ativa e simétrica. Tônus muscular global adequado para a idade. Extremidades bem perfundidas e coradas.',
          Neurológico:
            'Neuro: alerta durante o exame, alternando sono e vigília de forma adequada. Boa resposta a estímulos visuais e sonoros. Sem tremores ou movimentos anormais.',
          'Pele e anexos':
            'Pele: corada, hidratada, sem lesões ou descamações anormais, sem icterícia significativa, sem exantemas, petéquias ou equimoses. Unhas bem formadas.',
          'Marcos do DNPM': 'Marcos do desenvolvimento preenchidos no campo específico.',
        }),
      ],
    },
    {
      k: 'A',
      title: 'Avaliação',
      sub: 'Nutricional, crescimento, desenvolvimento, vacinação e doença atual',
      f: [
        T('av_nut', 'Avaliação nutricional', { q: ['Eutrófico, P/I e E/I entre P25 e P75.'] }),
        T('av_cresc', 'Avaliação do crescimento', { q: ['Crescimento adequado para a idade.'] }),
        T('av_dnpm', 'Avaliação do desenvolvimento', { q: ['Desenvolvimento neuropsicomotor adequado para a idade.'] }),
        T('av_imun', 'Avaliação imunológica', { q: ['Vacinação em dia.', 'Vacinação atrasada.'] }),
        T('av_pat', 'Avaliação patológica', { ph: 'doença atual, se houver', q: ['Sem intercorrências.'] }),
        T('hd', 'Hipótese diagnóstica / CID', {
          out: 'Hipótese diagnóstica',
          q: ['Puericultura – exame de rotina da criança (Z00.1).'],
        }),
      ],
    },
    stdP([
      G('Seguimento de sífilis', [{ t: 'sif', id: 'sif', mode: 'crianca' }], {
        ask: 'Criança exposta à sífilis ou com sífilis congênita?',
      }),
      CK('orient_pc', 'Orientações', [
        'Oriento aleitamento materno exclusivo até os 6 meses e complementado até 2 anos ou mais.',
        'Oriento sono seguro: de barriga para cima, em berço próprio, sem objetos soltos.',
        'Oriento prevenção de acidentes conforme a idade.',
        'Oriento manter o calendário vacinal em dia.',
        'Oriento sinais de alarme: febre, recusa alimentar, vômitos persistentes, sonolência excessiva, dificuldade para respirar, icterícia.',
        'Oriento suplementação de vitamina A+D e ferro conforme indicação.',
      ]),
    ]),
  ],
};
