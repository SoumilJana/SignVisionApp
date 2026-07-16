// Type declarations for modules without TypeScript support

declare module 'react-native-linear-gradient' {
  import {Component} from 'react';
  import {ViewProps} from 'react-native';

  interface LinearGradientProps extends ViewProps {
    colors: string[];
    start?: {x: number; y: number};
    end?: {x: number; y: number};
    locations?: number[];
    useAngle?: boolean;
    angle?: number;
    angleCenter?: {x: number; y: number};
  }

  export default class LinearGradient extends Component<LinearGradientProps> {}
}

// Worklet environment globals (available in JSI frame processors)
declare function performance(): never;
declare namespace performance {
  function now(): number;
}
