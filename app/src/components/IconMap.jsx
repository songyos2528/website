import * as Icon from 'react-feather';

/**
 * Map service icon names/emojis to React Feather Icons
 */
const iconMap = {
  // Emoji support (backward compatibility)
  '🎨': 'PenTool',
  '🔨': 'Tool',
  '🪟': 'Square',
  '🛠️': 'Tool',
  '🎪': 'Home',
  '✨': 'Star',

  // Direct icon name support (mapped to icons that exist in react-feather)
  'layers': 'Layers',
  'palette': 'PenTool',
  'hammer': 'Tool',
  'tool': 'Tool',
  'square': 'Square',
  'wrench': 'Tool',
  'home': 'Home',
  'star': 'Star',
  'pen-tool': 'PenTool',
  'box': 'Box',
  'aperture': 'Aperture',
  'check-circle': 'CheckCircle',
  'building': 'Home',
  'hammer-icon': 'Tool',
  'paintbrush': 'PenTool',
  'window': 'Square',
};

/**
 * Render Feather icon by name
 * @param {string} iconName - Icon name from database or emoji
 * @param {string} className - Additional CSS classes
 * @param {object} style - Additional inline styles
 */
export const FeatherIcon = ({
  iconName = 'Star',
  className = '',
  style = {},
  size = 32,
  color = 'currentColor'
}) => {
  // Get the mapped icon name
  const mappedIcon = iconMap[iconName] || 'HelpCircle';

  // Get the icon component from react-feather
  const IconComponent = Icon[mappedIcon];

  if (!IconComponent) {
    console.warn(`Icon "${mappedIcon}" not found in react-feather`);
    return <Icon.HelpCircle size={size} className={className} style={style} />;
  }

  return (
    <IconComponent
      size={size}
      color={color}
      className={`feather-icon ${className}`}
      style={style}
      strokeWidth={2}
    />
  );
};

export default FeatherIcon;
