import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { createClient } from "@supabase/supabase-js";

// ---------- Settings (change these) ----------
const SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
];
const DAYS_AHEAD = 60; // how far into the future people can book
const CONTACT_EMAIL = "kontakt@example.dk";

// ---------- Database (Supabase) ----------
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;
const configured = !!supabaseUrl && !!supabaseKey;
const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseKey || "placeholder",
);

type Language = "Dansk" | "Engelsk";

type Booking = {
  id: string;
  name: string;
  language: Language;
  email: string;
  phone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
};

// ---------- Date helpers ----------
const MONTHS = [
  "Januar",
  "Februar",
  "Marts",
  "April",
  "Maj",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "December",
];
const WEEKDAYS = ["MAN", "TIR", "ONS", "TOR", "FRE", "LØR", "SØN"];
const LONG_WEEKDAYS = [
  "Søndag",
  "Mandag",
  "Tirsdag",
  "Onsdag",
  "Torsdag",
  "Fredag",
  "Lørdag",
];
const ENGLISH_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const ENGLISH_WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const prettyDate = (s: string, language: Language = "Dansk") => {
  const [y, m, d] = s.split("-").map(Number);
  if (language === "Engelsk") {
    return `${ENGLISH_WEEKDAYS[new Date(y, m - 1, d).getDay()]}, ${d} ${ENGLISH_MONTHS[m - 1]} ${y}`;
  }
  return `${LONG_WEEKDAYS[new Date(y, m - 1, d).getDay()]} d. ${d}. ${MONTHS[m - 1].toLowerCase()} ${y}`;
};

const inputClass =
  "w-full rounded border border-stone-400 bg-white px-3 py-2 outline-none focus:border-slate-700 focus:ring-2 focus:ring-slate-300";

