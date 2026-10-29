/**
 * Regras do EscolhaSegura APS (contracepção): triagem de segurança, classificação
 * de cada método, ordenação pela preferência e texto do SOAP.
 * Funções puras: recebem um leitor `d` com d.valor(id) → texto e d.marcado(id) → booleano.
 * A interface (abas, cartões, botões) fica em js/contracepcao/app.js.
 */
import { METODOS_SUS } from './metodos.js';

/** Lê um campo numérico; null quando vazio ou inválido. */
function numeroDoCampo(d, id) {
  const v = parseFloat(d.valor(id));
  return isNaN(v) ? null : v;
}

function avaliarRiscosContracepcao(d) {
  const idade = numeroDoCampo(d, 'idade');
  const pas = numeroDoCampo(d, 'pas');
  const pad = numeroDoCampo(d, 'pad');
  const semanasParto = numeroDoCampo(d, 'semanasParto');
  const tabagismo = d.valor('tabagismo') === 'sim';
  const cigarrosDia = numeroDoCampo(d, 'cigarrosDia') || 0;
  const amamentando = d.valor('amamentando') === 'sim';

  const risco = {
    gravidezPossivel: d.marcado('suspeitaGravidez') || d.valor('rsdum') === 'sim' || d.valor('rsdum') === 'incerto',
    emergencia:
      d.valor('rs5') === 'sim' ||
      d.valor('motivo') === 'Contracepção de emergência' ||
      d.valor('preferencia') === 'emergencia',
    violenciaSexual: d.marcado('violenciaSexual'),
    riscoIST: d.marcado('riscoIST'),

    estrogenioContraindicado: false,
    estrogenioCautela: false,
    progestagenioContraindicado: false,
    progestagenioCautela: false,
    diuContraindicado: false,
    diuCautela: false,
    precisaMedico: false,

    motivosEstrogenio: [],
    motivosProgestagenio: [],
    motivosDIU: [],
    alertas: [],
  };

  if ((pas !== null && pas >= 160) || (pad !== null && pad >= 100) || d.marcado('hasGrave')) {
    risco.estrogenioContraindicado = true;
    risco.precisaMedico = true;
    risco.motivosEstrogenio.push('PA ≥160/100 mmHg ou HAS grave/de difícil controle.');
    risco.alertas.push(
      'PA elevada/HAS grave: não iniciar método combinado com estrogênio. Avaliar controle pressórico.',
    );
  } else if ((pas !== null && pas >= 140) || (pad !== null && pad >= 90)) {
    risco.estrogenioCautela = true;
    risco.motivosEstrogenio.push('PA elevada: requer cautela e acompanhamento.');
  }

  if (d.marcado('enxaquecaAura')) {
    risco.estrogenioContraindicado = true;
    risco.motivosEstrogenio.push('Enxaqueca com aura.');
  }

  if (d.marcado('trombose')) {
    risco.estrogenioContraindicado = true;
    risco.motivosEstrogenio.push('História de trombose/TEP.');
  }

  if (d.marcado('avc')) {
    risco.estrogenioContraindicado = true;
    risco.motivosEstrogenio.push('AVC ou doença cardiovascular importante.');
  }

  if (idade !== null && idade >= 35 && tabagismo) {
    risco.estrogenioContraindicado = true;
    risco.motivosEstrogenio.push(
      `Tabagismo em paciente ≥35 anos${cigarrosDia ? ' (' + cigarrosDia + ' cigarros/dia)' : ''}.`,
    );
  }

  if (d.marcado('dmVascular')) {
    risco.estrogenioContraindicado = true;
    risco.motivosEstrogenio.push('Diabetes com complicação vascular.');
  }

  if (d.marcado('doencaHepatica')) {
    risco.estrogenioContraindicado = true;
    risco.progestagenioCautela = true;
    risco.motivosEstrogenio.push('Doença hepática grave.');
    risco.motivosProgestagenio.push('Doença hepática grave: avaliar caso.');
  }

  if (d.marcado('lupusSaf')) {
    risco.estrogenioContraindicado = true;
    risco.precisaMedico = true;
    risco.motivosEstrogenio.push('Lúpus com SAF/anticorpos antifosfolípides.');
  }

  if (d.marcado('imobilizacao')) {
    risco.estrogenioContraindicado = true;
    risco.motivosEstrogenio.push('Imobilização prolongada/cirurgia maior.');
  }

  if (amamentando && semanasParto !== null && semanasParto < 6) {
    risco.estrogenioContraindicado = true;
    risco.motivosEstrogenio.push('Amamentação com menos de 6 semanas pós-parto.');
  } else if (amamentando && semanasParto !== null && semanasParto < 24) {
    risco.estrogenioCautela = true;
    risco.motivosEstrogenio.push('Amamentação/puerpério: preferir método sem estrogênio conforme protocolo.');
  }

  if (d.marcado('cancerMamaAtual')) {
    risco.estrogenioContraindicado = true;
    risco.progestagenioContraindicado = true;
    risco.precisaMedico = true;
    risco.motivosEstrogenio.push('Câncer de mama atual.');
    risco.motivosProgestagenio.push('Câncer de mama atual.');
  }

  if (d.marcado('cancerMamaPrevio')) {
    risco.estrogenioContraindicado = true;
    risco.progestagenioCautela = true;
    risco.precisaMedico = true;
    risco.motivosEstrogenio.push('Câncer de mama prévio.');
    risco.motivosProgestagenio.push('Câncer de mama prévio: discutir caso/avaliar risco-benefício.');
  }

  if (d.marcado('sangramentoAnormal')) {
    risco.estrogenioCautela = true;
    risco.progestagenioCautela = true;
    risco.diuCautela = true;
    risco.precisaMedico = true;

    risco.motivosEstrogenio.push('Sangramento uterino anormal sem investigação.');
    risco.motivosProgestagenio.push('Sangramento uterino anormal sem investigação.');
    risco.motivosDIU.push('Sangramento uterino anormal sem investigação.');

    risco.alertas.push(
      'Sangramento uterino anormal sem investigação: avaliar antes de iniciar método que possa mascarar o quadro.',
    );
  }

  if (d.marcado('anticonvulsivante') || d.marcado('rifampicina')) {
    risco.progestagenioCautela = true;
    risco.estrogenioCautela = true;

    const med = d.marcado('rifampicina') ? 'rifampicina/rifapentina' : 'anticonvulsivante indutor enzimático';

    risco.motivosProgestagenio.push(`Uso de ${med}: pode reduzir eficácia de alguns métodos hormonais.`);
    risco.motivosEstrogenio.push(`Uso de ${med}: pode reduzir eficácia de alguns métodos hormonais.`);
  }

  if (d.marcado('bariatricaDisabsortiva')) {
    risco.estrogenioCautela = true;
    risco.progestagenioCautela = true;

    risco.motivosEstrogenio.push('Cirurgia bariátrica disabsortiva: evitar depender de método oral se possível.');
    risco.motivosProgestagenio.push('Cirurgia bariátrica disabsortiva: evitar depender de método oral se possível.');
  }

  if (d.marcado('suspeitaGravidez')) {
    risco.precisaMedico = true;
    risco.alertas.push('Suspeita de gravidez: avaliar antes de iniciar método regular.');
  }

  if (d.marcado('istAtual') || d.marcado('dorPelvica')) {
    risco.diuContraindicado = d.marcado('istAtual');
    risco.diuCautela = true;
    risco.precisaMedico = true;

    if (d.marcado('istAtual')) risco.motivosDIU.push('IST atual, cervicite purulenta ou DIP atual.');
    if (d.marcado('dorPelvica')) risco.motivosDIU.push('Dor pélvica importante/investigação pendente.');
  }

  if (d.marcado('alergiaMetodo')) {
    risco.alertas.push('Alergia conhecida: confirmar componente antes da prescrição/dispensação.');
    risco.precisaMedico = true;
  }

  if (risco.violenciaSexual) {
    risco.precisaMedico = true;
    risco.alertas.push(
      'Suspeita/relato de violência sexual: seguir protocolo de violência sexual, profilaxias, notificação e cuidado integral.',
    );
  }

  if (risco.emergencia) {
    risco.alertas.push(
      'Relação desprotegida/falha nos últimos 5 dias: avaliar contracepção de emergência e necessidade de teste/orientação de retorno.',
    );
  }

  if (risco.riscoIST) {
    risco.alertas.push('Risco de IST: orientar preservativo e avaliar testagem conforme protocolo.');
  }

  return risco;
}

