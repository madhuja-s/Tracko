export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-8">
        <p
          className="text-4xl font-bold text-deepsage dark:text-sage leading-none"
          style={{ fontFamily: "'Caveat', cursive" }}
        >
          Tracko
        </p>
        <h1 className="mt-4 text-2xl font-extrabold text-deepsage dark:text-sage">
          {title}
        </h1>
        {subtitle && <p className="mt-1 mb-6 opacity-80">{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}