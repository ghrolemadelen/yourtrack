import styles from './footer.module.scss';

const Footer = () => {
  const url = 'yourtrack.vercel.app';
  const author = 'Madelen';

  return (
    <div className={styles.footer}>
      {url} /{' '}
      <a
        href='https://github.com/rolemadelen'
        target='_blank'
        rel='noopener noreferrer'>
        {author}
      </a>
    </div>
  );
};

export default Footer;
