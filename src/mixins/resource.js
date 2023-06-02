import snakeCase from "lodash/snakeCase";

/**
 * For any resource related components.
 */
export default {
  props: {
    /**
     * Name of the resource to use.
     * Required for good label localization and context action activators.
     * Default behavior is to fetch it from router context.
     */
    resource: {
      type: String,
      default() {
        return this.$route.meta.resource;
      },
    },
  },
  computed: {
    translatable() {
      return this.$route.meta.translatable;
    },
    currentResource() {
      return this.$admin.getResource(this.resource);
    },
  },
  methods: {
    hasAction(action) {
      /**
       * Check if access with user permissions for this specific action
       */
      return this.currentResource.canAction(action);
    },
    hasRoute(route) {
      /**
       * Check if CRUD route is defined for this resource
       */
      return (
        !this.currentResource.routes ||
        this.currentResource.routes.includes(route)
      );
    },
    /**
     * Dynamic, multiple parent resource ids
     */
    buildParentResourceIds(resourceName, params = {}) {
      // If has parent resource
      if (this.$route.meta.parentResource) {
        // Get parent resource object
        const resource = this.$admin.getResource(resourceName);
        // Generate parent resource id key
        const itemIdKey = snakeCase(`${resource.singularName}Id`);
        // Merge parent resource id into filter if exists
        if (this.$route.params[itemIdKey]) {
          params[itemIdKey] = this.$route.params[itemIdKey];
        }

        if (resource.parentResource) {
          this.buildParentResourceIds(resource.parentResource, params);
        }
      }

      return params;
    },
  },
};
