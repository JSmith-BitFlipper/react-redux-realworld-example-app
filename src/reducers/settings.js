import {
    SETTINGS_SAVED,
    SETTINGS_PAGE_REFRESH,
    SETTINGS_PAGE_UNLOADED,
    WEBAUTHN_REGISTER,
    ASYNC_START
} from '../constants/actionTypes';

export default (state = {}, action) => {
    switch (action.type) {
    case SETTINGS_SAVED:
        return {
            ...state,
            inProgress: false,
            errors: action.error ? action.payload.errors : null
        };
    case SETTINGS_PAGE_REFRESH:
        return {
            ...state,
            currentUserHasWebauthn: action.payload ? action.payload.webauthn_is_enabled : null,
        };
    case SETTINGS_PAGE_UNLOADED:
        return {};
    case WEBAUTHN_REGISTER:
        return {
            ...state,
            inProgress: false,
        };
    case ASYNC_START:
        return {
            ...state,
            inProgress: true
        };
    default:
        return state;
    }
};
