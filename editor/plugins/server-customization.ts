import {Context, Plugin} from '@nuxt/types';

const defaultSettings: Partial<DbServerCustomization> = {
  title: "Singlelink",
  brandName: "Singlelink",
  productName: "Singlelink",
  company: "Neutron Creative Inc.",
  contactEmail: "contact@neutroncreative.com",
  icons: {
    mainIcon: "/sl-icon.svg",
    favicon: "/sl-icon.svg"
  },
  metaTitle: "Singlelink - The open-source Linktree alternative & micro-site platform",
  metaDescription: "Singlelink is the open-source Linktree alternative without limits. Supercharge your micro-site in sixty seconds today!",
  metaImageUrl: "https://singlelink-22fp7.ondigitalocean.app/open-graph-image-v2.png",
  colors: undefined,
  customHtml: undefined,
  customCss: undefined,
  metadata: {}
};

declare module 'vue/types/vue' {
  // this.$transform inside Vue components
  interface Vue {
    $customSettings: DbServerCustomization
  }
}

declare module '@nuxt/types' {
  // nuxtContext.app.$transform inside asyncData, fetch, plugins, middleware, nuxtServerInit
  interface NuxtAppOptions {
    $customSettings: DbServerCustomization
  }

  // nuxtContext.$transform
  interface Context {
    $customSettings: DbServerCustomization
  }
}

const exportPlugin: Plugin = async (context: Context, inject) => {
  if (process.env.ENABLE_WHITELABEL) {
    let settings = (await context.$axios.get<{ customization: DbServerCustomization }>('/app/settings')).data.customization;

    inject('customSettings', settings);
  } else {

    inject('customSettings', defaultSettings);
  }
};

export default exportPlugin;
