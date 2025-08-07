declare module 'react-native-snap-carousel' {
  import { Component } from 'react';
  import {
    FlatListProps,
    ViewStyle,
    StyleProp,
    ImageStyle,
    TextStyle,
  } from 'react-native';

  export interface CarouselProps<T> extends FlatListProps<T> {
    data: T[];
    renderItem: ({ item, index }: { item: T; index: number }) => React.ReactNode;
    sliderWidth: number;
    itemWidth: number;
    onSnapToItem?: (index: number) => void;
    loop?: boolean;
    autoplay?: boolean;
    containerCustomStyle?: StyleProp<ViewStyle>;
    contentContainerCustomStyle?: StyleProp<ViewStyle>;
    slideStyle?: StyleProp<ViewStyle>;
    inactiveSlideOpacity?: number;
    inactiveSlideScale?: number;
    enableSnap?: boolean;
  }

  export default class Carousel<T> extends Component<CarouselProps<T>> {}
  export type CarouselRenderItemInfo<T> = { item: T; index: number };
}
