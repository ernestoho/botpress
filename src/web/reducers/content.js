import { handleActions } from 'redux-actions'
import reduceReducers from 'reduce-reducers'
import _ from 'lodash'
import nanoid from 'nanoid'

import {
  receiveContentCategories,
  receiveContentMessages,
  receiveContentMessagesRecent,
  receiveContentMessagesCount,
  receiveContentSchema
} from '~/actions'

const defaultState = {
  categories: [],
  currentMessages: [],
  recentMessages: [],
  messagesCount: 0
}

export default handleActions(
  {
    [receiveContentCategories]: (state, { payload }) => ({
      ...state,
      categories: payload
    }),

    [receiveContentMessages]: (state, { payload }) => ({
      ...state,
      currentMessages: payload.data
    }),

    [receiveContentMessagesRecent]: (state, { payload }) => ({
      ...state,
      recentMessages: payload.data
    }),

    [receiveContentMessagesCount]: (state, { payload }) => ({
      ...state,
      messagesCount: payload.data.count
    })
  },
  defaultState
)
