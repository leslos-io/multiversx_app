// frontend/app/redux/reducers/tokenReducer.ts
import { TokenActionTypes } from '../actions/tokenActions';

const initialState = {
  data: [],
  loading: false,
  error: null,
};

export default function tokenReducer(state = initialState, action: TokenActionTypes) {
  switch (action.type) {
    case 'FETCH_TOKENS_SUCCESS':
      return { ...state, data: action.payload, loading: false };
    case 'FETCH_TOKENS_FAILURE':
      return { ...state, error: action.error, loading: false };
    default:
      return state;
  }
}
