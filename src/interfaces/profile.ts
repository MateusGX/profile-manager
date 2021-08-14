import { Extension } from './extension'
export interface ProfileData{
  extensions: Array<Extension>;
  settings: Object;
}
export interface Profiles{
  [index: string]: ProfileData;
}