function classificarMetodo(metodo, risco, d) {
  let status = 'green';
  let tituloStatus = 'Pode usar/ofertar conforme protocolo';
  let motivos = [];

  if (metodo.id === 'preservativo') {
    return {
      status: 'green',
      tituloStatus: 'Ofertar sempre',
      motivos: ['Método de barreira e prevenção de IST.'],
    };
  }

  if (metodo.id === 'levonorgestrel') {
    if (risco.emergencia) {
      return {
        status: 'green',
        tituloStatus: 'Indicado para fluxo de emergência',
        motivos: ['Há relato/suspeita de relação desprotegida ou falha do método nos últimos 5 dias.'],
      };
    }

    return {
      status: 'yellow',
      tituloStatus: 'Disponível, mas não é método de rotina',
      motivos: ['Usar apenas como contracepção de emergência, não como método regular.'],
    };
  }

  if (metodo.id === 'aco' || metodo.id === 'mensal') {
    if (risco.gravidezPossivel) {
      status = 'orange';
      tituloStatus = 'Avaliar gravidez antes de iniciar';
      motivos.push('Gestação possível/incerta.');
    }

    if (risco.estrogenioContraindicado) {
      status = 'red';
      tituloStatus = 'Contraindicado/evitar';
      motivos = motivos.concat(risco.motivosEstrogenio);
    } else if (risco.estrogenioCautela && status !== 'red') {
      status = 'yellow';
      tituloStatus = 'Usar com cautela/avaliar';
      motivos = motivos.concat(risco.motivosEstrogenio);
    }

    if (!motivos.length) {
      motivos.push('Sem contraindicação ao estrogênio identificada nos dados preenchidos.');
    }

    return { status, tituloStatus, motivos };
  }

  if (metodo.id === 'pop' || metodo.id === 'trimestral' || metodo.id === 'implanon') {
    if (risco.gravidezPossivel) {
      status = 'orange';
      tituloStatus = 'Avaliar gravidez antes de iniciar';
      motivos.push('Gestação possível/incerta.');
    }

    if (risco.progestagenioContraindicado) {
      status = 'red';
      tituloStatus = 'Contraindicado/evitar';
      motivos = motivos.concat(risco.motivosProgestagenio);
    } else if (risco.progestagenioCautela && status !== 'red') {
      status = status === 'orange' ? 'orange' : 'yellow';
      tituloStatus = status === 'orange' ? 'Avaliar antes de iniciar' : 'Usar com cautela/avaliar';
      motivos = motivos.concat(risco.motivosProgestagenio);
    }

    if (metodo.id === 'pop' && d.marcado('dificuldadeLembrar')) {
      status = status === 'green' ? 'yellow' : status;
      motivos.push('Paciente relata dificuldade de lembrar comprimido diário; método pode ter pior adesão.');
    }

    if (metodo.id === 'trimestral') {
      motivos.push('Orientar sangramento irregular/amenorreia e possível atraso no retorno da fertilidade.');
    }

    if (metodo.id === 'implanon') {
      status = status === 'green' ? 'orange' : status;
      tituloStatus = status === 'orange' ? 'Elegível, mas precisa encaminhar' : tituloStatus;
      motivos.push('Método exige encaminhamento conforme fluxo municipal.');
    }

    if (!motivos.length) {
      motivos.push('Método sem estrogênio; sem contraindicação específica identificada nos dados preenchidos.');
    }

    return { status, tituloStatus, motivos };
  }

  if (metodo.id === 'diu') {
    status = 'orange';
    tituloStatus = 'Elegível, mas precisa encaminhar para GO';
    motivos.push('Método exige encaminhamento para GO conforme fluxo municipal.');

    if (risco.gravidezPossivel || d.marcado('suspeitaGravidez')) {
      motivos.push('Avaliar possibilidade de gravidez antes da inserção.');
    }

    if (risco.diuContraindicado) {
      status = 'red';
      tituloStatus = 'Contraindicado/adiar até tratamento/avaliação';
      motivos = motivos.concat(risco.motivosDIU);
    } else if (risco.diuCautela) {
      status = 'orange';
      motivos = motivos.concat(risco.motivosDIU);
    }

    return { status, tituloStatus, motivos };
  }

  return { status, tituloStatus, motivos };
}

