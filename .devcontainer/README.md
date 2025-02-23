Creating a Progressive web app.

Prompts for creation:

```
You are a prompt generation bot. Please generate a prompt to generate a progressive web application. The application will be written in Type script, and generated using create react app. The interface should use Bootstrap and support a responsive layout that is tailored for mobile devices. The application should support offline use and use IndexedDB. It should have the following data structure:

- Player
  - id
  - Name
  - Number

- Team
  - id
  - Name
  - Players (array of Player objects)

- Game
  - id
  - Date
  - Team (Team object)
  - Period (array of Period objects)
    - Length (10 minutes or 20 minutes)
    - Substitutions (array of Substitution objects)
      - Player (Player object)
      - Time on
      - Time off
      - Minutes Played

It should use the following navigation structure:
  - List Teams
    - Create Team
    - View Team
      - List Players
        - Create Player and add to Team
        - View Player
  - List Games
    - Create Game
    - View Game
      - Add Substitution to Game
      - Start and Stop Clock
      - Adjust Clock
      - Calculate Minutes Played
      - View Substitutions

When viewing a game, we need the following functionality:
- Set 2 20 minute halves or 4 10 minute quarters
- Start and stop the clock
- Add a player to the court. This should create a substitution and set the time on to the time on the clock
- Remove a player from the court. This should set the time off on their substitution to the time on the clock and calculate their minutes played
- Support manual adjustment of the clock
```

```
Generate a Progressive Web Application (PWA) using TypeScript and Create React App. The app should include Bootstrap for a responsive layout that’s optimized for mobile devices. The app should function offline and utilize IndexedDB to store data locally.
Data Structure:

    Player:
        id (unique identifier)
        name (string)
        number (string or number)

    Team:
        id (unique identifier)
        name (string)
        players (array of Player objects)

    Game:
        id (unique identifier)
        date (Date object)
        team (Team object)
        periods (array of Period objects):
            length (10 or 20 minutes)
            substitutions (array of Substitution objects):
                player (Player object)
                timeOn (time on the clock)
                timeOff (time off the clock)
                minutesPlayed (calculated from timeOn and timeOff)

Navigation Structure:

    List Teams
        Create Team
        View Team
            List Players
                Create Player and add to Team
                View Player

    List Games
        Create Game
        View Game
            Add Substitution to Game
            Start/Stop Clock
            Adjust Clock
            Calculate Minutes Played
            View Substitutions

Game View Functionality:

    Support setting the game into 2 halves of 20 minutes or 4 quarters of 10 minutes.
    Implement a start/stop clock for game periods.
    Add a player to the court, creating a substitution with the current time on the clock.
    Remove a player from the court, setting their timeOff on the substitution and calculate minutes played.
    Allow manual adjustments of the clock time.

Additional Features:

    Store data in IndexedDB to ensure offline capabilities.
    The layout should be responsive, ensuring a smooth user experience on mobile devices.
    Use React hooks and components to manage state and render UI elements dynamically.

Libraries/Technologies:

    TypeScript
    React (with hooks)
    Bootstrap (for layout)
    IndexedDB (for offline data storage)

Offline Support:

Ensure that data is stored locally using IndexedDB for offline usage, including team, player, and game data. The app should function fully offline once the user has interacted with it.
```

```
Yes please continue with the main components for team and game management.
```

```
Please continue with the game view component and routing setup.
```

```
Can you setup the service worker for PWA functionality
```

```
On the View Team page, can you add functionality to add a player to the team. The page should also show the Team name, and provide the option to remove or edit a player.
```

```
Implementing the game clock logic
Setting up the service worker for PWA functionality
Creating the responsive UI components using React Bootstrap
Implementing the substitution management system
Let me know which part you'd like to focus on next!
```