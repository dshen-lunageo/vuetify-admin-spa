import {
  GET_LIST,
  GET_MANY,
  GET_ONE,
  CREATE,
  UPDATE,
  UPDATE_MANY,
  DELETE,
  DELETE_MANY,
} from "./actions";

import FetchHydra from "../utils/fetchHydra";
import qs from "qs";

export default (httpClient) => {
  if (typeof httpClient === "string") {
    httpClient = new FetchHydra(httpClient);
  }

  return {
    [GET_LIST]: (resource, params) => {
      const { pagination, sort, filter } = params;

      let query = filter || {};

      if (pagination) {
        query = {
          ...query,
          page: pagination.page,
          itemsPerPage: pagination.perPage,
        };
      }

      if (sort && sort.length) {
        query.order = {};

        sort.forEach((item) => {
          let { by, desc } = item;

          query.order[by] = desc ? "desc" : "asc";
        });
      }

      return httpClient.get(
        `${resource}?${qs.stringify(query, { arrayFormat: "repeat" })}`
      );
    },
    [GET_MANY]: (resource, params) =>
      Promise.all(
        params.ids.map((id) =>
          httpClient.get(`${resource}/${id.substring(id.lastIndexOf("/") + 1)}`)
        )
      ).then((responses) => ({ data: responses.map(({ data }) => data) })),
    [GET_ONE]: (resource, params) => httpClient.get(`${resource}/${params.id}`),
    [CREATE]: (resource, params) => httpClient.post(resource, params.data),
    [UPDATE]: (resource, params) =>
      httpClient.put(`${resource}/${params.id}`, params.data),
    [UPDATE_MANY]: (resource, params) =>
      Promise.all(
        params.ids.map((id) => httpClient.put(`${resource}/${id}`, params.data))
      ).then(() => Promise.resolve()),
    [DELETE]: (resource, params) =>
      httpClient.delete(`${resource}/${params.id}`),
    [DELETE_MANY]: (resource, params) =>
      Promise.all(
        params.ids.map((id) => httpClient.delete(`${resource}/${id}`))
      ).then(() => Promise.resolve()),
  };
};
