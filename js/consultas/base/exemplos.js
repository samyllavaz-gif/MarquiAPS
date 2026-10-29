/**
 * Consultas de exemplo ("Ver exemplo preenchido"): textos fictícios para demonstração.
 */
import { EF } from './dados.js';

export const EX_BASE = {
  'f-motivo': 'Febre e dor no corpo há 3 dias',
  'f-hda':
    'Febre aferida até 38,8 °C desde o início, com mialgia difusa, cefaleia frontal e dor retro-orbitária. Aceitando bem líquidos, diurese preservada.',
  'dg-inicio': '',
  'dg-teste-dengue': 'NS1 solicitado',
  'dg-teste-covid': 'TR antígeno não reagente',
  'dg-ocup': 'Auxiliar de limpeza',
  'dg-vacinas': 'COVID e influenza 2026',
  'sv-pa': '118/76',
  'sv-fc': '88',
  'sv-fr': '16',
  'sv-tax': '38,1',
  'sv-spo2': '98',
  'sv-peso': '70',
  'f-exame':
    EF['Geral'].replace('afebril', 'febril') +
    '\n' +
    EF['ACV'] +
    '\n' +
    EF['AR'] +
    '\n' +
    EF['Abdome'] +
    '\nPele: sem exantema ou petéquias. Prova do laço negativa.',
  'f-aval':
    'Síndrome febril aguda compatível com dengue, sem sinais de alarme, sem condição especial e prova do laço negativa.',
  'f-hd': 'Dengue (A90 / A77)',
  'f-exsol': 'Hemograma, NS1',
  'f-conduta': 'Tratamento ambulatorial com hidratação oral e sintomáticos. Notificação realizada.',
  'f-retorno': 'Retorno em 2 dias',
  'f-seg': 'reavaliação clínica e hemograma no 1º dia sem febre',
};
export const EX_HD = {
  'f-motivo': 'Consulta de acompanhamento do HiperDia (HAS e DM2)',
  'f-hda':
    'Assintomática. Medidas de PA domiciliar entre 145-155/90 mmHg. Nega dor torácica, dispneia, poliúria ou polidipsia. Nega feridas nos pés.',
  'f-cont':
    'Em acompanhamento na unidade por HAS e DM2. Última consulta em 07/2026, sem alteração de doses. Refere boa adesão e dificuldade com a dieta.',
  'f-meds': 'Losartana 50 mg 1 cp 12/12h; Metformina 850 mg 1 cp após almoço e jantar',
  'f-risco-obs': 'Ex-tabagista há 6 anos (20 maços-ano)',
  'sv-pa': '152/92',
  'sv-fc': '80',
  'sv-hgt': '164',
  'sv-peso': '84',
  'sv-alt': '1,62',
  'sv-ca': '102',
  'f-exame': EF['Geral'] + '\n' + EF['ACV'] + '\n' + EF['AR'] + '\n' + EF['MMII'],
  'f-result': '08/2026: HbA1c 7,9% (acima da meta); glicemia de jejum 152; LDL 138; potássio 4,3',
  'hd-idade': '62',
  'hd-ct': '215',
  'hd-hdl': '44',
  'hd-cr': '1,1',
  'hd-crdata': '08/2026',
  'hd-rac': '48',
  'f-aval': 'HAS sem controle adequado, sem sinais de lesão aguda de órgão-alvo. DM2 acima da meta glicêmica.',
  'f-hd': 'Hipertensão arterial (I10 / K86); Diabetes mellitus tipo 2 (E11 / T90)',
  'f-cron-obs': 'Metas: PA < 130/80 e HbA1c < 7%',
  'f-exsol': 'HbA1c, glicemia de jejum, perfil lipídico, creatinina, potássio, urina tipo 1, RAC, ECG, fundo de olho',
  'f-conduta': 'Associada anlodipino. Iniciada estatina pelo risco cardiovascular. Mantidas demais medicações.',
  'f-retorno': 'Retorno em 30 dias',
  'f-seg': 'reavaliar PA domiciliar e resultados de exames',
};
