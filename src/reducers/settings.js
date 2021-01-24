import {
    SETTINGS_SAVED,
    SETTINGS_PAGE_UNLOADED,
    WEBAUTHN_BEGIN_REGISTER,
    WEBAUTHN_SAVED,
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
    case SETTINGS_PAGE_UNLOADED:
        return {};
    case WEBAUTHN_BEGIN_REGISTER:
        return {
            ...state,
            webauthn_options: action.payload
        };
    case WEBAUTHN_SAVED:
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