function isValidPhoneNumber(value: string) {
  const phone = value.trim();
  if (!/^\+?[0-9\s().-]+$/.test(phone)) return false;

  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

// ---------- App ----------
export default function App() {
  const [isAdmin, setIsAdmin] = useState(location.hash === "#admin");
  const [language, setLanguage] = useState<Language>("Dansk");

  useEffect(() => {
    const onHash = () => setIsAdmin(location.hash === "#admin");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-400 bg-stone-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a href="#" className="flex items-center">
            <img
              src="/logo.png"
              alt="Bachelor – Katharina og Cecilie"
              className="h-12 w-auto sm:h-14"
            />
          </a>
          <nav className="flex gap-5 text-sm font-medium uppercase tracking-wide">
            <a href="#om" className="hover:underline">
              {language === "Engelsk" ? "About the project" : "Om projektet"}
            </a>
            <a href="#kontakt" className="hover:underline">
              {language === "Engelsk" ? "Contact" : "Kontakt"}
            </a>
          </nav>
        </div>
      </header>

      {!configured ? (
        <main className="mx-auto max-w-xl px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">Supabase er ikke sat op endnu</h1>
          <p className="mt-3 text-stone-700">
            Opret filen <code>.env.local</code> med{" "}
            <code>VITE_SUPABASE_URL</code> og{" "}
            <code>VITE_SUPABASE_ANON_KEY</code> (se <code>.env.example</code>),
            og genstart derefter <code>npm run dev</code>.
          </p>
        </main>
      ) : isAdmin ? (
        <Admin />
      ) : (
        <Booking language={language} setLanguage={setLanguage} />
      )}

      <footer
        id="kontakt"
        className="mt-12 border-t border-stone-400 bg-stone-100 py-8 text-center text-sm text-stone-600"
      >
        <p>
          {language === "Engelsk" ? "Questions? Write to " : "Spørgsmål? Skriv til "}
          <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
        </p>
        <p className="mt-2">
          {isAdmin ? (
            <a className="underline" href="#">
              {language === "Engelsk" ? "Back to booking" : "Tilbage til booking"}
            </a>
          ) : (
            <a className="underline" href="#admin">
              Admin
            </a>
          )}
        </p>
      </footer>
    </div>
  );
}

// ---------- Booking view ----------
function Booking({
  language,
  setLanguage,
}: {
  language: Language;
  setLanguage: (language: Language) => void;
}) {
  const [taken, setTaken] = useState(new Set<string>());
  const [sending, setSending] = useState(false);
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState<Booking | null>(null);

  const refreshTaken = async () => {
    const { data } = await supabase.rpc("taken_slots");
    if (data)
      setTaken(
        new Set(
          (data as { date: string; time: string }[]).map(
            (s) => `${s.date} ${s.time}`,
          ),
        ),
      );
  };

  // load the taken times now, and again every 30 seconds
  useEffect(() => {
    refreshTaken();
    const timer = setInterval(refreshTaken, 30000);
    return () => clearInterval(timer);
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = addDays(today, 1);
  const maxDate = addDays(today, DAYS_AHEAD);

  const isFree = (d: string, t: string) => !taken.has(`${d} ${t}`);

  const isOpen = (d: Date) => {
    if (d < minDate || d > maxDate) return false;
    return SLOTS.some((t) => isFree(ymd(d), t));
  };

  const offset = (month.getDay() + 6) % 7; // Monday first
  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const cells: (Date | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from(
      { length: daysInMonth },
      (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1),
    ),
  ];
  const canGoBack = month > new Date(today.getFullYear(), today.getMonth(), 1);
  const canGoForward =
    new Date(month.getFullYear(), month.getMonth() + 1, 1) <= maxDate;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!date || !time) {
      setError(
        language === "Engelsk"
          ? "Please select both a date and a time."
          : "Vælg både en dato og et tidspunkt.",
      );
      return;
    }
    if (!isValidPhoneNumber(phone)) {
      setError(
        language === "Engelsk"
          ? "Enter a valid phone number with 7-15 digits. International numbers may include + and a country code."
          : "Indtast et gyldigt telefonnummer med 7-15 cifre. Internationale numre kan skrives med + og landekode.",
      );
      return;
    }
    setSending(true);
    const booking = {
      name: name.trim(),
      language,
      email: email.trim(),
      phone: phone.trim(),
      date,
      time,
    };
    const { error: dbError } = await supabase.from("bookings").insert(booking);
    setSending(false);

    if (dbError) {
      if (dbError.code === "23505") {
        // the database's unique rule caught a double booking
        await refreshTaken();
        setTime("");
        setError(
          language === "Engelsk"
            ? "That time was just booked by someone else. Please choose another."
            : "Det valgte tidspunkt blev lige booket af en anden. Vælg venligst et andet.",
        );
      } else {
        setError(
          language === "Engelsk"
            ? "Something went wrong. Please try again shortly."
            : "Noget gik galt. Prøv igen om lidt.",
        );
      }
      return;
    }

    setTaken(new Set(taken).add(`${date} ${time}`));
    setDone({ id: "", ...booking });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const reset = () => {
    setDone(null);
    setDate("");
    setTime("");
    setName("");
    setEmail("");
    setPhone("");
    setError("");
  };

  if (done) {
    return (
      <main className="mx-auto max-w-xl px-4 py-12">
        <div className="rounded-lg border border-green-300 bg-green-50 p-6 text-center shadow-sm sm:p-10">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-3xl text-white">
            ✓
          </div>
          <h1 className="text-3xl font-bold">
            {language === "Engelsk" ? "Your time is booked!" : "Din tid er booket!"}
          </h1>
          <p className="mt-3 text-lg">
            {prettyDate(done.date, language)}{" "}
            {language === "Engelsk" ? "at" : "kl."} <strong>{done.time}</strong>
          </p>
          <dl className="mx-auto mt-6 max-w-xs space-y-1 text-left text-sm">
            <div className="flex justify-between">
              <dt className="text-stone-600">
                {language === "Engelsk" ? "Name" : "Navn"}
              </dt>
              <dd>{done.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-600">
                {language === "Engelsk" ? "Language" : "Sprog"}
              </dt>
              <dd>{done.language}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-600">E-mail</dt>
              <dd>{done.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-600">
                {language === "Engelsk" ? "Phone" : "Telefon"}
              </dt>
              <dd>{done.phone}</dd>
            </div>
          </dl>
          <p className="mt-6 text-sm text-stone-600">
            {language === "Engelsk"
              ? "Feel free to take a screenshot of this page as confirmation. Thank you for participating!"
              : "Tag gerne et screenshot af denne side som bekræftelse. Tusind tak fordi du vil deltage!"}
          </p>
          <button onClick={reset} className="mt-6 text-sm underline">
            {language === "Engelsk" ? "Book a time for someone else" : "Book en tid til en anden"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main>
      <section className="bg-stone-100">
        <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 py-10 md:grid-cols-2">
          <div>
            <h1 className="text-4xl font-bold sm:text-5xl">
              {language === "Engelsk" ? "Book an interview" : "Book et interview"}
            </h1>
            <p className="mt-4 text-lg text-stone-700">
              {language === "Engelsk"
                ? "Thank you for participating in our bachelor project. Choose a time that suits you and fill in your contact details."
                : "Tak fordi du vil deltage i vores bachelorprojekt. Vælg et tidspunkt, der passer dig, og udfyld dine kontaktoplysninger."}
            </p>
          </div>
          <img
            src="/logo.png"
            alt=""
            className="mx-auto w-full max-w-sm md:ml-auto"
          />
        </div>
      </section>

      <form
        onSubmit={submit}
        className="mx-auto mt-8 grid max-w-6xl gap-6 px-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
      >
        {/* Contact details */}
        <section className="rounded-lg border border-stone-300 bg-stone-100 p-5">
          <h2 className="mb-4 text-lg font-bold uppercase tracking-wide">
            {language === "Engelsk" ? "Your details" : "Dine oplysninger"}
          </h2>
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">
                {language === "Engelsk" ? "Name" : "Navn"} *
              </span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className={inputClass}
              />
            </label>

            <fieldset>
              <legend className="mb-1 text-sm font-medium">
                {language === "Engelsk" ? "Preferred language" : "Foretrukket sprog"} *
              </legend>
              <div className="flex gap-6">
                {(["Dansk", "Engelsk"] as const).map((l) => (
                  <label key={l} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="language"
                      checked={language === l}
                      onChange={() => setLanguage(l)}
                      className="h-4 w-4 accent-slate-800"
                    />
                    {language === "Engelsk"
                      ? l === "Dansk"
                        ? "Danish"
                        : "English"
                      : l}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">
                {language === "Engelsk" ? "Email address" : "E-mailadresse"} *
              </span>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">
                {language === "Engelsk" ? "Phone number" : "Telefonnummer"} *
              </span>
              <input
                required
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                placeholder="+45 12 34 56 78"
                pattern="[+0-9 () .-]+"
                title={
                  language === "Engelsk"
                    ? "Use 7-15 digits. International numbers may include + and a country code."
                    : "Brug 7-15 cifre. Internationale numre kan skrives med + og landekode."
                }
                className={inputClass}
              />
            </label>
          </div>
        </section>

        {/* Date + time */}
        <section className="rounded-lg border border-stone-300 bg-stone-100 p-5">
          <h2 className="mb-4 text-lg font-bold uppercase tracking-wide">
            {language === "Engelsk" ? "1. Choose a date" : "1. Vælg en dato"}
          </h2>

          <div className="mx-auto max-w-md">
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                disabled={!canGoBack}
                onClick={() =>
                  setMonth(
                    new Date(month.getFullYear(), month.getMonth() - 1, 1),
                  )
                }
                className="h-9 w-9 rounded border border-stone-400 bg-white disabled:opacity-30"
                aria-label={language === "Engelsk" ? "Previous month" : "Forrige måned"}
              >
                ‹
              </button>
              <span className="font-semibold">
                {(language === "Engelsk" ? ENGLISH_MONTHS : MONTHS)[month.getMonth()]}{" "}
                {month.getFullYear()}
              </span>
              <button
                type="button"
                disabled={!canGoForward}
                onClick={() =>
                  setMonth(
                    new Date(month.getFullYear(), month.getMonth() + 1, 1),
                  )
                }
                className="h-9 w-9 rounded border border-stone-400 bg-white disabled:opacity-30"
                aria-label={language === "Engelsk" ? "Next month" : "Næste måned"}
              >
                ›
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {(language === "Engelsk"
                ? ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
                : WEEKDAYS
              ).map((w) => (
                <div
                  key={w}
                  className="py-1 text-xs font-semibold text-stone-500"
                >
                  {w}
                </div>
              ))}
              {cells.map((d, i) => {
                if (!d) return <div key={i} />;
                const open = isOpen(d);
                const selected = ymd(d) === date;
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={!open}
                    onClick={() => {
                      setDate(ymd(d));
                      setTime("");
                      setError("");
                    }}
                    className={
                      "aspect-square rounded border text-sm " +
                      (selected
                        ? "border-slate-800 bg-slate-700 font-bold text-white"
                        : open
                          ? "border-stone-400 bg-white hover:bg-stone-200"
                          : "border-transparent bg-stone-200 text-stone-400")
                    }
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600">
              <span className="flex items-center gap-1">
                <i className="h-3 w-3 rounded-sm border border-stone-400 bg-white" />{" "}
                {language === "Engelsk" ? "Available" : "Tilgængelig"}
              </span>
              <span className="flex items-center gap-1">
                <i className="h-3 w-3 rounded-sm bg-stone-200" />{" "}
                {language === "Engelsk" ? "Unavailable" : "Ikke tilgængelig"}
              </span>
              <span className="flex items-center gap-1">
                <i className="h-3 w-3 rounded-sm bg-slate-700" />{" "}
                {language === "Engelsk" ? "Selected" : "Valgt"}
              </span>
            </div>
          </div>

          <h2 className="mb-4 mt-8 text-lg font-bold uppercase tracking-wide">
            {language === "Engelsk"
              ? "2. Choose a time"
              : "2. Vælg et tidspunkt"}
            {date && (
              <span className="block text-sm font-normal normal-case text-stone-600 sm:ml-2 sm:inline">
                – {prettyDate(date, language)}
              </span>
            )}
          </h2>

          {!date ? (
            <p className="text-sm text-stone-600">
              {language === "Engelsk"
                ? "Please choose a date above first."
                : "Vælg først en dato ovenfor."}
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {SLOTS.map((t) => {
                const free = isFree(date, t);
                const selected = t === time;
                return (
                  <button
                    key={t}
                    type="button"
                    disabled={!free}
                    onClick={() => {
                      setTime(t);
                      setError("");
                    }}
                    className={
                      "rounded border px-2 py-2 text-sm " +
                      (selected
                        ? "border-slate-800 bg-slate-700 font-bold text-white"
                        : free
                          ? "border-stone-400 bg-white hover:bg-stone-200"
                          : "cursor-not-allowed border-red-200 bg-red-50 text-red-400 line-through")
                    }
                    title={
                      free ? "" : language === "Engelsk" ? "Booked" : "Optaget"
                    }
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600">
            <span className="flex items-center gap-1">
              <i className="h-3 w-3 rounded-sm border border-stone-400 bg-white" />{" "}
              {language === "Engelsk" ? "Available" : "Ledigt"}
            </span>
            <span className="flex items-center gap-1">
              <i className="h-3 w-3 rounded-sm border border-red-200 bg-red-50" />{" "}
              {language === "Engelsk" ? "Booked" : "Optaget"}
            </span>
            <span className="flex items-center gap-1">
              <i className="h-3 w-3 rounded-sm bg-slate-700" />{" "}
              {language === "Engelsk" ? "Your choice" : "Dit valg"}
            </span>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={sending}
            className="mt-6 w-full rounded bg-slate-700 py-3 text-lg font-semibold uppercase tracking-wide text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {sending
              ? language === "Engelsk"
                ? "Booking..."
                : "Booker..."
              : language === "Engelsk"
                ? "Book interview"
                : "Book interview"}
          </button>
        </section>
      </form>

      <section id="om" className="mx-auto mt-12 max-w-3xl px-4 text-center">
        <h2 className="text-2xl font-bold">
          {language === "Engelsk" ? "About the project" : "Om projektet"}
        </h2>
        <p className="mt-3 text-stone-700">
          {language === "Engelsk"
            ? "We are two students writing a bachelor project, and we would love to talk to you. The interview takes approximately 30 minutes, and your information will only be used for the project."
            : "Vi er to studerende, der skriver bachelorprojekt, og vi vil rigtig gerne tale med dig. Interviewet tager ca. 30 minutter, og dine oplysninger bruges kun til projektet."}
        </p>
      </section>
    </main>
  );
}

// ---------- Admin view ----------
function Admin() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null); // null = still checking
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [wrong, setWrong] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState("");

  const loadBookings = async () => {
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .order("date")
      .order("time");
    setBookings((data as Booking[]) ?? []);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, session) =>
      setLoggedIn(!!session),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loggedIn) loadBookings();
  }, [loggedIn]);

  const login = async (e: FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setWrong(!!error);
  };

  if (loggedIn === null) {
    return <main className="py-16 text-center text-stone-600">Henter...</main>;
  }

  if (!loggedIn) {
    return (
      <main className="mx-auto max-w-sm px-4 py-16">
        <form
          onSubmit={login}
          className="rounded-lg border border-stone-300 bg-stone-100 p-6"
        >
          <h1 className="text-2xl font-bold">Admin login</h1>
          <p className="mt-1 text-sm text-stone-600">Kun for projektgruppen.</p>
          <label
            htmlFor="admin-email"
            className="mt-4 block text-sm font-medium"
          >
            E-mail
          </label>
          <input
            id="admin-email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setWrong(false);
            }}
            autoComplete="username"
            className={inputClass + " mt-1"}
          />
          <label
            htmlFor="admin-password"
            className="mt-3 block text-sm font-medium"
          >
            Adgangskode
          </label>
          <input
            id="admin-password"
            name="password"
            type="password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setWrong(false);
            }}
            autoComplete="current-password"
            className={inputClass + " mt-1"}
          />
          {wrong && (
            <p className="mt-2 text-sm text-red-700">
              Forkert e-mail eller adgangskode.
            </p>
          )}
          <button
            type="submit"
            className="mt-4 w-full rounded bg-slate-700 py-2 font-semibold text-white hover:bg-slate-800"
          >
            Log ind
          </button>
        </form>
      </main>
    );
  }

  const q = search.toLowerCase();
  const shown = bookings.filter((b) =>
    [b.name, b.email, b.phone].some((v) => v.toLowerCase().includes(q)),
  );

  const remove = async (b: Booking) => {
    if (!confirm(`Slet bookingen for ${b.name}? Tiden bliver ledig igen.`))
      return;
    const { error } = await supabase.from("bookings").delete().eq("id", b.id);
    if (error) alert("Kunne ikke slette bookingen.");
    else setBookings(bookings.filter((x) => x.id !== b.id));
  };

  const exportCsv = () => {
    const rows = [
      ["Navn", "Sprog", "E-mail", "Telefon", "Dato", "Tidspunkt"],
      ...bookings.map((b) => [
        b.name,
        b.language,
        b.email,
        b.phone,
        b.date,
        b.time,
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const url = URL.createObjectURL(
      new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "bookinger.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // group by date for the agenda
  const byDate = bookings.reduce<Record<string, Booking[]>>((acc, b) => {
    (acc[b.date] ||= []).push(b);
    return acc;
  }, {});

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Bookinger ({bookings.length})</h1>
        <div className="flex gap-2">
          <button
            onClick={loadBookings}
            className="rounded border border-stone-400 bg-white px-3 py-2 text-sm"
          >
            Opdater
          </button>
          <button
            onClick={exportCsv}
            disabled={!bookings.length}
            className="rounded border border-stone-400 bg-white px-3 py-2 text-sm disabled:opacity-40"
          >
            Download CSV
          </button>
          <button
            onClick={() => supabase.auth.signOut()}
            className="rounded border border-stone-400 bg-white px-3 py-2 text-sm"
          >
            Log ud
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section className="rounded-lg border border-stone-300 bg-stone-100 p-4">
          <h2 className="mb-3 text-lg font-bold">Kalender</h2>
          {!bookings.length && (
            <p className="text-sm text-stone-600">Ingen bookinger endnu.</p>
          )}
          <div className="space-y-4">
            {Object.entries(byDate).map(([d, list]) => (
              <div key={d}>
                <h3 className="mb-1 text-sm font-semibold">{prettyDate(d)}</h3>
                <ul className="space-y-1">
                  {list.map((b) => (
                    <li
                      key={b.id}
                      className="rounded border border-green-300 bg-green-100 px-2 py-1 text-sm"
                    >
                      <strong>{b.time}</strong> – Interview – {b.name}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-stone-300 bg-stone-100 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold">Deltagerliste</h2>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Søg deltager..."
              className={inputClass + " max-w-56"}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead>
                <tr className="border-b border-stone-400 text-xs uppercase text-stone-600">
                  <th className="py-2 pr-2">Navn</th>
                  <th className="pr-2">Sprog</th>
                  <th className="pr-2">Kontakt</th>
                  <th className="pr-2">Tid</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {shown.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-stone-300 align-top"
                  >
                    <td className="py-2 pr-2">{b.name}</td>
                    <td className="pr-2">{b.language}</td>
                    <td className="pr-2">
                      {b.email}
                      <br />
                      {b.phone}
                    </td>
                    <td className="pr-2 whitespace-nowrap">
                      {b.date.split("-").reverse().join("/")}
                      <br />
                      {b.time}
                    </td>
                    <td>
                      <button
                        onClick={() => remove(b)}
                        className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                      >
                        Slet
                      </button>
                    </td>
                  </tr>
                ))}
                {!shown.length && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-stone-600">
                      Ingen resultater.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
