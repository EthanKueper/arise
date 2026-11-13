# Arise: Google version setup guide

About 30 minutes, once. Use a **computer** for Parts 1 to 3 and your **iPhone** for Parts 4 to 6.
Everything here is free. No credit card is needed at any step.

**Files in this folder**

| File | What it is |
|---|---|
| `index.html` | The app |
| `config.js` | Your Firebase settings (you fill this in during Step 4) |
| `firebase-cloud.js` | Google sign-in, cloud save and leaderboard (don't edit) |
| `sw.js`, `manifest.json`, `icon-*.png` | Make it a home-screen app that works offline |
| `firestore.rules` | Database security rules (you paste these in during Step 3) |

---

## Part 1: Create your free Firebase project (Google)

**Step 1. Create the project**
1. Go to **console.firebase.google.com** and sign in with your Google account.
2. Click **Create a project** (or **Add project**). Name it `arise`.
3. When asked about Google Analytics, turn it **off** (not needed). Click **Create project**, then **Continue**.

**Step 2. Turn on sign-in**
1. In the left menu: **Build › Authentication**, then click **Get started**.
2. On the **Sign-in method** tab:
   - Click **Google**, switch **Enable** on, pick your email as the support email, click **Save**.
   - Click **Add new provider › Email/Password**, switch **Enable** on (leave "Email link" off), click **Save**.

**Step 3. Create the database and lock it down**
1. Left menu: **Build › Firestore Database**, then **Create database**.
2. Pick a location near you (for example `nam5 (United States)`), click **Next**.
3. Choose **Start in production mode**, click **Create**.
4. Open the **Rules** tab. Delete everything in the editor, open `firestore.rules` from this folder in a text editor, copy all of it, paste it in, and click **Publish**.

**Step 4. Connect the app to your project**
1. Click the **gear icon** (top left) › **Project settings**.
2. Under **Your apps**, click the **web icon `</>`**. Nickname: `Arise`. Leave "Firebase Hosting" unchecked. Click **Register app**.
3. Firebase shows a block of code containing `const firebaseConfig = { ... }`. You only need the six lines inside the `{ }`.
4. Open `config.js` from this folder in a text editor (TextEdit on Mac: Format › Make Plain Text; Notepad on Windows).
5. Replace each `PASTE...` value with yours, keeping the quotes. It should look like:
   ```js
   window.FIREBASE_CONFIG = {
     apiKey: "AIzaSy...",
     authDomain: "arise-12345.firebaseapp.com",
     projectId: "arise-12345",
     storageBucket: "arise-12345.firebasestorage.app",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abc123"
   };
   ```
6. Save the file.

> These values aren't passwords. Every Firebase web app includes them. Your data is protected by the rules from Step 3.

---

## Part 2: Put the app online for free (GitHub Pages)

**Step 5. Create the repository**
1. Go to **github.com** and create a free account (or sign in).
2. Click **+** (top right) › **New repository**. Name: `arise`. Set it to **Public**. Click **Create repository**.

**Step 6. Upload the files**
1. On the new repository page, click **uploading an existing file**.
2. Drag in **all files from this folder**, including your edited `config.js`. (Uploading `SETUP-GUIDE.md` and `firestore.rules` is harmless.)
3. Click **Commit changes**.

**Step 7. Turn on the website**
1. In the repository, go to **Settings › Pages**.
2. Under **Build and deployment › Branch**, choose `main` and `/ (root)`, then click **Save**.
3. Wait 1 to 2 minutes and refresh. Your link appears at the top:
   `https://YOUR-GITHUB-NAME.github.io/arise/`

---

## Part 3: Allow sign-in from your website

**Step 8.** Back in Firebase: **Build › Authentication › Settings › Authorized domains › Add domain**.
Enter `YOUR-GITHUB-NAME.github.io` (no `https://`, no `/arise`). Click **Add**.

---

## Part 4: Install on your iPhone

**Step 9.**
1. Open your link in **Safari**.
2. Tap **Share › Add to Home Screen › Add**. The Arise icon appears on your home screen.
3. **Always open Arise from that icon** from now on.
4. Sign in with **Continue with Google**, or with **email and password**.
   If Google sign-in doesn't finish inside the home-screen app (iPhone sometimes blocks the pop-up), use **Create account** with email and password instead. It works the same way.

---

## Part 5: Move your progress over from the Claude version

**Step 10.**
1. In the new app, type any hunter name to get past the welcome screen.
2. Open the **Claude version** of Arise: Status › **⚙ › Copy backup**.
3. Switch to the new Arise app: Status › **⚙ › Restore backup**. Paste, then tap **Restore**.
4. Your hunter, levels, gates, history, tower, gear and titles are all back, now saved to your Google account.

---

## Part 6: Add your friends

**Step 11.**
1. Send friends your link (`https://YOUR-GITHUB-NAME.github.io/arise/`). They do Step 9 and create their hunter.
2. On the **Status** tab, the **Guild leaderboard** shows your 6-character code. Tap **Share** to send it.
3. Each person taps **+ Friend** and enters the other's code. Add each other both ways.
4. The board updates live whenever anyone trains. Sort by **Level, Tower, Week, Streak or Lifts**.

---

## Updating the app later

When you get a new `index.html` (or other files):
1. In your GitHub repository: **Add file › Upload files**, drag in the new file(s), then **Commit changes**.
2. Also open `sw.js` in GitHub (click it, then the pencil icon) and change `arise-v1` to `arise-v2` (then v3 next time…). Commit.
3. On your phone, close Arise fully and open it twice. Your data isn't affected.

## Troubleshooting

| You see | Fix |
|---|---|
| "Setup needed: paste your Firebase settings into config.js" | Step 4 wasn't done, or `config.js` wasn't uploaded/updated in GitHub. |
| "This site isn't authorized yet" | Step 8: add your `github.io` domain. |
| "That sign-in method isn't turned on" | Step 2: enable Google and Email/Password. |
| "Sync issue" with code `not_granted` | Step 3: the database rules weren't published. |
| Google sign-in spins or closes | Use email and password instead (Part 4). |
| Old version still showing | Change the version in `sw.js` (see "Updating"), then reopen the app twice. |

## Free plan limits (you won't come close)
1 GB of storage, 50,000 reads and 20,000 writes per day. Three people training daily use roughly 1 to 2% of the daily limits. If a limit were ever hit, Firebase pauses instead of charging, and the app keeps saving on your phone until the next day.
