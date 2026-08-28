/**
 * True from the moment the session dies (refresh failed) until the next login.
 * Read synchronously by the unsaved-changes blocker so a forced return-to-login
 * navigation is never blocked by a dirty edit form: React state has not
 * re-rendered yet when that navigation happens.
 */
export const sessionDeadRef = { current: false };
