<template>
  <div class="relative flex min-h-screen w-screen bg-gray-100 justify-center w-full sl-bg">
    <UserProfileView
      v-if="theme"
      :preview="true"
      :profile-data="theme"
    />
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import UserProfileView from "~/components/profile/UserProfileView.vue";

export default Vue.extend({
  components: {
    UserProfileView
  },
  middleware: 'authenticated',
  data() {
    return {
      id: null as string | null | undefined,
      theme: null as EditorTheme | null,
      themes: [] as EditorTheme[]
    };
  },

  head() {
    return {
      title: 'Theme preview - ' + this.$customSettings.productName,
      meta: [
        {
          hid: 'robots',
          name: 'robots',
          content: 'noindex'
        }
      ]
    };
  },

  mounted() {
    this.id = this.$route.path.replace('/dashboard/appearance/preview/', '');
    this.loadThemes();
  },

  methods: {
    async loadThemes() {
      try {
        // Grab themes from response
        this.theme = await this.$axios.$post('/theme/' + this.id, {
          token: this.$store.getters['auth/getToken']
        });

        // console.log(this.themes);
      } catch (error) {
        console.log('Failed to get themes');
        console.log(error);
      }
    },
  }
});
</script>
