/**
 * Ortopedia: regiões, manobras, regras de decisão (Ottawa etc.) e textos S e O da avaliação musculoesquelética.
 */
import { escaparHtml, minusculaInicial } from '../../utils/texto.js';
import { st, V } from './estado.js';
import { upd } from './soap.js';

const MAN = {
  arco: [
    'Arco doloroso',
    'Avaliar padrão relacionado ao manguito rotador / espaço subacromial.',
    'Paciente eleva ativamente o braço em abdução no plano da escápula e depois desce.',
    'Lado; faixa de amplitude com dor; se a dor alivia acima de cerca de 120°.',
    'Dor entre cerca de 60° e 120° sugere acometimento subacromial/manguito. Não confirma sozinho.',
    'Dor intensa que impede o movimento.',
    0,
  ],
  hawkins: [
    'Hawkins-Kennedy',
    'Provocar dor subacromial.',
    'Ombro e cotovelo fletidos a 90°; o examinador roda internamente o braço de forma passiva.',
    'Lado; localização da dor reproduzida.',
    'Dor anterolateral aumenta a suspeita de dor subacromial; sensível, pouco específico.',
    'Ombro muito doloroso ou suspeita de lesão aguda.',
    0,
  ],
  neer: [
    'Neer',
    'Provocar dor subacromial.',
    'Com a escápula estabilizada e o braço em rotação interna, elevar passivamente o braço em flexão até o máximo.',
    'Lado; dor reproduzida e local.',
    'Dor anterolateral sugere dor subacromial; interpretar com os demais testes.',
    'Dor intensa ou rigidez importante.',
    0,
  ],
  jobe: [
    'Jobe (lata vazia)',
    'Avaliar força e dor do supraespinal.',
    'Braços a 90° de elevação no plano da escápula, polegares para baixo; o paciente resiste à pressão para baixo.',
    'Lado; dor e/ou fraqueza comparada ao lado oposto.',
    'Fraqueza sugere lesão do supraespinal; dor isolada é menos específica.',
    'Suspeita de fratura ou luxação.',
    0,
  ],
  re_res: [
    'Rotação externa resistida',
    'Avaliar infraespinal e redondo menor.',
    'Cotovelo a 90° junto ao corpo; o paciente faz rotação externa contra resistência.',
    'Lado; dor; força (grau) comparada ao outro lado.',
    'Fraqueza sugere comprometimento do manguito posterior.',
    'Suspeita de fratura ou luxação.',
    0,
  ],
  droparm: [
    'Drop-arm',
    'Pesquisar lesão extensa do manguito.',
    'O examinador eleva o braço a cerca de 90° de abdução e pede que o paciente desça lentamente.',
    'Lado; queda do braço ou descida sem controle.',
    'Queda do braço sugere lesão extensa do manguito (específico, pouco sensível).',
    'Suspeita de fratura ou luxação.',
    0,
  ],
  lagre: [
    'Sinal de lag de rotação externa',
    'Pesquisar lesão do manguito posterossuperior.',
    'Cotovelo fletido a 90°; o examinador leva o ombro quase à rotação externa máxima e solta, pedindo que o paciente mantenha.',
    'Lado; graus de retorno em rotação interna.',
    'Retorno do braço sugere lesão do infraespinal/supraespinal.',
    'Suspeita de fratura ou luxação.',
    0,
  ],
  belly: [
    'Belly-press',
    'Avaliar o subescapular.',
    'Mão espalmada sobre o abdome; pressionar mantendo o cotovelo à frente do tronco.',
    'Lado; cotovelo cai para trás ou punho flete para compensar.',
    'Compensação sugere fraqueza do subescapular.',
    'Dor intensa.',
    0,
  ],
  liftoff: [
    'Lift-off (Gerber)',
    'Avaliar o subescapular.',
    'Dorso da mão apoiado na região lombar; afastar a mão das costas.',
    'Lado; capacidade de afastar a mão.',
    'Incapacidade sugere lesão do subescapular. Exige rotação interna suficiente.',
    'Rotação interna limitada ou dor intensa.',
    0,
  ],
  crossbody: [
    'Adução horizontal (cross-body)',
    'Verificar dor na acromioclavicular.',
    'Braço a 90° de flexão, levado em adução horizontal pela frente do tórax.',
    'Lado; dor localizada sobre a acromioclavicular.',
    'Dor localizada na acromioclavicular sugere origem nessa articulação.',
    'Suspeita de luxação acromioclavicular aguda.',
    0,
  ],
  mobilRE: [
    'Mobilidade ativa x passiva (rotação externa)',
    'Identificar padrão de rigidez glenoumeral.',
    'Comparar amplitudes ativa e passiva, sobretudo rotação externa com o braço junto ao corpo, nos dois lados.',
    'Amplitude ativa e passiva em graus; dor.',
    'Perda ativa e passiva, sobretudo de rotação externa, sugere padrão capsular (capsulite, artrose). Ativa reduzida com passiva preservada sugere dor ou lesão tendínea/neurológica.',
    'Suspeita de fratura ou luxação.',
    0,
  ],
  apreensao: [
    'Apreensão e relocação',
    'Investigar instabilidade anterior.',
    'Supino, ombro a 90° de abdução e rotação externa progressiva; na relocação, pressão posterior na cabeça umeral.',
    'Lado; apreensão (medo de luxar), não apenas dor; alívio com a relocação.',
    'Apreensão que alivia com relocação sugere instabilidade anterior.',
    'Luxação aguda, suspeita de fratura ou dor intensa.',
    1,
  ],
  spurling: [
    'Spurling',
    'Pesquisar radiculopatia cervical.',
    'Extensão, inclinação e rotação cervical para o lado sintomático com compressão axial suave.',
    'Lado; reprodução da dor irradiada ao membro superior (não só dor cervical).',
    'Reprodução da dor irradiada aumenta a suspeita de radiculopatia; negativo não exclui.',
    'Trauma cervical, suspeita de instabilidade ou de mielopatia.',
    1,
  ],
  ultt: [
    'Teste neurodinâmico do membro superior (mediano)',
    'Avaliar mecanossensibilidade neural.',
    'Depressão do ombro, abdução, extensão do cotovelo e do punho; depois inclinação cervical contralateral para diferenciar.',
    'Lado; sintoma reproduzido e mudança com a diferenciação cervical.',
    'Negativo reduz a suspeita de radiculopatia; positivo é pouco específico.',
    'Dor intensa ou sintomas neurológicos progressivos.',
    0,
  ],
  mielo: [
    'Sinais de mielopatia',
    'Pesquisar compressão medular.',
    'Marcha (base alargada, tandem), Hoffmann, reflexos, clônus, Babinski e sensibilidade/destreza das mãos.',
    'Cada sinal pesquisado e o resultado.',
    'Qualquer sinal de mielopatia exige investigação e encaminhamento prioritários.',
    'Não se aplica.',
    0,
  ],
  neuroMS: [
    'Exame neurológico do membro superior',
    'Localizar raiz ou nervo acometido.',
    'Força por miótomos (C5 abdução do ombro, C6 extensão do punho, C7 extensão do cotovelo, C8 flexão dos dedos, T1 abdução dos dedos), sensibilidade por dermátomos e reflexos (bicipital, braquiorradial, tricipital).',
    'Déficits encontrados, lado e grau.',
    'Déficit motor ou sensitivo amplia a investigação neurológica.',
    'Não se aplica.',
    0,
  ],
  extres: [
    'Palpação do epicôndilo lateral e extensão resistida do punho',
    'Avaliar a origem dos extensores.',
    'Palpar o epicôndilo lateral; o paciente estende o punho contra resistência com o cotovelo estendido.',
    'Lado; dor no epicôndilo lateral.',
    'Dor localizada sugere epicondilopatia lateral.',
    'Trauma agudo com suspeita de fratura.',
    0,
  ],
  cozen: [
    'Cozen',
    'Provocar dor na origem dos extensores.',
    'Cotovelo a 90° e antebraço pronado; extensão e desvio radial do punho contra resistência.',
    'Lado; dor no epicôndilo lateral.',
    'Dor reproduzida sugere epicondilopatia lateral.',
    'Trauma agudo.',
    0,
  ],
  medial: [
    'Flexão e pronação resistidas',
    'Avaliar a origem dos flexores/pronadores.',
    'Palpar o epicôndilo medial; flexão do punho e pronação contra resistência.',
    'Lado; dor medial; sintomas ulnares associados.',
    'Dor medial sugere epicondilopatia medial; pesquisar o nervo ulnar.',
    'Trauma agudo.',
    0,
  ],
  tinelcub: [
    'Tinel no túnel cubital',
    'Pesquisar neuropatia ulnar no cotovelo.',
    'Percussão do nervo ulnar no sulco atrás do epicôndilo medial.',
    'Lado; parestesia irradiada ao 4º e 5º dedos.',
    'Positivo sugere irritação do ulnar; complementa a história e a força intrínseca.',
    'Não se aplica.',
    0,
  ],
  flexcot: [
    'Flexão do cotovelo',
    'Provocar sintomas do nervo ulnar.',
    'Flexão máxima do cotovelo com punho em extensão por até 60 segundos.',
    'Lado; tempo até a parestesia ulnar.',
    'Parestesia ulnar sugere síndrome do túnel cubital.',
    'Dor intensa no cotovelo.',
    0,
  ],
  intrins: [
    'Força intrínseca e sinal de Froment',
    'Avaliar função motora do ulnar.',
    'Abdução dos dedos contra resistência; Froment: segurar um papel entre polegar e indicador enquanto o examinador puxa.',
    'Lado; fraqueza, atrofia; flexão da IF do polegar no Froment.',
    'Fraqueza intrínseca ou Froment positivo indica déficit motor ulnar.',
    'Não se aplica.',
    0,
  ],
  phalen: [
    'Phalen',
    'Provocar sintomas do nervo mediano.',
    'Flexão máxima dos punhos (dorso contra dorso) por até 60 segundos.',
    'Lado; tempo; dedos com parestesia.',
    'Parestesia no território do mediano sugere síndrome do túnel do carpo.',
    'Dor intensa no punho.',
    0,
  ],
  durkan: [
    'Compressão do carpo (Durkan)',
    'Provocar sintomas do nervo mediano.',
    'Pressão do polegar do examinador sobre o túnel do carpo por até 30 segundos.',
    'Lado; tempo; dedos com parestesia.',
    'Parestesia no território do mediano sugere síndrome do túnel do carpo.',
    'Não se aplica.',
    0,
  ],
  tinelcarp: [
    'Tinel do carpo',
    'Complementar a avaliação do mediano.',
    'Percussão sobre o nervo mediano no punho.',
    'Lado; parestesia irradiada.',
    'Complementar; menor acurácia isoladamente. Avaliar também força e atrofia tenar.',
    'Não se aplica.',
    0,
  ],
  finkel: [
    'Finkelstein (e diferença do Eichhoff)',
    'Avaliar o primeiro compartimento extensor (De Quervain).',
    'Finkelstein: o examinador segura o polegar do paciente e desvia o punho no sentido ulnar. Eichhoff: o paciente fecha a mão com o polegar dentro e o examinador desvia o punho ulnarmente (mais falsos-positivos).',
    'Lado; dor sobre o estiloide radial; qual técnica foi usada.',
    'Dor no estiloide radial sugere tenossinovite de De Quervain.',
    'Trauma com suspeita de fratura.',
    1,
  ],
  tabaq: [
    'Palpação da tabaqueira anatômica',
    'Pesquisar fratura do escafoide.',
    'Palpar a tabaqueira anatômica e o tubérculo do escafoide; compressão axial do polegar.',
    'Lado; dor à palpação.',
    'Dor após trauma: tratar como suspeita de fratura do escafoide (imobilizar e radiografar com incidências para escafoide), mesmo com radiografia inicial normal.',
    'Não aplicar testes de estresse.',
    0,
  ],
  a1: [
    'Polia A1 (dedo em gatilho)',
    'Avaliar tenossinovite estenosante.',
    'Palpar a face palmar sobre a cabeça do metacarpo e observar flexão e extensão ativas do dedo.',
    'Dedo; nódulo, dor e travamento.',
    'Nódulo doloroso com travamento sugere dedo em gatilho.',
    'Não se aplica.',
    0,
  ],
  tendao: [
    'Função tendínea isolada do dedo',
    'Avaliar lesão tendínea após trauma.',
    'FDP: bloquear a IFP e pedir flexão da IFD. FDS: manter os outros dedos estendidos e pedir flexão da IFP. Extensores: extensão ativa de cada articulação. Avaliar sensibilidade digital e perfusão.',
    'Dedo; função ausente ou fraca; sensibilidade e perfusão.',
    'Perda de função após trauma ou ferimento indica avaliação cirúrgica.',
    'Não se aplica.',
    0,
  ],
  cervMob: [
    'Mobilidade e palpação cervical',
    'Avaliar cervicalgia localizada.',
    'Flexão, extensão, inclinações e rotações; palpação de musculatura e processos espinhosos; avaliar o ombro conforme os sintomas.',
    'Amplitude, dor e pontos dolorosos.',
    'Orienta o diagnóstico de dor mecânica; procurar sinais neurológicos.',
    'Trauma cervical recente.',
    0,
  ],
  lombMob: [
    'Marcha, mobilidade e palpação lombar',
    'Avaliar lombalgia sem irradiação.',
    'Observar marcha; flexão, extensão e inclinações; palpar a musculatura e as sacroilíacas; avaliar o quadril conforme a localização.',
    'Amplitude, dor e achados.',
    'Lombalgia mecânica não exige imagem automática.',
    'Não se aplica.',
    0,
  ],
  neuroMI: [
    'Exame neurológico do membro inferior',
    'Localizar raiz acometida.',
    'Força (L2–L3 flexão do quadril, L3–L4 extensão do joelho, L4 dorsiflexão do tornozelo, L5 extensão do hálux, S1 flexão plantar), sensibilidade por dermátomos e reflexos patelar e aquileu.',
    'Déficits, lado e grau.',
    'Déficit motor ou sensitivo amplia a investigação; déficit progressivo exige urgência.',
    'Não se aplica.',
    0,
  ],
  lasegue: [
    'Elevação da perna estendida (Lasègue)',
    'Pesquisar radiculopatia lombossacra.',
    'Supino; elevar passivamente a perna estendida.',
    'Lado; ângulo; sintoma reproduzido e onde (dor irradiada abaixo do joelho x tensão posterior da coxa).',
    'Dor irradiada abaixo do joelho entre cerca de 30° e 70° sugere radiculopatia; tensão posterior da coxa não é positivo.',
    'Dor intensa.',
    0,
  ],
  lascruz: [
    'Lasègue cruzado',
    'Aumentar a especificidade para hérnia discal.',
    'Elevar a perna não sintomática.',
    'Reprodução da dor na perna sintomática.',
    'Positivo é mais específico para hérnia discal.',
    'Dor intensa.',
    0,
  ],
  femoral: [
    'Estiramento femoral',
    'Pesquisar radiculopatia L2–L4.',
    'Prono; flexão do joelho, com ou sem extensão do quadril.',
    'Lado; dor na face anterior da coxa.',
    'Dor anterior na coxa sugere radiculopatia lombar alta; avaliar o quadril em paralelo.',
    'Dor intensa.',
    0,
  ],
  claud: [
    'Marcha e pulsos',
    'Diferenciar claudicação neurogênica de vascular.',
    'Observar marcha; palpar pulsos pediosos e tibiais posteriores; perguntar se melhora ao sentar/flexionar o tronco ou apenas ao parar em pé.',
    'Pulsos, distância de marcha e fator de alívio.',
    'Melhora ao sentar ou flexionar sugere estenose do canal; pulsos reduzidos e alívio em pé sugerem causa vascular.',
    'Não se aplica.',
    0,
  ],
  reum: [
    'Encaminhar ao módulo de reumatologia',
    'Rigidez prolongada com melhora ao movimento sugere dor inflamatória.',
    'Abrir a consulta Reumatologia na APS para os padrões inflamatórios.',
    '—',
    '—',
    '—',
    0,
  ],
  quadrilMob: [
    'Mobilidade do quadril (rotação interna)',
    'Pesquisar doença intra-articular do quadril.',
    'Supino, quadril e joelho a 90°; rotação interna e externa passivas, comparando os lados.',
    'Graus de rotação interna; dor inguinal reproduzida.',
    'Dor inguinal com perda de rotação interna sugere doença intra-articular (artrose, lesão labral).',
    'Trauma com suspeita de fratura.',
    1,
  ],
  fadir: [
    'FADIR',
    'Provocar dor intra-articular / impacto femoroacetabular.',
    'Supino; flexão do quadril a 90°, adução e rotação interna.',
    'Lado; dor inguinal.',
    'Dor inguinal aumenta a suspeita de impacto ou lesão labral; muito sensível, pouco específico.',
    'Suspeita de fratura.',
    1,
  ],
  faber: [
    'FABER (Patrick)',
    'Diferenciar origem da dor: quadril ou sacroilíaca.',
    'Calcanhar sobre o joelho oposto (flexão, abdução e rotação externa); pressão suave sobre o joelho.',
    'Lado; localização da dor (inguinal ou posterior).',
    'Dor inguinal sugere quadril; dor posterior sugere sacroilíaca. Isolado, não determina a origem.',
    'Suspeita de fratura.',
    1,
  ],
  trocant: [
    'Palpação trocantérica e força de abdutores',
    'Avaliar dor lateral do quadril.',
    'Palpar o trocânter maior; abdução resistida em decúbito lateral; apoio unipodal por até 30 segundos se tolerado.',
    'Lado; dor à palpação e no apoio unipodal.',
    'Dor lateral reproduzida sugere síndrome dolorosa do grande trocânter.',
    'Não se aplica.',
    0,
  ],
  trendel: [
    'Trendelenburg',
    'Avaliar o glúteo médio.',
    'Apoio unipodal; observar a pelve.',
    'Lado de apoio; queda da pelve contralateral.',
    'Queda da pelve do lado oposto indica fraqueza do glúteo médio do lado apoiado.',
    'Dor intensa ou risco de queda.',
    0,
  ],
  siPal: [
    'Coluna, quadril e sacroilíaca',
    'Localizar a dor glútea.',
    'Palpar a sacroilíaca; avaliar coluna lombar e mobilidade do quadril; testes de provocação conforme a hipótese.',
    'Achados por estrutura.',
    'Combinação de achados orienta a origem; nenhum teste isolado define.',
    'Não se aplica.',
    0,
  ],
  joelhoAnt: [
    'Avaliação da dor anterior do joelho',
    'Avaliar a articulação patelofemoral.',
    'Mobilidade, palpação peripatelar, agachamento ou step-down se tolerado, alinhamento dos membros e avaliação do quadril.',
    'Dor reproduzida e tarefa avaliada.',
    'Dor anterior com agachamento sugere dor patelofemoral; avaliar quadril e alinhamento.',
    'Não se aplica.',
    0,
  ],
  interlinha: [
    'Palpação da interlinha articular',
    'Pesquisar lesão meniscal.',
    'Joelho fletido; palpar as interlinhas medial e lateral.',
    'Lado; interlinha dolorosa.',
    'Dor na interlinha, junto com a história, aumenta a suspeita meniscal.',
    'Não se aplica.',
    0,
  ],
  mcmurray: [
    'McMurray',
    'Pesquisar lesão meniscal.',
    'Supino, joelho em flexão máxima; rodar a tíbia (externa para menisco medial, interna para lateral) enquanto estende o joelho.',
    'Lado; estalido doloroso e localização.',
    'Estalido doloroso na interlinha aumenta a suspeita; combinação com história e palpação é mais útil que o teste isolado.',
    'Suspeita de fratura, joelho bloqueado ou dor intensa.',
    1,
  ],
  thessaly: [
    'Thessaly',
    'Pesquisar lesão meniscal com carga.',
    'Apoio unipodal com o joelho a 20° de flexão; rodar o corpo 3 vezes para cada lado, com o examinador segurando as mãos do paciente.',
    'Lado; dor na interlinha ou travamento.',
    'Dor na interlinha aumenta a suspeita meniscal.',
    'Somente com apoio seguro; não fazer com suspeita de fratura ou instabilidade importante.',
    1,
  ],
  lachman: [
    'Lachman',
    'Avaliar a estabilidade anterior (LCA).',
    'Supino, joelho a 20–30° de flexão; estabilizar o fêmur e tracionar a tíbia anteriormente.',
    'Lado; translação comparada ao outro lado; ponto final firme ou amolecido; limitação por dor.',
    'Translação aumentada com ponto final amolecido aumenta a suspeita de lesão do LCA; não confirma sozinho.',
    'Suspeita de fratura, dor intensa ou exame não tolerado.',
    1,
  ],
  gavant: [
    'Gaveta anterior do joelho',
    'Complementar a avaliação do LCA.',
    'Joelho a 90°, pé fixo; tracionar a tíbia anteriormente.',
    'Lado; translação comparada.',
    'Menos sensível que o Lachman na fase aguda.',
    'Suspeita de fratura ou dor intensa.',
    1,
  ],
  gavpost: [
    'Gaveta posterior',
    'Avaliar o LCP.',
    'Joelho a 90°, pé fixo; empurrar a tíbia posteriormente.',
    'Lado; translação comparada.',
    'Translação posterior aumentada sugere lesão do LCP.',
    'Suspeita de fratura.',
    1,
  ],
  sag: [
    'Sinal da queda posterior (sag)',
    'Avaliar o LCP.',
    'Supino, quadril e joelho a 90° com as pernas apoiadas; observar o contorno anterior da tíbia.',
    'Lado; queda posterior da tíbia.',
    'Queda posterior sugere lesão do LCP.',
    'Não se aplica.',
    0,
  ],
  valgo: [
    'Estresse em valgo',
    'Avaliar o ligamento colateral medial.',
    'Aplicar força em valgo a 0° e a 30° de flexão.',
    'Lado; dor e abertura medial em cada ângulo.',
    'Abertura a 30° sugere lesão do LCM; abertura a 0° sugere lesão combinada.',
    'Somente após afastar suspeita de fratura.',
    1,
  ],
  varo: [
    'Estresse em varo',
    'Avaliar o ligamento colateral lateral.',
    'Aplicar força em varo a 0° e a 30° de flexão.',
    'Lado; dor e abertura lateral.',
    'Abertura lateral sugere lesão do LCL ou do canto posterolateral.',
    'Somente após afastar suspeita de fratura.',
    1,
  ],
  derrame: [
    'Pesquisa de derrame articular',
    'Avaliar edema intra-articular.',
    'Teste da onda (bulge) e rechaço patelar; avaliar calor e mobilidade.',
    'Lado; derrame e calor.',
    'Derrame quente com febre ou dor intensa: considerar artrite séptica.',
    'Não se aplica.',
    0,
  ],
  mecExt: [
    'Mecanismo extensor',
    'Pesquisar ruptura do mecanismo extensor.',
    'Elevação ativa da perna estendida; palpar patela, tendão patelar e quadricipital.',
    'Lado; capacidade de estender e de manter a perna estendida; defeito palpável.',
    'Incapacidade após trauma sugere ruptura do mecanismo extensor ou fratura da patela: avaliação urgente.',
    'Não se aplica.',
    0,
  ],
  ottawaKnee: [
    'Regra de Ottawa do joelho',
    'Indicar radiografia após trauma do joelho.',
    'Verificar os critérios abaixo.',
    'Critérios presentes.',
    'Qualquer critério presente indica radiografia.',
    'Não se aplica.',
    0,
    'rule',
  ],
  ottawaAnkle: [
    'Regras de Ottawa do tornozelo e do pé',
    'Indicar radiografia após entorse.',
    'Palpar a borda posterior e a ponta dos maléolos (6 cm distais), a base do 5º metatarso e o navicular; avaliar se dá 4 passos.',
    'Critérios presentes.',
    'Indica radiografia quando há dor na região e algum critério presente.',
    'Não se aplica.',
    0,
    'rule',
  ],
  neuroPe: [
    'Exame neurológico e vascular do pé',
    'Avaliar formigamento ou entorse.',
    'Sensibilidade por território (plantar medial e lateral, sural, fibular), Tinel no túnel do tarso, pulsos pedioso e tibial posterior, perfusão.',
    'Déficits e pulsos.',
    'Alteração orienta investigação de neuropatia compressiva, diabética ou causa vascular.',
    'Não se aplica.',
    0,
  ],
  gavtorn: [
    'Gaveta anterior do tornozelo',
    'Avaliar o ligamento talofibular anterior.',
    'Joelho fletido; estabilizar a tíbia e tracionar o calcâneo anteriormente.',
    'Lado; translação comparada.',
    'Translação aumentada sugere lesão do talofibular anterior; mais confiável após 4–5 dias.',
    'Fase aguda dolorosa ou suspeita de fratura.',
    1,
  ],
  tilt: [
    'Inclinação talar',
    'Avaliar o ligamento calcaneofibular.',
    'Tornozelo neutro; inversão do calcâneo.',
    'Lado; abertura lateral comparada.',
    'Abertura aumentada sugere lesão do calcaneofibular.',
    'Fase aguda dolorosa ou suspeita de fratura.',
    1,
  ],
  thompson: [
    'Thompson',
    'Pesquisar ruptura do tendão de Aquiles.',
    'Prono, pé fora da maca; comprimir a panturrilha. Palpar o tendão em busca de defeito.',
    'Lado; presença ou ausência de flexão plantar; defeito palpável.',
    'Ausência de flexão plantar indica ruptura do Aquiles: encaminhamento urgente.',
    'Não se aplica.',
    0,
  ],
  fascia: [
    'Palpação da origem da fáscia plantar',
    'Localizar a dor no calcanhar.',
    'Palpar o tubérculo medial do calcâneo, com o hálux em dorsiflexão se necessário.',
    'Lado; dor à palpação.',
    'Dor localizada sugere fasciopatia plantar.',
    'Não se aplica.',
    0,
  ],
  windlass: [
    'Windlass',
    'Provocar dor na fáscia plantar.',
    'Dorsiflexão passiva do hálux, sentado ou em pé.',
    'Lado; reprodução da dor no calcanhar.',
    'Reprodução da dor sugere fasciopatia plantar.',
    'Não se aplica.',
    0,
  ],
  estresse: [
    'Palpação óssea focal',
    'Pesquisar fratura por estresse.',
    'Palpar metatarsos, navicular e tíbia distal no ponto doloroso.',
    'Local e dor óssea focal.',
    'Dor óssea focal após aumento de carga sugere fratura por estresse; evitar teste de salto se a suspeita for relevante.',
    'Não fazer teste de salto com suspeita relevante.',
    0,
  ],
};
const OREG = {
  ombro: [
    'Ombro',
    [
      ['Dor lateral ao elevar o braço', ['arco', 'jobe', 're_res', 'hawkins', 'neer']],
      ['Fraqueza para elevar o braço (sobretudo após trauma)', ['jobe', 're_res', 'droparm', 'lagre']],
      ['Suspeita de lesão do subescapular', ['belly', 'liftoff']],
      ['Dor sobre a acromioclavicular', ['crossbody']],
      ['Restrição progressiva da mobilidade', ['mobilRE']],
      ['Sensação de deslocamento ou luxações anteriores', ['apreensao']],
      ['Dor irradiada, parestesias ou relação com o pescoço', ['neuroMS', 'spurling']],
    ],
  ],
  mao: [
    'Cotovelo, punho e mão',
    [
      ['Dor lateral do cotovelo com preensão', ['extres', 'cozen']],
      ['Dor medial do cotovelo com esforço', ['medial', 'tinelcub']],
      ['Parestesia no 4º e 5º dedos', ['intrins', 'tinelcub', 'flexcot']],
      ['Parestesia noturna no território do mediano', ['phalen', 'durkan', 'tinelcarp']],
      ['Dor no estiloide radial relacionada ao polegar', ['finkel']],
      ['Trauma com dor na tabaqueira anatômica', ['tabaq']],
      ['Dedo que trava', ['a1']],
      ['Trauma com perda de movimento de um dedo', ['tendao']],
    ],
  ],
  cervical: [
    'Coluna cervical',
    [
      ['Cervicalgia localizada', ['cervMob']],
      ['Dor cervical irradiada ao braço', ['neuroMS', 'spurling', 'ultt']],
      ['Desequilíbrio, mãos desajeitadas ou sintomas bilaterais', ['mielo', 'neuroMS']],
    ],
  ],
  lombar: [
    'Coluna lombar',
    [
      ['Lombalgia sem irradiação', ['lombMob']],
      ['Dor irradiada à perna', ['neuroMI', 'lasegue', 'lascruz']],
      ['Dor anterior de coxa', ['neuroMI', 'femoral', 'quadrilMob']],
      ['Dor ao caminhar que melhora ao sentar', ['claud', 'neuroMI']],
      ['Rigidez prolongada que melhora com o movimento', ['reum']],
    ],
  ],
  quadril: [
    'Quadril',
    [
      ['Dor inguinal relacionada ao movimento', ['quadrilMob', 'fadir', 'faber']],
      ['Dor lateral, pior ao deitar sobre o lado', ['trocant']],
      ['Fraqueza ou queda pélvica ao caminhar', ['trendel', 'trocant']],
      ['Dor posterior ou glútea', ['siPal', 'faber', 'lombMob']],
      ['Trauma com incapacidade de apoiar', []],
    ],
  ],
  joelho: [
    'Joelho',
    [
      ['Dor anterior ao subir escadas ou agachar', ['joelhoAnt']],
      ['Torção com dor na interlinha ou travamento', ['interlinha', 'mcmurray', 'thessaly']],
      ['Estalo, edema precoce e instabilidade após trauma', ['ottawaKnee', 'lachman', 'gavant']],
      ['Trauma anterior na tíbia ou hiperflexão', ['gavpost', 'sag']],
      ['Trauma em valgo ou varo', ['ottawaKnee', 'valgo', 'varo']],
      ['Edema', ['derrame']],
      ['Incapacidade de estender ativamente após trauma', ['mecExt']],
    ],
  ],
  tornozelo: [
    'Tornozelo e pé',
    [
      ['Entorse', ['ottawaAnkle', 'neuroPe']],
      ['Instabilidade após entorse', ['gavtorn', 'tilt']],
      ['Estalo posterior e perda de impulsão', ['thompson']],
      ['Dor plantar no calcanhar nos primeiros passos', ['fascia', 'windlass']],
      ['Dor focal após aumento de treino ou carga', ['estresse']],
      ['Formigamento plantar', ['neuroPe']],
    ],
  ],
};
const RULES = {
  ottawaKnee: {
    items: [
      'Idade ≥ 55 anos',
      'Dor isolada na patela à palpação',
      'Dor na cabeça da fíbula à palpação',
      'Incapaz de fletir o joelho a 90°',
      'Incapaz de dar 4 passos (logo após e na avaliação)',
    ],
    ev: a =>
      a.length
        ? ['bad', 'Radiografia do joelho indicada.']
        : ['ok', 'Nenhum critério: radiografia não indicada pela regra.'],
  },
  ottawaAnkle: {
    items: [
      'Dor na região maleolar',
      'Dor à palpação da borda posterior ou ponta do maléolo lateral',
      'Dor à palpação da borda posterior ou ponta do maléolo medial',
      'Dor na região do mediopé',
      'Dor à palpação da base do 5º metatarso',
      'Dor à palpação do navicular',
      'Incapaz de dar 4 passos (logo após e na avaliação)',
    ],
    ev: a => {
      const h = x => a.includes(x),
        inc = h('Incapaz de dar 4 passos (logo após e na avaliação)');
      const tor =
        h('Dor na região maleolar') &&
        (h('Dor à palpação da borda posterior ou ponta do maléolo lateral') ||
          h('Dor à palpação da borda posterior ou ponta do maléolo medial') ||
          inc);
      const pe =
        h('Dor na região do mediopé') &&
        (h('Dor à palpação da base do 5º metatarso') || h('Dor à palpação do navicular') || inc);
      if (tor && pe) return ['bad', 'Radiografia do tornozelo e do pé indicadas.'];
      if (tor) return ['bad', 'Radiografia do tornozelo indicada.'];
      if (pe) return ['bad', 'Radiografia do pé indicada.'];
      return a.length ? ['ok', 'Critérios de radiografia não preenchidos.'] : ['', ''];
    },
  },
};
const OBASE = [
  ['insp', 'Inspeção', 'postura, marcha, edema, equimose, deformidade, atrofia, pele'],
  ['palp', 'Palpação', 'ponto doloroso, temperatura, estruturas, derrame'],
  ['ativa', 'Mobilidade ativa', 'amplitude e movimento que reproduz a dor'],
  ['passiva', 'Mobilidade passiva', 'comparação com a ativa, restrição'],
  ['forca', 'Força', 'movimento testado, grau, limitação por dor'],
  ['nv', 'Neurovascular', 'sensibilidade, força segmentar, reflexos, perfusão'],
  ['func', 'Função', 'tarefa relacionada à queixa, se tolerada'],
  ['adj', 'Regiões relacionadas', 'articulação adjacente ou coluna'],
];
const ORES = ['Positivo', 'Negativo', 'Inconclusivo', 'Não realizado'],
  ONR = ['Suspeita de lesão aguda', 'Limitado pela dor', 'Paciente não tolerou', 'Não indicado'];
