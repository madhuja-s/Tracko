import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// change this to the email people can write to
const CONTACT = 'your-email@example.com'

const SECTIONS = [
  {
    title: 'What Tracko stores',
    body: [
      'Your name, email and age, and the choices you make in the app, like your colours and reminder time.',
      'Your routine tasks and what you tick off each day, your goals, your money entries, budgets, savings goals and bills.',
      'Your vault items, but only in locked form (see below).',
    ],
  },
  {
    title: 'Where it lives',
    body: [
      'Your data is kept in Google Firebase, which is the service that runs the login and the database behind Tracko. Your device connects to it over a secure connection.',
    ],
  },
  {
    title: 'Who can see it',
    body: [
      'Only you can read your data through the app. The person who runs Tracko can technically look at the database, apart from your vault items, which are locked.',
      'We do not sell your data, show ads, or share it with anyone to market things to you.',
    ],
  },
  {
    title: 'Your vault',
    body: [
      'Vault items are locked on your device, with a key made from your vault password, before they are saved. We never receive your vault password or your recovery key.',
      'This means nobody can open your vault for you. If you lose both your vault password and your recovery key, your vault cannot be recovered.',
    ],
  },
  {
    title: 'What is saved on your device',
    body: [
      'Small settings like your colour choice, the vault auto-lock time, and which reminders you have already seen, so the app remembers them next time. No tracking.',
    ],
  },
  {
    title: 'Your choices',
    body: [
      'You can download your data any time from More, then Account & data.',
      'You can delete your account from the same page. That removes your login and everything saved for you, including your vault. It cannot be undone.',
    ],
  },
]

export default function Privacy() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-xl mx-auto pb-10">
      <Link
        to={user ? '/account' : '/login'}
        className="text-sm font-bold text-deepsage dark:text-sage"
      >
        ← Back
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold text-deepsage dark:text-sage">
        Privacy 🔒
      </h1>
      <p className="text-sm opacity-70">The short, plain version.</p>

      <div className="mt-5 space-y-4">
        {SECTIONS.map((s) => (
          <section
            key={s.title}
            className="bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-6"
          >
            <h2 className="font-bold">{s.title}</h2>
            <div className="mt-2 space-y-2 text-sm opacity-90">
              {s.body.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </section>
        ))}

        <section className="bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-6">
          <h2 className="font-bold">Questions?</h2>
          <p className="mt-2 text-sm opacity-90">
            Write to <b>trackoroutineandmoneytracker@gmail.com</b>.
          </p>
        </section>
      </div>
    </div>
  )
}