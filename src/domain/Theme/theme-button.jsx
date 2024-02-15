import React from 'react';
import styles from './theme-button.module.scss';

const ThemeButton = ({ color }) => {
  const changeTheme = (e) => {
    const theme = e.target.dataset.theme;
    const themeColors = {
      blue: { primary: '#6ec1ff' },
      red: { primary: '#ff9898' },
      black: { primary: '#777' },
      orange: { primary: '#ff8051' },
      green: { primary: '#7af17a' },
      purple: { primary: '#e16fe1' },
    };

    document.documentElement.style.setProperty(
      '--primary',
      themeColors[theme].primary
    );
  };

  const capitalize = (str) => {
    return str[0].toUpperCase() + str.slice(1);
  };

  return (
    <div>
      <label className={styles['form-control']}>
        <input
          type='radio'
          name='theme'
          id={`theme-${color}`}
          data-theme={color}
          onChange={(e) => changeTheme(e)}
        />
        {capitalize(color)}
      </label>
    </div>
  );
};

export default ThemeButton;
