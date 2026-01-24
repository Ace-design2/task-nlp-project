import React from "react";

const VuesaxIcon = ({
  name,
  isActive = false,
  darkMode,
  className = "",
  style = {},
  variant: propVariant,
  color,
}) => {
  // If variant is explicitly provided, use it. Otherwise derive from isActive.
  // Default to 'linear' if neither is specified/active.
  const variant = (
    propVariant ? propVariant : isActive ? "bold" : "linear"
  ).toLowerCase();
  const iconPath = `/icons/vuesax/${variant}/${name}.svg`;

  // If a specific color is requested, use mask-image approach
  if (color) {
    return (
      <div
        className={`vuesax-icon ${className}`}
        style={{
          width: 24,
          height: 24,
          backgroundColor: color,
          WebkitMaskImage: `url(${iconPath})`,
          maskImage: `url(${iconPath})`,
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          display: "block",
          ...style,
        }}
        aria-label={`${name} icon`}
      />
    );
  }

  return (
    <img
      src={iconPath}
      alt={`${name} icon`}
      className={`vuesax-icon ${className}`}
      style={{
        width: 24,
        height: 24,
        filter: darkMode ? "invert(1)" : "none",
        display: "block", // Ensure no extra inline spacing
        ...style,
      }}
    />
  );
};

export default VuesaxIcon;