function ordenarPorPreferencia(avaliados, d) {
  const pref = d.valor('preferencia');

  const statusPeso = {
    green: 0,
    yellow: 1,
    orange: 2,
    red: 3,
  };

  const base = {
    preservativo: 9,
    levonorgestrel: 8,
    aco: 5,
    pop: 5,
    mensal: 5,
    trimestral: 5,
    diu: 4,
    implanon: 4,
  };

  const bonus = id => {
    if (pref === 'diario' && (id === 'aco' || id === 'pop')) return -10;
    if (pref === 'mensal' && id === 'mensal') return -10;
    if (pref === 'trimestral' && id === 'trimestral') return -10;
    if (pref === 'longa' && (id === 'diu' || id === 'implanon')) return -10;
    if (pref === 'semHormônio' && (id === 'diu' || id === 'preservativo')) return -10;
    if (pref === 'emergencia' && id === 'levonorgestrel') return -10;
    return 0;
  };

  return avaliados.sort((a, b) => {
    return (
      statusPeso[a.avaliacao.status] +
      base[a.id] +
      bonus(a.id) -
      (statusPeso[b.avaliacao.status] + base[b.id] + bonus(b.id))
    );
  });
}

/** Aplica a triagem a todos os métodos e ordena pela preferência da paciente. */
export function avaliarMetodos(d, metodos = METODOS_SUS) {
  const risco = avaliarRiscosContracepcao(d);
  const avaliados = ordenarPorPreferencia(
    metodos.map(m => ({ ...m, avaliacao: classificarMetodo(m, risco, d) })),
    d,
  );
  return { risco, avaliados };
}

