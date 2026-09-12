import {readSave,writeSave} from '../progress/storage';
import {createPaidStore} from './store-core';
export const paidStore=createPaidStore({read:readSave,write:writeSave});
