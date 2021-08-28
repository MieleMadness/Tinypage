import fs from "fs";
import {FastifyInstance, FastifyReply, FastifyRequest} from "fastify";
import chalk from "chalk";
import axios, {AxiosResponse} from "axios";
import config from "./config/config";
import {StatusCodes} from "http-status-codes";

interface MicrositeRequest extends FastifyRequest {
    Querystring: {
        token?: string,
        scrolling: string
    };
}

/**
 * Creates all the routes.
 */
export class RouteHandler {
    fastify: FastifyInstance;

    constructor(fastify: FastifyInstance) {
        this.fastify = fastify;

        fastify.setNotFoundHandler((request, reply) => {
            reply.type('text/html').status(404);

            //language=HTML
            reply.send(`
                <html lang="">
                    <head>
                        <title>${config.appName} Web Client</title>
                        <meta charset="UTF-8">
                        <link rel="icon" type="image/x-icon" href="/favicon.png"/>
                        <link rel="icon" type="image/png" href="/favicon.png"/>
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
    }

    /**
     * Register routes
     */
    registerRoutes() {
        // Redirect old format
        this.fastify.get("/u/:handle", (request, reply) => {
            // Get requested profile handle from URL
            const handle = request.url.replace('/u/', '');
            reply.redirect(StatusCodes.PERMANENT_REDIRECT, '/' + handle);
        });

        /*
         Declare site route
         Route /*
        */
        this.fastify.get("*", async (request: FastifyRequest<MicrositeRequest>, reply: FastifyReply) => {
            // Get requested profile handle from URL
            const handle = request.url.replace('/', '');

            // Log MicrositeRequest
            console.log(`${chalk.cyan.bold(config.appName)}: Request received at /${handle} from ${request.ip}`);

            let response: AxiosResponse<{ profile: Profile, links: Link[], user: User, theme: Theme }> | undefined;

            const scrolling = request.query.scrolling === undefined || request.query.scrolling === "true";

            try {
                // Fetch profile from API

                if (request.query.token) {
                    response = await axios.post<{ profile: Profile, links: Link[], user: User, theme: Theme }>(`${config.apiUrl}/profile/${handle}`, {
                        token: request.query.token
                    });
                } else {
                    response = await axios.get<{ profile: Profile, links: Link[], user: User, theme: Theme }>(`${config.apiUrl}/profile/${handle}`);
                }

            } catch (err) {
                // Log error
                console.log(`${chalk.cyan.bold(config.appName)}: Error when processing request`);
                console.log(`${chalk.cyan.bold(config.appName)}: ${err}`);
            }

            if (!response) {
                reply.type('text/html').status(404);

                //language=HTML
                return reply.send(`
                    <!DOCTYPE html>
                    <html lang="">
                    <head>
                        <title>${config.appName} Web Client</title>
                        <meta charset="UTF-8">
                        <link rel="icon" type="image/x-icon" href="/favicon.png"/>
                        <link rel="icon" type="image/png" href="/favicon.png"/>
                        <style>
                            .text {
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: center;
                                font-size: 30px;
                            }

                            .header {
                                color: #1a202c;
                                margin-bottom: 0.5rem;
                                font-weight: bolder;
                            }

                            .message {
                                font-size: 1.25rem;
                                color: #718096;
                                margin-bottom: 1rem;
                            }
                        </style>
                    </head>
                    <body>
                    <div class="text" style="width: 800px; height: 400px; margin: 0 auto; text-align: center">
                        <h1 class="header">404 - Not Found</h1>
                        <h3 class="message">We couldn't find what you were looking for, sorry!</h3>
                    </div>
                    <link rel="stylesheet"
                          href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.0.4/tailwind.min.css"
                    />
                    <style>
                        @import url('https://rsms.me/inter/inter.css');

                        html {
                            font-family: 'Inter', sans-serif;
                        }

                        @supports (font-variation-settings: normal) {
                            html {
                                font-family: 'Inter var', sans-serif;
                            }
                        }
                    </style>
                    </body>
                    </html>
                `);
            }

            // Define profile
            const profile = response.data.profile;
            profile.headline = profile.headline ?? '';
            profile.subtitle = profile.subtitle ?? '';

            // Define user
            const user = response.data.user;

            // Define theme = response.data.theme;
            const theme = response.data.theme ?? {
                customCss: '',
                customHtml: '',
            };

            // Define Avatar image
            const imageUrl = profile.imageUrl || `https://www.gravatar.com/avatar/${user.emailHash}`;

            if (request.query.token) {
                // This is a editor session, ignore
            } else {
                // Record page view
                if (!profile.metadata?.privacyMode)
                    await axios.get(`${config.apiUrl}/analytics/profile/record/${profile.id}`);
            }

            // Define Link HTML Block
            //language=HTML
            let linkHtml = '';

            // Define links & sort by order
            const links = response.data.links.sort(function (a: Link, b: Link) {
                return a.sortOrder - b.sortOrder;
            });

            // Add link html to html block link-by-link
            for (let index = 0; index < links.length; index++) {

                let link = links[index];
                switch (link.type) {
                    case 'link': {
                        let subtitleHtml = '';
                        //language=HTML
                        if (link.subtitle) {
                            subtitleHtml = `<span
                                    class="text-sm text-gray-700 sl-link-subtitle mt-1"
                            >${link.subtitle}</span>`;
                        }
                        let css = link.customCss ?? '';
                        //language=HTML
                        linkHtml += `
                            <a
                                    id="sl-item-${link.id}"
                                    href="${config.apiUrl}/analytics/link/record/${link.id}"
                                    class="w-full sl-item-parent"
                                    target="_blank"
                            >
                                <div
                                        class="rounded-2xl shadow bg-white p-4 w-full font-medium mb-3 nc-link sl-item  flex items-center justify-center flex-col"
                                        style="${css}"
                                >
                                    <span class="font-medium text-gray-900 sl-label">${link.label}</span>${subtitleHtml}
                                </div>
                            </a>
                        `;
                        break;
                    }
                    case 'social': {
                        if (!link.metadata?.socialIcons)
                            break;

                        try {
                            let socialIcons: { type: string, color: string, scale: number, url: string }[] = link.metadata?.socialIcons ?? [];

                            if (socialIcons.length > 0) {
                                let css = link.customCss ?? '';

                                linkHtml += `
                                        <div class="social-button-list" style="margin-top: -1rem;${css}">`;
                            }

                            for (let i = 0; i < socialIcons.length; i++) {
                                let siSettings = socialIcons[i];
                                if (!siSettings.type)
                                    siSettings.type = "email";

                                if (!siSettings.color)
                                    siSettings.color = "#000000";

                                if (!siSettings.scale)
                                    siSettings.scale = 40;

                                let svgData = "";

                                switch (siSettings.type) {
                                    case "email":
                                        svgData = fs.readFileSync(`${__dirname}/static/icons/mail-outline.svg`).toString('utf-8');
                                        break;
                                    case "text":
                                        svgData = fs.readFileSync(`${__dirname}/static/icons/message.svg`).toString('utf-8');
                                        break;
                                    case "phone":
                                        svgData = fs.readFileSync(`${__dirname}/static/icons/call-outline.svg`).toString('utf-8');
                                        break;
                                    case "facebook":
                                        svgData = fs.readFileSync(`${__dirname}/static/icons/logo-facebook.svg`).toString('utf-8');
                                        break;
                                    case "discord":
                                        svgData = fs.readFileSync(`${__dirname}/static/icons/logo-discord.svg`).toString('utf-8');
                                        break;
                                    case "twitter":
                                        svgData = fs.readFileSync(`${__dirname}/static/icons/logo-twitter.svg`).toString('utf-8');
                                        break;
                                    case "instagram":
                                        svgData = fs.readFileSync(`${__dirname}/static/icons/logo-instagram.svg`).toString('utf-8');
                                        break;
                                    case "tiktok":
                                        svgData = fs.readFileSync(`${__dirname}/static/icons/logo-tiktok.svg`).toString('utf-8');
                                        break;
                                    case "spotify":
                                        svgData = fs.readFileSync(`${__dirname}/static/icons/logo-spotify.svg`).toString('utf-8');
                                        break;
                                    case "youtube":
                                        svgData = fs.readFileSync(`${__dirname}/static/icons/logo-youtube.svg`).toString('utf-8');
                                        break;
                                    case "applemusic":
                                        svgData = fs.readFileSync(`${__dirname}/static/icons/logo-apple-music.svg`).toString('utf-8');
                                        break;
                                    case "soundcloud":
                                        svgData = fs.readFileSync(`${__dirname}/static/icons/logo-soundcloud.svg`).toString('utf-8');
                                        break;
                                    case "linkedin":
                                        svgData = fs.readFileSync(`${__dirname}/static/icons/logo-linkedin.svg`).toString('utf-8');
                                        break;
                                    case "twitch":
                                        svgData = fs.readFileSync(`${__dirname}/static/icons/logo-twitch.svg`).toString('utf-8');
                                        break;
                                    case "pinterest":
                                        svgData = fs.readFileSync(`${__dirname}/static/icons/logo-pinterest.svg`).toString('utf-8');
                                        break;
                                }

                                let scale = null;
                                scale = siSettings.scale;

                                //language=HTML
                                linkHtml += `
                                    <a id="sl-item-a-${link.id}-${i}"
                                       href="${siSettings.url}"
                                       class="social-button"
                                       target="_blank"
                                       style="color:${siSettings.color};"
                                       onclick="{
                                         let recordUrl = '${config.apiUrl}/analytics/link/record/${link.id}'
                                         fetch(recordUrl, {method: 'POST'});
                                       }"
                                    >
                                        ${svgData}
                                        <script>
                                            {
                                                let svgElement = document.querySelector("#sl-item-a-${link.id}-${i} svg");
                                                svgElement.querySelector("title")?.remove();
                                                svgElement.setAttribute("style", "color:${siSettings.color};");
                                                let scale = ${scale};
                                                if (scale) {
                                                    svgElement.setAttribute("height", scale);
                                                    svgElement.setAttribute("width", scale);
                                                }

                                            }
                                        </script>
                                    </a>
                                `;
                            }

                            if (socialIcons.length > 0) {
                                linkHtml += `</div>`;
                            }
                        } catch (e) {
                            console.warn("Failed to parse social icon: " + link.subtitle);
                        }

                        break;
                    }
                    case 'vcard': {
                        let css = link.customCss ?? '';
                        //language=HTML
                        linkHtml += `
                            <a
                                    id="sl-item-${link.id}"
                                    href="${config.apiUrl}/analytics/link/record/${link.id}"
                                    class="w-full sl-item-parent"
                                    target="_blank"
                            >
                                <div
                                        class="rounded-2xl shadow bg-white p-4 w-full font-medium mb-3 nc-link sl-item  flex items-center justify-center flex-col"
                                        style="${css}"
                                >
                                    <span class="font-medium text-gray-900 sl-label">${link.label}</span>
                                </div>
                            </a>
                        `;
                        break;
                    }
                    case 'image': {
                        let css = link.customCss ?? '';

                        //language=HTML
                        linkHtml += `
                            <img id="sl-item-${link.id}" src="${link.url}" class="w-full h-auto"
                                 style="margin-bottom:.75rem;border-radius:4px;${css}" alt="link image"
                            />
                        `;
                        break;
                    }

                    case 'divider': {
                        if (!link.metadata?.dividerSettings)
                            break;

                        let css = link.customCss ?? '';

                        try {
                            let dividerSettings: { color: string, fontSize: number } = link.metadata?.dividerSettings ?? {};

                            if (!dividerSettings.color) {
                                dividerSettings.color = "#FFFFFFFF";
                            }

                            if (!dividerSettings.fontSize)
                                dividerSettings.fontSize = 18;

                            let color = dividerSettings.color;

                            //language=HTML
                            linkHtml += `
                                <div class="flex flex-row items-center justify-center w-full"
                                     style="margin-bottom:.75rem;${css}"
                                >
                                    <div style="flex-grow:1;background:${color};height:1px;"></div>
                                    <div style="margin:0 8px; text-transform:uppercase;font-weight:600;color:${color};letter-spacing:1px;font-size:${dividerSettings.fontSize};">
                                        ${link.label}
                                    </div>
                                    <div style="flex-grow:1;background:${color};height:1px;"></div>
                                </div>
                            `;
                        } catch (e) {
                            console.warn("Failed to parse divider: " + link.subtitle);
                        }
                        break;
                    }
                    case "text": {
                        let text = link.subtitle;

                        let css = link.customCss ?? '';

                        //language=HTML
                        linkHtml += `
                            <div style="overflow: hidden; ${css}"
                                 class="rounded-2xl w-full font-medium mb-3"
                            >
                                <div class="ql-editor">
                                    ${text}
                                </div>
                            </div>
                        `;

                        break;
                    }
                    case "html": {
                        let text = link.subtitle;

                        let css = link.customCss ?? '';

                        //language=HTML
                        linkHtml += `
                            <div style="overflow: hidden; ${css}"
                                 class="rounded-2xl w-full mb-3"
                            >
                                ${text}
                            </div>
                        `;

                        break;
                    }
                    case 'youtube': {
                        let css = link.customCss ?? '';

                        let watchId = link.url.match(/v=([^&]*)/);
                        if (watchId && watchId.length > 0 && watchId[1]) {
                            //language=HTML
                            linkHtml += `
                                <style>.embed-container {
                                    border-radius: 4px;
                                    width: 100%;
                                    position: relative;
                                    padding-bottom: 56.25%;
                                    height: 0;
                                    overflow: hidden;
                                    max-width: 100%;
                                }

                                .embed-container iframe, .embed-container object, .embed-container embed {
                                    position: absolute;
                                    top: 0;
                                    left: 0;
                                    width: 100%;
                                    height: 100%;
                                }</style>
                                <div class="embed-container" style="margin-bottom:.75rem;${css}">
                                    <iframe title="youtube"
                                            src="https://www.youtube.com/embed/${watchId[1]}?playsinline=0&controls=2"
                                            frameborder="0" allowfullscreen loading="lazy"
                                    ></iframe>
                                </div>
                            `;
                        }
                    }
                        break;
                }
            }

            // Define headline HTML
            //language=HTML
            const headlineHtml = `<h1 class="text-black font-semibold text-2xl sl-headline">${profile.headline}</h1>`;

            // Define subtitle HTML
            let subtitleHtml = ``;
            //language=HTML
            if (profile.subtitle) {
                subtitleHtml = `<h3 class="text-gray-600 mb-4 sl-subtitle">${profile.subtitle}</h3>`;
            }

            // Define theme colors html
            let themeColorsHtml = ``;

            //language=HTML
            if (theme && theme.colors) {
                themeColorsHtml = `
                    <style>
                        .sl-headline {
                            color: ${theme.colors?.text.primary ?? 'inherit'};
                        }

                        .sl-subtitle {
                            opacity: .85;
                            color: ${theme.colors?.text.primary ?? 'inherit'};
                        }

                        .sl-bg {
                            background: ${theme.colors?.fill.primary ?? 'inherit'};
                        }

                        .sl-item {
                            background: ${theme.colors?.fill.secondary ?? 'inherit'};
                        }

                        .sl-label {
                            color: ${theme.colors?.text.secondary ?? 'inherit'};
                        }

                        .sl-link-subtitle {
                            opacity: .85;
                            color: ${theme.colors?.text.secondary ?? 'inherit'};
                        }
                    </style>`;
            }

            if (profile.metadata?.coverImage) {
                //language=HTML
                themeColorsHtml += `
                    <style>
                        img.nc-avatar {
                            border: solid 2px #FFF;
                            /* Your Avatar border width & color */
                            box-shadow: 0 2px 5px rgba(0, 0, 0, .25);
                            width: 120px !important;
                            height: 120px !important;
                            margin-top: min(calc(56.25vw - 65px), 180px);
                        }

                        body, html {
                            background-size: cover;
                            /* Placeholder BG Color if image doesn't load */
                            overflow-x: hidden !important;
                            position: relative;
                            z-index: -2;
                        }

                        .sl-banner {
                            position: absolute;
                            top: 0;
                            left: 0;
                            right: 0;
                            padding-bottom: min(56.25%, 240px);
                            width: 100%;
                            max-width: 35rem;
                            border-radius: 10px 10px 3px 3px;
                            background: #9D50BB; /* Your cover background color, fallback if image doesn't load/before image loads */
                            background: url('${profile.metadata?.coverImage}');
                            background-size: cover;
                            background-position: center;
                            margin: 0 auto 10px auto;
                            z-index: -1;
                        }

                        section {
                            margin-top: 10px;
                        }

                        .sl-bg {
                            background: transparent !important; /* DO NOT CHANGE */
                        }

                        @media (max-width: 400px) {
                            section {
                                margin-top: 0;
                            }

                            .sl-banner {
                                border-radius: 0 0 3px 3px;
                                margin: 0 auto;
                            }
                        }

                        section {
                            padding-top: 0 !important;
                        }
                    </style>
                `;
            }

            // Build watermark string
            let watermarkHtml = '';

            if (profile.showWatermark) {
                watermarkHtml += `<div id="sl-watermark" class="flex flex-col items-center justify-center">`;

                if (theme && theme.colors) {
                    watermarkHtml += `
        <div style="color: ${theme.colors.text.primary};max-width:230px;" class="mt-4 mb-2 mx-auto text-sm" >
          Proudly built with ${config.appName}
        </div>`;
                } else {
                    watermarkHtml += `
        <div v-else style="color:rgba(0,0,0,1);max-width:230px;" class="mt-4 mb-2 mx-auto text-sm">
          Proudly built with ${config.appName}
        </div>`;
                }

                if (config.freeSignup) {
                    //language=HTML
                    watermarkHtml += `
                        <a class="text-indigo-600 hover-underline text-sm" href="${config.editorUrl}/create-account"
                           target="_blank"
                        >
                            Create your free micro-site in minutes!
                        </a>`;
                }

                watermarkHtml += `<base target="_blank">`;
                watermarkHtml += `</div>`;
            }

            if (profile.customCss === null) {
                profile.customCss = '';
            }
            if (profile.customHtml === null) {
                profile.customHtml = '';
            }
            if (theme.customCss === null) {
                theme.customCss = '';
            }
            if (theme.customHtml === null) {
                theme.customHtml = '';
            }

            let shouldHideScrollbar = "";
            if (!scrolling) {
                //language=CSS
                shouldHideScrollbar = `
                    html {
                        overflow: scroll;
                        overflow-x: hidden;
                    }

                    ::-webkit-scrollbar {
                        width: 0; /* Remove scrollbar space */
                        background: transparent; /* Optional: just make scrollbar invisible */
                    }

                    /* Optional: show position indicator in red */
                    ::-webkit-scrollbar-thumb {
                        background: #FF0000;
                    }
                `;
            }

            let pageHtml = "";
            if (profile.metadata?.pageHtml) {
                pageHtml = profile.metadata.pageHtml;
            }

            // Send response content type to text/html
            reply.type('text/html');

            // Send response to client
            // language=HTML
            return reply.send(`
                <!DOCTYPE html>
                <html lang="">
                <head>
                    <title>${profile.headline} - ${config.appName}</title>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">

                    <!-- Meta -->
                    <meta name="title" content="${profile.headline} - ${config.appName}">
                    <meta name="description"
                          content="${profile.subtitle} | Powered by ${config.appName}"
                    >

                    <!-- Open Graph-->
                    <meta property="og:title" content="${profile.headline} - ${config.appName}">
                    <meta property="og:description"
                          content="${profile.subtitle} | Powered by ${config.appName}"
                    >
                    <meta property="og:image" content="${config.apiUrl}/profile/thumbnail/${handle}">
                    <meta property="og:type" content="website">

                    <!-- Twitter Cards -->
                    <meta name="twitter:title" content="${profile.headline} - ${config.appName}">
                    <meta name="twitter:description"
                          content="${profile.subtitle} | Powered by ${config.appName}"
                    >
                    <meta name="twitter:image" content="${config.apiUrl}/profile/thumbnail/${handle}">
                    <meta name="twitter:card" content="summary_large_image">

                    <link rel="icon" type="image/x-icon" href="/favicon.png"/>
                    <link rel="icon" type="image/png" href="/favicon.png"/>

                    <link rel="stylesheet" href="/css/quill.core.min.css"/>

                    <!-- Tailwind CSS Embedded Styles -->
                    <style>
                        *, ::after, ::before {
                            box-sizing: border-box;
                            border-width: 0;
                            border-style: solid;
                            border-color: rgba(229, 231, 235, 1)
                        }

                        html {
                            -moz-tab-size: 4;
                            tab-size: 4
                            line-height: 1.15;
                            -webkit-text-size-adjust: 100%
                        }

                        body {
                            margin: 0
                            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
                            line-height: 1.5
                        }

                        b, strong {
                            font-weight: bolder
                        }

                        blockquote, dd, dl, figure, h1, h2, h3, h4, h5, h6, hr, p, pre {
                            margin: 0
                        }

                        img {
                            border-style: solid
                        }

                        h1, h2, h3, h4, h5, h6 {
                            font-size: inherit;
                            font-weight: inherit
                        }

                        a {
                            color: inherit;
                            text-decoration: inherit
                        }

                        audio, canvas, embed, iframe, img, object, svg, video {
                            display: block;
                            vertical-align: middle
                        }

                        img, video {
                            max-width: 100%;
                            height: auto
                        }

                        .relative {
                            position: relative
                        }

                        .mx-auto {
                            margin-left: auto;
                            margin-right: auto
                        }

                        .mt-1 {
                            margin-top: .25rem
                        }

                        .mt-4 {
                            margin-top: 1rem
                        }

                        .mb-2 {
                            margin-bottom: .5rem
                        }

                        .mb-3 {
                            margin-bottom: .75rem
                        }

                        .mb-4 {
                            margin-bottom: 1rem
                        }

                        .flex {
                            display: flex
                        }

                        .h-auto {
                            height: auto
                        }

                        .min-h-screen {
                            min-height: 100vh
                        }

                        .w-full {
                            width: 100%
                        }

                        .w-screen {
                            width: 100vw
                        }

                        .flex-row {
                            flex-direction: row
                        }

                        .flex-col {
                            flex-direction: column
                        }

                        .items-center {
                            align-items: center
                        }

                        .justify-center {
                            justify-content: center
                        }

                        .rounded-2xl {
                            border-radius: 1rem
                        }

                        .bg-white {
                            background-color: rgba(255, 255, 255, 1)
                        }

                        .bg-gray-100 {
                            background-color: rgba(243, 244, 246, 1)
                        }

                        .p-4 {
                            padding: 1rem
                        }

                        .p-6 {
                            padding: 1.5rem
                        }

                        .pt-8 {
                            padding-top: 2rem
                        }

                        .pb-8 {
                            padding-bottom: 2rem
                        }

                        .text-center {
                            text-align: center
                        }

                        .text-sm {
                            font-size: .875rem;
                            line-height: 1.25rem
                        }

                        .text-2xl {
                            font-size: 1.5rem;
                            line-height: 2rem
                        }

                        .font-medium {
                            font-weight: 500
                        }

                        .font-semibold {
                            font-weight: 600
                        }

                        .text-black {
                            color: rgba(0, 0, 0, 1)
                        }

                        .text-gray-600 {
                            color: rgba(75, 85, 99, 1)
                        }

                        .text-gray-700 {
                            color: rgba(55, 65, 81, 1)
                        }

                        .text-gray-900 {
                            color: rgba(17, 24, 39, 1)
                        }

                        .shadow {
                            box-shadow: 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)
                        }

                        ${theme.customCss}
                        ${profile.customCss}
                    </style>


                    <style>
                        .nc-avatar {
                            width: 60px;
                            height: 60px;
                            border-radius: 1000px;
                        }

                        .nc-link {
                            background-color: #FFF;
                            padding: 1rem;
                            margin-bottom: .75rem;
                            width: 100%;
                            border-radius: .25rem;
                            box-shadow: 0 1px 3px 0 rgb(0 0 (0 / 10%)), 0 1 px 2 px 0 rgb(0 0 (0 / 6 %));
                            font-weight: 500;
                            cursor: pointer;
                            transition: transform .15s ease-in-out;
                        }

                        .nc-link:hover {
                            transform: scale(1.02);
                        }

                        .nc-link:active {
                            transform: scale(1);
                        }

                        body {
                            overflow-x: hidden;
                        }

                        /*Override ql-editor settings*/
                        .ql-editor {
                            white-space: initial;
                            padding: 12px 0;
                        }

                        .page-width {
                            max-width: 24rem;
                        }

                        .page-padding {
                            padding: 1.5rem;
                        }

                        @media (min-width: 540px) {
                            .page-width {
                                max-width: 35rem;
                            }
                        }
                    </style>

                    <style>
                        html, * {
                            font-family: 'Inter',
                            -apple-system,
                            BlinkMacSystemFont,
                            'Segoe UI',
                            Roboto,
                            'Helvetica Neue',
                            Arial,
                            sans-serif;
                            font-size: 16px;
                            line-height: 1.65;
                            word-spacing: 1px;
                            -ms-text-size-adjust: 100%;
                            -webkit-text-size-adjust: 100%;
                            -moz-osx-font-smoothing: grayscale;
                            -webkit-font-smoothing: antialiased;
                            box-sizing: border-box;
                        }

                        h1.sl-headline, h3.sl-subtitle {
                            line-height: 1.65;
                            word-spacing: 1px;
                            -ms-text-size-adjust: 100%;
                            -webkit-text-size-adjust: 100%;
                            -moz-osx-font-smoothing: grayscale;
                            -webkit-font-smoothing: antialiased;
                        }

                        *,
                        *::before,
                        *::after {
                            box-sizing: border-box;
                            margin: 0;
                        }
                    </style>

                    <style>
                        .social-button-list {
                            display: flex;
                            flex-direction: row;
                            justify-content: center;
                            align-items: center;
                            margin: 0 auto;
                            width: 300px;
                            list-style: none;
                        }

                        .social-button {
                            display: inline-block;
                            margin: 15px auto;
                            padding: 1rem;
                            cursor: pointer;
                            transition: all .15s ease-in-out;
                        }
                    </style>

                    <style>
                        ${shouldHideScrollbar}
                    </style>
                </head>
                <body>
                <div class="relative flex min-h-screen w-screen bg-gray-100 justify-center w-full sl-bg">
                    <div
                            id="user-site-view"
                            class="relative flex min-h-screen w-screen bg-gray-100 justify-center w-full sl-bg"
                    >
                        <section
                                class="flex flex-col p-6 pt-8 pb-8 items-center text-center page-width w-full"
                        >
                            <img class="nc-avatar mb-2" src="${imageUrl}" alt="avatar"/>
                            ${headlineHtml}
                            ${subtitleHtml}
                            ${linkHtml}
                            <!-- Site html -->
                            <div id="custom-html">
                                ${profile.customHtml}
                            </div>
                            <!-- Theme html -->
                            <div id="theme-html">
                                ${theme.customHtml}
                                <div class="sl-banner"></div>
                            </div>
                            <!-- Watermark -->
                            ${watermarkHtml}
                            ${themeColorsHtml}
                            ${pageHtml}
                        </section>
                    </div>
                </div>
                </body>
                </html>
            `);
        });
    }
}
