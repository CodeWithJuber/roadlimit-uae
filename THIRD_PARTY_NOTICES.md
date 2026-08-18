# Third-party notices

This file records the direct runtime dependencies declared for RoadLimit UAE 0.1.1 and the icon font used by the research build. It is a starting point, not a complete transitive-dependency or final-binary audit. Regenerate and verify notices from the exact production bundle before distribution.

## Direct runtime dependencies

| Component | Version | Licence | Copyright notice |
|---|---:|---|---|
| `@expo/vector-icons` | 15.1.1 | MIT | Copyright (c) 2015 Joel Arvidsson; Copyright (c) 2020 650 Industries |
| `@react-native-async-storage/async-storage` | 2.2.0 | MIT | Copyright (c) 2015-present, Facebook, Inc. |
| `expo` | 57.0.14 | MIT | Copyright (c) 2015-present 650 Industries, Inc. (aka Expo) |
| `expo-constants` | 57.0.12 | MIT | Copyright (c) 2015-present 650 Industries, Inc. (aka Expo) |
| `expo-font` | 57.0.1 | MIT | Copyright (c) 2015-present 650 Industries, Inc. (aka Expo) |
| `expo-haptics` | 57.0.1 | MIT | Copyright (c) 2015-present 650 Industries, Inc. (aka Expo) |
| `expo-keep-awake` | 57.0.1 | MIT | Copyright (c) 2015-present 650 Industries, Inc. (aka Expo) |
| `expo-location` | 57.0.11 | MIT | Copyright (c) 2015-present 650 Industries, Inc. (aka Expo) |
| `expo-notifications` | 57.0.12 | MIT | Copyright (c) 2015-present 650 Industries, Inc. (aka Expo) |
| `expo-speech` | 57.0.1 | MIT | Copyright (c) 2015-present 650 Industries, Inc. (aka Expo) |
| `expo-status-bar` | 57.0.1 | MIT | Copyright (c) 2015-present 650 Industries, Inc. (aka Expo) |
| `expo-system-ui` | 57.0.2 | MIT | Copyright (c) 2015-present 650 Industries, Inc. (aka Expo) |
| `expo-task-manager` | 57.0.11 | MIT | Copyright (c) 2015-present 650 Industries, Inc. (aka Expo) |
| `react` | 19.2.3 | MIT | Copyright (c) Meta Platforms, Inc. and affiliates |
| `react-native` | 0.86.2 | MIT | Copyright (c) Meta Platforms, Inc. and affiliates |
| `react-native-safe-area-context` | 5.7.0 | MIT | Copyright (c) 2019 Th3rd Wave |

`@expo/vector-icons` contains vendored `react-native-vector-icons` code under the MIT licence, copyright 2015 Joel Arvidsson.

## Material Community Icons font

The app uses the `MaterialCommunityIcons.ttf` font distributed through `@expo/vector-icons`. Material Design Icons and its fonts are maintained by Pictogrammers and distributed under the Apache License 2.0 according to the [Pictogrammers licence page](https://pictogrammers.com/docs/general/license/). The full Apache 2.0 text is included in [LICENSE](LICENSE).

Brand and logo glyphs can carry separate trademark or other rights and are not covered by Pictogrammers' general icon licence. RoadLimit UAE does not intentionally use brand/logo glyphs; release review must verify the icons actually bundled and rendered.

## MIT licence text

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Release procedure

Before publishing a binary:

1. inventory the exact production dependency graph and packaged assets;
2. compare every licence and copyright notice against the installed source;
3. add notices for applicable transitive, native, build-generated, and asset dependencies; and
4. include the verified notice set in the distributed application or accompanying materials as each licence requires.