/** Separa os métodos avaliados em: disponíveis na UBS, com encaminhamento e contraindicados. */
export function agruparMetodos(avaliados) {
  return {
    elegiveisUBS: avaliados.filter(
      m => ['green', 'yellow'].includes(m.avaliacao.status) && m.disponibilidade === 'ubs' && m.id !== 'levonorgestrel',
    ),
    encaminhamento: avaliados.filter(m => m.disponibilidade === 'encaminhamento' && m.avaliacao.status !== 'red'),
    contraindicados: avaliados.filter(m => m.avaliacao.status === 'red'),
  };
}

/** Frase de prioridade conforme a preferência informada. */
export function textoPrioridade(pref) {
  let prioridade = 'Priorizar método seguro, disponível na UBS e alinhado à preferência da paciente.';
  if (pref === 'longa') {
    prioridade =
      'Paciente prefere longa duração: apresentar DIU de cobre e Implanon como opções com encaminhamento; oferecer método provisório disponível na UBS enquanto aguarda.';
  }

  if (pref === 'semHormônio') {
    prioridade =
      'Paciente prefere evitar hormônio: priorizar preservativo e DIU de cobre com encaminhamento para GO, se elegível.';
  }

  if (pref === 'trimestral') {
    prioridade =
      'Paciente prefere método trimestral: avaliar medroxiprogesterona 150 mg, se elegível, e orientar sangramento irregular/amenorreia.';
  }

  if (pref === 'diario') {
    prioridade =
      'Paciente aceita método diário: avaliar pílula combinada se puder estrogênio ou noretisterona 0,35 mg se preferir/precisar evitar estrogênio.';
  }

  if (pref === 'mensal') {
    prioridade =
      'Paciente prefere método mensal: avaliar injetável mensal combinado apenas se não houver contraindicação ao estrogênio.';
  }

  if (pref === 'emergencia') {
    prioridade = 'Fluxo de emergência: avaliar levonorgestrel 0,75 mg e orientar método regular após o episódio.';
  }
  return prioridade;
}