const sideTx = s => (s === 'Direito' ? 'D' : s === 'Esquerdo' ? 'E' : s === 'Bilateral' ? 'bilateral' : '');
function ortSt() {
  return (st.v.ort = st.v.ort || { regs: [], r: {} });
}
function ortSuspFx() {
  const a = V('seguranca') || {};
  return a['Trauma com deformidade ou suspeita de fratura/luxação'] === '+';
}
function ortMans(rk) {
  const R = ortSt().r[rk] || {},
    sc = R.sc || [],
    m = {};
  OREG[rk][1].forEach(([n, ids]) => {
    if (sc.includes(n))
      ids.forEach(id => {
        (m[id] = m[id] || []).push(n);
      });
  });
  return m;
}
function ortAdapt(rk) {
  const R = ortSt().r[rk] || {},
    x = [];
  if (R.mob === 'Ativa reduzida, passiva preservada')
    x.push('Mobilidade ativa reduzida com passiva preservada: aprofundar força, tendões e limitação por dor.');
  if (R.mob === 'Ativa e passiva reduzidas')
    x.push('Ativa e passiva reduzidas: explorar padrão articular/capsular e causas de rigidez.');
  const f = R.fx || [];
  if (f.includes('Déficit sensitivo ou motor'))
    x.push('Déficit sensitivo ou motor: ampliar o exame neurológico (miótomos, dermátomos e reflexos).');
  if (f.includes('Sinovite em várias articulações'))
    x.push('Sinovite em várias articulações: abrir a consulta Reumatologia na APS.');
  if (f.includes('Dor não reproduzida na região'))
    x.push('Dor não reproduzida na região: considerar estruturas adjacentes e causas referidas.');
  if (ortSuspFx())
    x.unshift(
      'Suspeita de fratura ou luxação: priorizar avaliação neurovascular, proteger o membro e seguir o fluxo de trauma; manobras de estresse suspensas.',
    );
  if ((R.sc || []).includes('Trauma com incapacidade de apoiar'))
    x.unshift(
      'Trauma com incapacidade de apoiar: seguir o fluxo de suspeita de fratura; evitar manobras provocativas.',
    );
  return x;
}
export function rOrthoS(f) {
  const O = ortSt(),
    el = document.createElement('div');
  el.className = 'field';
  const draw = () => {
    el.innerHTML = `<div class="lab">Região da dor <span class="hint">pode marcar mais de uma</span></div><div class="chips" data-oreg></div><div class="qcards" data-ocards></div>`;
    const ch = el.querySelector('[data-oreg]');
    Object.entries(OREG).forEach(([k, [l]]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.textContent = l;
      b.setAttribute('aria-pressed', O.regs.includes(k));
      b.onclick = () => {
        const i = O.regs.indexOf(k);
        if (i >= 0) O.regs.splice(i, 1);
        else {
          O.regs.push(k);
          O.r[k] = O.r[k] || { sc: [], ex: {}, m: {} };
        }
        draw();
        drawO();
        upd();
      };
      ch.appendChild(b);
    });
    const cards = el.querySelector('[data-ocards]');
    O.regs.forEach(k => {
      const R = (O.r[k] = O.r[k] || { sc: [], ex: {}, m: {} });
      const c = document.createElement('div');
      c.className = 'qcard';
      c.innerHTML = `<div class="qcard-h"><h3>${OREG[k][0]}</h3></div><div class="pt-row"><div class="lbl">Lado<div class="seg">${['Direito', 'Esquerdo', 'Bilateral'].map(x => `<button type="button" data-side="${x}" aria-pressed="${R.side === x}">${x}</button>`).join('')}</div></div><label class="lbl" style="flex:1 1 220px">Ponto principal e irradiação<input type="text" data-pt placeholder="Ex.: interlinha medial, sem irradiação"></label></div><div class="blk"><div class="blk-h">Clínica encontrada</div><div class="chips" data-sc></div></div>`;
      c.querySelectorAll('[data-side]').forEach(
        b =>
          (b.onclick = () => {
            R.side = R.side === b.dataset.side ? '' : b.dataset.side;
            c.querySelectorAll('[data-side]').forEach(x => x.setAttribute('aria-pressed', R.side === x.dataset.side));
            drawO();
            upd();
          }),
      );
      const pt = c.querySelector('[data-pt]');
      pt.value = R.pt || '';
      pt.oninput = () => {
        R.pt = pt.value;
        upd();
      };
      const sc = c.querySelector('[data-sc]');
      OREG[k][1].forEach(([n]) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'chip';
        b.textContent = n;
        b.setAttribute('aria-pressed', R.sc.includes(n));
        b.onclick = () => {
          const i = R.sc.indexOf(n);
          if (i >= 0) R.sc.splice(i, 1);
          else R.sc.push(n);
          b.setAttribute('aria-pressed', R.sc.includes(n));
          drawO();
          upd();
        };
        sc.appendChild(b);
      });
      cards.appendChild(c);
    });
  };
  draw();
  return el;
}
export let drawO = () => {};
export function rOrthoO(f) {
  const el = document.createElement('div');
  el.className = 'field';
  el.style.gap = '16px';
  drawO = () => {
    const O = ortSt();
    el.innerHTML = '';
    if (!O.regs.length) {
      el.innerHTML =
        '<div class="empty">Selecione a região da dor na seção S para abrir o exame básico e as manobras sugeridas.</div>';
      return;
    }
    const susp = ortSuspFx();
    O.regs.forEach(k => {
      const R = O.r[k];
      R.ex = R.ex || {};
      R.m = R.m || {};
      const box = document.createElement('div');
      box.className = 'mgrp';
      box.innerHTML = `<div class="mgrp-h"><h3>Exame · ${OREG[k][0]}${R.side ? ' ' + sideTx(R.side) : ''}</h3><span class="ask">compare os lados; nada em branco vira “normal”</span></div><div class="grid-in" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">${OBASE.map(([key, l, ph]) => `<label>${l}<input type="text" data-ex="${key}" placeholder="${ph}"></label>`).join('')}</div>
        <div class="pt-row"><div class="lbl">Mobilidade<div class="seg" data-mob>${['Ativa reduzida, passiva preservada', 'Ativa e passiva reduzidas', 'Ambas preservadas'].map(x => `<button type="button" data-v="${x}" aria-pressed="${R.mob === x}">${x}</button>`).join('')}</div></div></div>
        <div class="chips" data-fx>${['Déficit sensitivo ou motor', 'Sinovite em várias articulações', 'Dor não reproduzida na região'].map(x => `<button type="button" class="chip" data-v="${x}" aria-pressed="${(R.fx || []).includes(x)}">${x}</button>`).join('')}</div>
        <div class="chk-list" data-adapt></div><div class="lab" style="margin-top:4px">Manobras sugeridas pela clínica</div><div class="mans"></div>`;
      box.querySelectorAll('[data-ex]').forEach(i => {
        i.value = R.ex[i.dataset.ex] || '';
        i.oninput = () => {
          R.ex[i.dataset.ex] = i.value;
          upd();
        };
      });
      box.querySelectorAll('[data-mob] button').forEach(
        b =>
          (b.onclick = () => {
            R.mob = R.mob === b.dataset.v ? '' : b.dataset.v;
            drawO();
            upd();
          }),
      );
      box.querySelectorAll('[data-fx] button').forEach(
        b =>
          (b.onclick = () => {
            R.fx = R.fx || [];
            const i = R.fx.indexOf(b.dataset.v);
            if (i >= 0) R.fx.splice(i, 1);
            else R.fx.push(b.dataset.v);
            drawO();
            upd();
          }),
      );
      const ad = ortAdapt(k);
      box.querySelector('[data-adapt]').innerHTML =
        ad
          .map(
            t =>
              `<div class="chk"><span class="cat ${/fratura|Suspeita/.test(t) ? 'k-bad' : 'k-mid'}">Próximo passo</span><span>${escaparHtml(t)}</span></div>`,
          )
          .join('') +
        ((R.fx || []).includes('Sinovite em várias articulações') ||
        (R.sc || []).includes('Rigidez prolongada que melhora com o movimento')
          ? '<div><a class="btn small" href="#reumato">Abrir Reumatologia na APS</a></div>'
          : '');
      const mans = ortMans(k),
        mb = box.querySelector('.mans');
      if (!Object.keys(mans).length)
        mb.innerHTML = '<p class="note">Marque a clínica encontrada na seção S para ver as manobras pertinentes.</p>';
      Object.entries(mans).forEach(([id, why]) => {
        const M_ = MAN[id];
        if (!M_) return;
        const r = (R.m[id] = R.m[id] || {});
        const rule = M_[7] === 'rule';
        const sus = susp && M_[6];
        if (id === 'reum') {
          mb.insertAdjacentHTML(
            'beforeend',
            '<div class="chk"><span class="cat k-mid">Sugestão</span><span>Rigidez prolongada com melhora ao movimento: use a consulta Reumatologia na APS.</span></div>',
          );
          return;
        }
        const d = document.createElement('details');
        d.className = 'mcard';
        if (r.res || (r.rule && r.rule.length)) d.open = false;
        d.innerHTML = `<summary><b>${escaparHtml(M_[0])}</b> <span class="cat ${sus ? 'k-bad' : r.res === 'Positivo' ? 'k-warn' : r.res === 'Negativo' ? 'k-ok' : r.res ? 'k-mid' : 'k-mid'}">${sus ? 'adiar' : r.res ? escaparHtml(r.res.toLowerCase()) : 'sugerido'}</span><span class="why">Motivo: ${escaparHtml(why.join('; ').toLowerCase())}</span></summary>
          <div class="mbody">${sus ? '<p class="badmsg">Suspeita de fratura ou luxação: não realizar esta manobra de estresse agora.</p>' : ''}<p><b>Objetivo:</b> ${escaparHtml(M_[1])}</p><p><b>Como realizar:</b> ${escaparHtml(M_[2])}</p><p><b>Registrar:</b> ${escaparHtml(M_[3])}</p><p><b>Interpretação:</b> ${escaparHtml(M_[4])}</p><p><b>Quando adiar:</b> ${escaparHtml(M_[5])}</p>
          ${
            rule
              ? `<div class="chips" data-rule>${RULES[id].items.map(x => `<button type="button" class="chip" data-v="${escaparHtml(x)}" aria-pressed="${(r.rule || []).includes(x)}">${escaparHtml(x)}</button>`).join('')}</div><p data-rres></p>`
              : `<div class="seg" data-res>${ORES.map(x => `<button type="button" data-v="${x}" aria-pressed="${r.res === x}">${x}</button>`).join('')}</div>
          <div class="seg" data-nr ${r.res === 'Não realizado' ? '' : 'hidden'}>${ONR.map(x => `<button type="button" data-v="${x}" aria-pressed="${r.nr === x}">${x}</button>`).join('')}</div>
          <div class="pt-row"><div class="lbl">Lado<div class="seg" data-ms>${['D', 'E', 'Bilateral'].map(x => `<button type="button" data-v="${x}" aria-pressed="${(r.side || sideTx(R.side)) === x || (x === 'Bilateral' && (r.side || sideTx(R.side)) === 'bilateral')}">${x}</button>`).join('')}</div></div><label class="lbl" style="flex:1 1 220px">Achado / sintoma reproduzido<input type="text" data-det placeholder="Ex.: estalido doloroso medial"></label></div>`
          }</div>`;
        if (rule) {
          const ev = () => {
            const [c, t] = RULES[id].ev(r.rule || []);
            const p = d.querySelector('[data-rres]');
            p.className = c === 'bad' ? 'warnmsg' : c === 'ok' ? 'okmsg' : 'note';
            p.textContent = t;
          };
          d.querySelectorAll('[data-rule] button').forEach(
            b =>
              (b.onclick = () => {
                r.rule = r.rule || [];
                const i = r.rule.indexOf(b.dataset.v);
                if (i >= 0) r.rule.splice(i, 1);
                else r.rule.push(b.dataset.v);
                b.setAttribute('aria-pressed', r.rule.includes(b.dataset.v));
                ev();
                upd();
              }),
          );
          ev();
        } else {
          d.querySelectorAll('[data-res] button').forEach(
            b =>
              (b.onclick = () => {
                r.res = r.res === b.dataset.v ? '' : b.dataset.v;
                d.querySelectorAll('[data-res] button').forEach(x =>
                  x.setAttribute('aria-pressed', r.res === x.dataset.v),
                );
                d.querySelector('[data-nr]').hidden = r.res !== 'Não realizado';
                const s = d.querySelector('summary .cat');
                s.textContent = r.res ? r.res.toLowerCase() : 'sugerido';
                s.className = 'cat ' + (r.res === 'Positivo' ? 'k-warn' : r.res === 'Negativo' ? 'k-ok' : 'k-mid');
                upd();
              }),
          );
          d.querySelectorAll('[data-nr] button').forEach(
            b =>
              (b.onclick = () => {
                r.nr = r.nr === b.dataset.v ? '' : b.dataset.v;
                d.querySelectorAll('[data-nr] button').forEach(x =>
                  x.setAttribute('aria-pressed', r.nr === x.dataset.v),
                );
                upd();
              }),
          );
          d.querySelectorAll('[data-ms] button').forEach(
            b =>
              (b.onclick = () => {
                r.side = b.dataset.v;
                d.querySelectorAll('[data-ms] button').forEach(x =>
                  x.setAttribute('aria-pressed', r.side === x.dataset.v),
                );
                upd();
              }),
          );
          const det = d.querySelector('[data-det]');
          det.value = r.det || '';
          det.oninput = () => {
            r.det = det.value;
            upd();
          };
        }
        mb.appendChild(d);
      });
      el.appendChild(box);
    });
  };
  drawO();
  return el;
}
export function ortLinesS() {
  const O = ortSt(),
    out = [];
  O.regs.forEach(k => {
    const R = O.r[k] || {};
    const p = [
      R.side ? (sideTx(R.side) === 'bilateral' ? 'bilateral' : R.side.toLowerCase()) : '',
      R.pt ? R.pt.trim() : '',
    ]
      .filter(Boolean)
      .join(', ');
    const sc = (R.sc || []).map(minusculaInicial);
    out.push(`Região: ${minusculaInicial(OREG[k][0])}${p ? ` (${p})` : ''}${sc.length ? ` – ${sc.join('; ')}` : ''}.`);
  });
  return out;
}
export function ortLinesO() {
  const O = ortSt(),
    out = [];
  O.regs.forEach(k => {
    const R = O.r[k] || {},
      nm = minusculaInicial(OREG[k][0]) + (R.side ? ' ' + sideTx(R.side) : '');
    const ex = OBASE.filter(([key]) => (R.ex || {})[key] && R.ex[key].trim()).map(
      ([key, l]) => `${minusculaInicial(l)}: ${R.ex[key].trim()}`,
    );
    if (R.mob) ex.push(`mobilidade: ${minusculaInicial(R.mob)}`);
    if (ex.length) out.push(`Exame do ${nm}: ${ex.join('; ')}.`);
    const mans = ortMans(k),
      t = [];
    Object.keys(mans).forEach(id => {
      const r = (R.m || {})[id] || {},
        M_ = MAN[id];
      if (!M_ || id === 'reum') return;
      if (M_[7] === 'rule') {
        if ((r.rule || []).length) {
          const [, tx] = RULES[id].ev(r.rule);
          t.push(`${M_[0]}: ${r.rule.map(minusculaInicial).join(', ')} – ${minusculaInicial(tx).replace(/\.$/, '')}`);
        }
        return;
      }
      if (!r.res) return;
      const sd = r.side || sideTx(R.side);
      t.push(
        `${M_[0]}${sd ? ' ' + sd : ''} ${r.res.toLowerCase()}${r.res === 'Não realizado' && r.nr ? ` (${minusculaInicial(r.nr)})` : ''}${r.det && r.det.trim() ? ` (${r.det.trim()})` : ''}`,
      );
    });
    if (t.length) out.push(`Manobras (${nm}): ${t.join('; ')}.`);
  });
  return out;
}
