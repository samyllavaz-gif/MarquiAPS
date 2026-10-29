import * as PDFLib from '../../../assets/vendor/pdf-lib/pdf-lib.esm.min.js';
import { montarCabecalho, montarRodape } from '../../componentes/cabecalho.js';

// O gerador e os modelos PDF do arquivo original permanecem incorporados à página.
window.PDFLib = PDFLib;
montarCabecalho({ pagina: 'ses-bauru.html', rotaAtiva: 'requisicoes' });
montarRodape();
