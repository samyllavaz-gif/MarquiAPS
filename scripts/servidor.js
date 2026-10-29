/**
 * Servidor estático mínimo para desenvolvimento local (sem dependências).
 * Necessário porque os módulos ES (<script type="module">) não carregam via file://.
 *
 * Uso:  npm start            → http://localhost:8080
 *       PORT=3000 npm start  → http://localhost:3000
 *
 * Por privacidade, o servidor não registra requisições e escuta só em 127.0.0.1.
 * O site não envia dados ao servidor: tudo é processado no navegador.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(fileURLToPath(new URL('..', import.meta.url)));

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.otf': 'font/otf',
  '.ttf': 'font/ttf',
};

/** Pastas que não fazem parte do site publicado. */
const BLOQUEADAS = ['node_modules', 'tests', 'scripts', '.git'];

export function criarServidor(raiz = RAIZ) {
  return createServer(async (req, res) => {
    try {
      const caminho = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      let arquivo = normalize(join(raiz, caminho));
      const relativo = arquivo.slice(raiz.length + 1).split(sep)[0];
      if (!arquivo.startsWith(raiz) || BLOQUEADAS.includes(relativo)) {
        res.writeHead(403).end('Proibido');
        return;
      }
      if ((await stat(arquivo).catch(() => null))?.isDirectory()) arquivo = join(arquivo, 'index.html');
      const conteudo = await readFile(arquivo);
      res.writeHead(200, {
        'Content-Type': TIPOS[extname(arquivo).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer',
        'X-Content-Type-Options': 'nosniff',
      });
      res.end(conteudo);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Não encontrado');
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const porta = Number(process.env.PORT) || 8080;
  criarServidor().listen(porta, '127.0.0.1', () => {
    console.log(`Marqui APS em http://localhost:${porta}  (Ctrl+C para encerrar)`);
  });
}
