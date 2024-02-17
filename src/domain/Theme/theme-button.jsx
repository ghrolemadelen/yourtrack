import styles from './theme.module.scss';
import PropTypes from 'prop-types';

const ThemeButton = ({ color, index }) => {
  const changeTheme = (e) => {
    const themeColors = {
      blue: { primary: '#6ec1ff' },
      red: { primary: '#ff9898' },
      black: { primary: '#777' },
      orange: { primary: '#ff8051' },
      green: { primary: '#7af17a' },
      purple: { primary: '#e16fe1' },
    };

    const theme = e.target.dataset.theme;
    document.documentElement.style.setProperty(
      '--primary',
      themeColors[theme].primary
    );
  };

  const capitalize = (str) => {
    return str[0].toUpperCase() + str.slice(1);
  };

  return (
    <div key={index}>
      <label className={styles['form-control']}>
        <input
          type='radio'
          name='theme'
          id={`theme-${color}`}
          data-theme={color}
          onChange={(e) => changeTheme(e)}
          defaultChecked={color === 'blue'}
        />
        {capitalize(color)}
      </label>
    </div>
  );
};

ThemeButton.propTypes = {
  color: PropTypes.string.isRequired,
  index: PropTypes.string,
};

export default ThemeButton;
