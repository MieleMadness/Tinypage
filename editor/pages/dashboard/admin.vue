<template>
  <section class="flex flex-col p-8 items-center flex-grow overflow-x-hidden overflow-y-scroll">
    <h1 class="text-gray-800 font-extrabold tracking-tight text-3xl w-full mb-4">
      Admin dashboard
    </h1>
    <form class="flex flex-col w-full bg-white shadow p-8 rounded-xl">
      <div class="flex flex-col lg:flex-row mb-3">
        <div class="flex flex-col w-full lg:w-1/2 mr-4 mb-3 lg:mb-0">
          <label class="font-bold opacity-70 text-sm text-black" for="name">Platform name</label>
          <input
            id="name"
            class="p-2 mt-2 text-sm border-solid border-gray-300 rounded-2xl border"
            type="text"
            placeholder="e.g. Singlelink"
          >
        </div>
        <div class="flex flex-col w-full lg:w-1/2">
          <label class="font-bold opacity-70 text-sm text-black" for="subtitle">Platform slogan</label>
          <input
            id="subtitle"
            class="p-2 mt-2 text-sm border-solid border-gray-300 rounded-2xl border"
            type="text"
            placeholder="e.g. Tiny pages, big impact."
          >
        </div>
      </div>
      <div class="flex flex-col lg:flex-row mb-3">
        <div class="flex flex-col w-full lg:w-1/2 mr-4 mb-3 lg:mb-0">
          <label class="font-bold opacity-70 text-sm text-black" for="primaryColor">Primary color</label>
          <input
            id="primaryColor"
            class="p-2 mt-2 text-sm border-solid border-gray-300 rounded-2xl border"
            type="text"
            placeholder="e.g. #5353EC"
          >
        </div>
        <div class="flex flex-col w-full lg:w-1/2">
          <label class="font-bold opacity-70 text-sm text-black" for="secondaryColor">Secondary color</label>
          <input
            id="secondaryColor"
            class="p-2 mt-2 text-sm border-solid border-gray-300 rounded-2xl border"
            type="text"
            placeholder="e.g. #C4C4C4"
          >
        </div>
      </div>
      <div class="flex flex-row items-center justify-center space-x-4 mb-4">
        <input type="hidden" name="avatar_url" id="avatar_url" class="simple-file-upload"
               v-model="user.activeProfile.imageUrl">
        <div class="flex flex-col w-auto flex-grow flex-1">
          <label class="font-bold opacity-70 text-sm text-black" for="image_url">Logo image URL</label>
          <input
            id="image_url"
            v-model="user.activeProfile.imageUrl"
            class="p-2 mt-2 text-sm border-solid border-gray-300 rounded-2xl border"
            type="text"
            placeholder="e.g. https://uifaces.co/our-content/donated/rSuiu_Hr.jpg"
          >
          <div
            v-if="!isProfileValid"
            class="py-3 px-4 rounded-2xl bg-red-200 border border-red-400 text-red-500 flex flex-col items-start mt-2 text-sm"
          >
            <span class="font-semibold">Warning!</span>
            <span class="text-xs font-semibold">Your site picture may be improperly formatted! Please ensure your image is loaded via an SSL and ends in .gif, .png, .jpg, .jpeg, or another supported file extension.<a
              href="https://www.notion.so/neutroncreative/Troubleshooting-9a162db4a8ce482d89b3d3e1bc9825ba"
              target="_blank"
              class="ml-2 font-semibold underline hover:text-red-700"
            >Learn more</a></span>
          </div>
        </div>
      </div>
      <button
        type="button"
        class="mt-2 inline-flex p-3 text-white text-center bg-gdp hover:bg-indigo-500 rounded-2xl font-bold w-auto max-w-xs justify-center align-center"
        @click="saveChanges"
      >
        Save changes
      </button>
    </form>

  </section>
</template>


<script lang="ts">
import Vue from "vue";

type ThemeModalIntent = "create" | "edit";

export default Vue.extend({
  name: 'DashboardAdmin',
  layout: 'dashboard',
  middleware: 'authenticated',

  head() {
    return {
      title: 'Admin - ' + process.env.APP_NAME,
      meta: [
        {hid: 'robots', name: 'robots', content: 'noindex'}
      ]
    }
  },

  data() {
    return {
      originalHandle: '',
      user: {
        name: '',
        email: '',
        activeProfile: {
          imageUrl: '',
          headline: '',
          subtitle: '',
          handle: '',
          customDomain: '',
          visibility: ''
        }
      },
      pendingTheme: {
        id: '',
        label: '',
        global: true,
        colors: {
          fill: {
            primary: '',
            secondary: ''
          },
          text: {
            primary: '',
            secondary: ''
          }
        },
        customCss: undefined,
        customHtml: undefined,
      } as EditorTheme,
      themeError: '',
      themes: new Array<Theme>(),
      themeModalActive: false,
      themeModalIntent: 'create' as ThemeModalIntent,
      isAdmin: false,
      isProfileValid: false,
    };
  },

  async beforeMount() {
    const permGroup = await this.$axios.$post("/admin/perm-group", {
      token: this.$store.getters['auth/getToken']
    });

    this.isAdmin = permGroup["groupName"] === 'admin';

    this.isProfileValid = this.isAdmin;
  },

  async mounted() {
    //await this.loadThemes();
    await this.getUserData();
  },

  methods: {
    async getUserData() {
      try {
        const token = this.$store.getters['auth/getToken'];
        const userResponse = await this.$axios.$post('/user', {
          token
        });
        const profileResponse = await this.$axios.$post('/profile/active-profile', {
          token
        });
        this.user = userResponse;
        this.user.activeProfile = profileResponse;
        this.originalHandle = this.user.activeProfile.handle;
      } catch (err) {
        console.log('Error getting user data');
        console.log(err);
      }
    },
  }
});
</script>

<style lang="scss">
.nc-theme {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 80px;
  height: 80px;
  margin-right: 10px;
  cursor: pointer;

  &.active {
    box-shadow: inset 0 0 2px 2px #5353EC;
  }

  .nc-inner {
    position: relative;
    width: 40px;
    height: 40px;
    border-radius: 40px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .edit-icon {
    position: absolute;
    top: 2px;
    right: 5px;
    color: #3e39ab;
  }

  .nc-bottom-inner {
    width: 100%;
    height: 15px;
    margin-top: auto;
  }

  &:hover {
    transform: scale(1.02);
  }

  &:active {
    transform: scale(1);
  }
}

/**
  Animations
 */
.fade-enter-active, .fade-leave-active {
  transition: opacity .25s;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>
