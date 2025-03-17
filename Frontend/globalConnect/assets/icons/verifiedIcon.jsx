import * as React from "react";
import Svg, { Circle, Path } from "react-native-svg";

const VerifiedIcon = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={props.size || 16}
    height={props.size || 16}
    {...props}
  >
    {/* Blue circular background */}
    <Circle cx="12" cy="12" r="10" fill="#1877F2" />
    {/* White check mark */}
    <Path
      d="M9.5 12.5l2 2 4-4"
      stroke="#fff"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default VerifiedIcon;