import PropTypes from 'prop-types';
import ThemeButton from './theme-button';

const ThemeColors = ({ colors }) => {
  return (
    <div>
      {colors &&
        colors.map((color, idx) => (
          <ThemeButton
            color={color}
            key={idx}
          />
        ))}
    </div>
  );
};

ThemeColors.propTypes = {
  colors: PropTypes.array.isRequired,
};

export default ThemeColors;
