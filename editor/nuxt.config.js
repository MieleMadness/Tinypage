const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

export default {
  /*
  ** Nuxt rendering mode
  ** See https://nuxtjs.org/api/configuration-mode
  */
  ssr: true,

  /*
  ** Nuxt target
  ** See https://nuxtjs.org/api/configuration-target
  */
  target: 'server',

  loading: {
    color: '#5353ec',
    height: '3px'
  },

  server: {
    host: process.env.SERVER_HOST ?? '0.0.0.0',
    port: process.env.PORT ?? 80
  },

  /*
  ** Headers of the page
  ** See https://nuxtjs.org/api/configuration-head
  */
  head: {
    script: [
      {
        hid: 'slpa',
        src: 'https://singlelink.co/slpa.js',
        defer: true,
        'data-domain': 'singlelink.co',
        async: true
      },
      {
        hid: 'simplefileupload',
        src: 'https://app.simplefileupload.com/buckets/299048f4bf460802e90ea160f0c46064.js',
        defer: true
      }
    ]
  },
  /*
  ** Global CSS
  */
  css: [
    '~/assets/css/theme.css'
  ],
  /*
  ** Plugins to load before mounting the App
  ** https://nuxtjs.org/guide/plugins
  */
  plugins: [
    {
      src: '~plugins/draggable.js',
      ssr: true
    },
    {
      src: '~plugins/cssjson.ts',
      ssr: true,
    },
    {
      src: '~plugins/server-customization.ts',
      ssr: true,
    },
    {
      src: '~plugins/monaco.js',
      ssr: false
    }
  ],
  /*
  ** Auto import components
  ** See https://nuxtjs.org/api/configuration-components
  */
  components: true,
  /*
  ** Nuxt.js dev-modules
  */
  buildModules: [
    // Doc: https://github.com/nuxt-community/eslint-module
    '@nuxt/typescript-build',
    // Doc: https://github.com/nuxt-community/nuxt-tailwindcss
    '@nuxtjs/tailwindcss',
    '@nuxtjs/dotenv'
  ],
  /*
  ** Nuxt.js modules
  */
  modules: [
    // Doc: https://axios.nuxtjs.org/usage
    '@nuxtjs/axios',
    'cookie-universal-nuxt',
    '@aceforth/nuxt-optimized-images',
    '@nuxtjs/sitemap',
    'cookie-universal-nuxt'
  ],

  optimizedImages: {
    optimizeImages: true
  },

  /*
  ** Axios module configuration
  ** See https://axios.nuxtjs.org/options
  */
  axios: {
    baseURL: 'https://api.singlelink.co' /* fallback */
  },

  env: {
    ENABLE_WHITELABEL: process.env.ENABLE_WHITELABEL === 'true',
    API_URL: process.env.API_URL ?? 'https://api.singlelink.co',
    HOSTNAME: process.env.HOSTNAME ?? 'app.singlelink.co',
    LEADERBOARD: process.env.LEADERBOARD === 'true',
    SUPPORT: process.env.SUPPORT ?? 'https://discord.gg/wqjKmsRP39',
    PORT: process.env.PORT ?? 3000,
    LOGO_WIDTH: process.env.LOGO_WIDTH ?? '200px',
    ICON_WIDTH: process.env.ICON_WIDTH ?? '46px',
    FREE_SIGNUP: process.env.FREE_SIGNUP ? (process.env.FREE_SIGNUP === 'true') : true,
    QR_API: process.env.QR_API || null,
  },

  publicRuntimeConfig: {
    axios: {
      browserBaseURL: process.env.API_URL
    }
  },

  privateRuntimeConfig: {
    axios: {
      baseURL: process.env.API_URL
    }
  },

  sitemap: {
    hostname: 'https://' + process.env.HOSTNAME ?? 'app.singlelink.co'
  },
  /*
  ** Build configuration
  ** See https://nuxtjs.org/api/configuration-build/
  */
  build: {
    plugins: [
      new MonacoWebpackPlugin({
        features: [
          '!goToDefinitionCommands',
          '!goToDefinitionMouse',
          '!referenceSearch'
        ],
        languages: ['css', 'html'],
      })
    ],
    extend(config, ctx) {
      // const vue = ctx.loaders.vue;

      // Added Line
      config.devtool = ctx.isClient ? 'eval-source-map' : 'inline-source-map';
    }
  },
};