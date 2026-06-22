# ToDoList

This repository contains a simple Firebase-hosted to-do list web app backed by Firestore.

## Local files

- `index.html`: app shell
- `styles.css`: app styling
- `app.js`: Firebase and Firestore logic
- `env.example.js`: sample Firebase config file
- `firebase.json`: Firebase hosting configuration
- `firestore.rules`: Firestore security rules

## Deploy

1. Install the Firebase CLI if needed.
2. Copy `env.example.js` to `env.js` and fill in your Firebase config.
3. Run `firebase deploy`.

This project currently uses open Firestore rules because the app has no authentication.

## Firestore structure

- `todoLists/shared`: shared list document
- `todoLists/shared/items/*`: task documents for that list
