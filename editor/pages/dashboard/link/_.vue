<template>
  <section class="flex flex-col p-8 items-center overflow-x-hidden overflow-y-scroll">
    <div class="flex flex-row items-center justify-start mb-4 space-x-4 mb-4">
      <img class="w-8" src="/Pencil.svg"/>
      <h1 class="text-black font-extrabold tracking-tight text-3xl w-full flex flex-row items-start lg:items-center">
        <span v-if="intent==='create'">Create link</span>
        <span v-if="intent==='edit'">Edit link</span>
      </h1>
    </div>

    <!-- Type -->
    <div v-if="intent !=='view'"
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
    <div v-if="intent !=='view' && showOption(pendingLink.type, 'label')"
         class="flex flex-col mb-4 justify-start w-full"
    >
      <label v-if="pendingLink.type === 'text' || pendingLink.type === 'html'" class="font-semibold mb-2">
        {{ pendingLink.type === 'text' ? "Text" : pendingLink.type === 'html' ? "HTML" : "Label" }}</label>
      <label v-else class="font-semibold mb-2">Label</label>

      <client-only>
        <VueEditor v-if="pendingLink.type === 'text'"
                   v-model="pendingLink.label"
                   class="mb-20"
        />

        <textarea v-else-if="pendingLink.type === 'html'"
                  v-model="pendingLink.label"
                  class="p-2 mt-2 text-sm border-solid border-gray-300 rounded-2xl border"
                  placeholder="e.g. My blog" type="text"
                  rows="6"
        />

        <input v-else v-model="pendingLink.label"
               class="p-2 mt-2 text-sm border-solid border-gray-300 rounded-2xl border"
               placeholder="e.g. Anything" type="text"
        />
      </client-only>
    </div>

    <!-- Subtitle -->
    <div v-if="intent!=='view' && showOption(pendingLink.type, 'subtitle')"
         class="flex flex-col mb-4 justify-start w-full"
    >
      <label class="font-semibold mb-2">Subtitle (optional)</label>
      <input v-model="pendingLink.subtitle" class="p-2 mt-2 text-sm border-solid border-gray-300 rounded-2xl border"
             placeholder="e.g. Read more about my adventures in Peru!" type="text"
      />
    </div>

    <!-- URL -->
    <div v-if="intent!=='view' && showOption(pendingLink.type, 'url')" class="flex flex-col mb-8 justify-start w-full">
      <label v-if="pendingLink.type === 'link'" class="font-semibold mb-2">Link URL</label>
      <label v-else-if="pendingLink.type === 'image'" class="font-semibold mb-2">Image URL</label>
      <label v-else-if="pendingLink.type === 'social'" class="font-semibold mb-2">Social Link URL</label>
      <label v-else-if="pendingLink.type === 'youtube'" class="font-semibold mb-2">Video URL</label>
      <label v-else-if="pendingLink.type === 'vcard'" class="font-semibold mb-2">vCard URL</label>
      <label v-else class="font-semibold mb-2">URL</label>

      <input v-model="pendingLink.url" class="p-2 mt-2 text-sm border-solid border-gray-300 rounded-2xl border"
             :placeholder="pendingLink.type === 'vcard' ? 'e.g. https://mywebsite.com/vcard.vcf' : 'e.g. https://exampleurl.com/example'"
             type="url"
      />
    </div>

    <!-- Icon -->
    <div v-if="intent!=='view' && pendingLink.type === 'social'"
         class="flex flex-col mb-8 justify-start w-full"
    >
      <label class="font-semibold mb-2">Social Icon</label>
      <select v-model="socialIcon" class="p-2 mt-2 text-sm border-solid border-gray-300 rounded-2xl border"
      >
        <option disabled selected>Select an icon</option>

        <option value="email">Email</option>
        <option value="text">Text</option>
        <option value="phone">Phone</option>
        <option value="facebook">Facebook</option>
        <option value="twitter">Twitter</option>
        <option value="instagram">Instagram</option>
        <option value="tiktok">Tiktok</option>
        <option value="spotify">Spotify</option>
        <option value="youtube">YouTube</option>
        <option value="applemusic">Apple Music</option>
        <option value="soundcloud">SoundCloud</option>
        <option value="linkedin">LinkedIn</option>
        <option value="twitch">Twitch</option>
        <option value="pinterest">Pinterest</option>
      </select>
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
    </div>

    <!-- Buttons -->
    <div class="flex flex-col lg:flex-row items-center justify-start w-full mt-4">
      <div v-if="intent==='create'" class="button cursor-pointer" @click="addNewLink">Create link</div>
      <div v-if="intent==='edit'"
           class="flex-grow text-center text-lg px-8 py-4 font-bold text-white rounded-2xl hover:bg-indigo-500 bg-gdp lg:mr-4 mb-4 lg:mb-0 cursor-pointer"
           @click="saveLinkChanges"
      >
        Save changes
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
        <img alt="caution" src="/caution.svg" style="width: 12px;">
        <div class="flex flex-col ml-2">
          {{ error }}
        </div>
      </div>
    </transition>
  </section>
