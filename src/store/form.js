import {
  LOG_UNSAVED_CHANGES,
  REMOVE_UNSAVED_CHANGES,
  GET_UNSAVED_CHANGES,
} from "../providers/form/actions";

export default  {
  namespaced: true,
  state: { hasUnsavedChanges: false },
  mutations: {
    [LOG_UNSAVED_CHANGES](state) {
      state.hasUnsavedChanges = true;
    },
    [REMOVE_UNSAVED_CHANGES](state) {
      state.hasUnsavedChanges = false;
    },
  },
  getters: {
    [GET_UNSAVED_CHANGES](state) {
      return state.hasUnsavedChanges;
    },
  },
}