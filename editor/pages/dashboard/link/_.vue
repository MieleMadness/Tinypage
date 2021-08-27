<template>
  <section class="flex flex-col p-8 items-center overflow-x-hidden overflow-y-scroll">
    <div class="flex flex-row items-center justify-start mb-4 space-x-4 mb-4">
      <img class="w-8" src="/icons/Pencil.svg"/>
      <h1 class="text-black font-extrabold tracking-tight text-3xl w-full flex flex-row items-start lg:items-center">
        <span v-if="intent==='create'">Create link</span>
        <span v-if="intent==='edit'">Edit link</span>
      </h1>
    </div>

    <!-- Type -->
    <div v-show="intent !=='view'"
         class="flex flex-col mb-4 justify-start w-full"
    >
      <label class="font-semibold mb-2">Link type</label>
      <select v-model="pendingLink.type" class="p-2 mt-2 text-sm border-solid border-gray-300 rounded-2xl border"
      >
        <option disabled selected>Select a link type</option>
        <option value="link">URL (default)</option>
        <option value="social">Social Icon</option>
        <option value="vcard">vCard/Add To Contacts</option>
        <option value="image">Image</option>
        <option value="divider">Divider</option>
        <option value="text">Text</option>
        <option value="html">HTML Snippet</option>
        <option value="youtube">Youtube Video</option>
      </select>
    </div>

    <!-- Label -->
    <div v-show="intent !=='view'"
         class="flex flex-col mb-4 justify-start w-full"
    >
      <label class="font-semibold mb-2">Label</label>

      <input v-model="pendingLink.label"
             class="p-2 mt-2 text-sm border-solid border-gray-300 rounded-2xl border"
             placeholder="e.g. Some memorable name" type="text"
      />
    </div>

    <!-- Subtitle -->
    <div v-show="intent!=='view' && showOption(pendingLink.type, 'subtitle')"
         class="flex flex-col mb-4 justify-start w-full"
    >
      <label v-if="pendingLink.type === 'text'" class="font-semibold mb-2">Text</label>
      <label v-else-if="pendingLink.type === 'html'" class="font-semibold mb-2">HTML</label>
      <label v-else class="font-semibold mb-2">Subtitle (optional)</label>

      <client-only>
        <VueEditor v-if="pendingLink.type === 'text'"
                   v-model="pendingLink.subtitle"
                   class="mb-20"
        />

        <MonacoEditor
            v-else-if="pendingLink.type === 'html'"
            v-model="pendingLink.subtitle"
            :options="{
                  extraEditorClassName: 'rounded overflow-hidden mb-2',
                  autoIndent: 'full',
                  autoClosingQuotes: true,
                }"
            height="350"
            language="html"
            theme="vs-dark"
        ></MonacoEditor>

        <input v-else
               v-model="pendingLink.subtitle"
               class="p-2 mt-2 text-sm border-solid border-gray-300 rounded-2xl border"
               placeholder="e.g. Read more about my adventures in Peru!" type="text"
        />
      </client-only>
    </div>

    <!-- Divider Settings -->
    <div v-show="intent!=='view'" class="flex flex-col mb-4 justify-start w-full">
      <!-- Divider settings-->
      <label v-if="pendingLink.type === 'divider'" class="font-semibold mb-2">Divider Color</label>
      <div v-show="pendingLink.type === 'divider'">
        <input
            v-model="dividerSettings.color"
            class="p-3 mb-5 w-full rounded-lg bg-white text-sm text-gray-700"
            placeholder="e.g. #FFF"
            :data-jscolor="jsColorOptions"
        >

        <label v-if="pendingLink.type === 'divider'" class="font-semibold mt-2 mb-2">Divider Font Size</label>
        <input
            v-model="dividerSettings.fontSize"
            class="p-3 w-full rounded-lg bg-white text-sm text-gray-700"
            type="number"
        >
      </div>
    </div>

    <!-- Social Icon Settings -->
    <div v-show="intent!=='view' && pendingLink.type === 'social'" class="flex flex-col mb-4 justify-start w-full">
      <div class="flex flex-col lg:flex-row items-center justify-center items-center w-full mb-4">
        <div
            class="flex-grow text-center text-lg px-4 py-4 font-bold text-white rounded-2xl hover:bg-indigo-500 bg-gdp mb-4 lg:mb-0 cursor-pointer"
            @click="addSocialIcon()"
        >
          Add Icon
        </div>
      </div>

      <div v-for="(siSettings, index) of socialIcons" class="p-4 m-2 border-2 rounded-2xl">
        <div class="flex flex-row justify-start items-center">
          <label class="font-semibold align-middle mr-5">Icon {{ index + 1 }}</label>

          <button
              class="text-sm px-2 py-2 ml-2 font-bold text-white rounded-2xl bg-gdp hover:bg-indigo-500 mb-4 lg:mb-0 cursor-pointer"
              style="align-self: flex-end"
              @click="moveSocialIcon(index, 'up')"
          >
            <img src="/caret-up-outline.svg" style="width: 20px; height: 20px; filter: invert()" alt="move up"/>
          </button>
          <button
              class="text-sm px-2 py-2 ml-2 font-bold text-white rounded-2xl bg-gdp hover:bg-indigo-500 mb-4 lg:mb-0 cursor-pointer"
              style="align-self: flex-end"
              @click="moveSocialIcon(index, 'down')"
          >
            <img src="/caret-down-outline.svg" style="width: 20px; height: 20px; filter: invert()" alt="move up"/>
          </button>
          <button
              class="text-sm px-2 py-2 ml-2 font-bold text-white rounded-2xl bg-red-400 hover:bg-red-500 mb-4 lg:mb-0 cursor-pointer"
              style="align-self: flex-end"
              @click="deleteSocialIcon(index)"
          >
            Delete
          </button>
        </div>

        <select v-model="siSettings.type"
                class="p-2 mt-2 w-full text-sm border-solid border-gray-300 rounded-2xl border"
        >
          <option disabled selected>Select an icon</option>

          <option value="phone">Phone</option>
          <option value="text">Text</option>
          <option value="email">Email</option>

          <option value="applemusic">Apple Music</option>
          <option value="discord">Discord</option>
          <option value="facebook">Facebook</option>

          <option value="twitter">Twitter</option>
          <option value="instagram">Instagram</option>
          <option value="tiktok">Tiktok</option>
          <option value="spotify">Spotify</option>
          <option value="youtube">YouTube</option>

          <option value="soundcloud">SoundCloud</option>
          <option value="linkedin">LinkedIn</option>
          <option value="twitch">Twitch</option>
          <option value="pinterest">Pinterest</option>
        </select>

        <div class="mt-2">
          <label class="font-semibold">URL</label>
          <input v-model="siSettings.url"
                 class="p-2 mt-2 w-full text-sm border-solid border-gray-300 rounded-2xl border"
                 placeholder="e.g. https://exampleurl.com/example"
                 type="url"
          />
        </div>

        <label class="font-semibold mb-2 mt-2">Icon Color</label>
        <input
            v-model="siSettings.color"
            class="p-3 mt-4 mb-2 rounded-lg bg-white text-sm text-gray-700"
            placeholder="e.g. #FFF"
            :data-jscolor="jsColorOptions"
        >

        <div class="flex flex-row mt-3 mb-3">
          <label class="font-semibold mt-2 mb-2 mr-2">Scale (px)</label>
          <input
              v-model="siSettings.scale"
              class="p-3 rounded-lg bg-white text-sm text-gray-700"
              type="number"
          >
        </div>
      </div>
    </div>

    <!-- URL -->
    <div v-show="intent!=='view' && showOption(pendingLink.type, 'url')"
         class="flex flex-col mb-8 justify-start w-full"
    >
      <label v-if="pendingLink.type === 'link'" class="font-semibold mb-2">Link URL</label>
      <label v-else-if="pendingLink.type === 'image'" class="font-semibold mb-2">Image URL</label>
      <label v-else-if="pendingLink.type === 'youtube'" class="font-semibold mb-2">Video URL</label>
      <label v-else-if="pendingLink.type === 'vcard'" class="font-semibold mb-2">vCard URL</label>
      <label v-else class="font-semibold mb-2">URL</label>

      <input v-model="pendingLink.url" class="p-2 mt-2 text-sm border-solid border-gray-300 rounded-2xl border"
             :placeholder="pendingLink.type === 'vcard' ? 'e.g. https://mywebsite.com/vcard.vcf' : 'e.g. https://exampleurl.com/example'"
             type="url"
      />
    </div>
    <!-- No Code Builder-->
    <!--    <div class="hidden lg:flex flex-col p-6 bg-white shadow rounded-2xl w-full mb-6">-->
    <!--      <div-->
    <!--          class="flex flex-col lg:flex-row space-y-1 lg:space-y-0 items-start lg:justify-between lg:items-center w-full mb-2">-->
    <!--        <h2 class="text-gray-800 font-semibold text-lg">-->
    <!--          Customization-->
    <!--        </h2>-->
    <!--        <a href="https://www.notion.so/neutroncreative/Customizing-your-Singlelink-profile-ab34c4a8e3174d66835fa460774e7432"-->
    <!--           target="_blank" class="text-gray-500 text-xs hover:underline hover:text-gray-600">Need help? Read our-->
    <!--          documentation</a>-->
    <!--      </div>-->
    <!--      <Builder v-if="builderCssLoaded" v-model="builderCss"/>-->
    <!--    </div>-->

    <!-- Custom CSS-->
    <div class="hidden lg:flex flex-col p-6 bg-white shadow rounded-2xl w-full">
      <div
          class="flex flex-col lg:flex-row space-y-1 lg:space-y-0 items-start lg:justify-between lg:items-center w-full mb-2"
      >
        <h2 class="text-gray-800 font-semibold text-lg">
          Custom CSS
        </h2>
        <a
            class="text-gray-500 text-xs hover:underline hover:text-gray-600"
            href="https://www.notion.so/neutroncreative/Customizing-your-Singlelink-profile-ab34c4a8e3174d66835fa460774e7432"
            target="_blank"
        >Need help? Read our
          documentation</a>
      </div>
      <client-only>
        <MonacoEditor
            v-model="customCss"
            :options="{
                  extraEditorClassName: 'rounded overflow-hidden mb-2',
                  autoIndent: 'full',
                  autoClosingQuotes: true,
                }"
            height="350"
            language="css"
            theme="vs-dark"
        ></MonacoEditor>
      </client-only>
    </div>

    <!-- Buttons -->
    <div class="flex flex-col lg:flex-row items-center justify-start w-full mt-4">
      <div v-if="intent==='create'" class="button cursor-pointer" @click="addNewLink">Create link</div>
      <div v-if="intent==='edit'"
           class="flex-grow text-center text-lg px-8 py-4 font-bold text-white rounded-2xl hover:bg-indigo-500 bg-gdp lg:mr-4 mb-4 lg:mb-0 cursor-pointer"
           @click="saveLinkChanges"
      >
        Save and Exit
      </div>
      <div v-if="intent==='edit'"
           class="flex-grow text-center text-lg px-8 py-4 font-bold text-white rounded-2xl hover:bg-indigo-500 bg-gdp lg:mr-4 mb-4 lg:mb-0 cursor-pointer"
           @click="applyLinkChanges"
      >
        Apply
      </div>
      <div v-if="intent==='edit'"
           class="flex-grow text-center text-lg px-8 py-4 font-bold text-white rounded-2xl hover:bg-red-500 bg-red-600 cursor-pointer"
           @click="deleteLink"
      >
        Delete link
      </div>
    </div>

    <!-- Popups and Errors-->
    <transition name="fade">
      <div
          v-if="error"
          class="flex flex-row p-2 mb-4 bg-red-300 text-orange-600 rounded-2xl w-full justify-center items-center text-sm border border-orange-300 shadow-sm"
      >
        <img alt="caution" src="/icons/caution.svg" style="width: 12px;">
        <div class="flex flex-col ml-2">
          {{ error }}
        </div>
      </div>
    </transition>
  </section>
