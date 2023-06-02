<template>
  <va-action-page :title="title">
    <template slot="actions" v-if="showActions">
      <va-list-button
        v-if="actions.includes('list')"
        :resource="resource"
        :item="item"
      ></va-list-button>
      <va-show-button
        v-if="actions.includes('show')"
        :resource="resource"
        :item="item"
      ></va-show-button>
      <!-- @slot Additional custom action buttons placeholder. -->
      <slot name="actions"></slot>
      <va-clone-button
        v-if="actions.includes('clone')"
        :resource="resource"
        :item="item"
      ></va-clone-button>
      <va-delete-button
        v-if="actions.includes('delete')"
        :resource="resource"
        :item="item"
        redirect
      ></va-delete-button>
      <va-locale-button :resource="resource"></va-locale-button>
    </template>
    <!-- @slot Page content placeholder. -->
    <slot v-if="item"></slot>
  </va-action-page>
</template>

<script>
import Page from "../../../mixins/page";

/**
 * Page layout for resource edition.
 * Contain specific related action as deleting, cloning, showing as well as translation action.
 */
export default {
  mixins: [Page],
};
</script>
