// frontend/redux/reducers/index.js
import { combineReducers } from 'redux';
import tokenReducer from './tokenReducer';

export default combineReducers({
  tokens: tokenReducer,
});