function traduzir(v) {
  if (!v) return 'não informado';
  if (v === 'sim') return 'sim';
  if (v === 'nao') return 'não';
  if (v === 'incerto') return 'incerto';
  return v;
}

function textoPreferencia(v) {
  return (
    {
      diario: 'método diário',
      mensal: 'método mensal',
      trimestral: 'método trimestral',
      longa: 'método de longa duração',
      semHormônio: 'evitar hormônio',
      emergencia: 'contracepção de emergência',
      indiferente: 'sem preferência definida/quer orientação',
    }[v] || 'não informada'
  );
}

/** Texto SOAP da consulta de planejamento reprodutivo. */
export function montarSoapContracepcao(d, risco, avaliados) {
  const grupos = agruparMetodos(avaliados);
  const elegiveisUBS = grupos.elegiveisUBS.map(m => m.nome);
  const encaminhamento = grupos.encaminhamento.map(m => `${m.nome} (${m.acesso})`);
  const contra = grupos.contraindicados.map(m => m.nome);

  const alertas = risco.alertas.length
    ? risco.alertas.join(' ')
    : 'Sem alertas críticos identificados no preenchimento.';
  return `S: Paciente comparece para consulta de planejamento reprodutivo/contracepção.
Motivo: ${d.valor('motivo') || 'não informado'}.
DUM: ${d.valor('dum') || 'não informada'}. Ciclo: ${d.valor('ciclo') || 'não informado'}.
Relação sexual desprotegida nos últimos 5 dias: ${traduzir(d.valor('rs5'))}.
Relação sexual desprotegida desde a última menstruação: ${traduzir(d.valor('rsdum'))}.
Desejo gestacional nos próximos 12 meses: ${traduzir(d.valor('desejoGestacao'))}.
Amamentando: ${traduzir(d.valor('amamentando'))}. Semanas pós-parto: ${d.valor('semanasParto') || 'não se aplica/não informado'}.
Método atual: ${d.valor('metodoAtual') || 'não informado'}.
Preferência da paciente: ${textoPreferencia(d.valor('preferencia'))}.
Observações: ${d.valor('obs') || 'sem observações adicionais'}.

O: Idade: ${d.valor('idade') || 'não informada'} anos. PA: ${d.valor('pas') || '__'}x${d.valor('pad') || '__'} mmHg.
Triagem de segurança realizada para contraindicações a estrogênio, progestagênio e DIU.
Alertas identificados: ${alertas}

A: Planejamento reprodutivo. Avaliação de elegibilidade contraceptiva realizada por apoio à decisão.
Métodos elegíveis e disponíveis na UBS: ${elegiveisUBS.length ? elegiveisUBS.join('; ') : 'não definidos pelos dados preenchidos'}.
Métodos elegíveis com necessidade de encaminhamento: ${encaminhamento.length ? encaminhamento.join('; ') : 'nenhum'}.
Métodos a evitar/contraindicados nesta avaliação: ${contra.length ? contra.join('; ') : 'nenhum'}.

P: Realizado aconselhamento contraceptivo compartilhado, considerando preferência da paciente, elegibilidade clínica e disponibilidade municipal.
Orientado uso de preservativo masculino para prevenção de IST.
Se relação desprotegida/falha recente: avaliar contracepção de emergência com levonorgestrel conforme protocolo.
Se escolha por DIU de cobre: encaminhar para GO conforme fluxo municipal.
Se escolha por Implanon: encaminhar conforme fluxo municipal/priorização.
Orientados efeitos esperados, modo de uso, sinais de alerta e retorno se dor pélvica importante, sangramento intenso, cefaleia intensa nova, sintomas tromboembólicos, suspeita de gestação ou efeitos adversos relevantes.`;
}
