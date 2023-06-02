import Resource from "./resource";

/**
 * CRUD action page layout used for Show, Create end Edit.
 */
export default {
  mixins: [Resource],
  props: {
    /**
     * Optional H1 title of the page shown on the left of top header
     */
    title: String,

    actions: {
      type: Array,
      default: () => ["list", "show", "clone", "delete"],
    },

    hideActions: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    item() {
      return this.$store.state[this.resource].item;
    },
    showActions() {
      return !this.hideActions && this.actions.length > 0;
    },
  },
};
