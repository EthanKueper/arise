// Arise: Google (Firebase) sign-in, cloud save and friends leaderboard.
// You normally never need to edit this file. Your project settings go in config.js.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, sendPasswordResetEmail, signOut as fbSignOut } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { initializeFirestore, persistentLocalCache, persistentSingleTabManager, collection, doc, getDoc, getDocs,
  setDoc, deleteDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const $ = s => document.querySelector(s);
const ui = {
  show(msg, isErr) { const o = $('#authOv'); if (o) o.classList.remove('hide'); const m = $('#authMsg'); if (m) { m.textContent = msg || ''; m.style.color = isErr ? 'var(--red)' : 'var(--dim)'; } },
  hide() { const o = $('#authOv'); if (o) o.classList.add('hide'); },
  busy(b) { document.querySelectorAll('#authOv button').forEach(x => x.disabled = !!b); }
};

const cfg = window.FIREBASE_CONFIG || {};
if (!cfg.apiKey || String(cfg.apiKey).includes('PASTE')) {
  ui.show('Setup needed: paste your Firebase settings into config.js (see the setup guide).', true);
  ui.busy(true);
  throw new Error('Firebase config missing');
}

const app = initializeApp(cfg);
const auth = getAuth(app);
let db;
try { db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentSingleTabManager() }) }); }
catch (e) { db = initializeFirestore(app, {}); }