</template>

<script lang="ts">
import Vue from "vue";

type LinkField = "subtitle" | "url" | "icon";

export default Vue.extend({
  layout: 'dashboard',
  middleware: 'authenticated',

  head() {
    return {
      title: 'Link panel - ' + this.$customSettings.productName,
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'View, manage, and create new links from your ' + this.$customSettings.productName + ' link panel'
        },
        {
          hid: 'twitter:description',
          name: 'twitter:description',
          content: 'View, manage, and create new links from your ' + this.$customSettings.productName + ' link panel'
        },
        {
          hid: 'og:title',
          name: 'og:title',
          content: 'Link panel - ' + this.$customSettings.productName
        },
        {
          hid: 'twitter:title',
          name: 'twitter:title',
          content: 'Link panel - ' + this.$customSettings.productName
        },
        {
          hid: 'og:description',
          name: 'og:description',
          content: 'View, manage, and create new links from your ' + this.$customSettings.productName + ' link panel'
        },
      ]
    };
  },

  data() {
    const pendingLink: EditorLink = {
      id: "",
      sortOrder: 0,
      label: "",
      type: "link",
      subtitle: "",
      customCss: "",
      url: ""
    };

    return {
      jsColorOptions: "{alphaChannel: true, format: 'hexa'}",

      id: '',
      links: new Array<EditorLink>(),
      modalActive: false,
      modalIntent: 'create',
      pendingLink,
      user: '',
      error: '',
      intent: '',

      isLoaded: false,

      customCss: null as string | null | undefined,

      dividerSettings: {
        color: '#000000FF',
        fontSize: 16,
      },

      socialIcons: [] as { type: string, color: string, scale: number, url: string }[],

      sortedLinks: new Array<EditorLink>()
    };
  },

  async mounted() {
    await this.getUserData();
    await this.getLinks();
    // Fetch selected link from links
    this.id = this.$route.params.pathMatch;

    if (this.id) {
      this.intent = 'edit';
    } else {
      this.intent = 'create';
    }

    for (let i = 0; i < this.links.length; i++) {
      if (this.links[i].id == this.id) {
        this.pendingLink = this.links[i];
        this.customCss = this.pendingLink.customCss;
        break;
      }
    }

    if (this.pendingLink.type === 'divider') {
      try {
        this.dividerSettings = this.pendingLink.metadata?.dividerSettings ?? {};

        if (!this.dividerSettings.color) {
          this.dividerSettings.color = "#000000FF";
        }

        if (!this.dividerSettings.fontSize) {
          this.dividerSettings.fontSize = 16;
        }
      } catch (e) {
        console.warn("Failed to parse JSON string for divider: " + this.pendingLink.metadata?.dividerSettings);
      }
    }

    if (this.pendingLink.type === 'social') {
      try {
        this.socialIcons = this.pendingLink.metadata?.socialIcons ?? [];
      } catch (e) {
        console.warn("Failed to parse JSON string for divider: " + this.pendingLink.metadata?.socialIcons);
      }
    }

    if (process.client) {
      this.$nextTick(() => {
        this.initColorPickers();
      });
    }
  },

  methods: {
    initColorPickers() {
      let jscolor = ((window as any).jscolor) as any;
      jscolor.install();
    },

    async getUserData() {
      try {
        this.user = await this.$axios.$post('/user', {
          token: this.$store.getters['auth/getToken']
        });
      } catch (err) {
        console.log('Error getting user data');
        console.log(err);
      }
    },

    async getLinks() {
      try {
        this.links = await this.$axios.$post('/profile/links', {
          token: this.$store.getters['auth/getToken']
        });
      } catch (err) {
        console.log('Error getting profile links');
        console.log(err);
      }
    },

    async deleteLink() {
      try {
        await this.$axios.$post('/link/delete', {
          token: this.$store.getters['auth/getToken'],
          id: this.pendingLink.id,
        });

        const index = this.links.findIndex(x => x.id === this.pendingLink.id);
        this.links.splice(index, 1);

        //this.resortLinks();

        //this.closeModal();

        this.$router.push('/dashboard/');
        this.$root.$emit('refreshUserProfileView');
      } catch (err) {
        console.log('Link destruction unsuccessful');
        console.log(err);
      }
    },

    async saveLinkChanges() {
      await this.applyLinkChanges();
      this.$router.push('/dashboard/');
    },

    async applyLinkChanges() {
      try {
        this.addMetadata();

        await this.$axios.$post('/link/update', {
          token: this.$store.getters['auth/getToken'],
          link: {
            id: this.pendingLink.id,
            label: this.pendingLink.label,
            type: this.pendingLink.type,
            subtitle: this.pendingLink.subtitle,
            url: this.pendingLink.url,
            customCss: this.customCss,
            metadata: this.pendingLink.metadata
          }
        });

        const index = this.links.findIndex(x => x.id === this.pendingLink.id);
        this.links[index] = this.pendingLink;

        this.$root.$emit('refreshUserProfileView');
      } catch (err) {
        console.log('Link changes unsuccessful');
        console.log(err);
      }
    },

    clearErrors() {
      this.error = '';
    },

    addMetadata() {
      if (!this.pendingLink.metadata)
        this.pendingLink.metadata = {};

      if (this.pendingLink.type === 'divider')
        this.pendingLink.metadata.dividerSettings = this.dividerSettings;

      if (this.pendingLink.type === 'social')
        this.pendingLink.metadata.socialIcons = this.socialIcons;
    },

    async addNewLink(): Promise<boolean> {
      if (!this.pendingLink.label) {
        this.error = 'Link label required';
        return false;
      }

      try {
        const response = await this.$axios.post('/link/create', {
          token: this.$store.getters['auth/getToken'],
          link: {
            id: this.pendingLink.id,
            label: this.pendingLink.label,
            type: this.pendingLink.type,
            subtitle: this.pendingLink.subtitle,
            url: this.pendingLink.url,
            customCss: this.customCss || '',
            metadata: this.pendingLink.metadata
          }
        });

        this.links.push(response.data);
        //this.clearPending();

        //this.resortLinks();

        this.$router.push('/dashboard/');
        this.$root.$emit('refreshUserProfileView');
        return true;
      } catch (err) {
        console.log('Error adding new link to profile');
        console.log(err);
        return true;
      }
    },

    addSocialIcon() {
      this.socialIcons.push({
        color: "#000000FF",
        scale: 40,
        type: "email",
        url: "",
      });

      this.$nextTick(() => {
        this.initColorPickers();
      });
    },

    deleteSocialIcon(index: number) {
      this.socialIcons.splice(index, 1);
    },

    moveSocialIcon(index: number, direction: "up" | "down", shift: number = 1) {
      if (direction === "up") {
        for (let i = 0; i < shift; i++) {
          let item = this.socialIcons.shift();
          if (!item)
            continue;

          this.socialIcons.push(item);
        }
      } else if (direction === "down") {
        for (let i = 0; i < shift; i++) {
          let item = this.socialIcons.pop();
          if (!item)
            continue;

          this.socialIcons.unshift(item);
        }
      }
    },

    showOption(linkType: LinkType, field: LinkField): boolean {
      switch (linkType) {
        case "link":
          switch (field) {
            case "subtitle":
            case "url":
              return true;
          }
          break;

        case "social":
          switch (field) {
            case "icon":
              return true;
          }
          break;

        case "vcard":
          switch (field) {
            case "url":
              return true;
          }
          break;

        case "image":
          switch (field) {
            case "url":
              return true;
          }
          break;

        case "text":
          switch (field) {
            case "subtitle":
              return true;
          }
          break;

        case "html":
          switch (field) {
            case "subtitle":
              return true;
          }
          break;

        case "youtube":
          switch (field) {
            case "url":
              return true;
          }
          break;
      }

      return false;
    },
  }
});
</script>
