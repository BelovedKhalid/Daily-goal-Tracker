# Daily Goals Tracker

A simple static web app for tracking daily goals, scheduling reminders, and reviewing successes or missed goals.

## Usage

1. Open `index.html` in your browser.
2. Add a goal description and select a time.
3. Allow browser notifications when prompted.
4. The app will notify you when the goal time arrives.
5. At the end of the day, it will summarize whether you completed all goals or missed any.

## Notes

- Goals and history are saved using browser `localStorage`.
- The app checks pending goals every 30 seconds.
- If a goal is not completed by its scheduled time, it is marked as missed.
- The app registers a service worker and supports installation as a PWA to improve background notification behavior.
- For notifications while the app is closed on mobile or desktop, install the app to your device and allow notifications.
