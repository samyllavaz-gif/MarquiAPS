/**
 * Mapa das folhas da densitometria: onde cada dado é escrito sobre a imagem do formulário oficial.
 * Coordenadas em pontos (pt) a partir do canto superior esquerdo.
 * B = Laudo BPA-I · H = Pedido de exame do HC.
 */
/** Escala das imagens de fundo (tamanho original → página de 594 × 840 pt). */
export const ESCALA_FOLHAS_DENSITOMETRIA = {
  B: `scale(${594 / 598.805},${840 / 843.475})`,
  H: `scale(${594 / 595.3},${840 / 841.9})`,
};

// t: texto em uma linha [chave, x, x1, linhaBase, {center,size,upper}]
// c: quadradinhos [chave, x, x1, n, linhaBase]
// x: caixa de marcar [chave, x, y, w, h]
// m: texto em várias linhas [chave, x, x1, primeiraBase, recuo, altLinha, limiteInferior]
export const MAPA_DENSITOMETRIA = {
  B: {
    t: [
      ['nome_h', 313, 479, 120.5],
      ['rg', 500, 568, 120.5],
      ['idade', 314, 408, 140.5],
      ['clinica', 324, 458, 162],
      ['servico', 501, 567, 162],
      ['dat_d', 393, 425, 181, { center: 1 }],
      ['dat_m', 429, 465, 181, { center: 1 }],
      ['dat_a', 472, 508, 181, { center: 1 }],
      ['nome', 121, 568, 216],
      ['mae', 330, 556, 234.5],
      ['endereco', 130, 433, 250.5],
      ['tel', 480, 567, 250.5, { upper: 0 }],
      ['municipio', 81, 212, 267.5],
      ['uf', 233, 265, 267.5, { center: 1 }],
      ['nasc', 483, 567, 267.5],
      ['convnome', 240, 566, 281.5],
      ['medico', 340, 568, 365],
      ['hipotese', 134, 437, 427],
      ['cid', 481, 566, 427],
      ['dl_d', 54, 77, 628, { center: 1 }],
      ['dl_m', 80, 106, 628, { center: 1 }],
      ['dl_a', 109, 140, 628, { center: 1 }],
    ],
    c: [
      ['cpf', 111.8, 260.5, 11, 234.5],
      ['cep', 290, 398, 8, 267.5],
      ['cpfmed', 106.4, 255.8, 11, 365],
    ],
    x: [
      ['sexF', 482.6, 132, 10.8, 11],
      ['sexM', 529, 132, 10.8, 11],
      ['convS', 99.5, 273.5, 10.5, 9.5],
      ['convN', 132, 273.5, 10.5, 9.5],
      ['pDens', 33, 326.1, 12.7, 9.7],
      ['pBio', 33, 338.4, 12.6, 11.5],
    ],
    box: [
      [99.5, 273.5, 10.5, 9.5],
      [132, 273.5, 10.5, 9.5],
    ],
    m: [
      ['resumo', 30, 565, 459, 154, 11, 498],
      ['exames', 30, 565, 509, 202, 11, 593],
    ],
  },
  H: {
    t: [
      ['enfermaria', 87, 203, 250],
      ['leito', 242, 295, 250],
      ['medicacao', 120, 563, 283.5, { upper: 0 }],
      ['hipotese', 141, 563, 386],
      ['resultados', 206, 563, 405, { upper: 0 }],
      ['condobs', 34, 562, 437, { upper: 0 }],
      ['hconvout', 365, 434, 457],
      ['hdata', 482, 569, 459],
      ['medico', 129, 350, 490],
      ['cpfmedf', 470, 563, 490],
    ],
    c: [],
    x: [
      ['oAmb', 34.4, 196.5, 14.1, 14],
      ['oTri', 120, 196.5, 14.1, 14],
      ['oPS', 186.2, 196.5, 14.1, 14],
      ['cAle', 24.2, 411.5, 12, 12],
      ['cPro', 87.2, 411.5, 12, 12],
      ['cRen', 199.2, 411.5, 12, 12],
      ['cBio', 367.2, 411.5, 12, 12],
      ['cGra', 493.2, 411.5, 12, 12],
      ['hSUS', 94.2, 446.2, 12, 12],
      ['hARE', 150.2, 446.2, 12, 12],
      ['hCS', 213.2, 446.2, 12, 12],
      ['kPre', 200.6, 570.4, 12, 12],
      ['kRot', 352.7, 570.4, 12, 12],
      ['kEme', 472.7, 570.4, 12, 12],
    ],
    m: [['resumo', 22, 563, 306, 108, 11, 370]],
  },
};
const LINHAS_EXAMES_HC = [189.5, 175.2, 160.9, 146.5, 132.2, 118.0, 103.7, 89.4, 75.1, 59.3];
LINHAS_EXAMES_HC.forEach((b, i) => {
  const base = 841.9 - b - 3.6;
  MAPA_DENSITOMETRIA.H.t.push([`ex_t${i}`, 24, 281, base], [`ex_m${i}`, 287, 424, base], [`ex_o${i}`, 430, 573, base]);
});
