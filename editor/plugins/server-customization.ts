import {Context, Plugin} from '@nuxt/types';
import * as process from "process";

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
        $customSettings: DbServerCustomization;
    }
}

declare module '@nuxt/types' {
    // nuxtContext.app.$transform inside asyncData, fetch, plugins, middleware, nuxtServerInit
    interface NuxtAppOptions {
        $customSettings: DbServerCustomization;
    }

    // nuxtContext.$transform
    interface Context {
        $customSettings: DbServerCustomization;
    }
}

const exportPlugin: Plugin = async (context: Context, inject) => {
    if (process.env.ENABLE_WHITELABEL) {
        let settings: DbServerCustomization = {
            icons: {},
            colors: {}
        } as any;

        if (process.env.CUSTOM_TITLE) {
            settings.title = process.env.CUSTOM_TITLE;
        }

        if (process.env.CUSTOM_BRAND_NAME) {
            settings.brandName = process.env.CUSTOM_BRAND_NAME;
        }

        if (process.env.CUSTOM_PRODUCT_NAME) {
            settings.productName = process.env.CUSTOM_PRODUCT_NAME;
        }

        if (process.env.CUSTOM_COMPANY) {
            settings.company = process.env.CUSTOM_COMPANY;
        }

        if (process.env.CUSTOM_CONTACT_EMAIL) {
            settings.contactEmail = process.env.CUSTOM_CONTACT_EMAIL;
        }

        if (process.env.CUSTOM_ICONS_MAIN_ICON) {
            settings.icons.mainIcon = process.env.CUSTOM_ICONS_MAIN_ICON;
        }

        if (process.env.CUSTOM_ICONS_FAVICON) {
            settings.icons.favicon = process.env.CUSTOM_ICONS_FAVICON;
        }

        if (process.env.CUSTOM_COLORS_MAIN_COLOR) {
            settings.colors.mainColor = process.env.CUSTOM_COLORS_MAIN_COLOR;
        }

        if (process.env.CUSTOM_COLORS_SECONDARY_COLOR) {
            settings.colors.secondaryColor = process.env.CUSTOM_COLORS_SECONDARY_COLOR;
        }

        if (process.env.CUSTOM_COLORS_MAIN_TEXT_COLOR) {
            settings.colors.mainTextColor = process.env.CUSTOM_COLORS_MAIN_TEXT_COLOR;
        }

        if (process.env.CUSTOM_COLORS_SECONDARY_TEXT_COLOR) {
            settings.colors.secondaryTextColor = process.env.CUSTOM_COLORS_SECONDARY_TEXT_COLOR;
        }

        if (process.env.CUSTOM_META_TITLE) {
            settings.metaTitle = process.env.CUSTOM_META_TITLE;
        }

        if (process.env.CUSTOM_META_DESCRIPTION) {
            settings.metaDescription = process.env.CUSTOM_META_DESCRIPTION;
        }

        if (process.env.CUSTOM_HTML) {
            settings.customHtml = process.env.CUSTOM_HTML;
        }

        if (process.env.CUSTOM_CSS) {
            settings.customCss = process.env.CUSTOM_CSS;
        }

        settings = (await context.$axios.get<{ customization: DbServerCustomization }>('/app/settings')).data.customization;

        inject('customSettings', settings);
    } else {

        inject('customSettings', defaultSettings);
    }
};

export default exportPlugin;
