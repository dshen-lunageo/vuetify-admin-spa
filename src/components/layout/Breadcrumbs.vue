<template>
  <v-breadcrumbs :items="items"></v-breadcrumbs>
</template>

<script>
import resource from "vuetify-admin/src/mixins/resource";
/**
 * Default admin component for breadcrumbs, will generate automatically hierarchical links from current route.
 * Support hierarchical CRUD structure.
 */
export default {
  mixins: [resource],
  computed: {
    items() {
      return this.$route.matched.map((route) => {
        return {
          text: route.meta ? route.meta.title : route.name,
          exact: true,
          to: route.path === "" ? "/" : route,
        };
      });
    },
  },
};
</script>

<style>
.v-breadcrumbs {
  background-color: #fff;
}
</style>
