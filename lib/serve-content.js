import { createServer } from 'http';
import serveHandler from 'serve-handler';

/**
 * Serve a directory on a random port using a HTTP server and the serve-handler package.
 *
 * @returns a promise that resolves with the server instance once the server is ready and listening.
 */
const serveDirectory = async ({ basedir, port }) =>
    new Promise((resolve) => {
        const server = createServer((request, response) => serveHandler(request, response, { public: basedir }));
        server.listen(port, () => resolve(server));
    });

/**
 * Close the given server instance asynchronously.
 */
const closeServer = async (server) =>
    new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));

export { serveDirectory, closeServer };
