// Share.jsx
import * as React from "react";
import Svg, { Path } from "react-native-svg";

const Share = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={props.size || 24}
    height={props.size || 24}
    fill="currentColor"
    {...props}
  >
    {/* Material Design "Share Variant" Icon */}
    <Path d="M18 16.08c-.76 0-1.44.3-1.96.77l-7.13-3.77a3.09 3.09 0 0 0 0-1.14l7.13-3.77c.5.47 1.2.77 1.96.77 1.66 0 3-1.34 3-3s-1.34-3-3-3c-1.66 0-3 1.34-3 3 0 .37.07.72.19 1.04l-7.07 3.73C6.49 10.05 5.78 10 5 10 3.34 10 2 11.34 2 13s1.34 3 3 3c.78 0 1.49-.05 2.12-.54l7.07 3.73c-.12.31-.19.67-.19 1.04 0 1.66 1.34 3 3 3 1.65 0 3-1.34 3-3 .01-1.66-1.33-3-2.99-3z" />
  </Svg>
);

export default Share;
 