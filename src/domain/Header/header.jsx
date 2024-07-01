import styles from './header.module.scss';

const Header = () => {
  const currentDate = new Date();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth()+1, 0).getDate() - 1;
  let pastDate = new Date(
    new Date().setDate(new Date().getDate() - daysInMonth)
  ).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const displayDate = () => {
    return (
      <span className='date'>
        {pastDate} -{' '}
        {currentDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })}
      </span>
    );
  };

  return (
    <header className={styles.header}>
      <h2>YOUR TRACK - Top 10</h2>
      <div className={styles.info}>
        {displayDate()}
        <span className={styles.handle}></span>
      </div>
    </header>
  );
};

export default Header;
