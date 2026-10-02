export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-8">
        <h1 className="text-2xl font-extrabold text-deepsage dark:text-sage">
          {title}
        </h1>
        {subtitle && <p className="mt-1 mb-6 opacity-80">{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}