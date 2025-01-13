/**
 * plugins/index.ts
 *
 * Automatically included in `./src/main.ts`
 */

// Plugins
import vuetify from "./vuetify";
import pinia from "../stores";
import router from "../router";

// Types
import type { App } from "vue";
import { AVPlugin } from "vue-audio-visual";

export function registerPlugins(app: App) {
  app.use(vuetify).use(router).use(pinia).use(AVPlugin);
}
