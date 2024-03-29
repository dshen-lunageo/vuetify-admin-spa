<template>
  <v-form ref="form" @submit.prevent="onSubmit">
    <!-- @slot All content form with all inner inputs. Model will be injected for each inputs. -->
    <slot></slot>
  </v-form>
</template>

<script>
import Resource from "../../../mixins/resource";
import set from "lodash/set";

/**
 * Form component which handle resource saving by calling `create` or `update` data provider methods.
 * It's the better place for made heavy usage of any VA inputs.
 * Use injection which allowing unique global v-model for all inputs.
 */

/**
 * Data flow for form:
 * 1. Form component: Initialize form model with value (v-model)
 * 2. Input mixin: **Initialize input** with value (v-model)
 * 3. Input mixin: **Update input** with value from item/model when formState injected
 *    1) Form: Update form model by invoking formState.update
 *    2) Input mixin: **Update input**
 */
export default {
  mixins: [Resource],
  provide() {
    return {
      formState: this.formState,
    };
  },
  props: {
    /**
     * Current form model being edited. Represent the final data that will be send through your API.
     * @model
     */
    value: {
      type: Object,
      default: () => {},
    },
    /**
     * Id of resource to be edit. If null, then create a new one.
     */
    id: [String, Number],
    /**
     * Explicit item resource object where all properties must be injected into form model.
     */
    item: {
      type: Object,
      default: () => {},
    },
    /**
     * Default route resource action to redirect after saving.
     * @values list, create, show, edit
     */
    redirect: {
      type: String,
      validator: (v) => ["list", "create", "show", "edit"].includes(v),
      default: "list",
    },
    /**
     * Disable default redirect behavior
     */
    disableRedirect: Boolean,
  },
  data() {
    return {
      originalValue: this.value,
      formState: {
        edit: !!this.id,
        item: this.item,
        model: {},
        saving: false,
        errors: {},
        update: ({ source, value }) => {
          let model = { ...this.formState.model };
          set(model, source, value);

          this.formState.model = model;

          /**
           * Update item if provided, useful for updating nested inputs.
           */
          set(this.formState.item, source, value);

          /**
           * Send model update, called after each single input change.
           */
          this.$emit("input", model);
        },
        submit: (redirect) => {
          this.save(redirect);
        },
      },
    };
  },
  watch: {
    item(val) {
      /**
       * Invoked when item is updated
       */
      if (!val) {
        this.formState.model = this.originalValue;
      }
      this.formState.item = val;
    },
    value: {
      handler(val) {
        /**
         * Invoked when model is updated
         */
        if (val) {
          this.formState.model = val;
        }
      },
      deep: true,
      immediate: true,
    },
  },
  mounted() {
    window.addEventListener('beforeunload', this.unload);
    document.addEventListener("keydown", this.doSave);
  },
  beforeDestroy() {
    window.removeEventListener('beforeunload', this.unload);
    document.removeEventListener("keydown", this.doSave);
  },
  methods: {
    unload(event) {
      if (this.$store.state.form.hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Do you want to leave without saving?';
      }
    },
    doSave(event) {
      if (!(event.keyCode === 83 && (event.ctrlKey || event.metaKey))) {
        return;
      }
      
      event.preventDefault();
      this.onSubmit();
    },
    onSubmit() {
      if (this.disableRedirect) {
        this.save();
        return;
      }
      this.save(this.redirect);
    },
    async save(redirect) {
      if (!this.$refs.form.validate()) {
        return;
      }

      /**
       * Set saving to childs.
       */
      this.formState.saving = true;

      try {
        let { data } = this.id
          ? await this.$store.dispatch(`${this.resource}/update`, {
              id: this.id,
              data: this.formState.model,
            })
          : await this.$store.dispatch(`${this.resource}/create`, {
              data: this.formState.model,
            });

        this.formState.errors = {};

        /**
         * Sent after success saving.
         */
        this.$emit("saved");

        /**
         * Remove unsaved changes after saving success.
         */
        this.$store.commit('form/removeUnsavedChanges');

        switch (redirect) {
          case "list":
            this.$router.push({ name: `${this.resource}_list` });
            break;
          case "create":
            // Reset form in case of same route
            this.formState.item = null;
            this.formState.model = this.originalValue;

            this.$router.push({ name: `${this.resource}_create` });
            break;
          case "show":
            this.$router.push({
              name: `${this.resource}_show`,
              params: { id: data.id },
            });
            break;
          case "edit":
            this.$router.push({
              name: `${this.resource}_edit`,
              params: { id: data.id },
            });
            break;
        }
      } catch (e) {
        if (e.errors) {
          this.formState.errors = e.errors;
        }
      } finally {
        this.formState.saving = false;
      }
    },
  },
};
</script>
