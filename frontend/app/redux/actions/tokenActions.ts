import { Dispatch } from "redux";
import { FETCH_TOKENS_SUCCESS, FETCH_TOKENS_FAILURE } from "./actionTypes";

// frontend/app/redux/actions/actionTypes.ts
export interface FetchTokensSuccessAction {
  type: typeof FETCH_TOKENS_SUCCESS;
  payload: any; // Specify a more precise type if possible
}

export interface FetchTokensFailureAction {
  type: typeof FETCH_TOKENS_FAILURE;
  error: any; // Specify a more precise type if possible
}

export type TokenActionTypes =
  | FetchTokensSuccessAction
  | FetchTokensFailureAction;

  // frontend/app/redux/actions/tokenActions.js
  export const fetchTokens = () => async (dispatch: Dispatch<TokenActionTypes>) => {

  try {
    const response = await fetch('/api/tokens');
    const data = await response.json();
    dispatch({ type: 'FETCH_TOKENS_SUCCESS', payload: data });
  } catch (error) {
    if (error instanceof Error) {
      dispatch({ type: 'FETCH_TOKENS_FAILURE', error: error.message });
    } else {
      dispatch({ type: 'FETCH_TOKENS_FAILURE', error: 'An unknown error occurred' });
    }
  }
};

