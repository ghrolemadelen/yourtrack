> Since the quota extension has not been processed yet, only 25 users may have access to this app. If you would like to try the app, please contact me (jiiyoo@tuta.io) with your email address so that you can gain access to it.

# YourTrack

![](/public/ogimage.png)

YourTrack is a React-based web application that allows you to easily view the top 10 tracks from your last month's history of playing music on Spotify.

## Features

- **Spotify Integration**: YourTrack seamlessly integrates with the Spotify API to fetch your music history.
- **Top 10 Tracks**: Quickly discover your most-played tracks from the previous month.
- **30-Second Track Preview**: Click on a track to listen to a 30-second preview directly within the application.
- **Customizable Themes**: Personalize your experience by choosing from 6 different themes to change the appearance of the application.
- **Download as Image**: Save your top tracks visualization as an image for easy sharing.

## Deployment

### Clone and Install Dependencies

1. Clone the repository

```sh
$ git clone https://github.com/yourusername/yourtrack.git
```

2. Install Dependencies

```sh
cd yourtrack
$ pnpm install
```

### Set Up Spotify API

- Visit the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and create a new application.
- Obtain your _Client ID_
- Navigate to the Setting and add your environment in _Redirect URIs_ section.
- Create a `.env` file in the project root and add:
  ```env
  VITE_CLIENT_ID=<client_id>
  VITE_REDIRECT_URI=<redirect_uri>
  ```

### Run the Application

```sh
$ pnpm run dev
```

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE.md) file for details.
