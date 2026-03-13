import { Platform, View } from 'react-native';

let AvoidSoftInputView;
if (Platform.OS !== 'web') {
  AvoidSoftInputView = require('react-native-avoid-softinput').AvoidSoftInputView;
} else {
  AvoidSoftInputView = View;
}

export { AvoidSoftInputView };
