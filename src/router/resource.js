import camelCase from "lodash/camelCase";
import kebabCase from "lodash/kebabCase";
import upperFirst from "lodash/upperFirst";
import snakeCase from "lodash/snakeCase";

const buildResourceRoute = ({
  store,
  i18n,
  resource,
  title,
  isRootPath = true,
}) => {
  let {
    name,
    include,
    routes,
    translatable,
    getTitle,
    singularName,
    pluralName,
  } = resource;

  const itemIdKey = snakeCase(`${singularName}Id`);

  const setTitle = (to, action, item = null) => {
    to.meta.title = getTitle(action, item);

    /**
     * Set main and document title
     */
    document.title = `${to.meta.title} | ${title}`;

    return title;
  };

  /**
   * Action route builder
   */
  const buildRoute = (action, path) => {
    const route = {
      path,
      name: `${name}_${action}`,
      props: true,
      component: {
        props: ["id", itemIdKey],
        render(c) {
          let componentName = `${upperFirst(camelCase(name))}${upperFirst(
            action
          )}`;

          let props = {
            id: this[itemIdKey],
            [itemIdKey]: this[itemIdKey],
            title: this.$route.meta.title,
            resource,
            item: store.state[name].item,
            permissions: store.getters["auth/getPermissions"],
          };

          if (componentName in this.$options.components) {
            /**
             * Return client side page component
             */
            return c(componentName, {
              props,
            });
          }

          /**
           * Return guesser page component
           */
          return c(`Va${upperFirst(action)}Guesser`, {
            props,
          });
        },
        async beforeRouteEnter(to, from, next) {
          /**
           * Initialize from query if available
           */

          // TODO: Optimize checking to.query.source
          let id = to.params[itemIdKey] || to.query.source;

          if (id) {
            /**
             * Route model binding
             */
            try {
              let { data } = await store.dispatch(`${name}/getOne`, {
                id,
                include,
              });

              /**
               * Insert model into route & resource store
               */
              store.commit(`${name}/setItem`, data);

              if (to.params.id) {
                setTitle(to, action, data);
                return next();
              }
            } catch ({ status, message }) {
              to.meta.title = message;
              document.title = message;

              store.commit(`messages/setError`, {
                status,
                message:
                  status === 404
                    ? i18n.t("va.pages.not_found", {
                        resource: resource.singularName,
                        id,
                      })
                    : message,
              });
              return next();
            }
          }

          setTitle(to, action);
          next();
        },
        beforeRouteLeave(to, from, next) {
          if (store.state.form.hasUnsavedChanges) {
            const answer = window.confirm('You have unsaved changes. Do you want to leave without saving?');
            if (!answer) {
              next(false);
            } else {
              store.commit('form/removeUnsavedChanges');
              store.commit(`${name}/removeItem`);
              next();
            }
          } else {
            store.commit(`${name}/removeItem`);
            next();
          }
        },
        beforeRouteUpdate(to, from, next) {
          if (to.name !== from.name) {
            next();
          }

          if (store.state.form.hasUnsavedChanges) {
            const answer = window.confirm('You have unsaved changes. Do you want to leave without saving?');
            if (!answer) {
              next(false);
            } else {
              store.commit('form/removeUnsavedChanges');
              next();
            }
          } else {
            next();
          }
        },
      },
      meta: {
        authenticated: true,
        resource: name,
        parentResource: resource.parentResource,
        translatable,
        itemIdKey,
      },
    };

    if (resource.children && action === "show") {
      route.children = resource.children.map((r) =>
        buildResourceRoute({
          store,
          i18n,
          resource: r,
          title,
          isRootPath: false,
        })
      );
    }

    return route;
  };

  /**
   * Return crud routes for this resource
   */
  const result = {
    path: `${isRootPath ? "/" : ""}${kebabCase(name)}`,
    component: {
      render(c) {
        return c("router-view");
      },
    },
    meta: {
      title: pluralName,
    },
    children: [
      { name: "list", path: "" },
      { name: "create", path: "create" },
      { name: "show", path: `:${itemIdKey}` },
      { name: "edit", path: `:${itemIdKey}/edit` },
    ]
      .filter(({ name }) => routes.includes(name))
      .map(({ name, path }) => buildRoute(name, path)),
  };

  return result;
};

export default buildResourceRoute;
