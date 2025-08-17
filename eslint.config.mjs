import js from "@eslint/js";
import globals from "globals";
import pluginVue from "eslint-plugin-vue";
import { defineConfig } from "eslint/config";

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,vue}"], ignores: ['dist/**', 'node_modules/**', 'docs/**', 'coverage/**', 'webpack.config.js'], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: globals.browser } },
  pluginVue.configs["flat/essential"],
]);
