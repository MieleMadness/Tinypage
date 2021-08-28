<template>
  <div :class="'w-full flex flex-col items-center justify-center ' + activeStyles">
    <div class="relative rounded" style="width: 201px;height:217px;overflow:hidden;">
      <iframe
          v-if="theme"
          scrolling="no"
          style="pointer-events: none;width: 375px;height: 406px;transform: scale(.536) translate(-163px, -175px);top:0;left:0;position:absolute;"
          :src="'/dashboard/appearance/preview/' + id"
          loading="lazy"
      />
    </div>
    <div class="font-bold text-black mb-1 mt-2 flex flex-col items-center justify-center">
      {{ label }}

      <a
          v-if="theme && icon"
          @click.self="onClick"
      >
        <div class="bg-gray-700 hover:bg-indigo-300"
             style="color: #FFF; text-shadow: 0 1px 2px #000; border-radius: 5px; height: 30px; width: 30px;"
             @click.self="onClick"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"
                  d="M364.13 125.25L87 403l-23 45 44.99-23 277.76-277.13-22.62-22.62zM420.69 68.69l-22.62 22.62 22.62 22.63 22.62-22.63a16 16 0 000-22.62h0a16 16 0 00-22.62 0z"
            />
          </svg>
        </div>
      </a>
    </div>
    <!--<span class="text-sm text-gray-500">Author: {{ userId }}</span>-->
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import UserProfileView from "~/components/profile/UserProfileView.vue";

export default Vue.extend({
  name: 'Theme',

  components: {
    UserProfileView
  },

  props: {
    id: String,
    colors: Object,
    label: String,
    icon: String,
    active: Boolean,
  },

  data() {
    return {
      theme: null as EditorTheme | null
    };
  },

  async mounted() {
    this.theme = await this.$axios.$post('/theme/' + this.id, {
      token: this.$store.getters['auth/getToken']
    }) as EditorTheme;
  },

  computed: {
    activeStyles() {
      if (!this.active) {
        return '';
      }
      return ' bg-indigo-200 border-indigo-600 border hover:bg-indigo-300';
    }
  },

  methods: {
    profile() {
      return {
        customHtml: this.theme?.customHtml,
        customCss: this.theme?.customCss,
        imageUrl: null,
        headline: 'Lorem ipsum',
        subtitle: 'Example subtitle',
        showWatermark: true,
        metadata: {
          privacyMode: false
        }
      };
    },

    onClick() {
      window.location.replace('/dashboard/appearance/theme/' + this.id);
    }
  }
});
</script>