const errCode = e => String((e && e.code) || 'unknown').replace(/^firestore\//, '').replace(/-/g, '_');
const wrapErr = e => ({ code: errCode(e) === 'permission_denied' ? 'not_granted' : errCode(e), message: (e && e.message) || String(e) });
const clean = d => JSON.parse(JSON.stringify(d)); // strips undefined, which Firestore rejects

// ---- adapter in the shape the app already uses ("data/users/<uid>" collection of docs)
function makeDb(uid) {
  const base = () => collection(db, 'users', uid, 'data');
  return {
    collection: () => ({
      get: async () => {
        try { const snap = await getDocs(base()); return { docs: snap.docs.map(d => ({ id: d.id, data: () => d.data() })) }; }
        catch (e) { throw wrapErr(e); }
      },
      doc: (id) => ({
        set: async (data) => { try { await setDoc(doc(db, 'users', uid, 'data', id), clean(data)); } catch (e) { throw wrapErr(e); } },
        delete: async () => { try { await deleteDoc(doc(db, 'users', uid, 'data', id)); } catch (e) { throw wrapErr(e); } },
        onSnapshot: (next, error) => onSnapshot(doc(db, 'users', uid, 'data', id),
          sn => next({ exists: sn.exists(), data: () => sn.data(), metadata: { hasPendingWrites: sn.metadata.hasPendingWrites, fromCache: sn.metadata.fromCache } }),
          e => error && error(wrapErr(e)))
      })
    })
  };
}

// ---- friend codes and leaderboard cards
const ALPH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newCode = () => Array.from({ length: 6 }, () => ALPH[Math.floor(Math.random() * ALPH.length)]).join('');
let lastCard = '', unsubCards = null;
const cloud = {
  uid: null, email: '', code: '', ready: false,
  async ensureCode() {
    const mine = await getDoc(doc(db, 'cards', this.uid)).catch(() => null);
    if (mine && mine.exists() && mine.data().code) { this.code = mine.data().code; return this.code; }
    for (let i = 0; i < 8; i++) {
      const c = newCode();
      try { await setDoc(doc(db, 'codes', c), { uid: this.uid }); this.code = c; await setDoc(doc(db, 'cards', this.uid), { code: c, updated: Date.now() }, { merge: true }); return c; }
      catch (e) { /* taken: try another */ }
    }
    return '';
  },
  async publishCard(card) {
    if (!this.ready) return;
    const body = clean({ ...card, code: this.code });
    const key = JSON.stringify(body);
    if (key === lastCard) return;
    lastCard = key;
    try { await setDoc(doc(db, 'cards', this.uid), { ...body, updated: Date.now() }); } catch (e) { lastCard = ''; }
  },
  async addFriend(code) {
    code = String(code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length !== 6) throw new Error('Codes are 6 letters/numbers.');
    const c = await getDoc(doc(db, 'codes', code));
    if (!c.exists()) throw new Error('No hunter found with that code.');
    const uid = c.data().uid;
    if (uid === this.uid) throw new Error("That's your own code.");
    const card = await getDoc(doc(db, 'cards', uid));
    return { uid, code, name: card.exists() ? (card.data().name || 'Hunter') : 'Hunter' };
  },
  watchCards(uids, cb) {
    // one live listener per hunter (lets the security rules allow single-card reads only)
    if (unsubCards) { unsubCards.forEach(u => u()); unsubCards = null; }
    const list = [...new Set(uids)].filter(Boolean).slice(0, 30);
    const out = {}; unsubCards = list.map(uid => onSnapshot(doc(db, 'cards', uid),
      d => { if (d.exists()) out[uid] = d.data(); else delete out[uid]; cb({ ...out }); }, () => {}));
  },
  async signOut() {
    try { await fbSignOut(auth); } catch (e) {}
    try { localStorage.removeItem('gatebreaker.v1'); localStorage.removeItem('arise.uid'); } catch (e) {}
    location.reload();
  }
};
window.ARISE_CLOUD = cloud;

// ---- sign-in screen
const friendly = e => {
  const c = (e && e.code) || '';
  if (c.includes('popup-closed') || c.includes('cancelled-popup')) return 'Sign-in window was closed. Try again, or use email below.';
  if (c.includes('popup-blocked')) return 'Pop-up blocked. Use email sign-in below instead.';
  if (c.includes('unauthorized-domain')) return 'This site isn’t authorized yet. Add it under Firebase › Authentication › Settings › Authorized domains.';
  if (c.includes('operation-not-allowed')) return 'That sign-in method isn’t turned on in Firebase › Authentication › Sign-in method.';
  if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found')) return 'Email or password is incorrect.';
  if (c.includes('email-already-in-use')) return 'That email already has an account. Tap Sign in instead.';
  if (c.includes('weak-password')) return 'Password needs at least 6 characters.';
  if (c.includes('invalid-email')) return 'That email address doesn’t look right.';
  if (c.includes('network')) return 'No connection. Connect to the internet for your first sign-in.';
  return (e && e.message) || 'Something went wrong. Try again.';
};
const run = async (fn) => { ui.busy(true); ui.show('Signing in…'); try { await fn(); } catch (e) { ui.show(friendly(e), true); } finally { ui.busy(false); } };
const em = () => ($('#authEmail').value || '').trim(), pw = () => $('#authPass').value || '';
$('#authGoogle').onclick = () => run(() => signInWithPopup(auth, new GoogleAuthProvider()));
$('#authIn').onclick = () => run(() => signInWithEmailAndPassword(auth, em(), pw()));
$('#authUp').onclick = () => run(() => createUserWithEmailAndPassword(auth, em(), pw()));
$('#authReset').onclick = async () => { if (!em()) { ui.show('Type your email first, then tap Forgot password.', true); return; }
  try { await sendPasswordResetEmail(auth, em()); ui.show('Password reset email sent.'); } catch (e) { ui.show(friendly(e), true); } };

// ---- wire up once signed in
onAuthStateChanged(auth, async (user) => {
  if (!user) { ui.busy(false); ui.show(''); return; }
  // a different account than last time on this phone: start from that account's cloud save
  let prev = null; try { prev = localStorage.getItem('arise.uid'); } catch (e) {}
  if (prev && prev !== user.uid) { try { localStorage.removeItem('gatebreaker.v1'); localStorage.setItem('arise.uid', user.uid); } catch (e) {} location.reload(); return; }
  try { localStorage.setItem('arise.uid', user.uid); } catch (e) {}
  ui.hide();
  cloud.uid = user.uid; cloud.email = user.email || ''; cloud.ready = true;
  cloud.ensureCode().then(() => window.dispatchEvent(new Event('arise-cloud'))).catch(() => {});
  window.__resolveCloud({
    use: async (name) => {
      if (name === 'user') return { id: async () => user.uid };
      if (name === 'db') return makeDb(user.uid);
      return null;
    }
  });
});
