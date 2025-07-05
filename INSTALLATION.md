# ইনস্টলেশন গাইড

## দ্রুত শুরু (Quick Start)

### ধাপ ১: প্রয়োজনীয় সফটওয়্যার ইনস্টল করুন

#### Node.js ইনস্টল করুন
1. [Node.js অফিসিয়াল ওয়েবসাইট](https://nodejs.org/) থেকে LTS সংস্করণ ডাউনলোড করুন
2. ইনস্টলার চালান এবং নির্দেশনা অনুসরণ করুন
3. টার্মিনালে যাচাই করুন:
```bash
node --version
npm --version
```

### ধাপ ২: প্রোজেক্ট সেটআপ

#### প্রোজেক্ট ফোল্ডার খুলুন
```bash
# জিপ ফাইল আনজিপ করুন
unzip enhanced_member_management_system.zip
cd login-page

# ডিপেন্ডেন্সি ইনস্টল করুন
npm install
```

### ধাপ ৩: Firebase সেটআপ

#### Firebase প্রোজেক্ট তৈরি করুন
1. [Firebase Console](https://console.firebase.google.com/) এ যান
2. "Create a project" ক্লিক করুন
3. প্রোজেক্টের নাম দিন (যেমন: "member-management")
4. Google Analytics সক্রিয় করুন (ঐচ্ছিক)

#### Authentication সেটআপ
1. Firebase Console এ "Authentication" এ যান
2. "Get started" ক্লিক করুন
3. "Sign-in method" ট্যাবে যান
4. "Email/Password" সক্রিয় করুন

#### Firestore Database সেটআপ
1. "Firestore Database" এ যান
2. "Create database" ক্লিক করুন
3. "Start in test mode" নির্বাচন করুন
4. Location নির্বাচন করুন (asia-south1 বাংলাদেশের জন্য ভাল)

#### Storage সেটআপ
1. "Storage" এ যান
2. "Get started" ক্লিক করুন
3. Security rules এ "Start in test mode" নির্বাচন করুন

#### Firebase কনফিগারেশন
1. Project Overview এ "Web app" আইকনে ক্লিক করুন
2. অ্যাপের নাম দিন
3. Firebase Hosting সেটআপ করুন (ঐচ্ছিক)
4. কনফিগারেশন কপি করুন

### ধাপ ৪: প্রোজেক্ট কনফিগারেশন

#### Firebase কনফিগারেশন আপডেট করুন
`src/firebase.js` ফাইল খুলুন এবং আপনার Firebase কনফিগারেশন দিয়ে প্রতিস্থাপন করুন:

```javascript
// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "আপনার-api-key",
  authDomain: "আপনার-project-id.firebaseapp.com",
  projectId: "আপনার-project-id",
  storageBucket: "আপনার-project-id.appspot.com",
  messagingSenderId: "আপনার-sender-id",
  appId: "আপনার-app-id"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

### ধাপ ৫: প্রোজেক্ট চালু করুন

```bash
# ডেভেলপমেন্ট সার্ভার চালু করুন
npm start
```

ব্রাউজারে `http://localhost:3000` এ যান।

### ধাপ ৬: প্রথম অ্যাডমিন তৈরি করুন

#### ম্যানুয়াল অ্যাডমিন তৈরি
1. সাইটে গিয়ে "Sign Up" করুন
2. Firebase Console এ "Authentication" > "Users" এ যান
3. আপনার ইউজারে ক্লিক করুন
4. "Custom claims" এ যান
5. নিচের JSON যুক্ত করুন:
```json
{
  "admin": true
}
```

## বিস্তারিত সেটআপ

### Firestore Security Rules

`firestore.rules` ফাইল তৈরি করুন:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Members collection
    match /members/{document} {
      allow read, write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Member applications collection
    match /memberApplications/{document} {
      allow read, write: if request.auth != null;
      allow create: if request.auth != null;
    }
    
    // Users collection
    match /users/{document} {
      allow read, write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

### Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /member-photos/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

### Environment Variables (ঐচ্ছিক)

`.env` ফাইল তৈরি করুন:

```env
REACT_APP_FIREBASE_API_KEY=আপনার-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=আপনার-project-id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=আপনার-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=আপনার-project-id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=আপনার-sender-id
REACT_APP_FIREBASE_APP_ID=আপনার-app-id
```

## প্রোডাকশন ডিপ্লয়মেন্ট

### Firebase Hosting এ ডিপ্লয়

#### Firebase CLI ইনস্টল করুন
```bash
npm install -g firebase-tools
```

#### লগইন করুন
```bash
firebase login
```

#### প্রোজেক্ট ইনিশিয়ালাইজ করুন
```bash
firebase init hosting
```

#### বিল্ড এবং ডিপ্লয়
```bash
npm run build
firebase deploy
```

### অন্যান্য হোস্টিং প্ল্যাটফর্ম

#### Netlify
1. `npm run build` চালান
2. `build` ফোল্ডার Netlify এ আপলোড করুন

#### Vercel
1. Vercel CLI ইনস্টল করুন: `npm i -g vercel`
2. `vercel` কমান্ড চালান

## সমস্যা সমাধান

### সাধারণ সমস্যা

#### "Module not found" এরর
```bash
# node_modules মুছে দিয়ে আবার ইনস্টল করুন
rm -rf node_modules package-lock.json
npm install
```

#### Firebase কানেকশন এরর
- ইন্টারনেট কানেকশন চেক করুন
- Firebase কনফিগারেশন সঠিক আছে কিনা দেখুন
- Firebase প্রোজেক্ট সক্রিয় আছে কিনা চেক করুন

#### Permission denied এরর
- Firestore Security Rules চেক করুন
- ব্যবহারকারীর admin claims আছে কিনা দেখুন

### লগ চেক করা

#### ব্রাউজার Console
1. F12 চাপুন
2. "Console" ট্যাবে যান
3. এরর মেসেজ দেখুন

#### Firebase Console
1. Firebase Console এ যান
2. "Functions" > "Logs" এ যান (যদি Functions ব্যবহার করেন)

## পারফরমেন্স অপ্টিমাইজেশন

### বিল্ড অপ্টিমাইজেশন
```bash
# প্রোডাকশন বিল্ড
npm run build

# বিল্ড সাইজ বিশ্লেষণ
npm install -g webpack-bundle-analyzer
npx webpack-bundle-analyzer build/static/js/*.js
```

### Firebase অপ্টিমাইজেশন
- Firestore কোয়েরি অপ্টিমাইজ করুন
- ইনডেক্স তৈরি করুন
- ক্যাশিং ব্যবহার করুন

## ব্যাকআপ এবং রিস্টোর

### ডেটা ব্যাকআপ
```bash
# Firestore ব্যাকআপ
gcloud firestore export gs://আপনার-bucket-name/backup-folder

# Authentication ব্যাকআপ (ম্যানুয়াল)
# Firebase Console থেকে ব্যবহারকারী তালিকা এক্সপোর্ট করুন
```

### ডেটা রিস্টোর
```bash
# Firestore রিস্টোর
gcloud firestore import gs://আপনার-bucket-name/backup-folder
```

## মনিটরিং এবং অ্যানালিটিক্স

### Firebase Analytics সেটআপ
1. Firebase Console এ "Analytics" সক্রিয় করুন
2. Google Analytics অ্যাকাউন্ট লিংক করুন

### Performance Monitoring
1. Firebase Console এ "Performance" সক্রিয় করুন
2. SDK যুক্ত করুন

## সিকিউরিটি চেকলিস্ট

### ✅ করণীয়
- [ ] Firebase Security Rules সঠিকভাবে কনফিগার করা
- [ ] HTTPS ব্যবহার করা
- [ ] API Keys সুরক্ষিত রাখা
- [ ] নিয়মিত ব্যাকআপ নেওয়া
- [ ] ব্যবহারকারী অনুমতি যাচাই করা

### ❌ বর্জনীয়
- [ ] API Keys পাবলিক রিপোজিটরিতে রাখা
- [ ] Test mode এ প্রোডাকশন চালানো
- [ ] Admin claims সবাইকে দেওয়া
- [ ] Security Rules ছাড়া ডেটাবেস চালানো

## সাপোর্ট এবং কমিউনিটি

### অফিসিয়াল ডকুমেন্টেশন
- [React Documentation](https://reactjs.org/docs/)
- [Firebase Documentation](https://firebase.google.com/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs/)

### কমিউনিটি সাপোর্ট
- [Stack Overflow](https://stackoverflow.com/questions/tagged/reactjs)
- [Firebase Community](https://firebase.google.com/community/)
- [React Community](https://reactjs.org/community/support.html)

---

**সফল ইনস্টলেশনের জন্য শুভকামনা!**

যদি কোন সমস্যার সম্মুখীন হন, অনুগ্রহ করে USER_GUIDE.md দেখুন অথবা সাপোর্ট টিমের সাথে যোগাযোগ করুন।

