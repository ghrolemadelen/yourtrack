import ThemeColors from './theme-colors';
import styles from './theme.module.scss';

const Theme = () => {
  return (
    <>
      <h2>Choose a Theme</h2>
      <div className={styles.themes}>
        <ThemeColors colors={['red', 'green', 'purple']} />
        <ThemeColors colors={['orange', 'blue', 'black']} />
      </div>
    </>
  );
};

export default Theme;
