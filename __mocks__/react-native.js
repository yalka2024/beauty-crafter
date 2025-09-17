// __mocks__/react-native.js
const React = require('react');
module.exports = {
  View: (props) => React.createElement('View', props, props.children),
  Text: (props) => React.createElement('Text', props, props.children),
  TextInput: (props) => React.createElement('TextInput', props, props.children),
  Button: (props) => React.createElement('Button', props, props.children),
  ActivityIndicator: (props) => React.createElement('ActivityIndicator', props, props.children),
  FlatList: (props) => {
    // Render all items using renderItem, as React Native would
    const items = Array.isArray(props.data) && typeof props.renderItem === 'function'
      ? props.data.map((item, index) => props.renderItem({ item, index }))
      : null;
    return React.createElement('FlatList', props, items);
  },
  StyleSheet: {
    create: jest.fn((styles) => styles),
    flatten: jest.fn((style) => style),
  },
  Alert: {
    alert: jest.fn(),
  },
  Platform: {
    OS: 'ios',
    select: jest.fn((obj) => obj.ios),
  },
  // Add any other components or APIs you use as needed
};