import chalk from "chalk";
import fastifyInit from "fastify";
import fastify_static from "fastify-static";
import config from "./config/config";
import {RouteHandler} from "./route-handler";
import path from "path";

const fastify = fastifyInit({logger: false});

fastify.register(fastify_static, {
    root: path.join(__dirname, 'static'),
    list: false,
});

fastify.setNotFoundHandler((request, reply) => {
    reply.type('text/html');
    reply.send(`
                <html lang="">
                    <head>
                        <title>${config.appName} Web Client</title>
                        <meta charset="UTF-8">
                        <link rel="icon" type="image/x-icon" href="favicon.ico"/>
                        <link rel="icon" type="image/png" href="favicon.ico"/>
                    </head>
                    <body>
                        <div class="w-full h-full flex flex-col items-center justify-center">
                            <h1 class="text-4xl text-gray-900 mb-2 font-extrabold">404 - Not Found</h1>
                            <h3 class="text-lg text-gray-600 mb-4">We couldn't find what you were looking for, sorry!</h3>
                            <a class="bg-indigo-600 hover:bg-indigo-500 rounded-2xl shadow text-white py-3 px-6 text-sm font-medium" href="` + request.url + `">Reload page</a>
                        </div>
                        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.0.4/tailwind.min.css"/>
                        <style>
                            @import url('https://rsms.me/inter/inter.css');
                            html { font-family: 'Inter', sans-serif; }
                            @supports (font-variation-settings: normal) {
                            html { font-family: 'Inter var', sans-serif; }
                            }
                        </style>
                    </body>
                </html>
            `);
});

let routeHandler = new RouteHandler(fastify);

routeHandler.registerRoutes();

// Run the server!
async function start() {
    try {
        console.clear();
        console.log(`${chalk.cyan.bold(config.appName)}: Starting application...`);

        await fastify.listen(config.port, config.host);

        console.log(`${chalk.cyan.bold(config.appName)}: Application listening on port ${config.port}`);
    } catch (err) {
        console.log(`${chalk.cyan.bold(config.appName)}: Error!`);
        console.log(`${chalk.cyan.bold(config.appName)}: ${err}`);

        process.exit(1);
    }
}

start().then(() => {
    // do nothing
});