</template>

<script lang="ts">
import Vue from "vue";
import {VueEditor} from "vue2-editor";

type LinkField = "label" | "subtitle" | "url" | "icon";
type LinkTypeOption = "link" | "social" | "vcard" | "image" | "divider" | "text" | "html" | "youtube" | string;

type SocialIcon =
    "email"
    | "text"
    | "phone"
    | "facebook"
    | "twitter"
    | "instagram"
    | "tiktok"
    | "spotify"
    | "youtube"
    | "applemusic"
    | "soundcloud"
    | "linkedin"
    | "twitch"
    | "pinterest"
    | undefined;

export default Vue.extend({
  layout: 'dashboard',
  middleware: 'authenticated',

  components: {VueEditor},

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
      id: '',
      links: new Array<EditorLink>(),
      modalActive: false,
      modalIntent: 'create',
      pendingLink,
      user: '',
      error: '',
      intent: '',

      customCss: null as string | null | undefined,

      socialIcon: undefined as SocialIcon,

      noCode: {
        divBreakColor: ''
      },

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

    try {
      const css = this.pendingLink.customCss ?? '';
      let strings = css.split('/* SL-NO-CODE */');

      this.customCss = strings[0];

      if (strings.length > 1) {
        this.noCode = this.deserializeNodeCode(strings[1]);
      }

    } catch (err) {
      console.log('Error getting user data');
      console.log(err);
    }

    this.$nextTick(() => {
      this.loadTextEditor();
    });
  },

  methods: {
    async loadTextEditor() {

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
      try {
        const noCodeCss = this.serializeNoCode(this.noCode);

        await this.$axios.$post('/link/update', {
          token: this.$store.getters['auth/getToken'],
          link: {
            id: this.pendingLink.id,
            label: this.pendingLink.label,
            type: this.pendingLink.type,
            subtitle: this.pendingLink.subtitle,
            url: this.pendingLink.url,
            customCss: this.customCss + '/* SL-NO-CODE */' + noCodeCss,
          }
        });

        const index = this.links.findIndex(x => x.id === this.pendingLink.id);
        this.links[index] = this.pendingLink;

        //this.closeModal();
        this.$router.push('/dashboard/');
        this.$root.$emit('refreshUserProfileView');
      } catch (err) {
        console.log('Link changes unsuccessful');
        console.log(err);
      }
    },

    clearErrors() {
      this.error = '';
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
            label: this.pendingLink.label,
            subtitle: this.pendingLink.subtitle,
            type: this.pendingLink.type,
            url: this.pendingLink.url,
            customCss: this.pendingLink.customCss || ''
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

    editLink(link: EditorLink) {
      //this.clearPending();

      this.pendingLink = {
        id: link.id,
        sortOrder: link.sortOrder,
        label: link.label,
        type: link.type,
        subtitle: link.subtitle,
        customCss: link.customCss,
        url: link.url
      };

      //this.openModal('edit');
    },

    showOption(linkType: LinkTypeOption, field: LinkField): boolean {
      switch (linkType) {
        case "link":
          switch (field) {
            case "label":
            case "subtitle":
            case "url":
              return true;
          }
          break;

        case "social":
          switch (field) {
            case "icon":
            case "url":
              return true;
          }
          break;

        case "vcard":
          switch (field) {
            case "label":
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

        case "divider":
          switch (field) {
            case "label":
              return true;
          }
          break;

        case "text":
          switch (field) {
            case "label":
              return true;
          }
          break;

        case "html":
          switch (field) {
            case "label":
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

    /**
     * Converts a "no-code" object to CSS.
     * @param object
     */
    serializeNoCode(object: any): string {
      return '';
    },

    /**
     * Converts a "no-code" CSS string to an object.
     * @param code
     */
    deserializeNodeCode(code: string): any | null {
      return null;
    }
  }
});
</script>
