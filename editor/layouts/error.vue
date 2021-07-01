<template>
  <section class="flex flex-col px-8 items-center overflow-x-hidden overflow-y-scroll py-16">
    <component :is="'style'" v-if="$customSettings.customCss">
      {{ $customSettings.customCss }}
    </component>

    <div class="flex flex-row items-center justify-start mb-4 space-x-4 mt-8">
      <img class="w-12" src="/Grimacing face.svg">
      <h1 class="text-black font-extrabold tracking-tight text-5xl w-full flex flex-row items-start lg:items-center">
        Uh oh!
      </h1>
    </div>

    <p class="font-bold text-2xl opacity-70 text-black text-center">We're sorry, but we couldn't find the page you were
      looking for.<br>Try checking the URL!</p>

    <GDPRConsentPopup/>

    <div id="custom-global-html" v-html="$customSettings.customHtml"/>
  </section>
</template>

<script lang="ts">
import Vue from "vue";
import GDPRConsentPopup from "~/components/utilities/GDPRConsentPopup.vue";

export default Vue.extend({
  components: {GDPRConsentPopup},
  layout: 'dashboard',

  head() {
    return {
      title: this.$customSettings.metaTitle,
      meta: [
        {charset: 'utf-8'},
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1, user-scalable=no'
        },
        {
          hid: 'description',
          name: 'description',
          content: this.$customSettings.metaDescription
        },
        {
          hid: 'twitter:description',
          name: 'twitter:description',
          content: this.$customSettings.metaDescription
        },
        {
          hid: 'og:image',
          name: 'og:image',
          content: this.$customSettings.metaImageUrl
        },
        {
          hid: 'twitter:image',
          name: 'twitter:image',
          content: this.$customSettings.metaImageUrl
        },
        {
          hid: 'og:title',
          name: 'og:title',
          content: this.$customSettings.metaTitle
        },
        {
          hid: 'twitter:title',
          name: 'twitter:title',
          content: this.$customSettings.metaTitle
        },
        {
          hid: 'og:description',
          name: 'og:description',
          content: this.$customSettings.metaDescription
        },
        {
          hid: 'twitter:url',
          name: 'twitter:url',
          content: ('https://' + process.env.HOSTNAME) ?? 'https://app.singlelink.co'
        },
        {
          hid: 'twitter:card',
          name: 'twitter:card',
          content: 'summary_large_image'
        }
      ],
      link: [
        {
          rel: 'icon',
          type: 'image/x-icon',
          href: this.$customSettings.icons.favicon
        },
        {
          rel: 'stylesheet',
          href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.1/css/all.min.css'
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com'
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap'
        }
      ],
    };
  }
});
</script>
