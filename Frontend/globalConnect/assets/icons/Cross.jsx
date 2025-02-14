import * as React from "react";
import Svg, { Path } from "react-native-svg";

const Cross = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={24}
    height={24}
    color="#000000"
    fill="none"
    {...props}
  >
    <Path
      d="M6 6L18 18M18 6L6 18"
      stroke="currentColor"
      strokeWidth={props.strokeWidth || 2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default Cross;
