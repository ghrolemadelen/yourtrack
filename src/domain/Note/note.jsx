import styles from './Note.module.scss';

const Note = () => {
  return (
    <div className={styles.note}>
      <ol>
        <li>
          Top 10 tracks based on the last 28 days of your listening history.
        </li>
        <li>
          Click a track to play a 30-second preview (some tracks may not have a
          preview available).
        </li>
        <li>
          To stop the preview, click the track again or press the ESC key.
        </li>
      </ol>
    </div>
  );
};

export default Note;
