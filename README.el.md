# 📋 Stackd

Μια σύγχρονη, cloud-based εφαρμογή διαχείρισης εργασιών με ελεύθερη τοποθέτηση στηλών και καρτών μέσω drag-and-drop. Κατασκευασμένη με Next.js, Clerk authentication και Supabase για real-time συνεργασία.

![Stackd Logo](public/Stackd.png)

**[English Version](README.md)** | **Ελληνική Έκδοση**

## ✨ Χαρακτηριστικά

- **🔐 Έλεγχος Ταυτότητας Χρήστη**: Ασφαλής σύνδεση με Clerk (Email, Google, GitHub)
- **☁️ Cloud Αποθήκευση**: Όλα τα δεδομένα αποθηκεύονται σε Supabase PostgreSQL βάση δεδομένων
- **🎯 Ελεύθερη Τοποθέτηση Στηλών**: Σύρετε και τοποθετήστε στήλες οπουδήποτε στον καμβά
- **📝 Drag & Drop Κάρτες**: Μετακινήστε κάρτες μεταξύ στηλών απρόσκοπτα
- **💾 Αυτόματη Αποθήκευση**: Οι αλλαγές αποθηκεύονται αυτόματα 1 δευτερόλεπτο μετά το πληκτρολόγημα
- **💬 Σχόλια σε Κάρτες**: Προσθέστε σχόλια με avatars χρηστών και χρονοσήμανση
- **👥 Κοινή Χρήση Πινάκων**: Μοιραστείτε πίνακες με άλλους χρήστες μέσω email
- **🔄 Real-time Συγχρονισμός**: Συγχρονισμός βασισμένος σε polling που ενημερώνεται κάθε 3 δευτερόλεπτα σε όλους τους χρήστες
- **⚡ Βελτιστοποιημένη Απόδοση**: Κατασκευασμένο με React.memo, useCallback για ομαλές αλληλεπιδράσεις
- **🎨 Σύγχρονο UI**: Καθαρή, σκούρα διεπαφή με ομαλές μεταβάσεις
- **📱 Responsive Σχεδιασμός**: Λειτουργεί άψογα σε desktop και κινητές συσκευές
- **🔒 Row Level Security**: Το Supabase RLS εξασφαλίζει ιδιωτικότητα και ασφάλεια δεδομένων

## 🚀 Ξεκινώντας

### Προαπαιτούμενα

