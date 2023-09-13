import upperFirst from "lodash/upperFirst";
import lowerCase from "lodash/lowerCase";
import isEmpty from "lodash/isEmpty";

import messages from "./store/messages";
import auth from "./store/auth";
import guest from "./store/guest";
import api from "./store/api";
import form from "./store/form";

import resourceCrudModule from "./store/resource";
import resourceCrudRoutes from "./router/resource";

export default class VuetifyAdmin {
  constructor({
    router,
    store,
    i18n,
    title,
    routes,
    locales,
    translations,
    authProvider,
    dataProvider,
    resources,
    options,
    canAction,
    http,
  }) {
    /**
     * Options properties
     */
    this.title = title;
    this.locales = locales;
    this.translations = translations;
    this.authProvider = authProvider;
    this.dataProvider = dataProvider;
    this.options = options || {};
    this.http = http;

    /**
     * Permissions helper & directive
     */
    this.can = (permissions) =>
      !authProvider ||
      isEmpty(permissions) ||
      !isEmpty(
        (Array.isArray(permissions) ? permissions : [permissions]).filter(
          (p) => -1 !== store.getters["auth/getPermissions"].indexOf(p)
        )
      );

    const formatResource = (r, parentResource) => {
      r = typeof r === "string" ? { name: r } : r;

      /**
       * Get valid routes
       */
      let routes = ["list", "show", "create", "edit"].filter((name) => {
        return !r.routes || r.routes.includes(name);
      });

      /**
       * Get valid actions
       */
      let actions = ["list", "show", "create", "edit", "delete"].filter(
        (name) => {
          if ((r.actions || []).length) {
            return r.actions.includes(name);
          }

          if ((r.except || []).length) {
            return !r.except.includes(name);
          }

          return true;
        }
      );

      let nameKey = `resources.${r.name}.name`;

      /**
       * Get localized resource name if key exists
       */
      let getName = (count) =>
        i18n.te(nameKey)
          ? i18n.tc(nameKey, count)
          : upperFirst(lowerCase(r.name));

      const result = {
        ...r,
        icon: r.icon || "mdi-view-grid",
        parentResource,
        routes,
        actions,
        getName,
        singularName: getName(1),
        pluralName: getName(10),
        getTitle: (action, item = null) => {
          let titleKey = `resources.${r.name}.titles.${action}`;

          if (item) {
            return (
              (i18n.te(titleKey)
                ? i18n.t(titleKey, item)
                : i18n.t(`va.pages.${action}`, {
                    resource: getName(1).toLowerCase(),
                    label:
                      typeof r.label === "function"
                        ? r.label(item)
                        : item[r.label],
                  })) + ` #${item.id}`
            );
          }
          return i18n.te(titleKey)
            ? i18n.t(titleKey)
            : i18n.t(`va.pages.${action}`, {
                resource: getName(action === "list" ? 10 : 1).toLowerCase(),
              });
        },
        canAction: (action) => {
          /**
           * Test if action exist for this resource
           */
          if (!actions.includes(action)) {
            return false;
          }

          /**
           * Use custom action if defined
           */
          if (canAction) {
            let result = canAction({
              resource: r,
              action,
              can: this.can,
            });

            /**
             * If valid boolean return this value instead of default next behavior
             */
            if (typeof result === "boolean") {
              return result;
            }
          }

          /**
           * OK if no permissions set
           */
          if (!r.permissions) {
            return true;
          }

          /**
           * Get permissions for asked action
           */
          let permissions = (r.permissions || [])
            .filter((p) => {
              return typeof p === "string" || p.actions.includes(action);
            })
            .map((p) => {
              return typeof p === "string" ? p : p.name;
            });

          // Test if current user can access
          return permissions.length && this.can(permissions);
        },
      };

      return result;
    };

    /**
     * Format usable resources object
     */
    const formatResources = (resources, parentResource) => {
      return resources.map((r) => {
        if (r.children) {
          r.children = formatResources(r.children, r.name);
        }
        return formatResource(r, parentResource);
      });
    };

    const indexResources = (resources, resourceDict = {}) => {
      return resources.reduce((acc, resource) => {
        acc[resource.name] = resource;
        if (resource.children) {
          acc = { ...acc, ...indexResources(resource.children, acc) };
        }
        return acc;
      }, resourceDict);
    };

    const formattedResources = formatResources(resources);

    this.resources = formattedResources;
    this.indexedResources = indexResources(formattedResources);

    /**
     * Get full resource object meta from name
     */
    this.getResource = (name) => this.indexedResources[name];

    /**
     * Get label source, humanize it if not found
     */
    this.getSourceLabel = (resource, source) => {
      let key = `resources.${resource}.fields.${source}`;

      return i18n.te(key)
        ? i18n.t(key)
        : upperFirst(lowerCase(source.replace(".", " ")));
    };

    /**
     * Resource link helper with action permission test
     */
    this.getResourceLink = (link) => {
      let getLink = ({ name, icon, text, action }) => {
        action = action || "list";
        let resource = this.getResource(name);

        if (!resource) {
          return false;
        }

        let { routes, canAction, singularName, pluralName } = resource;

        /**
         * Route must exist
         */
        if (!routes.includes(action)) {
          return false;
        }

        /**
         * Current user must have permission for this action
         */
        if (!canAction(action)) {
          return false;
        }

        return {
          icon: icon || resource.icon,
          resource: name,
          text: text || (action === "list" ? pluralName : singularName),
          link: { name: `${name}_${action}` },
        };
      };

      if (typeof link === "object") {
        return getLink(link);
      }
      return getLink({ name: link });
    };

    /**
     * Resource links list helper
     */
    this.getResourceLinks = (links) => {
      return links
        .map((link) => {
          if (typeof link === "object") {
            if (link.children) {
              return link;
            }

            return this.getResourceLink(link);
          }
          return this.getResourceLink({ name: link });
        })
        .filter((r) => r);
    };

    /**
     * Load i18n locales
     */
    Object.keys(locales).forEach((locale) => {
      i18n.mergeLocaleMessage(locale, { va: locales[locale] });
    });

    /**
     * Auth store & api dispatcher module injection
     */
    store.registerModule("messages", messages);
    store.registerModule("api", api);
    store.registerModule(
      "auth",
      this.authProvider ? auth(this.authProvider, router) : guest
      );
    store.registerModule("form", form);

    /**
     * Add API resources modules dynamically
     */
    const registerResourceModule = (resources) => {
      resources.forEach((resource) => {
        store.registerModule(
          resource.name,
          resourceCrudModule({
            provider: this.dataProvider,
            resource,
            i18n,
          })
        );

        if (resource.children) {
          registerResourceModule(resource.children);
        }
      });
    };

    if (this.dataProvider) {
      registerResourceModule(this.resources);
    }

    /**
     * Add resources routes dynamically
     */
    const resourceRoutes = this.resources.map((resource) =>
      resourceCrudRoutes({
        store,
        i18n,
        resource,
        title: this.title,
      })
    );

    // Merge resources routes with explicit routes
    routes.children = resourceRoutes.concat(
      (routes.children || []).map((r) => {
        r.meta = { ...(r.meta || {}), authenticated: true };
        return r;
      })
    );

    router.addRoute(routes);

    /**
     * Global confirm dialog function
     */
    this.confirm = (title, message) =>
      store.dispatch("messages/confirm", { title, message });

    /**
     * Global toaster object
     */
    this.toast = ["success", "error", "info", "warning", "message"].reduce(
      (o, action) => ({
        ...o,
        [action]: (message) =>
          store.commit("messages/showToast", {
            color: action !== "message" ? action : null,
            message,
          }),
      }),
      {}
    );

    /**
     * Check Auth after each navigation
     */
    router.beforeEach(async (to, from, next) => {
      store.commit("messages/cleanError");

      /**
       * Set main and document title
       */
      document.title = to.meta.title
        ? `${to.meta.title} | ${this.title}`
        : this.title;

      /**
       * Check and refresh authenticated user with last permissions
       * after each navigation
       */
      let user = await store.dispatch("auth/checkAuth");

      /**
       * If logged
       */
      if (user) {
        /**
         * Redirect to dashboard route by default if public or root path
         */
        if (to.path === "/" || !to.meta.authenticated) {
          return next({ name: "dashboard" });
        }

        return next();
      }

      /**
       * Force redirect to login if not logged for authenticated routes
       */
      if (to.meta.authenticated) {
        return next({ name: "login" });
      }

      next();
    });
  }
}
