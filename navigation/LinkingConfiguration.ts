/**
 * Learn more about deep linking with React Navigation
 * https://reactnavigation.org/docs/deep-linking
 * https://reactnavigation.org/docs/configuring-links
 */

import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';

import { RootStackParamList } from '../types';

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL('/')],
  config: {
    screens: {
      Root: {
        screens: {
          TabOne: {
            screens: {
              TabOneScreen: 'one',
            },
          },
          TabTwo: {
            screens: {
              TabTwoScreen: 'two',
            },
          },
        },
      },
      Login: 'login',
      CreateProfile: 'createProfile',
      Home: 'home',
      ViewTrip: 'viewTrip',
      ViewExpense: 'viewExpense',
      ViewTravelers: 'viewTravelers',
      PrintPDF: 'printPDF',
      VerifyEmail: 'verifyEmail',
      CreateTrip: 'CreateTrip',
      Profile: 'Profile',
      // Modal: 'modal',
      NotFound: '*',
    },
  },
};

export default linking;
