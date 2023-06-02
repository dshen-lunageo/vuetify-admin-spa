import Button from "./button";

/**
 * For buttons that support redirect.
 * Button will auto hide if no create action available unless `disableRedirect` prop is active.
 */
export default {
  mixins: [Button],
  props: {
    /**
     * Disable default redirect behavior for compatible buttons
     * Force button to be shown, prevent hiding it according to default behavior if no action exist.
     */
    disableRedirect: Boolean,
  },
  methods: {
    canShow(action) {
      return (
        (this.disableRedirect || this.hasRoute(action)) &&
        this.hasAction(action)
      );
    },
    getRoute(action, params) {
      if (!this.disableRedirect && this.hasRoute(action)) {
        return {
          name: `${this.resource}_${action}`,
          ...params,
        };
      }
      return null;
    },
    getItemRoute(action, { itemId }, params = {}) {
      if (!this.disableRedirect && this.hasRoute(action)) {
        const result = {
          name: `${this.resource}_${action}`,
          params: {
            [this.$route.meta.itemIdKey]: itemId,
            ...params,
          },
        };

        return result;
      }
      return null;
    },
  },
};
