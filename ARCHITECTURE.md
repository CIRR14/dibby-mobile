# Dibby Mobile - Frontend Architecture

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Core Patterns](#core-patterns)
5. [Authentication & User Flow](#authentication--user-flow)
6. [State Management](#state-management)
7. [Navigation](#navigation)
8. [Styling & Design System](#styling--design-system)
9. [Data Flow](#data-flow)
10. [Firebase Integration](#firebase-integration)
11. [Key Architectural Decisions](#key-architectural-decisions)
12. [Common Tasks & Workflows](#common-tasks--workflows)

---

## Project Overview

**Dibby** is a cross-platform expense-splitting application built with Expo (React Native + Web). It enables users to create trips, track shared expenses, and settle debts with friends in real-time.

### Key Features
- User authentication (Google, Facebook, Apple, Email)
- Trip management and expense tracking
- Real-time collaboration on shared expenses
- PDF export of trip summaries
- Dark/light theme support
- Responsive design (mobile, tablet, web)

### Deployment Targets
- iOS (via Expo/Xcode)
- Android (via Expo/Android Studio)
- Web (via Expo Web + Firebase Hosting)

---

## Technology Stack

### Core

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | React Native / React | 18.2.0 / 0.71.14 | Cross-platform UI |
| **Bundler** | Expo | 48.0.20 | Development & deployment |
| **Language** | TypeScript | 4.9.4 | Type safety |
| **Platform Adapter** | React Native Web | 0.18.7 | Web support |

### State Management

| Library | Version | Purpose |
|---------|---------|---------|
| **Zustand** | 5.0.8 | Global state (auth, user profile) |
| **Async Storage** | 1.17.11 | Persistent local state (theme) |
| **React Context** | Built-in | Theme provider |

### Navigation

| Library | Version | Purpose |
|---------|---------|---------|
| **React Navigation** | 6.x | Cross-platform routing |
| **Native Stack** | 6.8.0 | Native stack navigation |
| **Bottom Tabs** | 6.0.5 | Tab bar navigation |

### Backend & Services

| Service | Purpose |
|---------|---------|
| **Firebase Authentication** | User signup, login, OAuth providers |
| **Firestore** | Real-time database for trips, expenses, users |
| **Cloud Storage** | User profile photos |

### UI & Styling

| Library | Version | Purpose |
|---------|---------|---------|
| **React Native Paper** | 5.9.1 | Material Design components |
| **RNEUI** | 4.0.0-rc.7 | Themed components (avatars, etc.) |
| **FontAwesome Icons** | 6.2.0 | Icon set |
| **Expo Linear Gradient** | 12.1.2 | Gradient effects |

### Utilities

| Library | Purpose |
|---------|---------|
| **React Hook Form** | Form state management |
| **UUID** | Unique ID generation |
| **Dotenv** | Environment variables |
| **Expo Linking** | Deep linking & URL handling |
| **Expo Print** | PDF generation |

---

## Project Structure

```
dibby-mobile/
├── App.tsx                      # Root entry point
├── firebase.js                  # Firebase initialization & config
├── types.tsx                    # Global TypeScript definitions (navigation types)
│
├── navigation/                  # Navigation setup
│   ├── index.tsx               # Root, stack, and tab navigators
│   └── LinkingConfiguration.ts # Deep linking config
│
├── screens/                     # Full-screen components (pages)
│   ├── LoginScreen.tsx         # Auth entry point
│   ├── CreateProfile.tsx       # Onboarding step 2
│   ├── VerifyEmail.tsx         # Onboarding step 1
│   ├── HomeScreen.tsx          # Trips list
│   ├── ViewTrip.tsx            # Trip detail & expense list
│   ├── ViewExpense.tsx         # Expense detail
│   ├── Profile.tsx             # User profile page
│   ├── TripWizard.tsx          # Multi-step trip creation
│   ├── PdfScreen.tsx           # PDF preview/export
│   ├── PrivacyPolicy.tsx       # Legal
│   └── AccountDeletion.tsx     # Account management
│
├── components/                  # Reusable UI components
│   ├── Dibby*.tsx              # Custom branded components (Button, Input, Card, etc.)
│   ├── Neuro*.tsx              # Neuomorphic design components
│   ├── CreateTrip.tsx          # Trip creation modal
│   ├── CreateExpense.tsx       # Expense creation modal
│   ├── SortFilterBar.tsx       # Expense filtering
│   ├── StatsGrid.tsx           # Statistics display
│   └── ScreenLayout.tsx        # Shared screen wrapper
│
├── hooks/                       # Custom React hooks
│   ├── useUser.ts              # Read-only access to auth/profile state
│   ├── useAppTheme.ts          # Theme color access
│   ├── useAvatarUrl.ts         # Avatar image URL resolution
│   ├── useCachedResources.ts   # Font loading on app start
│   ├── useColorScheme.ts       # System dark/light preference
│   ├── useDebounce.ts          # Debounced values
│   └── useResponsiveLayout.ts  # Screen size detection
│
├── stores/                      # Zustand state stores
│   ├── authStore.ts            # Auth state (loggedInUser, authReady)
│   ├── userStore.ts            # User profile state (dibbyUser, profileStatus)
│   └── (Pattern: useXXXSelector for selector-based access)
│
├── context/                     # React Context
│   └── ThemeContext.tsx        # Theme (dark/light) provider
│
├── constants/                   # Constants & config
│   ├── Colors.ts               # Design tokens (light/dark themes)
│   ├── Neumo.ts                # Neuomorphic design tokens
│   ├── Typography.ts           # Font sizes & weights
│   ├── DibbyTypes.ts           # Business logic types (Trip, Expense, etc.)
│   ├── Errors.ts               # Firebase error messages
│   ├── Layout.ts               # Layout constants
│   ├── DeviceWidth.ts          # Responsive breakpoints
│   ├── Styles.ts               # Global stylesheet
│   └── PdfTemplate.ts          # PDF rendering config
│
├── helpers/                     # Business logic utilities
│   ├── FirebaseHelpers.ts      # Firestore CRUD operations
│   ├── TripRepository.ts       # Trip data logic
│   ├── DibbyLogic.ts           # Expense & settlement calculations
│   ├── StatsHelpers.ts         # Statistics computation
│   ├── AppHelpers.ts           # General utilities
│   ├── GenerateColor.ts        # User color assignment
│   ├── TypeHelpers.tsx         # Type utilities & guards
│   └── track.ts                # Analytics tracking
│
├── docs/                        # Documentation
│   ├── privacy-policy.md
│   ├── account-deletion.md
│   └── store-*.md              # App store submission guides
│
├── public/                      # Web static assets
│   └── index.html
│
├── web/                         # Web build output
│   └── index.html              # Web entry point
│
└── assets/
    ├── fonts/                  # Custom fonts
    └── images/                 # App icons, splash screen
```

---

## Core Patterns

### 1. Single File, Single Responsibility
- Each screen/component is a single `.tsx` file
- Inline styles or co-located styles at the bottom
- Clear export: `export default ComponentName;`

### 2. Hook-Based Composition
- Leverage React hooks for state & side effects
- Custom hooks extract cross-cutting concerns (theme, user state)
- Never compose business logic into presentation components

### 3. TypeScript Everywhere
- Strict typing for props, state, and Firebase documents
- Type definitions in `types.tsx` for navigation
- Business types in `DibbyTypes.ts` for data models

---

## Authentication & User Flow

### Authentication Flow Diagram

```
User arrives
    ↓
[useUserBootstrap() runs in RootNavigator]
    ├── Subscribes to Firebase Auth state
    ├── Sets authReady when user is known
    └── Fetches user profile from Firestore
    ↓
authReady = false?
    ├─→ YES: Show DibbyLoading spinner
    └─→ NO: Check auth state
    ↓
loggedInUser = null?
    ├─→ YES: Render LoginScreen
    └─→ NO: Check email verification
    ↓
emailVerified = false?
    ├─→ YES: Render VerifyEmail screen
    └─→ NO: Check profile completion
    ↓
profileStatus != 'complete'?
    ├─→ YES: Render CreateProfile screen
    └─→ NO: Render Root (BottomTabNavigator)
```

### Key Design Decisions

**Single Bootstrap Location**
- `useUserBootstrap()` is called only in [RootNavigator](navigation/index.tsx).
- This centralizes all Firebase listeners and prevents duplicate subscriptions.
- Screens use read-only `useUser()` hook to access state.

**Auth State Seeding**
- Bootstrap immediately calls `setAuthState(auth.currentUser ?? null)` before async listener.
- This eliminates indefinite loading if `onAuthStateChanged` is slow.

**Profile Timeout Safeguard**
- Firestore profile listener has an 8-second timeout.
- If profile load stalls, profile is marked as "missing" to unblock navigation.

**Error-Driven State**
- Profile listener has error callback that sets profile to "missing".
- Prevents indefinite loading on permission/network errors.

### Auth Stores

**authStore.ts** - Firebase auth state
```typescript
interface AuthState {
  loggedInUser: User | null;      // Firebase User object
  authReady: boolean;              // Auth listener initialized
  setAuthState: (user: User | null) => void;
}
```

**userStore.ts** - Dibby user profile
```typescript
type ProfileStatus = "none" | "missing" | "incomplete" | "complete";

interface UserState {
  dibbyUser: DibbyUser | undefined;        // App-level user profile
  profileReady: boolean;                    // Profile fetch complete
  profileStatus: ProfileStatus;             // Onboarding progress
  setProfileLoading: () => void;
  setProfileNone: () => void;
  setProfileMissing: () => void;
  setProfile: (user: DibbyUser, status: ProfileStatus) => void;
}
```

---

## State Management

### Store Pattern: Selector-Based Access

All stores follow a **selector pattern** to avoid unnecessary re-renders:

```typescript
// authStore.ts
export const useAuthSelector = <T>(selector: (state: AuthState) => T): T =>
  useAuthStore(selector);

// In components:
const loggedInUser = useAuthSelector(state => state.loggedInUser);
const authReady = useAuthSelector(state => state.authReady);
```

### Public Hooks

**useUser()** - Read-only access
```typescript
const { dibbyUser, loggedInUser, authReady, profileReady, profileStatus } = useUser();
```

**useUserBootstrap()** - Bootstrap side effects (RootNavigator only)
```typescript
useUserBootstrap(); // Runs Firebase listeners
```

### Local State Management

Most screens use `useState` and `useEffect` for local UI state:
- Form inputs (CreateProfile, ViewExpense)
- Local flags (loading, filters, modals)
- Computed derived state

### Persistent Local State

Theme preference is persisted to device storage:
- `ThemeContext` manages `themeMode` and `scheme`
- Saved to AsyncStorage on change
- Restored from storage on app launch

---

## Navigation

### Navigator Hierarchy

```
NavigationContainer
    ↓
RootNavigator (Stack)
    ├── [Unauthenticated]
    │   └── Login
    ├── [Authenticated but unverified]
    │   └── VerifyEmail
    ├── [Authenticated but incomplete profile]
    │   └── CreateProfile
    ├── [Fully authenticated]
    │   └── Root (BottomTabNavigator)
    │       ├── TripsTab (Stack)
    │       │   ├── Home
    │       │   ├── ViewTrip
    │       │   ├── ViewExpense
    │       │   ├── CreateTrip
    │       │   ├── TripWizard
    │       │   └── PrintPDF
    │       ├── AddAction (null screen, triggers modal via AddTabButton)
    │       └── ProfileTab (Stack)
    │           └── Profile
    ├── NotFound (fallback)
    ├── PrivacyPolicy (modal)
    └── AccountDeletion (modal)
```

### Key Files

**navigation/index.tsx**
- Defines all navigator instances
- `RootNavigator` hosts the auth flow logic
- `BottomTabNavigator` with 3 tabs + add button
- Delegates to stack navigators for each tab

**navigation/LinkingConfiguration.ts**
- Deep linking configuration
- Maps routes to URL paths
- Example: `ViewTrip` → `viewTrip`

**types.tsx**
- TypeScript definitions for all route params
- Example: `ViewTrip` takes `tripId`, `tripName`, `expenseId`
- Ensures type-safe navigation

### Navigation Patterns

#### Stack Navigation
```typescript
navigation.navigate('TripsTab', { 
  screen: 'ViewTrip', 
  params: { tripId: '123', tripName: 'Vegas' } 
});
```

#### Reset Navigation
```typescript
navigation.reset({
  index: 0,
  routes: [{ name: 'Root' }],
});
```

#### Modal via Button
- `AddTabButton` in floating tab bar
- Reads active route and navigates to appropriate creation modal

---

## Styling & Design System

### Design Philosophy: Neumorphism

**Neumorphism** (or Skeuomorphism 2.0) combines flat design with subtle shadows and highlights to create a soft, molded appearance.

### Design Tokens

**NeumoTokens** in `constants/Neumo.ts`:
```typescript
export const NeumoTokens = {
  radius: { xs: 8, sm: 12, md: 16, lg: 22, xl: 28, pill: 999 },
  spacing: { xxs: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 40 },
  motion: { fast: 180, normal: 220, slow: 260 },
  touch: { minTarget: 44 },
  control: { button: { sm, md, lg }, pill: { ...} },
};
```

### Surface Variants

Surface container styling maps variants to visual styles:
- `raised` → Glass effect with blur
- `glass` → Semi-transparent glass
- `glass-strong` → Stronger glass effect
- `solid` → Opaque background
- `inset` → Pressed/depressed effect
- `flat` → Solid background

### Theme System

**Colors.ts** defines light/dark color palettes:
```typescript
interface ThemeColors {
  primary: { background, text };
  accent: string;
  textPrimary, textSecondary: string;
  background: { default, secondary };
  surfaceGlass, surfaceGlassStrong: string;
  danger, success, info: { background, ... };
}
```

**ThemeContext** manages theme persistence:
```typescript
const { scheme, themeMode, setThemeMode } = useTheme();
```

### Color Assignment

**generateColor.ts** - Deterministic user color assignment
- Assigns unique color to each user based on uid/email/displayName
- Ensures consistent avatar colors across app

### Responsive Design

**useResponsiveLayout()** - Breakpoints:
- Mobile: < 600px (default)
- Tablet: 600-1200px
- Web: > 1200px

Most screens use `maxWidth: 420` to constrain content on large screens.

---

## Data Flow

### Unidirectional Data Flow

```
Firebase
    ↓
[useUserBootstrap listeners]
    ↓
Zustand stores (authStore, userStore)
    ↓
useUser() read-only hook
    ↓
Components render
```

### Example: Viewing a Trip

1. **User taps trip in HomeScreen**
   ```typescript
   navigation.navigate('ViewTrip', { tripId: '123', tripName: 'Vegas' });
   ```

2. **ViewTrip screen mounts**
   ```typescript
   const { dibbyUser } = useUser(); // Get current user
   const tripId = route.params.tripId;
   ```

3. **Fetch trip data on mount**
   ```typescript
   useEffect(() => {
     const tripRef = doc(db, 'trips', tripId);
     const unsubscribe = onSnapshot(tripRef, (docSnap) => {
       const trip = docSnap.data() as DibbyTrip;
       setTrip(trip);
     });
     return unsubscribe;
   }, [tripId]);
   ```

4. **Real-time updates**
   - Firestore listener pushes updates to component state
   - Component re-renders with new data

### Key Data Types

**DibbyUser** (from Firestore `users/{uid}`)
```typescript
interface DibbyUser {
  uid: string;
  email: string;
  displayName: string;
  username: string;
  photoURL: string | null;
  trips: string[]; // Trip IDs user is part of
  createdAt: Timestamp;
}
```

**DibbyTrip** (from Firestore `trips/{tripId}`)
```typescript
interface DibbyTrip {
  id: string;
  name: string;
  createdBy: string; // uid
  participants: DibbyParticipant[];
  expenses: DibbyExpense[];
  createdAt: Timestamp;
}
```

**DibbyExpense**
```typescript
interface DibbyExpense {
  id: string;
  description: string;
  amount: number;
  paidBy: DibbyParticipant;
  peopleInExpense: DibbySplits[];
  createdAt: Timestamp;
}
```

---

## Firebase Integration

### Firebase Initialization

**firebase.js** - Config & provider setup:
- Reads env vars from `.env`
- Supports web/native platform differences
- Exports instances: `auth`, `db`, `storage`

### Authentication

**Providers supported**
- Google OAuth
- Facebook OAuth
- Apple OAuth
- Email/password

### Firestore Database Structure

```
firestore/
├── users/{uid}
│   ├── email
│   ├── displayName
│   ├── username
│   ├── photoURL
│   ├── trips[]
│   └── userColor
│
├── trips/{tripId}
│   ├── name
│   ├── createdBy (uid)
│   ├── participants[]
│   ├── expenses[]
│   └── createdAt
│
├── expenses/{expenseId}
│   ├── amount
│   ├── description
│   ├── paidBy
│   ├── peopleInExpense[]
│   └── createdAt
│
└── subTrips/{tripId}_{subTripId}
    └── (Sub-categories for splitting)
```

### Firebase Helpers

**FirebaseHelpers.ts** - CRUD operations:
- `createDibbyUser()` - Onboarding
- `createTrip()` - New trip
- `addExpense()` - Log expense
- `settleSplit()` - Close expense
- `deleteDibbyUserData()` - Account deletion

**TripRepository.ts** - Trip-specific logic:
- `ensureMainSubTripForTrip()` - Init trip structure
- `createTripExpense()` - Add expense to trip
- `deleteTripExpense()` - Remove expense
- `MAIN_SUB_TRIP_ID` - Partition key

---

## Key Architectural Decisions

### 1. Why Zustand over Redux?
- **Lightweight**: No boilerplate required
- **Hooks-first**: Uses React hooks API
- **Selector pattern**: Prevents unnecessary re-renders
- **Firebase-friendly**: Easy to update store from listeners

### 2. Why Firestore over REST API?
- **Real-time**: onSnapshot() auto-updates UI
- **Offline support**: Data cached locally
- **Security rules**: Fine-grained access control
- **Scalability**: Managed database

### 3. Why Bootstrap Hook Separate from Read Hook?
- **Single source of truth**: One place sets up listeners (prevents duplicates)
- **Screens stay pure**: Components read state, don't set up listeners
- **Testability**: Easier to mock listeners during testing

### 4. Why React Navigation Over Custom Router?
- **Platform consistency**: Same API for iOS/Android/Web
- **Deep linking**: Built-in URL routing
- **Type-safe**: TypeScript support for routes
- **Native performance**: Uses native stack navigator on mobile

### 5. Why Neumorphism Design?
- **Visual uniqueness**: Stands out from Material Design/iOS defaults
- **Accessibility**: High contrast ratios maintained
- **Scalability**: Works well across mobile, tablet, web
- **Branding**: Distinctive product identity

### 6. Why TypeScript Everywhere?
- **Developer experience**: IDE autocomplete & error detection
- **Refactoring safety**: Catch breaking changes at build time
- **Documentation**: Types serve as inline docs
- **Maintainability**: Reduces bugs in dynamic data flows

---

## Common Tasks & Workflows

### Adding a New Screen

1. **Create screen component**
   ```bash
   touch screens/MyScreen.tsx
   ```

2. **Define navigation type** in `types.tsx`:
   ```typescript
   export type RootStackParamList = {
     MyScreen: { param1: string; param2?: number };
     // ...
   };
   ```

3. **Register in navigator** in `navigation/index.tsx`:
   ```typescript
   <Stack.Screen
     name="MyScreen"
     component={MyScreen}
     options={{ title: "My Screen" }}
   />
   ```

4. **Navigate to it**:
   ```typescript
   navigation.navigate('MyScreen', { param1: 'value' });
   ```

### Adding a New Component

1. **Create reusable component** in `components/`:
   ```bash
   touch components/MyComponent.tsx
   ```

2. **Use props + TypeScript**:
   ```typescript
   interface MyComponentProps {
     label: string;
     onPress: () => void;
     disabled?: boolean;
   }

   const MyComponent: React.FC<MyComponentProps> = ({ label, onPress, disabled }) => (
     // ...
   );

   export default MyComponent;
   ```

3. **Import in screens/other components**:
   ```typescript
   import MyComponent from '../components/MyComponent';
   ```

### Fetching Data from Firestore

```typescript
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

useEffect(() => {
  const docRef = doc(db, 'trips', tripId);
  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data() as DibbyTrip;
      setTrip(data);
    } else {
      setTrip(null);
    }
  });
  return unsubscribe; // Cleanup listener
}, [tripId]);
```

### Updating Firestore Data

```typescript
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const handleUpdate = async () => {
  try {
    const docRef = doc(db, 'trips', tripId);
    await updateDoc(docRef, {
      name: newName,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Update failed:', error);
  }
};
```

### Styling a Component

**Option 1: Inline styles**
```typescript
const MyComponent = () => (
  <View style={{ padding: 16, backgroundColor: '#fff' }}>
    <Text style={{ fontSize: 16, fontWeight: '600' }}>Title</Text>
  </View>
);
```

**Option 2: StyleSheet (preferred for larger components)**
```typescript
const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 16, fontWeight: '600' },
});

const MyComponent = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Title</Text>
  </View>
);
```

**Option 3: Neumo surface component**
```typescript
<View
  variant="raised"
  tone="surface"
  radius={NeumoTokens.radius.lg}
  padding={NeumoTokens.spacing.md}
>
  <Text>Content</Text>
</View>
```

### Using Theme Colors

```typescript
import useAppTheme from '../hooks/useAppTheme';

const MyComponent = () => {
  const colors = useAppTheme();
  
  return (
    <View style={{ backgroundColor: colors.background.default }}>
      <Text style={{ color: colors.textPrimary }}>Hello</Text>
    </View>
  );
};
```

### Form Handling

```typescript
import { useForm, Controller } from 'react-hook-form';

const MyForm = () => {
  const { control, handleSubmit, watch } = useForm({
    defaultValues: { name: '', email: '' },
  });

  const onSubmit = (data) => console.log(data);

  return (
    <View>
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, value } }) => (
          <DibbyInput
            label="Name"
            value={value}
            onChangeText={onChange}
          />
        )}
      />
      <DibbyButton onPress={handleSubmit(onSubmit)} title="Submit" />
    </View>
  );
};
```

### Deep Linking

Users can be sent to specific screens via URLs:
```
dibby://viewTrip?tripId=123&tripName=Vegas
```

Configured in `LinkingConfiguration.ts`:
```typescript
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL('/')],
  config: {
    screens: {
      ViewTrip: 'viewTrip',
      // ...
    },
  },
};
```

---

## Debugging Tips

### Enable Redux DevTools (if added)
```javascript
// In console
__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
```

### Inspect Zustand State
```typescript
import useAuthStore from '../stores/authStore';

// In console:
useAuthStore.getState()
```

### Check Firestore Listener Status
```typescript
// In console:
db._datastore // Firestore instance
```

### Enable React Query DevTools (if used)
```typescript
import { ReactQueryDevtools } from 'react-query/devtools';

// Wrap NavigationContainer with:
<ReactQueryDevtools />
```

### View Navigation State
```typescript
import { useNavigationState } from '@react-navigation/native';

const state = useNavigationState((s) => s);
console.log(state); // Full nav tree
```

---

## Performance Considerations

1. **Memoization**: Use `useMemo` and `useCallback` for expensive operations
2. **List performance**: Use `FlatList`/`SectionList` with `keyExtractor`
3. **Image caching**: Leverage `expo-image-cache` for avatars
4. **Firestore pagination**: Limit queries with `.limit(10)` and use cursors
5. **Navigation performance**: Use `enableScreens()` from `react-native-screens`

---

## Security Best Practices

1. **Environment variables**: Never commit `.env` files; use Firebase config from secrets
2. **Firestore rules**: Restrict access to user's own data
3. **OAuth scopes**: Request minimal necessary permissions
4. **Sensitive data**: Don't log auth tokens; use secure storage
5. **Input validation**: Validate all user inputs before Firestore writes

---

## Troubleshooting

### Issue: Infinite Loading after Login
**Cause**: `profileReady` never resolves (Firestore listener stalled)
**Solution**: 
- Check Firestore security rules allow user read-access
- Verify user doc exists in `/users/{uid}`
- Enable 8-second timeout in `useUserBootstrap()`

### Issue: Route Not Found Error
**Cause**: Screen not registered in navigator or param name mismatch
**Solution**:
- Check screen is registered in `navigation/index.tsx`
- Verify route name matches `types.tsx` definition
- Check param types in type definition

### Issue: Theme Not Persisting
**Cause**: AsyncStorage not initialized
**Solution**:
- Ensure `ThemeProvider` wraps app (in `App.tsx`)
- Check AsyncStorage is installed: `npm install @react-native-async-storage/async-storage`

### Issue: Styles Not Applied on Web
**Cause**: React Native Web has limited style support
**Solution**:
- Use `Platform.select()` for platform-specific styles
- Avoid unsupported properties like `shadowOffset`
- Use `React.CSSProperties` for web-only properties

---

## Further Reading

- [React Navigation Docs](https://reactnavigation.org/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Native Web](https://necolas.github.io/react-native-web/)
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [Expo Documentation](https://docs.expo.dev/)

---

**Last Updated**: April 13, 2026  
**Maintainers**: Dibby Team
