# Folio

A book collection app: books and their editions, physical copies, series and
universes, collections, TBR/DNF, pre-orders, subscription boxes and a visual
bookshelf with drag and drop. Built with Expo (React Native) and Supabase.

## Getting started

```bash
npm install
cp .env.example .env      # then fill in the two values below
npx expo start            # press i / a, or scan the QR code with a dev build
```

`.env` (never commit it):

```
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Only the **publishable** key belongs in the app. The secret key must never be
put in an `EXPO_PUBLIC_` variable: it would be bundled into the app.

**Expo Go** (no dev build): the project is linked to an EAS project, so Expo Go
asks you to sign in as a member. To open it with your own Expo account instead:

```bash
npx expo login                      # and sign in to Expo Go with the same account
FOLIO_EXPO_GO=1 npx expo start --go
```

`app.config.js` drops the EAS project id only when `FOLIO_EXPO_GO=1`; builds
are unaffected.

## After pulling changes

```bash
git pull
npm install               # always, after every pull
npx expo start -c         # -c clears Metro's cache ("Unable to resolve module ...")
```

If a pull adds or updates a package with native code (for example
`expo-image`, `expo-haptics`), the **development build must be rebuilt**:

```bash
eas build --profile development --platform ios   # and/or android
```

Install the new build on your phone, then run `npx expo start -c` again.

Windows (PowerShell) equivalents: set an env var with
`$env:FOLIO_EXPO_GO=1; npx expo start --go`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Expo dev server |
| `npm test` | Unit tests (jest-expo) |
| `npm run lint` | ESLint (eslint-config-expo) |
| `npm run web` | Run in a browser (drag and drop is best tested on a phone) |

## Project structure

```
App.js                     auth gate, screen switch, layout
index.js                   root: SafeAreaProvider, toast host, web Alert shim
src/
  state/
    useFolioStore.js       all state + data loading; returns everything screens use
    FolioContext.js        useFolio() hook for screens/components
    actions/*.js           actions by area: books, collections, images, preorders, subscriptions
    stats.js               numbers for the Stats tab
  screens/                 one file per screen (Library, BookDetail, Collections, ...)
    forms/                 one file per add/edit form shown in the bottom sheet
  components/
    ui.js                  AppButton, Field, Heading, Cover, Chip
    shell/                 TopBar, TabBar, ScannerModal, ProfileModal
    Toast.js               notify(title, message) + <ToastHost/>
  Bookshelf.js             the bookshelf: layout, drag and drop, piles, auto-scroll
  utils/shelfLayout.js     pure shelf layout logic (unit tested)
  utils/format.js          dates, money, small helpers (unit tested)
  styles.js, theme.js, constants.js
supabase/migrations/       every database change, in order (with .down.sql where needed)
__tests__/                 unit tests
```

How data flows: `useFolioStore` loads the user's tables from Supabase and
holds them in state. Screens call `useFolio()` to read data and call actions.
After an action writes, it calls `loadData([...tables])` so only the tables it
touched are reloaded (plus cascade children, e.g. books → editions).

Messages: use `notify(title, message)` for anything that is not a question.
Keep `Alert.alert` only for real choices ("Delete this book?"); on web those
become `window.confirm`.

## The bookshelf

- Each edition stores its shelf (`editions.shelf_index`) and its order
  (`editions.sort_order`). Books stay on the shelf they were put on; if a shelf
  becomes too full for the screen, its last book moves to the start of the next
  shelf. There is always one spare empty shelf to drop onto.
- Display styles: `spine`, `cover`, `edge`, `stack` (lying flat). Consecutive
  lying books form a pile of up to 5.
- Drag and drop: long-press to lift, drag anywhere (the page auto-scrolls at
  the top/bottom edge), release to drop. The whole layout is saved in one call
  to `save_shelf_layout(ids, shelves)`.
- New editions are placed at the end of the bookcase by a database trigger.

## Database

All schema changes live in `supabase/migrations/` and have been applied to the
project. Apply new ones in order (Supabase SQL editor or `supabase db push`).

Row-level security is on for every table: users can only read and write their
own rows. Functions the app calls: `save_shelf_layout`, `reorder_editions`,
`username_available`.