- Node.js 18+
- npm, yarn, pnpm, ή bun
- Λογαριασμός Clerk ([clerk.com](https://clerk.com))
- Λογαριασμός Supabase ([supabase.com](https://supabase.com))

### Εγκατάσταση

1. Κλωνοποιήστε το repository:
```bash
git clone https://github.com/Contzokas/stackd.git
cd stackd
```

2. Εγκαταστήστε τις εξαρτήσεις:
```bash
npm install
```

3. Ρυθμίστε τις μεταβλητές περιβάλλοντος:

Δημιουργήστε ένα αρχείο `.env.local` στον ριζικό κατάλογο:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

4. Ρυθμίστε τη βάση δεδομένων Supabase:

Εκτελέστε το SQL schema από το αρχείο `supabase-schema.sql` στο Supabase SQL Editor:
```bash
# Το αρχείο περιέχει ορισμούς πινάκων για:
# - boards (με RLS policies)
# - columns
# - cards
# - comments
# - board_members
```

5. Εκτελέστε τον development server:
```bash
npm run dev
```

6. Ανοίξτε το [http://localhost:3000](http://localhost:3000) στον browser σας

## 🏗️ Δομή Project

```
stackd/
├── app/
│   ├── api/
│   │   ├── boards/          # Λειτουργίες CRUD πινάκων
│   │   ├── cards/           # Λειτουργίες CRUD καρτών
│   │   ├── columns/         # Λειτουργίες CRUD στηλών
│   │   ├── comments/        # Λειτουργίες CRUD σχολίων
│   │   └── users/           # Αναζήτηση χρηστών
│   ├── sign-in/             # Σελίδα σύνδεσης Clerk
│   ├── sign-up/             # Σελίδα εγγραφής Clerk
│   ├── layout.js            # Root layout με authentication
│   ├── page.js              # Κύρια σελίδα με board manager
│   └── globals.css          # Global styles
├── components/
│   ├── Board_Original.jsx   # Κύριο component πίνακα
│   ├── MultiBoardManager.jsx # Διαχείριση πολλαπλών πινάκων
│   ├── CloudBoardManager.jsx # Cloud board CRUD
│   ├── FreeFormColumn.jsx   # Component στήλης με δυνατότητα μετακίνησης
│   ├── Card.jsx             # Component μεμονωμένης κάρτας
│   ├── CardModal.jsx        # Modal λεπτομερειών κάρτας με σχόλια
│   ├── ShareBoardModal.jsx  # Διεπαφή κοινής χρήσης πίνακα
│   └── Footer.jsx           # Component footer
├── hooks/
│   ├── useDragAndDrop.js        # Hook για drag & drop καρτών
│   ├── useColumnDragAndDrop.js  # Hook για αναδιάταξη στηλών
│   └── useFreeFormDrag.js       # Hook για ελεύθερη τοποθέτηση
├── lib/
│   └── supabase.js          # Διαμόρφωση Supabase client
└── public/
    └── Stackd.png           # Logo και assets
```

## 🎮 Χρήση

### Ξεκινώντας
1. **Εγγραφή/Σύνδεση**: Δημιουργήστε λογαριασμό ή συνδεθείτε με email, Google ή GitHub
2. **Δημιουργία Πίνακα**: Κάντε κλικ στο "Create New Board" για να ξεκινήσετε τον πρώτο σας πίνακα
3. **Προσθήκη Στηλών**: Κάντε κλικ στο "+ Add Column" για να δημιουργήσετε κατηγορίες εργασιών
4. **Προσθήκη Καρτών**: Κάντε κλικ στο "+ Add card" σε οποιαδήποτε στήλη για να δημιουργήσετε εργασίες

### Διαχείριση Στηλών
- **Μετακίνηση Στηλών**: Κάντε κλικ και σύρετε οποιαδήποτε κεφαλίδα στήλης για να την τοποθετήσετε οπουδήποτε στον πίνακα
- **Μετονομασία Στήλης**: Κάντε διπλό κλικ στον τίτλο της στήλης για inline επεξεργασία
- **Διαγραφή Στήλης**: Κάντε κλικ στο κουμπί ✕ στην κεφαλίδα της στήλης (διαγράφει όλες τις κάρτες μέσα)

### Διαχείριση Καρτών
- **Προσθήκη Κάρτας**: Κάντε κλικ στο κουμπί "+ Add card" σε οποιαδήποτε στήλη
- **Επεξεργασία Κάρτας**: Κάντε κλικ σε μια κάρτα για να ανοίξετε το modal λεπτομερειών
- **Αυτόματη Αποθήκευση**: Οι αλλαγές στην κάρτα αποθηκεύονται αυτόματα 1 δευτερόλεπτο μετά το πληκτρολόγημα
- **Χειροκίνητη Αποθήκευση**: Κάντε κλικ στο κουμπί "Save" για άμεση αποθήκευση
- **Μετακίνηση Κάρτας**: Σύρετε μια κάρτα και αφήστε την σε διαφορετική στήλη
- **Διαγραφή Κάρτας**: Κάντε κλικ στο εικονίδιο κάδου στο modal της κάρτας

### Σχόλια
- **Προσθήκη Σχολίου**: Πληκτρολογήστε στο πλαίσιο σχολίων στο κάτω μέρος του modal της κάρτας
- **Προβολή Σχολίων**: Όλα τα σχόλια εμφανίζονται με avatars χρηστών και χρονοσήμανση
- **Επεξεργασία Σχολίου**: Κάντε κλικ στο εικονίδιο επεξεργασίας στα δικά σας σχόλια
- **Διαγραφή Σχολίου**: Κάντε κλικ στο εικονίδιο κάδου στα δικά σας σχόλια

### Κοινή Χρήση Πινάκων
- **Κοινή Χρήση Πίνακα**: Κάντε κλικ στο εικονίδιο κοινής χρήσης, εισάγετε email addresses χρηστών
- **Συνεργάτες**: Όλα τα μέλη του πίνακα μπορούν να προβάλλουν και να επεξεργάζονται σε real-time
- **Προβολή Μελών**: Δείτε όλα τα τρέχοντα μέλη του πίνακα στο modal κοινής χρήσης

## 🛠️ Τεχνολογίες

- **Framework**: [Next.js 16.0.0](https://nextjs.org/) με App Router
- **Authentication**: [Clerk](https://clerk.com/) - Διαχείριση και έλεγχος ταυτότητας χρηστών
- **Database**: [Supabase](https://supabase.com/) - PostgreSQL με Row Level Security
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Γλώσσα**: JavaScript (ES6+)
- **Απόδοση**: React.memo, useCallback, βελτιστοποιημένα re-renders
- **API**: RESTful API routes με Next.js App Router

## 🎨 Βασικά Χαρακτηριστικά - Επεξήγηση

### Ελεύθερη Μετακίνηση
Σε αντίθεση με τους παραδοσιακούς πίνακες Kanban, το Stackd σας επιτρέπει να τοποθετήσετε στήλες οπουδήποτε στον καμβά, δίνοντάς σας πλήρη έλεγχο της διάταξης του χώρου εργασίας σας.

### Σύστημα Αυτόματης Αποθήκευσης
- **Debounced Auto-Save**: Οι αλλαγές αποθηκεύονται αυτόματα 1 δευτερόλεπτο μετά το τέλος της πληκτρολόγησης
- **Έξυπνος Συγχρονισμός**: Το modal επαναφέρει την κατάσταση μόνο όταν αλλάζετε σε διαφορετική κάρτα
- **Optimistic Updates**: Το UI ενημερώνεται αμέσως ενώ η αποθήκευση γίνεται στο παρασκήνιο
- **Database-First**: Εμφανίζει πάντα τα πιο πρόσφατα δεδομένα από τη βάση δεδομένων

### Real-time Συγχρονισμός
- **Polling-Based Updates**: Η κατάσταση του πίνακα ανανεώνεται κάθε 3 δευτερόλεπτα
- **Συνεργασία Πολλαπλών Χρηστών**: Οι αλλαγές που γίνονται από οποιονδήποτε χρήστη συγχρονίζονται σε όλους τους θεατές εντός 3 δευτερολέπτων
- **Αυτόματη Επίλυση Συγκρούσεων**: Η τελευταία κατάσταση της βάσης δεδομένων κερδίζει πάντα
- **Οπτικός Δείκτης Συγχρονισμού**: Δείχνει όταν ο συγχρονισμός είναι σε εξέλιξη
- **Αξιόπιστο & Απλό**: Χωρίς πολυπλοκότητα WebSocket, λειτουργεί σε όλα τα δίκτυα

### Βελτιστοποίηση Απόδοσης
- **React.memo**: Αποτρέπει περιττά re-renders στηλών και καρτών
- **Smart Memoization**: Τα components κάνουν re-render μόνο όταν τα πραγματικά δεδομένα τους αλλάζουν
- **useCallback**: Αποθηκεύει event handlers για να αποφύγει την επαναδημιουργία
- **Service Role Client**: Τα API routes παρακάμπτουν το RLS για συνεπή πρόσβαση στη βάση δεδομένων

### Ασφάλεια
- **Clerk Authentication**: Ασφαλής, production-ready έλεγχος ταυτότητας χρηστών
- **Row Level Security**: Οι πολιτικές Supabase RLS διασφαλίζουν ότι οι χρήστες βλέπουν μόνο τους δικούς τους πίνακες
- **Service Role Key**: Τα API routes χρησιμοποιούν αυξημένα δικαιώματα για συνεπή πρόσβαση
- **Protected Routes**: Όλα τα API endpoints ελέγχουν τον έλεγχο ταυτότητας χρήστη

## 📚 Πρόσθετη Τεκμηρίωση

- **[README.md](README.md)**: Αγγλική έκδοση αυτού του README
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)**: Λεπτομερείς οδηγίες εγκατάστασης για Clerk και Supabase
- **[QUICK_START.md](QUICK_START.md)**: Γρήγορη αναφορά για να ξεκινήσετε
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)**: Συνήθη προβλήματα και λύσεις
- **supabase-schema.sql**: Schema βάσης δεδομένων για ρύθμιση Supabase

## 🤝 Συνεισφορά

Οι συνεισφορές είναι ευπρόσδεκτες! Μη διστάσετε να:

1. Κάνετε Fork το repository
2. Δημιουργήστε ένα feature branch (`git checkout -b feature/ΑπίθανοΧαρακτηριστικό`)
3. Κάντε Commit τις αλλαγές σας (`git commit -m 'Προσθήκη Απίθανου Χαρακτηριστικού'`)
4. Κάντε Push στο branch (`git push origin feature/ΑπίθανοΧαρακτηριστικό`)
5. Ανοίξτε ένα Pull Request

## 📝 Άδεια

Αυτό το project είναι open source και διαθέσιμο υπό την [MIT License](LICENSE).

## 👤 Δημιουργός

**Κωνσταντίνος Τζόκας**

- Twitter: [@Tziogadoros](https://x.com/Tziogadoros)
- GitHub: [@Contzokas](https://github.com/Contzokas)

## 🙏 Ευχαριστίες

- Κατασκευασμένο με [Next.js](https://nextjs.org/)
- Έλεγχος ταυτότητας από [Clerk](https://clerk.com/)
- Βάση δεδομένων από [Supabase](https://supabase.com/)
- Styling με [Tailwind CSS](https://tailwindcss.com/)
- Font: [Geist](https://vercel.com/font)

---

⭐ Κάντε Star αυτό το repo αν το βρίσκετε χρήσιμο!
